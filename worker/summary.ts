import type { Env } from "./types";

/**
 * Short consumer-facing product summary generated with Gemini.
 * Configure the free key with:
 *   npx wrangler secret put GEMINI_API_KEY --config wrangler.pharmacy.jsonc
 * or in the dashboard: Worker → Settings → Variables and Secrets.
 */

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "POST, OPTIONS",
  "access-control-allow-headers": "content-type",
  "access-control-max-age": "86400"
};

const CACHE_SECONDS = 6 * 60 * 60;

type InputStage = { title: string; state: "ok" | "warning"; date: string };
type SummaryInput = {
  name: string;
  gtin: string;
  batch: string;
  manufacturer: string;
  category: string;
  netContent: string;
  received: boolean;
  stages: InputStage[];
};

export type SummaryOutput = {
  summary: string;
  advice: string;
  risk: "past" | "o'rtacha" | "yuqori";
  source: "gemini" | "fallback";
  model?: string;
  notice?: string;
  cached?: boolean;
};

function json(data: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...CORS, ...headers }
  });
}

async function readJson<T>(request: Request): Promise<T | null> {
  if (!(request.headers.get("content-type") ?? "").includes("application/json")) return null;
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}

function clean(value: unknown, max: number): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, max) : "";
}

function normalize(body: Record<string, unknown> | null): SummaryInput {
  const rawStages = Array.isArray(body?.stages) ? body!.stages.slice(0, 14) : [];
  const stages: InputStage[] = rawStages.map((stage) => {
    const row = stage as Record<string, unknown>;
    return {
      title: clean(row.title, 120) || "Bosqich",
      state: row.state === "warning" ? "warning" : "ok",
      date: clean(row.date, 40)
    };
  });

  return {
    name: clean(body?.name, 120) || "Mahsulot",
    gtin: clean(body?.gtin, 14).replace(/\D/g, "").slice(0, 14),
    batch: clean(body?.batch, 40),
    manufacturer: clean(body?.manufacturer, 120) || "Noma'lum ishlab chiqaruvchi",
    category: clean(body?.category, 80),
    netContent: clean(body?.netContent, 60),
    received: body?.received === true,
    stages
  };
}

function riskFor(warnings: number): SummaryOutput["risk"] {
  if (warnings >= 3) return "yuqori";
  if (warnings >= 1) return "o'rtacha";
  return "past";
}

export function fallbackSummary(input: SummaryInput): SummaryOutput {
  const warnings = input.stages.filter((stage) => stage.state === "warning").length;
  const pharmacy = /(dori|tabletka|kapsula|mg|antibiotik|antigistamin|og'riq)/i.test(
    `${input.name} ${input.category}`
  );
  const batch = input.batch ? ` (${input.batch}-partiya)` : "";
  const summary = pharmacy
    ? `${input.name}${batch} — ${input.manufacturer} tomonidan ishlab chiqarilgan. Partiya ${input.stages.length} bosqichdan o'tgan${warnings ? `, ${warnings} tasida og'ish qayd etilgan va ular hal qilingan` : ", barcha bosqichlar izohsiz"}. ${input.received ? "Dorixona qabulni tasdiqlagan, ya'ni dori savdo javonida." : "Dorixona qabuli hali tasdiqlanmagan."}`
    : `${input.name}${batch} — ${input.manufacturer} mahsuloti. Partiya ${input.stages.length} bosqichdan o'tgan${warnings ? `, ${warnings} tasida og'ish bo'lgan va u hal qilingan` : ", barcha bosqichlar izohsiz"}. ${input.received ? "Savdo nuqtasi qabulni tasdiqlagan." : "Savdo nuqtasi qabuli hali tasdiqlanmagan."}`;

  return {
    summary,
    advice: pharmacy
      ? "Yo'riqnomadagi dozaga amal qiling. Yon ta'sir yoki savol bo'lsa, shifokor yoki dorixona mutaxassisiga murojaat qiling."
      : "Mahsulotdan ko'rsatmadagi shartlarga muvofiq foydalaning. Savol bo'lsa, sotuvchiga murojaat qiling.",
    risk: riskFor(warnings),
    source: "fallback"
  };
}

function buildPrompt(input: SummaryInput) {
  const stageLines = input.stages
    .map((stage, index) => `${index + 1}. ${stage.title} (${stage.date || "sana yo'q"}) — ${stage.state === "warning" ? "og'ish bo'lgan, hal qilingan" : "izohsiz"}`)
    .join("\n");

  return [
    `Mahsulot: ${input.name}`,
    `Ishlab chiqaruvchi: ${input.manufacturer}`,
    input.category ? `Toifa: ${input.category}` : "",
    input.batch ? `Partiya: ${input.batch}` : "",
    input.gtin ? `GTIN: ${input.gtin}` : "",
    input.netContent ? `Miqdor: ${input.netContent}` : "",
    `Dorixona qabuli: ${input.received ? "tasdiqlangan" : "tasdiqlanmagan"}`,
    "Partiya bosqichlari:",
    stageLines || "1. Ma'lumot yo'q",
    "",
    "O'zbek tilida 2-3 gaplik xulosa yozing: mahsulot nima uchun ishlatilishi, partiyaning ishonchliligi va muhim og'ishlar. Keyin bitta qisqa amaliy tavsiya bering. Tibbiy tashxis qo'ymang va doza bo'yicha shifokor maslahatini almashtirmang."
  ].filter(Boolean).join("\n");
}

const SYSTEM_PROMPT =
  "Siz O'zbekistondagi xaridorlar uchun mahsulot partiyasi haqida qisqa va xolis ma'lumot beruvchi yordamchisiz. Faqat berilgan faktlardan foydalaning, to'qima yo'q. Javobni faqat JSON formatida qaytaring.";

type SummaryJson = { summary?: string; advice?: string; risk?: string };

/** Accepts clean JSON, fenced JSON, JSON embedded in prose, or a doubly encoded JSON string. */
function parseSummaryText(text: string): SummaryJson | null {
  const cleaned = text.replace(/```(?:json)?/gi, "").replace(/```/g, "").trim();
  const candidates = [cleaned];
  const first = cleaned.indexOf("{");
  const last = cleaned.lastIndexOf("}");
  if (first >= 0 && last > first) candidates.push(cleaned.slice(first, last + 1));

  for (const candidate of candidates) {
    try {
      let value = JSON.parse(candidate) as unknown;
      if (typeof value === "string") value = JSON.parse(value) as unknown;
      if (value && typeof value === "object") {
        const object = value as Record<string, unknown>;
        if (typeof object.summary === "string" && object.summary.trim()) return object as SummaryJson;
      }
    } catch {
      // try the next candidate
    }
  }
  return null;
}

export async function handleSummary(request: Request, env: Env): Promise<Response> {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const body = await readJson<Record<string, unknown>>(request);
  if (!body) return json({ error: "invalid_body" }, 400);

  const input = normalize(body);
  const fallback = fallbackSummary(input);
  if (!env.GEMINI_API_KEY) {
    return json({ ...fallback, notice: "GEMINI_API_KEY sozlanmagan — demo xulosa ko'rsatilmoqda." }, 200, { "cache-control": "no-store" });
  }

  const model = env.GEMINI_MODEL || "gemini-2.5-flash";
  const cacheKey = new Request(
    `https://cache.signalcode.internal/ai-summary-v2?gtin=${encodeURIComponent(input.gtin)}&batch=${encodeURIComponent(input.batch)}&received=${input.received ? 1 : 0}&stages=${input.stages.length}&warn=${input.stages.filter((stage) => stage.state === "warning").length}&model=${encodeURIComponent(model)}`,
    { method: "GET" }
  );
  const cache = (globalThis as { caches?: { default?: Cache } }).caches?.default;
  if (cache) {
    try {
      const hit = await cache.match(cacheKey);
      if (hit) {
        const data = (await hit.json()) as SummaryOutput;
        return json({ ...data, cached: true }, 200, { "cache-control": "public, max-age=3600" });
      }
    } catch {
      // cache is best effort
    }
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(env.GEMINI_API_KEY)}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{ role: "user", parts: [{ text: buildPrompt(input) }] }],
          generationConfig: {
            temperature: 0.35,
            maxOutputTokens: 900,
            // Gemini 2.5 spends output tokens on "thinking" by default, which can truncate
            // the JSON schema answer. This task needs no reasoning budget.
            thinkingConfig: { thinkingBudget: 0 },
            responseMimeType: "application/json",
            responseSchema: {
              type: "OBJECT",
              properties: {
                summary: { type: "STRING" },
                advice: { type: "STRING" },
                risk: { type: "STRING", enum: ["past", "o'rtacha", "yuqori"] }
              },
              required: ["summary", "advice", "risk"]
            }
          }
        })
      }
    );

    if (!response.ok) {
      return json({ ...fallback, notice: `Gemini javob bermadi (${response.status}). Demo xulosa ko'rsatilmoqda.` }, 200, { "cache-control": "no-store" });
    }

    const payload = (await response.json()) as {
      candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] } }[];
    };
    // Ignore thought parts; only the visible answer becomes the summary.
    const text = payload.candidates?.[0]?.content?.parts
      ?.filter((part) => !part.thought)
      .map((part) => part.text ?? "")
      .join("") ?? "";
    const raw = clean(text, 1200);
    const parsed = parseSummaryText(text);
    const looksStructured = /^[[{"`]/.test(raw);
    const summary = clean(parsed?.summary, 900) || (!looksStructured && raw.length >= 40 ? raw : "");

    if (!summary) {
      console.error("[ai-summary] unparsed Gemini output", raw.slice(0, 160));
      return json(
        { ...fallback, notice: "AI javobini o'qib bo'lmadi. Demo xulosa ko'rsatilmoqda." },
        200,
        { "cache-control": "no-store" }
      );
    }

    const result: SummaryOutput = {
      summary,
      advice: clean(parsed?.advice, 500) || fallback.advice,
      risk: parsed?.risk === "yuqori" || parsed?.risk === "o'rtacha" || parsed?.risk === "past" ? parsed.risk : fallback.risk,
      source: "gemini",
      model
    };

    if (cache) {
      try {
        await cache.put(
          cacheKey,
          new Response(JSON.stringify(result), {
            headers: { "content-type": "application/json", "cache-control": `public, max-age=${CACHE_SECONDS}` }
          })
        );
      } catch {
        // ignore cache write failures
      }
    }

    return json(result, 200, { "cache-control": "public, max-age=3600" });
  } catch {
    return json({ ...fallback, notice: "Gemini bilan aloqa o'rnatilmadi. Demo xulosa ko'rsatilmoqda." }, 200, { "cache-control": "no-store" });
  } finally {
    clearTimeout(timer);
  }
}
