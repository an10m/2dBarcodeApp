"use client";

import Link from "next/link";
import { useState } from "react";

const verifiedMedicine = {
  name: "Organic Oat Milk 1L",
  manufacturer: "Northstar Foods LLC",
  batch: "NS-2026-11-04",
  expiry: "30 Nov 2027",
  gtin: "09506000134352",
  status: "Verified product",
};

export default function ScanPage() {
  const [code, setCode] = useState("");
  const [result, setResult] = useState<typeof verifiedMedicine | null>(null);

  function verify(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResult(verifiedMedicine);
  }

  return <main className="scan-shell"><header className="scan-header"><Link className="scan-brand" href="/"><span className="logo-mark">S</span><strong>signal<span>code</span></strong></Link><span className="scan-lang">UZ&nbsp; / &nbsp;RU&nbsp; / &nbsp;EN</span></header><section className="scan-hero"><div className="scan-eyebrow">Public medicine verification</div><h1>Check a medicine before you trust it.</h1><p>Scan the 2D code on a package to see its registered product, batch, expiry, and available quality evidence.</p><div className="scan-card"><div className="scan-frame" aria-hidden="true"><div className="scan-corner top-left" /><div className="scan-corner top-right" /><div className="scan-corner bottom-left" /><div className="scan-corner bottom-right" /><span>⌁</span></div><div className="scan-card-copy"><b>Use your camera</b><span>Camera scanning will connect to the GS1 decoder in the next release.</span><button className="outline-button" type="button" onClick={() => setCode("(01)09506000134352")}>Use demo code</button></div></div><div className="or-row"><span>or enter a code manually</span></div><form className="verify-form" onSubmit={verify}><input aria-label="Barcode or GTIN" value={code} onChange={(event) => setCode(event.target.value)} placeholder="GTIN, serial, or barcode payload" required /><button className="primary-button" type="submit">Verify medicine&nbsp; →</button></form>{result && <article className="verification-result"><div className="result-top"><div><span className="result-kicker">SignalCode result</span><h2>{result.name}</h2></div><span className="verified-pill">✓ {result.status}</span></div><div className="result-grid"><div><span>Manufacturer</span><b>{result.manufacturer}</b></div><div><span>Batch</span><b>{result.batch}</b></div><div><span>Expiry</span><b>{result.expiry}</b></div><div><span>GTIN</span><b>{result.gtin}</b></div></div><div className="evidence-note"><span>✓</span><p><b>Quality evidence available</b><br />Certificate and laboratory report are registered for this product. This scan confirms the package record, not independent medical safety.</p></div><button className="result-action" type="button">View evidence summary&nbsp; →</button></article>}</section><footer className="scan-footer"><span>Built for safer, more transparent local medicine.</span><Link href="/">For manufacturers and teams&nbsp; →</Link></footer></main>;
}
