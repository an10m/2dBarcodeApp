import type { Env, UserRow } from "./types";
import { signToken, verifyPassword, verifyToken } from "./crypto";
import { parseCode } from "./code";
import { handleSummary } from "./summary";

const COOKIE = "sc_session";
const SESSION_SECONDS = 12 * 60 * 60;
const MAX_ATTEMPTS = 5;
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;
const MAX_NOTE = 500;

export const DEVIATION_REASONS: Record<string, string> = {
  damaged_package: "Qadoq shikastlangan",
  temperature: "Harorat rejimi buzilgan",
  quantity: "Miqdor hujjatga mos kelmaydi",
  documents: "Hujjatlar mos kelmaydi",
  other: "Boshqa sabab"
};

const MONTHS = ["yan.", "fev.", "mar.", "apr.", "may", "iyun", "iyul", "avg.", "sen.", "okt.", "noy.", "dek."];
// Used to spend the same time on unknown usernames as on real ones.
const DUMMY_HASH = `pbkdf2$100000$${btoa("0123456789abcdef")}$${btoa("0".repeat(32))}`;

type Session = { uid: number; exp: number };
type StageOut = {
  date: string; title: string; detail: string; location: string; country: string;
  state: "ok" | "warning"; tag: string; kind: "pharmacy"; eventType: "received" | "deviation"; at: string;
};
type EventRow = {
  event_type: "received" | "deviation"; reason: string | null; note: string | null; created_at: string;
  pharmacy_name: string; city: string;
};

function json(data: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...headers }
  });
}
const err = (status: number, code: string, message?: string) => json({ error: code, message }, status);

function formatDate(iso: string): string {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Tashkent", day: "2-digit", month: "numeric", year: "numeric" })
    .formatToParts(new Date(iso));
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("day")} ${MONTHS[Number(get("month")) - 1]} ${get("year")}`;
}

export function toStage(row: EventRow): StageOut {
  const base = { country: "O'zbekiston", kind: "pharmacy" as const, eventType: row.event_type, at: row.created_at, date: formatDate(row.created_at) };
  if (row.event_type === "received") {
    return {
      ...base,
      title: "Dorixonaga qabul",
      detail: `Dori "${row.pharmacy_name}" dorixonasi tomonidan qabul qilindi va savdoga qo'yildi.${row.note ? ` Izoh: ${row.note}` : ""}`,
      location: `${row.pharmacy_name}, ${row.city}`,
      state: "ok",
      tag: "Sotuvga tayyor"
    };
  }
  const reason = DEVIATION_REASONS[row.reason ?? "other"] ?? DEVIATION_REASONS.other;
  return {
    ...base,
    title: "Dorixonada og'ish qayd etildi",
    detail: `${reason}.${row.note ? ` ${row.note}` : ""}`,
    location: `${row.pharmacy_name}, ${row.city}`,
    state: "warning",
    tag: "Og'ish"
  };
}

async function readJson<T>(request: Request): Promise<T | null> {
  if (!(request.headers.get("content-type") ?? "").includes("application/json")) return null;
  try { return (await request.json()) as T; } catch { return null; }
}

function cleanNote(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.replace(/\s+/g, " ").trim().slice(0, MAX_NOTE);
  return trimmed || null;
}

function cookieValue(request: Request, name: string): string | null {
  const header = request.headers.get("cookie") ?? "";
  for (const part of header.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (k === name) return rest.join("=");
  }
  return null;
}

async function currentUser(request: Request, env: Env, now: number): Promise<UserRow | null> {
  const token = cookieValue(request, COOKIE);
  if (!token) return null;
  const session = await verifyToken<Session>(token, env.SESSION_SECRET);
  if (!session || session.exp * 1000 < now) return null;
  return env.DB.prepare("SELECT id, username, password_hash, pharmacy_name, city, active FROM users WHERE id = ? AND active = 1")
    .bind(session.uid).first<UserRow>();
}

const publicUser = (u: UserRow) => ({ username: u.username, pharmacyName: u.pharmacy_name, city: u.city });

const BATCH_SELECT = `
  SELECT b.id, b.gtin, b.batch, b.serial, b.name, b.manufacturer, b.expiry, b.payload,
    (SELECT created_at FROM stage_events e WHERE e.batch_id = b.id AND e.event_type = 'received') AS received_at,
    (SELECT user_id    FROM stage_events e WHERE e.batch_id = b.id AND e.event_type = 'received') AS received_by,
    (SELECT COUNT(*)   FROM stage_events e WHERE e.batch_id = b.id AND e.event_type = 'deviation') AS deviations
  FROM batches b`;

type BatchRow = {
  id: number; gtin: string; batch: string; serial: string; name: string; manufacturer: string; expiry: string | null;
  payload: string; received_at: string | null; received_by: number | null; deviations: number;
};
const batchOut = (b: BatchRow, userId: number) => ({
  id: b.id, gtin: b.gtin, batch: b.batch, serial: b.serial, name: b.name, manufacturer: b.manufacturer,
  expiry: b.expiry, payload: b.payload, receivedAt: b.received_at, receivedByMe: b.received_by === userId, deviations: b.deviations
});

async function eventsFor(env: Env, batchId: number): Promise<EventRow[]> {
  const { results } = await env.DB.prepare(
    `SELECT e.event_type, e.reason, e.note, e.created_at, u.pharmacy_name, u.city
     FROM stage_events e JOIN users u ON u.id = e.user_id WHERE e.batch_id = ? ORDER BY e.created_at, e.id`
  ).bind(batchId).all<EventRow>();
  return results;
}

async function getVisibleBatch(env: Env, id: unknown, user: UserRow): Promise<{ batch?: BatchRow; status?: Response }> {
  const batchId = Number(id);
  if (!Number.isInteger(batchId)) return { status: err(400, "invalid_batch") };
  const row = await env.DB.prepare(`${BATCH_SELECT} WHERE b.id = ?`).bind(batchId).first<BatchRow & { assigned_user_id?: number }>();
  if (!row) return { status: err(404, "batch_not_found") };
  const assigned = await env.DB.prepare("SELECT assigned_user_id AS a FROM batches WHERE id = ?").bind(batchId).first<{ a: number | null }>();
  if (assigned?.a != null && assigned.a !== user.id) return { status: err(403, "not_your_batch") };
  return { batch: row };
}

const CORS = { "access-control-allow-origin": "*", "access-control-allow-methods": "GET, OPTIONS", "access-control-max-age": "86400" };

export async function handle(request: Request, env: Env, now = Date.now()): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, "") || "/";
  const method = request.method;

  // ---- public, read-only, cross-origin (consumer and producer apps) ----
  if (path === "/api/public/stages") {
    if (method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
    if (method !== "GET") return err(405, "method_not_allowed");
    const gtin = url.searchParams.get("gtin") ?? "";
    if (!/^\d{14}$/.test(gtin)) return json({ error: "invalid_gtin" }, 400, CORS);
    const batch = url.searchParams.get("batch");
    const serial = url.searchParams.get("serial");
    const rows = await env.DB.prepare(
      `SELECT id FROM batches WHERE gtin = ? AND (? IS NULL OR batch = ?) AND (? IS NULL OR serial = ?)`
    ).bind(gtin, batch, batch, serial, serial).all<{ id: number }>();
    if (rows.results.length !== 1) return json({ known: false, ambiguous: rows.results.length > 1, received: false, stages: [] }, 200, CORS);
    const events = await eventsFor(env, rows.results[0].id);
    const stages = events.map(toStage);
    return json({ known: true, received: events.some((e) => e.event_type === "received"), stages }, 200, { ...CORS, "cache-control": "no-store" });
  }

  if (path === "/api/public/summary") return handleSummary(request, env);

  if (!path.startsWith("/api/")) return err(404, "not_found");

  // Basic CSRF guard for state-changing calls: JSON only and same-origin.
  if (method === "POST") {
    const origin = request.headers.get("origin");
    if (origin && origin !== url.origin) return err(403, "bad_origin");
  }

  if (path === "/api/login" && method === "POST") {
    const body = await readJson<{ username?: string; password?: string }>(request);
    const username = typeof body?.username === "string" ? body.username.trim().slice(0, 64) : "";
    const password = typeof body?.password === "string" ? body.password.slice(0, 200) : "";
    if (!username || !password) return err(400, "missing_credentials");

    const recent = await env.DB.prepare("SELECT COUNT(*) AS n FROM login_attempts WHERE username = ? AND at > ?")
      .bind(username, now - ATTEMPT_WINDOW_MS).first<{ n: number }>();
    if ((recent?.n ?? 0) >= MAX_ATTEMPTS) return err(429, "too_many_attempts", "Juda ko'p urinish. 15 daqiqadan keyin qayta urinib ko'ring.");

    const user = await env.DB.prepare("SELECT id, username, password_hash, pharmacy_name, city, active FROM users WHERE username = ?")
      .bind(username).first<UserRow>();
    const ok = await verifyPassword(password, user?.password_hash ?? DUMMY_HASH);
    if (!user || !user.active || !ok) {
      await env.DB.prepare("INSERT INTO login_attempts (username, at) VALUES (?, ?)").bind(username, now).run();
      return err(401, "invalid_credentials", "Login yoki parol noto'g'ri.");
    }
    await env.DB.prepare("DELETE FROM login_attempts WHERE username = ?").bind(username).run();
    const token = await signToken({ uid: user.id, exp: Math.floor(now / 1000) + SESSION_SECONDS } satisfies Session, env.SESSION_SECRET);
    return json({ user: publicUser(user) }, 200, {
      "set-cookie": `${COOKIE}=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${SESSION_SECONDS}`
    });
  }

  if (path === "/api/logout" && method === "POST") {
    return json({ ok: true }, 200, { "set-cookie": `${COOKIE}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0` });
  }

  // ---- everything below needs a signed-in pharmacist ----
  const user = await currentUser(request, env, now);
  if (!user) return err(401, "unauthorized");

  if (path === "/api/me" && method === "GET") return json({ user: publicUser(user) });

  if (path === "/api/batches" && method === "GET") {
    const { results } = await env.DB.prepare(`${BATCH_SELECT} WHERE (b.assigned_user_id IS NULL OR b.assigned_user_id = ?) ORDER BY b.id`)
      .bind(user.id).all<BatchRow>();
    return json({ batches: results.map((b) => batchOut(b, user.id)) });
  }

  if (path === "/api/lookup" && method === "POST") {
    const body = await readJson<{ code?: string }>(request);
    const parsed = parseCode(typeof body?.code === "string" ? body.code : "");
    if (!parsed) return err(400, "invalid_code", "Kod formati tanilmadi.");
    const { results } = await env.DB.prepare(
      `${BATCH_SELECT} WHERE b.gtin = ? AND (? IS NULL OR b.batch = ?) AND (? IS NULL OR b.serial = ?)
         AND (b.assigned_user_id IS NULL OR b.assigned_user_id = ?) ORDER BY b.id`
    ).bind(parsed.gtin, parsed.batch ?? null, parsed.batch ?? null, parsed.serial ?? null, parsed.serial ?? null, user.id).all<BatchRow>();
    return json({ matches: results.map((b) => batchOut(b, user.id)) });
  }

  if (path === "/api/batch" && method === "GET") {
    const found = await getVisibleBatch(env, url.searchParams.get("id"), user);
    if (found.status) return found.status;
    const events = await eventsFor(env, found.batch!.id);
    return json({ batch: batchOut(found.batch!, user.id), stages: events.map(toStage) });
  }

  if (path === "/api/receive" && method === "POST") {
    const body = await readJson<{ batchId?: number; note?: string }>(request);
    const found = await getVisibleBatch(env, body?.batchId, user);
    if (found.status) return found.status;
    try {
      await env.DB.prepare("INSERT INTO stage_events (batch_id, user_id, event_type, note, created_at) VALUES (?, ?, 'received', ?, ?)")
        .bind(found.batch!.id, user.id, cleanNote(body?.note), new Date(now).toISOString()).run();
    } catch {
      return err(409, "already_received", "Bu partiya allaqachon qabul qilingan.");
    }
    const events = await eventsFor(env, found.batch!.id);
    return json({ ok: true, stages: events.map(toStage) }, 201);
  }

  if (path === "/api/deviation" && method === "POST") {
    const body = await readJson<{ batchId?: number; reason?: string; note?: string }>(request);
    const reason = typeof body?.reason === "string" ? body.reason : "";
    if (!(reason in DEVIATION_REASONS)) return err(400, "invalid_reason", "Sababni tanlang.");
    const note = cleanNote(body?.note);
    if (reason === "other" && !note) return err(400, "note_required", "\"Boshqa sabab\" uchun izoh yozing.");
    const found = await getVisibleBatch(env, body?.batchId, user);
    if (found.status) return found.status;
    await env.DB.prepare("INSERT INTO stage_events (batch_id, user_id, event_type, reason, note, created_at) VALUES (?, ?, 'deviation', ?, ?, ?)")
      .bind(found.batch!.id, user.id, reason, note, new Date(now).toISOString()).run();
    const events = await eventsFor(env, found.batch!.id);
    return json({ ok: true, stages: events.map(toStage) }, 201);
  }

  if (path === "/api/history" && method === "GET") {
    const { results } = await env.DB.prepare(
      `SELECT e.id, e.event_type, e.reason, e.note, e.created_at, b.name, b.gtin, b.batch, b.serial
       FROM stage_events e JOIN batches b ON b.id = e.batch_id WHERE e.user_id = ? ORDER BY e.created_at DESC, e.id DESC LIMIT 200`
    ).bind(user.id).all<{ id: number; event_type: string; reason: string | null; note: string | null; created_at: string; name: string; gtin: string; batch: string; serial: string }>();
    return json({
      history: results.map((r) => ({
        id: r.id, eventType: r.event_type, reason: r.reason ? DEVIATION_REASONS[r.reason] ?? r.reason : null,
        note: r.note, at: r.created_at, date: formatDate(r.created_at), name: r.name, gtin: r.gtin, batch: r.batch, serial: r.serial
      }))
    });
  }

  return err(404, "not_found");
}

export default {
  fetch(request: Request, env: Env): Promise<Response> {
    return handle(request, env);
  }
};
