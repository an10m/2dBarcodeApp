import { FormEvent, useEffect, useRef, useState } from "react";

type Gs1History = { date: string; action: string; location: string; detail: string };
type Barcode = {
  id: string; name: string; format: string; value: string; scans: number;
  status: "Active" | "Draft" | "Archived"; updated: string; gtin: string; batch: string;
  serial: string; manufactureDate: string; expiryDate: string; bestBefore: string;
  manufacturer: string; category: string; country: string; netContent: string;
  packaging: string; lotSize: number; history: Gs1History[];
};

const seedBarcodes: Barcode[] = [
  { id: "BX-12480", name: "Organic Oat Milk 1L", format: "GS1 DataMatrix", value: "(01)09506000134352(10)NS20261104(21)10482001(17)271130", scans: 128462, status: "Active", updated: "Today, 09:42", gtin: "09506000134352", batch: "NS20261104", serial: "10482001", manufactureDate: "04 Nov 2026", expiryDate: "30 Nov 2027", bestBefore: "30 Nov 2027", manufacturer: "Northstar Foods LLC", category: "Plant-based beverages", country: "Uzbekistan", netContent: "1 L", packaging: "Carton, retail unit", lotSize: 48000,
    history: [
      { date: "04 Nov 2026, 08:12", action: "Commissioned", location: "Tashkent Filling Plant", detail: "GTIN and serial number registered; EPCIS commission event." },
      { date: "04 Nov 2026, 11:45", action: "Aggregation", location: "Tashkent Packing Line 3", detail: "Retail unit packed into case PAL-NS-77120." },
      { date: "05 Nov 2026, 16:20", action: "Shipped", location: "Tashkent Distribution Center", detail: "Dispatched to Northstar Central Warehouse." },
      { date: "06 Nov 2026, 09:08", action: "Received", location: "Northstar Central Warehouse", detail: "Quantity 2,400 retail units verified by GS1 GRAI." },
      { date: "12 Nov 2026, 13:31", action: "Delivered", location: "Berlin Central Pharmacy", detail: "Retail unit observed at final destination." },
      { date: "18 Nov 2026, 09:42", action: "Verified", location: "Berlin, Germany", detail: "Public verification completed; no anomaly detected." }
    ] },
  { id: "BX-12479", name: "Alpine Trail Jacket", format: "GS1 Digital Link", value: "https://id.gs1.org/01/09506000184721", scans: 89243, status: "Active", updated: "Yesterday", gtin: "09506000184721", batch: "AJ20261109", serial: "847210042", manufactureDate: "09 Nov 2026", expiryDate: "Not applicable", bestBefore: "Not applicable", manufacturer: "Alpine Works AG", category: "Outdoor apparel", country: "Uzbekistan", netContent: "Size M", packaging: "Polybag, retail unit", lotSize: 12500,
    history: [{ date: "09 Nov 2026, 07:30", action: "Commissioned", location: "Samarkand Assembly Hall", detail: "GTIN, batch and serial identifiers registered." }, { date: "10 Nov 2026, 15:10", action: "Shipped", location: "Samarkand Distribution Hub", detail: "Customer order NS-88421 handed to carrier." }, { date: "13 Nov 2026, 12:44", action: "Received", location: "Berlin Retail Store 12", detail: "Inventory received and linked to store shelf location." }] },
  { id: "BX-12478", name: "Citrus Hand Wash 250ml", format: "GS1 DataMatrix", value: "(01)09506000984716(10)HW261104(21)984716002", scans: 63418, status: "Active", updated: "12 Nov 2026", gtin: "09506000984716", batch: "HW261104", serial: "984716002", manufactureDate: "04 Nov 2026", expiryDate: "31 Oct 2028", bestBefore: "31 Oct 2028", manufacturer: "Northstar Consumer Care", category: "Personal care", country: "Uzbekistan", netContent: "250 ml", packaging: "Bottle, retail unit", lotSize: 76000,
    history: [{ date: "04 Nov 2026, 06:15", action: "Commissioned", location: "Tashkent Plant A", detail: "Batch and unique serial assigned." }, { date: "04 Nov 2026, 14:52", action: "Aggregated", location: "Tashkent Plant A", detail: "Linked to case ID 095060009999900012." }, { date: "08 Nov 2026, 10:22", action: "Shipped", location: "Tashkent Export Terminal", detail: "Manifest HSW-2468 departed for regional distribution." }] },
  { id: "BX-12477", name: "Studio Mug / Clay", format: "GS1 Digital Link", value: "https://id.gs1.org/01/09506000821095", scans: 21912, status: "Draft", updated: "10 Nov 2026", gtin: "09506000821095", batch: "MUG-DRAFT-04", serial: "821095104", manufactureDate: "08 Nov 2026", expiryDate: "Not applicable", bestBefore: "Not applicable", manufacturer: "Studio Northstar", category: "Tableware", country: "Uzbekistan", netContent: "1 mug", packaging: "Gift box", lotSize: 3200,
    history: [{ date: "08 Nov 2026, 12:10", action: "Identifier allocated", location: "Northstar Design Office", detail: "Draft GTIN and linked data page allocated." }] },
  { id: "BX-12476", name: "Field Notes No. 04", format: "GS1 DataMatrix", value: "(01)09506000018472(10)FN041108(21)184720004", scans: 7648, status: "Archived", updated: "08 Nov 2026", gtin: "09506000018472", batch: "FN041108", serial: "184720004", manufactureDate: "08 Nov 2026", expiryDate: "Not applicable", bestBefore: "Not applicable", manufacturer: "Field Station Publishing", category: "Stationery", country: "Uzbekistan", netContent: "1 notebook", packaging: "Shrink wrap", lotSize: 18000,
    history: [{ date: "08 Nov 2026, 09:20", action: "Commissioned", location: "Tashkent Print Works", detail: "Identifier issued for archived edition." }, { date: "18 Nov 2026, 10:04", action: "Archived", location: "Northstar Catalog", detail: "Edition closed after inventory depletion." }] }
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
  const [selectedBarcode, setSelectedBarcode] = useState<Barcode | null>(null);

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
    `${item.name} ${item.id} ${item.value} ${item.gtin} ${item.batch} ${item.serial}`.toLowerCase().includes(query.toLowerCase()) &&
    (status === "All statuses" || item.status === status)
  );

  function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setBarcodes((current) => [{
      id: `BX-${12481 + current.length}`,
      name: String(data.get("name") || "Untitled barcode"),
      format: String(data.get("format")),
      value: String(data.get("payload")),
      scans: 128,
      status: "Draft",
      updated: "Just now",
      gtin: String(data.get("payload") || "").replace(/\D/g, "").slice(0, 14),
      batch: "PENDING",
      serial: "PENDING",
      manufactureDate: "Pending",
      expiryDate: "Pending",
      bestBefore: "Pending",
      manufacturer: "Northstar Goods",
      category: "Unclassified",
      country: "Uzbekistan",
      netContent: "Pending",
      packaging: "Pending",
      lotSize: 0,
      history: [{ date: "Just now", action: "Draft created", location: "SignalCode workspace", detail: "Record created and awaiting GS1 identifier verification." }]
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
            <Metric label="Total barcodes" value="12,480" detail="↑ 18.6% this month" />
            <Metric label="Scans this month" value="284,692" detail="↑ 24.2% vs last month" />
            <Metric label="Active products" value="98.4%" detail="↑ 4.8% verified" />
            <Metric label="Import queue" value="126" detail="18 need attention" neutral />
          </section>
          <div className="contentGrid">
            <Library barcodes={filtered} query={query} setQuery={setQuery} status={status} setStatus={setStatus} notify={notify} onSelect={setSelectedBarcode} />
            <aside className="panel activityPanel">
              <PanelHeader title="Activity stream" caption="Recent changes across your workspace" />
              <div className="activityList">
                <Activity text="Organic Oat Milk 1L was published" time="12 min ago" />
                <Activity tone="orange" text="Import batch #104 needs review" time="48 min ago" />
                <Activity tone="blue" text="New scan received from Berlin" time="2 hr ago" />
              </div>
              <div className="progress"><div><span>Monthly scan capacity</span><b>284,692 / 500,000</b></div><i><b /></i></div>
              <div className="quickActions"><button onClick={() => navigate("Scan")}><b>⌁ Scan a code</b><span>Camera or image upload</span></button><button onClick={() => navigate("Imports")}><b>⇧ Import batch</b><span>CSV up to 10,000 rows</span></button></div>
            </aside>
          </div>
        </>}
        {activeNav === "Barcode library" && <Library barcodes={filtered} query={query} setQuery={setQuery} status={status} setStatus={setStatus} notify={notify} onSelect={setSelectedBarcode} full />}
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
      {selectedBarcode && <ProductHistory barcode={selectedBarcode} onClose={() => setSelectedBarcode(null)} />}
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

function Library({ barcodes, query, setQuery, status, setStatus, notify, onSelect, full = false }: {
  barcodes: Barcode[]; query: string; setQuery: (value: string) => void; status: string; setStatus: (value: string) => void; notify: (message: string) => void; onSelect: (barcode: Barcode) => void; full?: boolean;
}) {
  return <section className={`panel ${full ? "full" : ""}`}><PanelHeader title="Barcode library" caption="Manage the identifiers your customers and teams rely on." /><div className="filters"><label><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name, ID, GTIN, batch, or serial" /></label><select value={status} onChange={(event) => setStatus(event.target.value)}><option>All statuses</option><option>Active</option><option>Draft</option><option>Archived</option></select>{full && <button className="outlineButton" onClick={() => notify("Export prepared: 12,480 records")}>↓ Export</button>}</div><BarcodeTable barcodes={barcodes} onSelect={onSelect} /></section>;
}

function BarcodeTable({ barcodes, onSelect }: { barcodes: Barcode[]; onSelect: (barcode: Barcode) => void }) {
  if (!barcodes.length) return <div className="empty">No barcodes match your filters.</div>;
  return <div className="tableWrap"><table><thead><tr><th>Barcode</th><th>GS1 identity</th><th>Scans</th><th>Status</th></tr></thead><tbody>{barcodes.map((item) => <tr key={item.id} className="clickableRow" onClick={() => onSelect(item)}><td><div className="codeName"><span className="pattern" /><div><b>{item.name}</b><small>{item.id} · {item.updated}</small></div></div></td><td><b>{item.gtin}</b><small>Batch {item.batch}</small></td><td><b>{item.scans.toLocaleString()}</b></td><td><span className={`badge ${item.status.toLowerCase()}`}>{item.status}</span></td></tr>)}</tbody></table></div>;
}

function ActivityView() {
  return <section className="panel full"><PanelHeader title="Scan activity" caption="284,692 verification events across pharmacies, teams, and public users." /><div className="activityList fullActivity"><Activity text="Organic Oat Milk 1L was verified" time="12 min ago · Berlin · 128,462 total scans" /><Activity tone="orange" text="Serial duplicate flagged for review" time="48 min ago · System · 23 serial anomalies" /><Activity tone="blue" text="New public scan received" time="2 hr ago · Tashkent · 42,806 regional scans" /></div></section>;
}
function ImportsView({ notify }: { notify: (message: string) => void }) {
  return <section className="panel full"><PanelHeader title="Import queue" caption="Batch product data before it enters the trusted catalog." /><div className="imports"><div><span><b>northstar-products-nov.csv</b><small>184,260 rows · Uploaded today</small></span><b className="badge active">Ready</b></div><div><span><b>batch-certificates-104.csv</b><small>64,820 rows · Needs review</small></span><b className="badge draft">Review 18</b></div><div><span><b>gs1-digital-link-history.csv</b><small>38,142 EPCIS events · Uploaded yesterday</small></span><b className="badge active">Complete</b></div></div><button className="primaryButton importButton" onClick={() => notify("CSV import opened")}>⇧ Import CSV</button></section>;
}

function ProductHistory({ barcode, onClose }: { barcode: Barcode; onClose: () => void }) {
  return <div className="historyBackdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <aside className="historyDrawer" aria-label={`${barcode.name} GS1 product history`}>
      <header className="historyHeader"><div><small>GS1 product record</small><h2>{barcode.name}</h2></div><button type="button" onClick={onClose} aria-label="Close">×</button></header>
      <div className="historyStatus"><span className={`badge ${barcode.status.toLowerCase()}`}>{barcode.status}</span><span>{barcode.scans.toLocaleString()} linked verifications</span></div>
      <section className="identityGrid">
        <div><span>GTIN</span><b>{barcode.gtin}</b></div>
        <div><span>Batch / lot (AI 10)</span><b>{barcode.batch}</b></div>
        <div><span>Serial (AI 21)</span><b>{barcode.serial}</b></div>
        <div><span>Manufacture date (AI 11)</span><b>{barcode.manufactureDate}</b></div>
        <div><span>Expiry (AI 17)</span><b>{barcode.expiryDate}</b></div>
        <div><span>Best before</span><b>{barcode.bestBefore}</b></div>
        <div><span>Manufacturer</span><b>{barcode.manufacturer}</b></div>
        <div><span>Net content</span><b>{barcode.netContent}</b></div>
        <div><span>Country</span><b>{barcode.country}</b></div>
        <div><span>Packaging</span><b>{barcode.packaging}</b></div>
        <div><span>Lot size</span><b>{barcode.lotSize ? barcode.lotSize.toLocaleString() : "Pending"}</b></div>
        <div><span>Category</span><b>{barcode.category}</b></div>
      </section>
      <section className="historyPayload"><small>Canonical 2D payload</small><code>{barcode.value}</code></section>
      <section className="historyTimeline"><div className="historySectionTitle"><h3>GS1 EPCIS history</h3><span>{barcode.history.length} events</span></div>{barcode.history.map((event, index) => <article key={`${event.date}-${event.action}`}><i>{index + 1}</i><div><time>{event.date}</time><h4>{event.action}</h4><b>{event.location}</b><p>{event.detail}</p></div></article>)}</section>
    </aside>
  </div>;
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
      {result && <article className="result"><div className="resultTop"><div><small>SignalCode result · GS1 EPCIS verified</small><h2>Organic Oat Milk 1L</h2></div><b>✓ Verified product</b></div><div className="resultGrid"><div><span>Manufacturer</span><b>Northstar Foods LLC</b></div><div><span>GTIN / batch / serial</span><b>09506000134352 · NS20261104 · 10482001</b></div><div><span>Manufacture / expiry</span><b>04 Nov 2026 · 30 Nov 2027</b></div><div><span>Latest custody event</span><b>Verified · Berlin · 18 Nov 2026</b></div></div><div className="scanHistory"><h3>Linked product history</h3><ol><li><span>Commissioned</span><b>Tashkent Filling Plant · 04 Nov 2026</b></li><li><span>Aggregated</span><b>Packing Line 3 · 04 Nov 2026</b></li><li><span>Shipped & received</span><b>Distribution Center · 05–06 Nov 2026</b></li><li><span>Delivered & verified</span><b>Berlin · 12–18 Nov 2026</b></li></ol></div></article>}
    </section>
  </main>;
}
