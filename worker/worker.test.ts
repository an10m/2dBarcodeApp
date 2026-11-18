// Run: npx tsx --test worker/worker.test.ts   (uses node:sqlite as a stand-in for D1)
import { test } from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import { pbkdf2Sync, randomBytes } from "node:crypto";
import { handle } from "./index";
import { parseCode } from "./code";
import type { D1Database, Env } from "./types";

function makeDb(): D1Database {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec(readFileSync(new URL("../db/schema.sql", import.meta.url), "utf8"));
  sqlite.exec(readFileSync(new URL("../db/seed.sql", import.meta.url), "utf8"));
  const wrap = (sql: string, values: unknown[] = []) => ({
    bind: (...v: unknown[]) => wrap(sql, v),
    first: async <T>() => (sqlite.prepare(sql).get(...(values as never[])) as T | undefined) ?? null,
    all: async <T>() => ({ results: sqlite.prepare(sql).all(...(values as never[])) as T[], success: true, meta: {} }),
    run: async () => { const r = sqlite.prepare(sql).run(...(values as never[])); return { results: [], success: true, meta: { changes: Number(r.changes) } }; }
  });
  (makeDb as unknown as { raw: DatabaseSync }).raw = sqlite;
  return { prepare: (sql: string) => wrap(sql) } as unknown as D1Database;
}

function addUser(db: DatabaseSync, username: string, password: string, pharmacy: string, city: string) {
  const salt = randomBytes(16);
  const hash = pbkdf2Sync(password, salt, 100000, 32, "sha256");
  const stored = `pbkdf2$100000$${salt.toString("base64")}$${hash.toString("base64")}`;
  return Number(db.prepare("INSERT INTO users (username, password_hash, pharmacy_name, city) VALUES (?,?,?,?)").run(username, stored, pharmacy, city).lastInsertRowid);
}

function setup() {
  const DB = makeDb();
  const raw = (makeDb as unknown as { raw: DatabaseSync }).raw;
  const ids = { a: addUser(raw, "apteka1", "correct-horse", "Dorixona №1", "Samarqand"), b: addUser(raw, "apteka2", "battery-staple", "Dorixona №2", "Toshkent") };
  const env: Env = { DB, SESSION_SECRET: "test-secret-test-secret-test-secret" };
  return { env, raw, ids };
}

const call = (env: Env, path: string, init: { method?: string; body?: unknown; cookie?: string } = {}, now?: number) =>
  handle(new Request(`https://x.test${path}`, {
    method: init.method ?? (init.body ? "POST" : "GET"),
    headers: { "content-type": "application/json", ...(init.cookie ? { cookie: init.cookie } : {}) },
    body: init.body ? JSON.stringify(init.body) : undefined
  }), env, now);

async function login(env: Env, username = "apteka1", password = "correct-horse") {
  const res = await call(env, "/api/login", { body: { username, password } });
  const cookie = res.headers.get("set-cookie")?.split(";")[0] ?? "";
  return { res, cookie };
}

test("parseCode understands GS1, Digital Link and plain GTIN", () => {
  assert.deepEqual(parseCode("(01)09506000487120(10)PM-260814(21)48120007(17)280814"), { gtin: "09506000487120", batch: "PM-260814", serial: "48120007" });
  assert.deepEqual(parseCode("https://x.uz/01/09506000184721/10/AJ1/21/42"), { gtin: "09506000184721", batch: "AJ1", serial: "42" });
  assert.deepEqual(parseCode("09506000184721"), { gtin: "09506000184721", batch: undefined, serial: undefined });
  assert.equal(parseCode("hello"), null);
});

test("login: wrong password rejected, right password sets HttpOnly cookie", async () => {
  const { env } = setup();
  assert.equal((await login(env, "apteka1", "nope")).res.status, 401);
  assert.equal((await login(env, "ghost", "whatever")).res.status, 401);
  const { res, cookie } = await login(env);
  assert.equal(res.status, 200);
  assert.match(res.headers.get("set-cookie")!, /HttpOnly/);
  assert.match(cookie, /^sc_session=/);
});

test("protected endpoints need a session; tampered cookie is rejected", async () => {
  const { env } = setup();
  assert.equal((await call(env, "/api/batches")).status, 401);
  const { cookie } = await login(env);
  assert.equal((await call(env, "/api/batches", { cookie })).status, 200);
  assert.equal((await call(env, "/api/batches", { cookie: cookie.slice(0, -2) + "xx" })).status, 401);
});

test("expired session is rejected", async () => {
  const { env } = setup();
  const { cookie } = await login(env);
  assert.equal((await call(env, "/api/me", { cookie }, Date.now() + 13 * 3600 * 1000)).status, 401);
});

test("lockout after 5 failed attempts", async () => {
  const { env } = setup();
  for (let i = 0; i < 5; i++) await login(env, "apteka1", "bad");
  assert.equal((await login(env, "apteka1", "correct-horse")).res.status, 429);
});

test("receive: creates a stage, second receive is 409, public endpoint shows it", async () => {
  const { env } = setup();
  const { cookie } = await login(env);
  const pub = "/api/public/stages?gtin=09506000487120&batch=PM-260814&serial=48120007";

  const before = await (await call(env, pub)).json() as { known: boolean; received: boolean; stages: unknown[] };
  assert.deepEqual([before.known, before.received, before.stages.length], [true, false, 0]);

  const lookup = await (await call(env, "/api/lookup", { cookie, body: { code: "(01)09506000487120(10)PM-260814(21)48120007" } })).json() as { matches: { id: number }[] };
  assert.equal(lookup.matches.length, 1);
  const id = lookup.matches[0].id;

  const ok = await call(env, "/api/receive", { cookie, body: { batchId: id, note: "Hammasi joyida" } });
  assert.equal(ok.status, 201);
  assert.equal((await call(env, "/api/receive", { cookie, body: { batchId: id } })).status, 409);

  const after = await (await call(env, pub)).json() as { received: boolean; stages: { title: string; state: string; location: string; detail: string }[] };
  assert.equal(after.received, true);
  assert.equal(after.stages[0].title, "Dorixonaga qabul");
  assert.equal(after.stages[0].state, "ok");
  assert.match(after.stages[0].location, /Dorixona №1, Samarqand/);
  assert.match(after.stages[0].detail, /Hammasi joyida/);
});

test("deviation: validates reason, 'other' needs a note, shows as warning", async () => {
  const { env } = setup();
  const { cookie } = await login(env);
  const id = ((await (await call(env, "/api/batches", { cookie })).json()) as { batches: { id: number }[] }).batches[0].id;
  assert.equal((await call(env, "/api/deviation", { cookie, body: { batchId: id, reason: "bogus" } })).status, 400);
  assert.equal((await call(env, "/api/deviation", { cookie, body: { batchId: id, reason: "other" } })).status, 400);
  const ok = await call(env, "/api/deviation", { cookie, body: { batchId: id, reason: "damaged_package", note: "Qutisi ezilgan" } });
  assert.equal(ok.status, 201);
  const body = await ok.json() as { stages: { state: string; tag: string }[] };
  assert.deepEqual([body.stages[0].state, body.stages[0].tag], ["warning", "Og'ish"]);
});

test("assigned batches are invisible and locked for other pharmacies", async () => {
  const { env, raw, ids } = setup();
  raw.prepare("UPDATE batches SET assigned_user_id = ? WHERE gtin = '09506000487120'").run(ids.b);
  const a = (await login(env, "apteka1", "correct-horse")).cookie;
  const b = (await login(env, "apteka2", "battery-staple")).cookie;
  const listA = await (await call(env, "/api/batches", { cookie: a })).json() as { batches: { gtin: string }[] };
  const listB = await (await call(env, "/api/batches", { cookie: b })).json() as { batches: { gtin: string }[] };
  assert.ok(!listA.batches.some((x) => x.gtin === "09506000487120"));
  assert.ok(listB.batches.some((x) => x.gtin === "09506000487120"));
  const id = Number((raw.prepare("SELECT id FROM batches WHERE gtin='09506000487120'").get() as { id: number }).id);
  assert.equal((await call(env, "/api/receive", { cookie: a, body: { batchId: id } })).status, 403);
  assert.equal((await call(env, "/api/receive", { cookie: b, body: { batchId: id } })).status, 201);
});

test("history lists only my events; public endpoint for unknown GTIN says known=false", async () => {
  const { env } = setup();
  const a = (await login(env, "apteka1", "correct-horse")).cookie;
  const b = (await login(env, "apteka2", "battery-staple")).cookie;
  const id = ((await (await call(env, "/api/batches", { cookie: a })).json()) as { batches: { id: number }[] }).batches[1].id;
  await call(env, "/api/receive", { cookie: a, body: { batchId: id } });
  assert.equal(((await (await call(env, "/api/history", { cookie: a })).json()) as { history: unknown[] }).history.length, 1);
  assert.equal(((await (await call(env, "/api/history", { cookie: b })).json()) as { history: unknown[] }).history.length, 0);
  const unknown = await (await call(env, "/api/public/stages?gtin=12345678901234")).json() as { known: boolean };
  assert.equal(unknown.known, false);
});

test("cross-origin POST is refused", async () => {
  const { env } = setup();
  const res = await handle(new Request("https://x.test/api/login", {
    method: "POST", headers: { "content-type": "application/json", origin: "https://evil.test" },
    body: JSON.stringify({ username: "apteka1", password: "correct-horse" })
  }), env);
  assert.equal(res.status, 403);
});

test("public AI summary falls back when GEMINI_API_KEY is missing", async () => {
  const { env } = setup();
  const res = await call(env, "/api/public/summary", {
    body: {
      name: "Paracetamol 500 mg",
      manufacturer: "PharmaMed Uzbekistan",
      gtin: "09506000487120",
      batch: "PM-260814",
      stages: [
        { title: "Ishlab chiqarish", state: "ok", date: "14 avg. 2026" },
        { title: "Laboratoriya nazorati", state: "warning", date: "24 avg. 2026" }
      ]
    }
  });
  assert.equal(res.status, 200);
  const data = (await res.json()) as { source: string; summary: string; risk: string; notice?: string };
  assert.equal(data.source, "fallback");
  assert.match(data.summary, /Paracetamol 500 mg/);
  assert.equal(data.risk, "o'rtacha");
  assert.ok(data.notice);
});

test("public AI summary answers CORS preflight", async () => {
  const { env } = setup();
  const res = await handle(new Request("https://x.test/api/public/summary", { method: "OPTIONS" }), env);
  assert.equal(res.status, 204);
  assert.equal(res.headers.get("access-control-allow-origin"), "*");
});
