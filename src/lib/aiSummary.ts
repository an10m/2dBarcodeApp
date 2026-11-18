import type { PassportStage } from "../components/ProductPassport";

export type SummaryProduct = {
  name: string;
  gtin: string;
  batch: string;
  manufacturer: string;
  category: string;
  netContent?: string;
  country?: string;
};

export type AiSummaryResult = {
  summary: string;
  advice: string;
  risk: "past" | "o'rtacha" | "yuqori";
  source: "gemini" | "fallback";
  model?: string;
  notice?: string;
};

export function isPharmacyProduct(product: Pick<SummaryProduct, "name" | "category">) {
  return /(dori|tabletka|kapsula|mg|antibiotik|antigistamin|og'riq)/i.test(`${product.name} ${product.category}`);
}

/** Offline/demo summary used when the Gemini key is not configured yet. */
export function buildLocalSummary(
  product: SummaryProduct,
  stages: PassportStage[],
  received = false
): AiSummaryResult {
  const warnings = stages.filter((stage) => stage.state === "warning").length;
  const pharmacy = isPharmacyProduct(product);
  const party = product.batch ? ` (${product.batch}-partiya)` : "";
  const summary = pharmacy
    ? `${product.name}${party} — ${product.manufacturer} tomonidan ishlab chiqarilgan. Partiya ${stages.length} bosqichdan o'tgan${warnings ? `, ${warnings} tasida og'ish qayd etilgan va ular hal qilingan` : ", barcha bosqichlar izohsiz"}. ${received ? "Dorixona qabulni tasdiqlagan, ya'ni dori savdo javonida." : "Dorixona qabuli hali tasdiqlanmagan."}`
    : `${product.name}${party} — ${product.manufacturer} mahsuloti. Partiya ${stages.length} bosqichdan o'tgan${warnings ? `, ${warnings} tasida og'ish bo'lgan va u hal qilingan` : ", barcha bosqichlar izohsiz"}. ${received ? "Savdo nuqtasi qabulni tasdiqlagan." : "Savdo nuqtasi qabuli hali tasdiqlanmagan."}`;

  return {
    summary,
    advice: pharmacy
      ? "Yo'riqnomadagi dozaga amal qiling. Yon ta'sir yoki savol bo'lsa, shifokor yoki dorixona mutaxassisiga murojaat qiling."
      : "Mahsulotdan ko'rsatmadagi shartlarga muvofiq foydalaning. Savol bo'lsa, sotuvchiga murojaat qiling.",
    risk: warnings > 1 ? "o'rtacha" : "past",
    source: "fallback",
    notice: "Gemini kaliti hali ulanmagan — bu demo xulosa."
  };
}

export function summaryCacheKey(product: SummaryProduct) {
  return `signalcode:ai:v2:${product.gtin}:${product.batch}`;
}

export function readCachedSummary(product: SummaryProduct): AiSummaryResult | null {
  try {
    const raw = localStorage.getItem(summaryCacheKey(product));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { at: number; data: AiSummaryResult };
    if (!parsed?.data || Date.now() - parsed.at > 6 * 60 * 60 * 1000) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

export function writeCachedSummary(product: SummaryProduct, data: AiSummaryResult) {
  try {
    localStorage.setItem(summaryCacheKey(product), JSON.stringify({ at: Date.now(), data }));
  } catch {
    // storage disabled — no problem
  }
}