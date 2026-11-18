import { useEffect, useState } from "react";
import type { PassportStage } from "../components/ProductPassport";

/**
 * Base URL of the pharmacy Worker (the one that owns the database), e.g.
 * https://2dbarcodeapp-pharmacy.<account>.workers.dev  — set VITE_API_URL at build time.
 * When it is empty the apps behave exactly as before and show the demo fixtures.
 */
const API_URL = ((import.meta.env.VITE_API_URL as string | undefined) ?? "").replace(/\/+$/, "");

type LiveResponse = {
  known: boolean;
  received: boolean;
  stages: (PassportStage & { eventType?: string })[];
};

export type LiveStages = {
  /** Stages to render: fixture stages (without the fake pharmacy step) + real pharmacy events. */
  stages: PassportStage[];
  /** True when the database knows this batch and the stages below are authoritative. */
  known: boolean;
  /** True once a pharmacy has confirmed receipt. */
  received: boolean;
};

type Ids = { gtin: string; batch: string; serial: string };

export function useLiveStages(fixture: PassportStage[] | undefined, ids: Ids | undefined): LiveStages {
  const [live, setLive] = useState<LiveResponse | null>(null);
  const gtin = ids?.gtin;
  const batch = ids?.batch;
  const serial = ids?.serial;

  useEffect(() => {
    setLive(null);
    if (!API_URL || !gtin) return;
    let alive = true;
    const query = new URLSearchParams({ gtin, batch: batch ?? "", serial: serial ?? "" });
    fetch(`${API_URL}/api/public/stages?${query}`)
      .then((r) => (r.ok ? (r.json() as Promise<LiveResponse>) : null))
      .then((data) => { if (alive && data) setLive(data); })
      .catch(() => undefined); // offline or API down: keep showing the fixtures
    return () => { alive = false; };
  }, [gtin, batch, serial]);

  const base = fixture ?? [];
  if (!live?.known) return { stages: base, known: false, received: false };
  // The fixture's last "pharmacy" step is a demo placeholder; the database is the source of truth now.
  const real = live.stages.map(({ eventType: _eventType, ...stage }) => stage as PassportStage);
  return { stages: [...base.filter((s) => s.kind !== "pharmacy"), ...real], known: true, received: live.received };
}

export const pendingPharmacyStatus = {
  title: "Dorixonaga yetkazilmoqda",
  caption: "Dorixona qabulni hali tasdiqlamagan",
  tone: "warning" as const
};
