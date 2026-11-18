import { useEffect, useRef, useState } from "react";
import * as bwipjs from "bwip-js/browser";

const bcidByFormat: Record<string, string> = {
  "GS1 DataMatrix": "gs1datamatrix",
  "QR / Digital Link": "qrcode",
  "GS1 Digital Link": "qrcode",
  "Data Matrix": "datamatrix"
};

/** Picks the symbology: explicit format first, otherwise guess from the payload. */
function pickBcid(format: string | undefined, value: string) {
  if (format && bcidByFormat[format]) return bcidByFormat[format];
  if (/^https?:\/\//i.test(value)) return "qrcode";
  if (/^\(\d{2,4}\)/.test(value)) return "gs1datamatrix";
  return "datamatrix";
}

type Props = { value: string; format?: string; scale?: number; className?: string };

export function BarcodeImage({ value, format, scale = 4, className }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!ref.current || !value.trim()) return;
    try {
      bwipjs.toCanvas(ref.current, {
        bcid: pickBcid(format, value.trim()),
        text: value.trim(), // GS1: "(01)09506000134352(10)NS20261104..."
        scale,
        padding: 2,
        backgroundcolor: "FFFFFF"
      });
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [value, format, scale]);

  if (error) return <span className="barcodeError" title={error}>Kod yaratilmadi</span>;
  return <canvas ref={ref} className={`barcodeImage ${className ?? ""}`} role="img" aria-label={`2D kod: ${value}`} />;
}
