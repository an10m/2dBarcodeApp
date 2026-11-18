import { useEffect, useRef, useState } from "react";
import * as bwipjs from "bwip-js/browser";

const bcidByFormat: Record<string, string> = {
  "GS1 DataMatrix": "gs1datamatrix",
  "GS1 Digital Link": "gs1dldatamatrix",
  "QR / Digital Link": "qrcode",
  "Data Matrix": "datamatrix"
};

/** Picks the symbology: explicit format first, otherwise guess from the payload. */
function pickBcid(format: string | undefined, value: string) {
  if (/^https?:\/\//i.test(value)) return "gs1dldatamatrix";
  if (format && bcidByFormat[format]) return bcidByFormat[format];
  if (/^\(\d{2,4}\)/.test(value)) return "gs1datamatrix";
  return "datamatrix";
}

const variableAIs = new Set(["10", "21", "22", "30", "37", "240", "400", "7003"]);

/** Converts a human readable "(01)…(10)…" string into a GS1 element string with FNC1 separators. */
function toGs1ElementString(value: string) {
  const parts = Array.from(value.matchAll(/\((\d{2,4})\)([^()]*)/g)).map((match) => ({ ai: match[1], data: match[2] }));
  if (!parts.length) return value;
  return parts
    .map((part, index) => `${part.ai}${part.data}${variableAIs.has(part.ai) && index < parts.length - 1 ? "^FNC1" : ""}`)
    .join("");
}

type Props = {
  value: string;
  format?: string;
  scale?: number;
  className?: string;
  /** When set, renders a PNG download button using this base file name. */
  downloadName?: string;
};

export function BarcodeImage({ value, format, scale = 4, className, downloadName }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!ref.current || !value.trim()) return;
    const bcid = pickBcid(format, value.trim());
    try {
      bwipjs.toCanvas(ref.current, {
        bcid,
        text: bcid === "gs1datamatrix" ? toGs1ElementString(value.trim()) : value.trim(),
        parsefnc: bcid === "gs1datamatrix",
        scale,
        padding: 2,
        backgroundcolor: "FFFFFF",
        barcolor: "111111"
      });
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [value, format, scale]);

  function download() {
    const canvas = ref.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `${(downloadName ?? "signalcode-2d-kod").replace(/[^a-z0-9-]+/gi, "-").toLowerCase()}.png`;
    link.click();
  }

  if (error) return <span className="barcodeError" title={error}>Kod yaratilmadi</span>;

  return (
    <div className={`barcodeWrap ${className ?? ""}`}>
      <canvas ref={ref} className="barcodeImage" role="img" aria-label={`2D kod: ${value}`} />
      {downloadName && (
        <button type="button" className="codeDownload" onClick={download}>
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 4v11M7 10l5 5 5-5M5 20h14" />
          </svg>
          PNG yuklab olish
        </button>
      )}
    </div>
  );
}
