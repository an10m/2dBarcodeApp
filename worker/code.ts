export type ParsedCode = { gtin: string; batch?: string; serial?: string };

/** Understands "(01)…(10)…(21)…", GS1 Digital Link URLs (/01/…/10/…/21/…) and bare 14-digit GTINs. */
export function parseCode(raw: string): ParsedCode | null {
  const value = raw.trim();
  if (!value) return null;

  const fields: Record<string, string> = {};
  for (const m of value.matchAll(/\((\d{2})\)([^()]*)/g)) fields[m[1]] = m[2];

  if (!fields["01"]) {
    const link = value.match(/\/01\/(\d{14})(?:\/10\/([^/?#]+))?(?:\/21\/([^/?#]+))?/);
    if (link) {
      fields["01"] = link[1];
      if (link[2]) fields["10"] = decodeURIComponent(link[2]);
      if (link[3]) fields["21"] = decodeURIComponent(link[3]);
    }
  }
  if (!fields["01"]) {
    const digits = value.replace(/\D/g, "");
    if (/^\d{14}$/.test(value) || (digits.length === 14 && value === digits)) fields["01"] = digits;
  }
  if (!/^\d{14}$/.test(fields["01"] ?? "")) return null;
  return { gtin: fields["01"], batch: fields["10"] || undefined, serial: fields["21"] || undefined };
}
