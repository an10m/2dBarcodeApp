"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Barcode = { id: string; name: string; type: string; value: string; scans: number; status: "Active" | "Draft" | "Archived"; updated: string };

const seedBarcodes: Barcode[] = [
  { id: "BX-1048", name: "Organic Oat Milk 1L", type: "GS1 DataMatrix", value: "(01)09506000134352", scans: 1248, status: "Active", updated: "Today, 09:42" },
  { id: "BX-1047", name: "Alpine Trail Jacket", type: "QR / Digital Link", value: "https://id.signalcode.io/84721", scans: 892, status: "Active", updated: "Yesterday" },
  { id: "BX-1046", name: "Citrus Hand Wash 250ml", type: "GS1 DataMatrix", value: "(01)09506000984716", scans: 634, status: "Active", updated: "12 Nov 2026" },
  { id: "BX-1045", name: "Studio Mug / Clay", type: "QR / Digital Link", value: "https://id.signalcode.io/82109", scans: 219, status: "Draft", updated: "10 Nov 2026" },
  { id: "BX-1044", name: "Field Notes No. 04", type: "Data Matrix", value: "SN-FN04-000184", scans: 76, status: "Archived", updated: "08 Nov 2026" },
];

const navItems = [["▦", "Overview"], ["⌗", "Barcode library"], ["⌁", "Scan activity"], ["⇧", "Imports"]];

export default function Home() {
  const [activeNav, setActiveNav] = useState("Overview");
  const [barcodes, setBarcodes] = useState(seedBarcodes);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All statuses");
  const [showCreate, setShowCreate] = useState(false);
  const [toast, setToast] = useState("");

  const filteredBarcodes = useMemo(() => barcodes.filter((barcode) => {
    const matchesQuery = `${barcode.name} ${barcode.id} ${barcode.value}`.toLowerCase().includes(query.toLowerCase());
    const matchesStatus = statusFilter === "All statuses" || barcode.status === statusFilter;
    return matchesQuery && matchesStatus;
  }), [barcodes, query, statusFilter]);

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2800);
  }

  function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") || "Untitled barcode");
    const payload = String(form.get("payload") || "(01)00000000000000");
    setBarcodes((current) => [{ id: `BX-${1050 + current.length}`, name, type: String(form.get("format") || "GS1 DataMatrix"), value: payload, scans: 0, status: "Draft", updated: "Just now" }, ...current]);
    setShowCreate(false);
    notify("Barcode saved as a draft");
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="logo"><div className="logo-mark">S</div><div className="logo-name">signal<span>code</span></div></div>
        <div className="nav-label">Workspace</div>
        <nav className="nav" aria-label="Primary navigation">
          {navItems.map(([icon, label]) => <button className={`nav-item ${activeNav === label ? "active" : ""}`} key={label} onClick={() => { setActiveNav(label); notify(`${label} view selected`); }}><span className="nav-icon">{icon}</span>{label}</button>)}
        </nav>
        <div className="sidebar-bottom">
          <div className="workspace"><small>Current workspace</small><strong>Northstar Goods</strong><div className="workspace-row"><span><i className="status-dot" />Production</span><span>⌄</span></div></div>
          <div className="profile"><div className="avatar">AK</div><div><b>Alex Kim</b><span>Workspace admin</span></div><span style={{ marginLeft: "auto", fontSize: 17 }}>•••</span></div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div><div className="eyebrow">Northstar Goods / {activeNav}</div><h1>{activeNav === "Overview" ? "Good morning, Alex." : activeNav}</h1><p className="subtitle">Your barcode operations are moving cleanly. Here is the pulse of your product identity workspace.</p></div>
          <div className="top-actions"><button className="icon-button" aria-label="Notifications" onClick={() => notify("No new notifications")}>♢</button><Link className="outline-button" href="/scan">⌁&nbsp; Scan</Link><button className="primary-button" onClick={() => setShowCreate(true)}>＋&nbsp; New barcode</button></div>
        </header>

        {activeNav === "Overview" && <><section className="kpi-grid" aria-label="Workspace metrics">
          <Metric label="Total barcodes" value={barcodes.length.toLocaleString()} trend="↑ 12.4% this month" />
          <Metric label="Scans this month" value="3,069" trend="↑ 8.7% vs last month" />
          <Metric label="Active products" value="92.6%" trend="↑ 3.1% completion" />
          <Metric label="Import queue" value="04" trend="2 need attention" neutral />
        </section>

        <div className="content-grid">
          <section className="panel">
            <div className="panel-header"><div><h2 className="panel-title">Barcode library</h2><p className="panel-caption">Manage the identifiers your customers and teams rely on.</p></div><button className="outline-button" onClick={() => notify("Export prepared for download")}>↓&nbsp; Export</button></div>
            <div className="filter-row"><label className="search"><span>⌕</span><input aria-label="Search barcodes" placeholder="Search by name, ID, or payload" value={query} onChange={(event) => setQuery(event.target.value)} /></label><select className="select" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option>All statuses</option><option>Active</option><option>Draft</option><option>Archived</option></select></div>
            {filteredBarcodes.length ? <table><thead><tr><th>Barcode</th><th>Format</th><th>Scans</th><th>Status</th></tr></thead><tbody>{filteredBarcodes.map((barcode) => <tr key={barcode.id}><td><div className="code-name"><div className="code-pattern" aria-hidden="true">{Array.from({ length: 25 }, (_, index) => <i key={index} />)}</div><div><b>{barcode.name}</b><span>{barcode.id} · {barcode.updated}</span></div></div></td><td><span className="muted">{barcode.type}</span></td><td><b>{barcode.scans.toLocaleString()}</b></td><td><span className={`badge ${barcode.status === "Active" ? "green" : barcode.status === "Draft" ? "orange" : "blue"}`}>{barcode.status}</span></td></tr>)}</tbody></table> : <div className="empty">No barcodes match your current filters.</div>}
          </section>

          <aside className="panel"><div className="panel-header"><div><h2 className="panel-title">Activity stream</h2><p className="panel-caption">Recent changes across your workspace.</p></div><button className="icon-button" aria-label="More activity" onClick={() => notify("Showing the latest activity")}>•••</button></div><div className="activity-list"><Activity icon="✓" text="Organic Oat Milk 1L was published" time="12 min ago" /><Activity icon="↗" tone="orange" text="Import batch #104 needs review" time="48 min ago" /><Activity icon="⌁" tone="blue" text="New scan received from Berlin" time="2 hr ago" /><Activity icon="+" text="Alex added a new team member" time="Yesterday" /></div><div className="progress-block"><div className="progress-meta"><span>Monthly scan capacity</span><b>3,069 / 5,000</b></div><div className="progress-track"><div className="progress-fill" style={{ width: "61%" }} /></div></div><div className="quick-actions"><button className="quick-action" onClick={() => notify("Scanner is ready to open")}><b>⌁ Scan a code</b><span>Camera or image upload</span></button><button className="quick-action" onClick={() => notify("Import flow opened")}><b>⇧ Import batch</b><span>CSV up to 10,000 rows</span></button></div></aside>
        </div></>}
        {activeNav === "Barcode library" && <LibraryView barcodes={filteredBarcodes} query={query} setQuery={setQuery} statusFilter={statusFilter} setStatusFilter={setStatusFilter} />}
        {activeNav === "Scan activity" && <ActivityView />}
        {activeNav === "Imports" && <ImportsView />}
      </main>

      {showCreate && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowCreate(false); }}><form className="modal" onSubmit={handleCreate}><div className="modal-header"><div><h2>Create a barcode</h2><p>Start with a GS1 identifier or a product URL. You can publish it later.</p></div><button type="button" className="close" aria-label="Close" onClick={() => setShowCreate(false)}>×</button></div><div className="form-grid"><label className="form-label">Product or asset name<input className="form-input" name="name" placeholder="e.g. Alpine Trail Jacket" required /></label><label className="form-label">Barcode format<select className="form-input" name="format" defaultValue="GS1 DataMatrix"><option>GS1 DataMatrix</option><option>QR / Digital Link</option><option>Data Matrix</option></select></label><label className="form-label">Payload or GTIN<input className="form-input" name="payload" placeholder="(01)09506000134352" required /></label></div><div className="modal-actions"><button type="button" className="outline-button" onClick={() => setShowCreate(false)}>Cancel</button><button className="primary-button" type="submit">Save draft</button></div></form></div>}
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}

function Metric({ label, value, trend, neutral = false }: { label: string; value: string; trend: string; neutral?: boolean }) { return <article className="kpi"><div className="kpi-head"><span>{label}</span><span>↗</span></div><div className="kpi-value">{value}</div><div className={`kpi-trend ${neutral ? "neutral" : ""}`}>{trend}</div></article>; }
function Activity({ icon, text, time, tone = "" }: { icon: string; text: string; time: string; tone?: string }) { return <div className="activity"><div className={`activity-icon ${tone}`}>{icon}</div><div><p>{text}</p><time>{time}</time></div></div>; }

function LibraryView({ barcodes, query, setQuery, statusFilter, setStatusFilter }: { barcodes: Barcode[]; query: string; setQuery: (value: string) => void; statusFilter: string; setStatusFilter: (value: string) => void }) {
  return <section className="panel full-panel"><div className="panel-header"><div><h2 className="panel-title">Barcode library</h2><p className="panel-caption">Search and manage every product identity in this workspace.</p></div><span className="view-count">{barcodes.length} records</span></div><div className="filter-row"><label className="search"><span>⌕</span><input aria-label="Search barcodes" placeholder="Search by name, ID, or payload" value={query} onChange={(event) => setQuery(event.target.value)} /></label><select className="select" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option>All statuses</option><option>Active</option><option>Draft</option><option>Archived</option></select></div><BarcodeTable barcodes={barcodes} /></section>;
}

function BarcodeTable({ barcodes }: { barcodes: Barcode[] }) {
  if (!barcodes.length) return <div className="empty">No barcodes match your current filters.</div>;
  return <table><thead><tr><th>Barcode</th><th>Format</th><th>Scans</th><th>Status</th></tr></thead><tbody>{barcodes.map((barcode) => <tr key={barcode.id}><td><div className="code-name"><div className="code-pattern" aria-hidden="true">{Array.from({ length: 25 }, (_, index) => <i key={index} />)}</div><div><b>{barcode.name}</b><span>{barcode.id} · {barcode.updated}</span></div></div></td><td><span className="muted">{barcode.type}</span></td><td><b>{barcode.scans.toLocaleString()}</b></td><td><span className={`badge ${barcode.status === "Active" ? "green" : barcode.status === "Draft" ? "orange" : "blue"}`}>{barcode.status}</span></td></tr>)}</tbody></table>;
}

function ActivityView() {
  return <section className="panel full-panel"><div className="panel-header"><div><h2 className="panel-title">Scan activity</h2><p className="panel-caption">Verification events from pharmacies, teams, and public users.</p></div><span className="view-count">3,069 this month</span></div><div className="activity-list activity-grid"><Activity icon="✓" text="Organic Oat Milk 1L was verified" time="12 min ago · Berlin" /><Activity icon="↗" tone="orange" text="Import batch #104 needs review" time="48 min ago · Alex Kim" /><Activity icon="⌁" tone="blue" text="New public scan received" time="2 hr ago · Tashkent" /><Activity icon="!" tone="orange" text="Serial duplicate flagged for review" time="Yesterday · System" /><Activity icon="✓" text="Citrus Hand Wash 250ml was verified" time="Yesterday · Samarkand" /></div></section>;
}

function ImportsView() {
  return <section className="panel full-panel"><div className="panel-header"><div><h2 className="panel-title">Import queue</h2><p className="panel-caption">Batch product data before it becomes part of the trusted catalog.</p></div><button className="primary-button" onClick={() => window.alert("CSV import will connect in the next backend slice.")}>⇧&nbsp; Import CSV</button></div><div className="import-list"><div className="import-row"><div><b>northstar-products-nov.csv</b><span>184 rows · Uploaded today at 09:14</span></div><span className="badge green">Ready</span></div><div className="import-row"><div><b>batch-certificates-104.csv</b><span>64 rows · Uploaded today at 08:42</span></div><span className="badge orange">Review 2</span></div><div className="import-row"><div><b>archive-products-oct.csv</b><span>1,208 rows · Completed 08 Nov 2026</span></div><span className="badge blue">Complete</span></div></div></section>;
}
