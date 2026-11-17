import { FormEvent, useEffect, useRef, useState } from "react";

type Barcode = { id: string; name: string; format: string; value: string; scans: number; status: "Active" | "Draft" | "Archived"; updated: string };

const seedBarcodes: Barcode[] = [
  { id: "BX-1048", name: "Organic Oat Milk 1L", format: "GS1 DataMatrix", value: "(01)09506000134352", scans: 1248, status: "Active", updated: "Today, 09:42" },
  { id: "BX-1047", name: "Alpine Trail Jacket", format: "QR / Digital Link", value: "https://id.signalcode.io/84721", scans: 892, status: "Active", updated: "Yesterday" },
  { id: "BX-1046", name: "Citrus Hand Wash 250ml", format: "GS1 DataMatrix", value: "(01)09506000984716", scans: 634, status: "Active", updated: "12 Nov 2026" },
  { id: "BX-1045", name: "Studio Mug / Clay", format: "QR / Digital Link", value: "https://id.signalcode.io/82109", scans: 219, status: "Draft", updated: "10 Nov 2026" },
  { id: "BX-1044", name: "Field Notes No. 04", format: "Data Matrix", value: "SN-FN04-000184", scans: 76, status: "Archived", updated: "08 Nov 2026" }
];

type BarcodeDetectorResult = { rawValue: string };
type BarcodeDetectorApi = new (options: { formats: string[] }) => { detect(source: CanvasImageSource): Promise<BarcodeDetectorResult[]> };
declare global { interface Window { BarcodeDetector?: BarcodeDetectorApi } }

export default function App() {
  const isScanRoute = window.location.pathname.startsWith("/scan");
  const [route, setRoute] = useState(isScanRoute ? "Scan" : "Overview");
  const [activeNav, setActiveNav] = useState(isScanRoute ? "Overview" : "Overview");
  const [barcodes, setBarcodes] = useState(seedBarcodes);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All statuses");
  const [createOpen, setCreateOpen] = useState(false);
  const [toast, setToast] = useState("");

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2600);
  }

  function navigate(next: string) {
    setRoute(next);
    setActiveNav(next === "Scan" ? "Overview" : next);
    window.history.pushState({}, "", next === "Scan" ? "/scan" : "/");
  }

  useEffect(() => {
    function pop() { const scan = window.location.pathname.startsWith("/scan"); setRoute(scan ? "Scan" : activeNav); }
    window.addEventListener("popstate", pop);
    return () => window.removeEventListener("popstate", pop);
  }, [activeNav]);

  const filtered = barcodes.filter((item) =>
    `${item.name} ${item.id} ${item.value}`.toLowerCase().includes(query.toLowerCase()) &&
    (status === "All statuses" || item.status === status)
  );

  function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setBarcodes((current) => [{
      id: `BX-${1050 + current.length}`,
      name: String(data.get("name") || "Untitled barcode"),
      format: String(data.get("format")),
      value: String(data.get("payload")),
      scans: 0,
      status: "Draft",
      updated: "Just now"
    }, ...current]);
    setCreateOpen(false);
    notify("Barcode saved as a draft");
  }

  if (route === "Scan") return <ScanPage onBack={() => navigate("Overview")} />;

  return (
    <div className="shell">
      <aside className="sidebar">
        <button className="logo" onClick={() => navigate("Overview")} aria-label="SignalCode home"><span className="logoMark">S</span><span className="logoName">signal<b>code</b></span></button>
        <div className="navLabel">Workspace</div>
        <nav className="nav" aria-label="Primary navigation">
          {[
            ["▦", "Overview"], ["⌗", "Barcode library"], ["⌁", "Scan activity"], ["⇧", "Imports"]
          ].map(([icon, label]) => (
            <button key={label} className={`navItem ${activeNav === label ? "active" : ""}`} onClick={() => navigate(label)}>
              <span>{icon}</span>{label}
            </button>
          ))}
        </nav>
        <div className="sidebarBottom">
          <div className="workspace"><small>Current workspace</small><strong>Northstar Goods</strong><div><span><i /> Production</span><span>⌄</span></div></div>
          <div className="profile"><span className="avatar">AK</span><div><b>Alex Kim</b><small>Workspace admin</small></div></div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div><div className="eyebrow">Northstar Goods / {activeNav}</div><h1>{activeNav === "Overview" ? "Good morning, Alex." : activeNav}</h1><p className="subtitle">Your barcode operations are moving cleanly. Here is the pulse of your product identity workspace.</p></div>
          <div className="topActions"><button className="iconButton" onClick={() => notify("No new notifications")} aria-label="Notifications">♢</button><button className="outlineButton" onClick={() => navigate("Scan")}>⌁ Scan</button><button className="primaryButton" onClick={() => setCreateOpen(true)}>＋ New barcode</button></div>
        </header>

        {activeNav === "Overview" && <>
          <section className="kpis">
            <Metric label="Total barcodes" value={barcodes.length.toString()} detail="↑ 12.4% this month" />
            <Metric label="Scans this month" value="3,069" detail="↑ 8.7% vs last month" />
            <Metric label="Active products" value="92.6%" detail="↑ 3.1% completion" />
            <Metric label="Import queue" value="04" detail="2 need attention" neutral />
          </section>
          <div className="contentGrid">
            <Library barcodes={filtered} query={query} setQuery={setQuery} status={status} setStatus={setStatus} notify={notify} />
            <aside className="panel activityPanel">
              <PanelHeader title="Activity stream" caption="Recent changes across your workspace" />
              <div className="activityList">
                <Activity text="Organic Oat Milk 1L was published" time="12 min ago" />
                <Activity tone="orange" text="Import batch #104 needs review" time="48 min ago" />
                <Activity tone="blue" text="New scan received from Berlin" time="2 hr ago" />
              </div>
              <div className="progress"><div><span>Monthly scan capacity</span><b>3,069 / 5,000</b></div><i><b /></i></div>
              <div className="quickActions"><button onClick={() => navigate("Scan")}><b>⌁ Scan a code</b><span>Camera or image upload</span></button><button onClick={() => navigate("Imports")}><b>⇧ Import batch</b><span>CSV up to 10,000 rows</span></button></div>
            </aside>
          </div>
        </>}
        {activeNav === "Barcode library" && <Library barcodes={filtered} query={query} setQuery={setQuery} status={status} setStatus={setStatus} notify={notify} full />}
        {activeNav === "Scan activity" && <ActivityView />}
        {activeNav === "Imports" && <ImportsView notify={notify} />}
      </main>

      {createOpen && <div className="backdrop" onMouseDown={(event) => event.target === event.currentTarget && setCreateOpen(false)}>
        <form className="modal" onSubmit={create}>
          <div className="modalHeader"><div><h2>Create a barcode</h2><p>Start with a GS1 identifier or product URL.</p></div><button type="button" onClick={() => setCreateOpen(false)}>×</button></div>
          <label>Product or asset name<input name="name" placeholder="e.g. Alpine Trail Jacket" required /></label>
          <label>Barcode format<select name="format" defaultValue="GS1 DataMatrix"><option>GS1 DataMatrix</option><option>QR / Digital Link</option><option>Data Matrix</option></select></label>
          <label>Payload or GTIN<input name="payload" placeholder="(01)09506000134352" required /></label>
          <div className="modalActions"><button type="button" className="outlineButton" onClick={() => setCreateOpen(false)}>Cancel</button><button className="primaryButton">Save draft</button></div>
        </form>
      </div>}
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}

function Metric({ label, value, detail, neutral }: { label: string; value: string; detail: string; neutral?: boolean }) {
  return <article className="kpi"><div><span>{label}</span><span>↗</span></div><strong>{value}</strong><small className={neutral ? "neutral" : ""}>{detail}</small></article>;
}
function PanelHeader({ title, caption }: { title: string; caption: string }) {
  return <div className="panelHeader"><div><h2>{title}</h2><p>{caption}</p></div></div>;
}
function Activity({ text, time, tone = "" }: { text: string; time: string; tone?: string }) {
  return <div className="activity"><span className={tone}>{tone ? "↗" : "✓"}</span><div><p>{text}</p><time>{time}</time></div></div>;
}

function Library({ barcodes, query, setQuery, status, setStatus, notify, full = false }: {
  barcodes: Barcode[]; query: string; setQuery: (value: string) => void; status: string; setStatus: (value: string) => void; notify: (message: string) => void; full?: boolean;
}) {
  return <section className={`panel ${full ? "full" : ""}`}><PanelHeader title="Barcode library" caption="Manage the identifiers your customers and teams rely on." /><div className="filters"><label><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name, ID, or payload" /></label><select value={status} onChange={(event) => setStatus(event.target.value)}><option>All statuses</option><option>Active</option><option>Draft</option><option>Archived</option></select>{full && <button className="outlineButton" onClick={() => notify("Export prepared")}>↓ Export</button>}</div><BarcodeTable barcodes={barcodes} /></section>;
}

function BarcodeTable({ barcodes }: { barcodes: Barcode[] }) {
  if (!barcodes.length) return <div className="empty">No barcodes match your filters.</div>;
  return <div className="tableWrap"><table><thead><tr><th>Barcode</th><th>Format</th><th>Scans</th><th>Status</th></tr></thead><tbody>{barcodes.map((item) => <tr key={item.id}><td><div className="codeName"><span className="pattern" /><div><b>{item.name}</b><small>{item.id} · {item.updated}</small></div></div></td><td><small>{item.format}</small></td><td><b>{item.scans.toLocaleString()}</b></td><td><span className={`badge ${item.status.toLowerCase()}`}>{item.status}</span></td></tr>)}</tbody></table></div>;
}

function ActivityView() {
  return <section className="panel full"><PanelHeader title="Scan activity" caption="Verification events from pharmacies, teams, and public users." /><div className="activityList fullActivity"><Activity text="Organic Oat Milk 1L was verified" time="12 min ago · Berlin" /><Activity tone="orange" text="Serial duplicate flagged for review" time="48 min ago · System" /><Activity tone="blue" text="New public scan received" time="2 hr ago · Tashkent" /></div></section>;
}
function ImportsView({ notify }: { notify: (message: string) => void }) {
  return <section className="panel full"><PanelHeader title="Import queue" caption="Batch product data before it enters the trusted catalog." /><div className="imports"><div><span><b>northstar-products-nov.csv</b><small>184 rows · Uploaded today</small></span><b className="badge active">Ready</b></div><div><span><b>batch-certificates-104.csv</b><small>64 rows · Needs review</small></span><b className="badge draft">Review 2</b></div></div><button className="primaryButton importButton" onClick={() => notify("CSV import opened")}>⇧ Import CSV</button></section>;
}

function ScanPage({ onBack }: { onBack: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [code, setCode] = useState("");
  const [cameraOn, setCameraOn] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(false);

  async function startCamera() {
    setError("");
    if (!navigator.mediaDevices?.getUserMedia) { setError("Camera access is not supported by this browser."); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
      setCameraOn(true);
    } catch { setError("Camera permission was denied or no camera is available."); }
  }
  useEffect(() => () => streamRef.current?.getTracks().forEach((track) => track.stop()), []);

  async function scanFrame() {
    if (!window.BarcodeDetector || !videoRef.current) { setError("This browser does not support live barcode detection. Enter the code manually."); return; }
    try {
      const detector = new window.BarcodeDetector({ formats: ["qr_code", "data_matrix", "ean_13", "ean_8", "code_128"] });
      const found = await detector.detect(videoRef.current);
      if (found[0]) { setCode(found[0].rawValue); setResult(true); }
      else setError("No code detected. Hold the code steady inside the frame.");
    } catch { setError("The live scan could not be read."); }
  }

  return <main className="scanShell">
    <header className="scanHeader"><button className="scanBrand" onClick={onBack}><span className="logoMark">S</span><strong>signal<b>code</b></strong></button><span>UZ / RU / EN</span></header>
    <section className="scanHero"><div className="eyebrow">Public medicine verification</div><h1>Check a medicine before you trust it.</h1><p>Scan the 2D code on a package to see its registered product, batch, expiry, and quality evidence.</p>
      <div className="scanCard"><div className="scanFrame">{cameraOn ? <video ref={videoRef} muted playsInline /> : <span>⌁</span>}<i /><i /><i /><i /></div><div><b>Use your camera</b><span>Live detection works in supported browsers.</span><button className="outlineButton" onClick={startCamera}>{cameraOn ? "Restart camera" : "Start camera"}</button>{cameraOn && <button className="primaryButton scanButton" onClick={scanFrame}>Read code</button>}</div></div>
      {error && <div className="scanError">{error}</div>}
      <div className="orRow"><span>or enter a code manually</span></div>
      <form className="verifyForm" onSubmit={(event) => { event.preventDefault(); if (code.trim()) setResult(true); }}><input value={code} onChange={(event) => setCode(event.target.value)} placeholder="GTIN, serial, or barcode payload" required /><button className="primaryButton">Verify medicine →</button></form>
      {result && <article className="result"><div className="resultTop"><div><small>SignalCode result</small><h2>Organic Oat Milk 1L</h2></div><b>✓ Verified product</b></div><div className="resultGrid"><div><span>Manufacturer</span><b>Northstar Foods LLC</b></div><div><span>Batch</span><b>NS-2026-11-04</b></div><div><span>Expiry</span><b>30 Nov 2027</b></div><div><span>GTIN</span><b>09506000134352</b></div></div></article>}
    </section>
  </main>;
}
