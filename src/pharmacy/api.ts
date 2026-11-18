export class ApiError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

const fallbackMessages: Record<string, string> = {
  unauthorized: "Seans tugagan. Qayta kiring.",
  invalid_credentials: "Login yoki parol noto'g'ri.",
  too_many_attempts: "Juda ko'p urinish. 15 daqiqadan keyin qayta urinib ko'ring.",
  already_received: "Bu partiya allaqachon qabul qilingan.",
  not_your_batch: "Bu partiya sizning dorixonangizga biriktirilmagan.",
  batch_not_found: "Partiya topilmadi.",
  invalid_code: "Kod formati tanilmadi."
};

export async function api<T>(path: string, body?: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      method: body === undefined ? "GET" : "POST",
      headers: body === undefined ? undefined : { "content-type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      credentials: "same-origin"
    });
  } catch {
    throw new ApiError(0, "network", "Server bilan aloqa yo'q. Internetni tekshiring.");
  }
  const data = (await response.json().catch(() => ({}))) as { error?: string; message?: string } & T;
  if (!response.ok) {
    const code = data.error ?? "error";
    throw new ApiError(response.status, code, data.message ?? fallbackMessages[code] ?? "Xatolik yuz berdi.");
  }
  return data;
}

export type User = { username: string; pharmacyName: string; city: string };
export type Batch = {
  id: number; gtin: string; batch: string; serial: string; name: string; manufacturer: string;
  expiry: string | null; payload: string; receivedAt: string | null; receivedByMe: boolean; deviations: number;
};
export type Stage = {
  date: string; title: string; detail: string; location: string; state: "ok" | "warning"; tag: string;
  eventType: "received" | "deviation"; at: string;
};
export type HistoryItem = {
  id: number; eventType: "received" | "deviation"; reason: string | null; note: string | null; at: string;
  name: string; gtin: string; batch: string; serial: string;
};

export function formatDateTime(iso: string): string {
  const text = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Tashkent", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit"
  }).format(new Date(iso));
  return text.replaceAll("/", ".").replace(", ", " ");
}
