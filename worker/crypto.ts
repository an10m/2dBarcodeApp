const encoder = new TextEncoder();

export function toB64Url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function binToBytes(bin: string): Uint8Array<ArrayBuffer> {
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function fromB64Url(value: string): Uint8Array<ArrayBuffer> {
  const b64 = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  return binToBytes(atob(b64));
}

function fromB64(value: string): Uint8Array<ArrayBuffer> {
  return binToBytes(atob(value));
}

export function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

/** Stored format: pbkdf2$<iterations>$<salt base64>$<hash base64> (PBKDF2-SHA256, 32 bytes). */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, iterations, salt, hash] = stored.split("$");
  if (scheme !== "pbkdf2" || !iterations || !salt || !hash) return false;
  const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: fromB64(salt), iterations: Number(iterations) },
    key,
    256
  );
  return timingSafeEqual(new Uint8Array(bits), fromB64(hash));
}

async function hmacKey(secret: string) {
  return crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

export async function signToken(payload: object, secret: string): Promise<string> {
  const body = toB64Url(encoder.encode(JSON.stringify(payload)));
  const sig = await crypto.subtle.sign("HMAC", await hmacKey(secret), encoder.encode(body));
  return `${body}.${toB64Url(new Uint8Array(sig))}`;
}

export async function verifyToken<T>(token: string, secret: string): Promise<T | null> {
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const ok = await crypto.subtle.verify("HMAC", await hmacKey(secret), fromB64Url(sig), encoder.encode(body));
  if (!ok) return null;
  try {
    return JSON.parse(new TextDecoder().decode(fromB64Url(body))) as T;
  } catch {
    return null;
  }
}
