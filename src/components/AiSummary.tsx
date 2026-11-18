import { useEffect, useMemo, useState } from "react";
import type { PassportStage } from "./ProductPassport";
import { API_URL } from "../lib/liveStages";
import {
  buildLocalSummary,
  readCachedSummary,
  writeCachedSummary
} from "../lib/aiSummary";
import type { AiSummaryResult, SummaryProduct } from "../lib/aiSummary";

type Props = {
  product: SummaryProduct;
  stages: PassportStage[];
  received?: boolean;
};

export function AiSummary({ product, stages, received = false }: Props) {
  const [state, setState] = useState<AiSummaryResult>(() => buildLocalSummary(product, stages, received));
  const [loading, setLoading] = useState(true);

  const signature = useMemo(
    () =>
      [
        product.gtin,
        product.batch,
        product.name,
        received ? "received" : "pending",
        ...stages.map((stage) => `${stage.title}:${stage.state}`)
      ].join("|"),
    [product.gtin, product.batch, product.name, received, stages]
  );

  useEffect(() => {
    const local = buildLocalSummary(product, stages, received);
    setState(local);

    const cached = readCachedSummary(product);
    if (cached) {
      setState(cached);
      setLoading(false);
      return;
    }

    if (!API_URL) {
      setLoading(false);
      return;
    }

    let alive = true;
    const controller = new AbortController();
    setLoading(true);

    fetch(`${API_URL}/api/public/summary`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        name: product.name,
        gtin: product.gtin,
        batch: product.batch,
        manufacturer: product.manufacturer,
        category: product.category,
        netContent: product.netContent,
        received,
        stages: stages.map((stage) => ({ title: stage.title, state: stage.state, date: stage.date }))
      })
    })
      .then((response) => (response.ok ? (response.json() as Promise<AiSummaryResult>) : Promise.reject(new Error("summary failed"))))
      .then((data) => {
        if (!alive || !data?.summary) return;
        setState(data);
        writeCachedSummary(product, data);
      })
      .catch(() => undefined)
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
      controller.abort();
    };
    // The signature captures every value that changes the summary.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  return (
    <article className={`aiCard ${loading ? "loading" : ""}`}>
      <header className="aiCardHead">
        <span className="aiBadge">
          <span aria-hidden="true">✦</span> AI xulosasi
        </span>
      </header>

      {loading ? (
        <div className="aiSkeleton" aria-label="AI xulosasi tayyorlanmoqda">
          <span /><span /><span />
        </div>
      ) : (
        <>
          <p className="aiText">{state.summary}</p>
          {state.advice && (
            <p className="aiAdvice">
              <b>Tavsiya:</b> {state.advice}
            </p>
          )}
          <footer className="aiFooter">
            <span className={`aiRisk ${state.risk === "past" ? "ok" : "warn"}`}>
              Xavf darajasi: {state.risk}
            </span>
            <span>{stages.length} bosqich · {stages.filter((stage) => stage.state === "warning").length} og'ish</span>
          </footer>
          {state.notice && <p className="aiNotice">{state.notice}</p>}
        </>
      )}
    </article>
  );
}