import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { ProductPassport } from "./components/ProductPassport";
import { BarcodeImage } from "./components/BarcodeImage";
import { catalog, makeDraft } from "./data/catalog";
import type { CatalogProduct } from "./data/catalog";
import { localizeDate } from "./lib/format";

type Barcode = CatalogProduct;

const seedBarcodes: Barcode[] = catalog;

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
  const [selectedBarcode, setSelectedBarcode] = useState<Barcode | null>(() => {
    const key = new URLSearchParams(window.location.search).get("barcode");
    return key ? seedBarcodes.find((item) => item.id === key || item.gtin === key) ?? null : null;
  });
  const uzbekNav: Record<string, string> = {
    "Overview": "Umumiy ko'rinish",
    "Barcode library": "Shtrix kodlar kutubxonasi",
    "Scan activity": "Skaner tarixi",
    "Imports": "Importlar"
  };

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
    document.title = "SignalCode | 2D shtrix kod operatsiyalari";
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
    setBarcodes((current) => [
      { ...makeDraft(String(data.get("name") || ""), String(data.get("format")), String(data.get("payload"))), id: `BX-${12481 + current.length}` },
      ...current
    ]);
    setCreateOpen(false);
    notify("Shtrix kod qoralama sifatida saqlandi");
  }

  if (route === "Scan") return <ScanPage barcodes={barcodes} onBack={() => navigate("Overview")} onOpenPassport={(code) => {
    const digits = code.replace(/\D/g, "").slice(0, 14);
    const match = barcodes.find((item) => code.includes(item.gtin) || item.gtin === digits);
    if (match) setSelectedBarcode(match);
    else notify("Bu kod uchun partiya tarixi topilmadi");
  }} />;
  if (selectedBarcode) return <ProductHistory barcode={selectedBarcode} onClose={() => { setSelectedBarcode(null); window.history.replaceState({}, "", "/"); }} />;

  return (
    <div className="shell">
      <aside className="sidebar">
        <button className="logo" onClick={() => navigate("Overview")} aria-label="SignalCode home"><span className="logoMark">S</span><span className="logoName">signal<b>code</b></span></button>
        <div className="navLabel">Ish maydoni</div>
        <nav className="nav" aria-label="Primary navigation">
          {[
            ["▦", "Overview"], ["⌗", "Barcode library"], ["⌁", "Scan activity"], ["⇧", "Imports"]
          ].map(([icon, label]) => (
            <button key={label} className={`navItem ${activeNav === label ? "active" : ""}`} onClick={() => navigate(label)}>
              <span>{icon}</span>{uzbekNav[label]}
            </button>
          ))}
        </nav>
        <div className="sidebarBottom">
          <div className="workspace"><small>Joriy ish maydoni</small><strong>Northstar Goods</strong><div><span><i /> Ishlab chiqarish</span><span>⌄</span></div></div>
          <div className="profile"><span className="avatar">AK</span><div><b>Alex Kim</b><small>Ish maydoni administratori</small></div></div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div><div className="eyebrow">Northstar Goods / {uzbekNav[activeNav] || activeNav}</div><h1>{activeNav === "Overview" ? "Xayrli tong, Alex." : uzbekNav[activeNav] || activeNav}</h1><p className="subtitle">Shtrix kod operatsiyalaringiz muntazam ishlamoqda. Mahsulot identifikatsiyasi bo'yicha asosiy ko'rsatkichlar.</p></div>
          <div className="topActions"><button className="iconButton" onClick={() => notify("Yangi bildirishnoma yo'q")} aria-label="Bildirishnomalar">♢</button><button className="outlineButton" onClick={() => navigate("Scan")}>⌁ Skanerlash</button><button className="primaryButton" onClick={() => setCreateOpen(true)}>＋ Yangi shtrix kod</button></div>
        </header>

        {activeNav === "Overview" && <>
          <section className="kpis">
            <Metric label="Jami shtrix kodlar" value="12 480" detail="↑ Oylik o'sish 18,6%" />
            <Metric label="Bu oygi skanerlashlar" value="284 692" detail="↑ O'tgan oyga nisbatan 24,2%" />
            <Metric label="Faol mahsulotlar" value="98,4%" detail="↑ 4,8% tasdiqlangan" />
            <Metric label="Import navbati" value="126" detail="18 ta tekshiruvni talab qiladi" neutral />
          </section>
          <div className="contentGrid">
            <Library barcodes={filtered} query={query} setQuery={setQuery} status={status} setStatus={setStatus} notify={notify} onSelect={setSelectedBarcode} />
            <aside className="panel activityPanel">
              <PanelHeader title="Faollik oqimi" caption="Ish maydonidagi so'nggi o'zgarishlar" />
              <div className="activityList">
                <Activity text="Organic Oat Milk 1L nashr qilindi" time="12 daqiqa oldin" />
                <Activity tone="orange" text="Import partiyasi №104 tekshiruvni talab qiladi" time="48 daqiqa oldin" />
                <Activity tone="blue" text="Berlin shahridan yangi skanerlash keldi" time="2 soat oldin" />
              </div>
              <div className="progress"><div><span>Oylik skanerlash hajmi</span><b>284 692 / 500 000</b></div><i><b /></i></div>
              <div className="quickActions"><button onClick={() => navigate("Scan")}><b>⌁ Kodni skanerlash</b><span>Kamera yoki rasm yuklash</span></button><button onClick={() => navigate("Imports")}><b>⇧ Partiyani import qilish</b><span>10 000 qatorgacha CSV</span></button></div>
            </aside>
          </div>
        </>}
        {activeNav === "Barcode library" && <Library barcodes={filtered} query={query} setQuery={setQuery} status={status} setStatus={setStatus} notify={notify} onSelect={setSelectedBarcode} full />}
        {activeNav === "Scan activity" && <ActivityView />}
        {activeNav === "Imports" && <ImportsView notify={notify} />}
      </main>

      {createOpen && <div className="backdrop" onMouseDown={(event) => event.target === event.currentTarget && setCreateOpen(false)}>
        <form className="modal" onSubmit={create}>
          <div className="modalHeader"><div><h2>Shtrix kod yaratish</h2><p>GS1 identifikatori yoki mahsulot havolasidan boshlang.</p></div><button type="button" onClick={() => setCreateOpen(false)}>×</button></div>
          <label>Mahsulot yoki aktiv nomi<input name="name" placeholder="Masalan, Alpine Trail Jacket" required /></label>
          <label>Shtrix kod formati<select name="format" defaultValue="GS1 DataMatrix"><option>GS1 DataMatrix</option><option>QR / Digital Link</option><option>Data Matrix</option></select></label>
          <label>Ma'lumot yoki GTIN<input name="payload" placeholder="(01)09506000134352" required /></label>
          <div className="modalActions"><button type="button" className="outlineButton" onClick={() => setCreateOpen(false)}>Bekor qilish</button><button className="primaryButton">Qoralama sifatida saqlash</button></div>
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

function Library({ barcodes, query, setQuery, status, setStatus, notify, onSelect, full = false }: {
  barcodes: Barcode[]; query: string; setQuery: (value: string) => void; status: string; setStatus: (value: string) => void; notify: (message: string) => void; onSelect: (barcode: Barcode) => void; full?: boolean;
}) {
  return <section className={`panel ${full ? "full" : ""}`}><PanelHeader title="Shtrix kodlar kutubxonasi" caption="Mijozlar va jamoalar foydalanadigan identifikatorlarni boshqarish." /><div className="filters"><label><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nom, ID, GTIN, partiya yoki seriya bo'yicha qidirish" /></label><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="All statuses">Barcha holatlar</option><option value="Active">Faol</option><option value="Draft">Qoralama</option><option value="Archived">Arxivlangan</option></select>{full && <button className="outlineButton" onClick={() => notify("Eksport tayyor: 12 480 yozuv")}>↓ Eksport</button>}</div><BarcodeTable barcodes={barcodes} onSelect={onSelect} /></section>;
}

function BarcodeTable({ barcodes, onSelect }: { barcodes: Barcode[]; onSelect: (barcode: Barcode) => void }) {
  if (!barcodes.length) return <div className="empty">Filtrlarga mos shtrix kod topilmadi.</div>;
  return <div className="tableWrap"><table><thead><tr><th>Shtrix kod</th><th>GS1 identifikatori</th><th>Skanerlar</th><th>Holati</th></tr></thead><tbody>{barcodes.map((item) => <tr key={item.id} className="clickableRow" onClick={() => onSelect(item)}><td><div className="codeName"><BarcodeImage className="thumb" value={item.digitalLink} format="GS1 Digital Link" scale={2} /><div><b>{item.name}</b><small>{item.id} · {localizeDate(item.updated)}</small></div></div></td><td><b>{item.gtin}</b><small>Partiya {item.batch}</small></td><td><b>{item.scans.toLocaleString("uz-UZ")}</b></td><td><span className={`badge ${item.status.toLowerCase()}`}>{item.status === "Active" ? "Faol" : item.status === "Draft" ? "Qoralama" : "Arxivlangan"}</span></td></tr>)}</tbody></table></div>;
}

function ActivityView() {
  return <section className="panel full"><PanelHeader title="Skaner tarixi" caption="Apteka, jamoa va foydalanuvchilardan 284 692 tasdiqlash hodisasi." /><div className="activityList fullActivity"><Activity text="Organic Oat Milk 1L tasdiqlandi" time="12 daqiqa oldin · Berlin · Jami 128 462 skanerlash" /><Activity tone="orange" text="Seriya nusxasi tekshiruvga yuborildi" time="48 daqiqa oldin · Tizim · 23 seriya anomaliyasi" /><Activity tone="blue" text="Yangi jamoat skanerlashi qabul qilindi" time="2 soat oldin · Toshkent · 42 806 hududiy skanerlash" /></div></section>;
}
function ImportsView({ notify }: { notify: (message: string) => void }) {
  return <section className="panel full"><PanelHeader title="Import navbati" caption="Mahsulot ma'lumotlari ishonchli katalogga kirishidan oldin partiyalar bo'yicha tekshirilsin." /><div className="imports"><div><span><b>northstar-products-nov.csv</b><small>184 260 qator · Bugun yuklandi</small></span><b className="badge active">Tayyor</b></div><div><span><b>batch-certificates-104.csv</b><small>64 820 qator · Tekshiruv kerak</small></span><b className="badge draft">18 ta tekshiruv</b></div><div><span><b>gs1-digital-link-history.csv</b><small>38 142 EPCIS hodisasi · Kecha yuklandi</small></span><b className="badge active">To'liq</b></div></div><button className="primaryButton importButton" onClick={() => notify("CSV import oynasi ochildi")}>⇧ CSV import qilish</button></section>;
}

function ProductHistory({ barcode, onClose }: { barcode: Barcode; onClose: () => void }) {
  const statusCopy = barcode.status === "Active"
    ? { title: "Partiya haqiqiy", caption: "Barcha ishlab chiqarish bosqichlari tasdiqlangan" }
    : barcode.status === "Draft"
      ? { title: "Qoralama — tasdiqlash kutilmoqda", caption: "Identifikator hali to'liq tasdiqlanmagan", tone: "warning" as const }
      : { title: "Partiya arxivlangan", caption: "Yozuv keyingi tekshiruvlar uchun saqlangan" };

  return (
    <div className="passportPage">
      <ProductPassport
        eyebrow={`${barcode.category} · ${barcode.format}`}
        name={barcode.name}
        description={`Partiya ${barcode.batch} ning xomashyodan yakuniy xaridorgacha bo'lgan yo'li: ${barcode.stages.length} bosqich.`}
        meta={[
          { label: "Ishlab chiqaruvchi", value: barcode.manufacturer },
          { label: "Partiya", value: barcode.batch },
          { label: "Yaroqlilik muddati", value: localizeDate(barcode.expiryDate) },
          { label: "GTIN", value: barcode.gtin }
        ]}
        status={statusCopy}
        stages={barcode.stages}
        code={barcode.digitalLink}
        codeText={barcode.value}
        codeFormat="GS1 Digital Link"
        onBack={onClose}
        backLabel="Kutubxonaga qaytish"
        actions={<button type="button" className="passportPrimary" onClick={() => navigator.clipboard?.writeText(barcode.digitalLink)}>Havolani nusxalash</button>}
      />
    </div>
  );
}

function ScanPage({ onBack, barcodes, onOpenPassport }: { onBack: () => void; barcodes: Barcode[]; onOpenPassport: (code: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [code, setCode] = useState("");
  const [cameraOn, setCameraOn] = useState(false);
  const [error, setError] = useState("");
  const [verifiedCode, setVerifiedCode] = useState("");

  function verify(value: string) {
    const trimmed = value.trim();
    if (!trimmed) return;
    setCode(trimmed);
    setVerifiedCode(trimmed);
    setError("");
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraOn(false);
  }

  async function startCamera() {
    setError("");
    if (!navigator.mediaDevices?.getUserMedia) { setError("Bu brauzer kameraga kirishni qo'llab-quvvatlamaydi."); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
      streamRef.current = stream;
      setCameraOn(true);
    } catch { setError("Kamera ruxsat berilmadi yoki kamera mavjud emas."); }
  }
  useEffect(() => () => streamRef.current?.getTracks().forEach((track) => track.stop()), []);
  useEffect(() => {
    if (!cameraOn || !videoRef.current || !streamRef.current) return;
    videoRef.current.srcObject = streamRef.current;
    void videoRef.current.play();
  }, [cameraOn]);

  async function scanFrame() {
    if (!window.BarcodeDetector || !videoRef.current) { setError("Bu brauzer jonli kod aniqlashni qo'llab-quvvatlamaydi. Kodni qo'lda kiriting."); return; }
    try {
      const detector = new window.BarcodeDetector({ formats: ["qr_code", "data_matrix", "ean_13", "ean_8", "code_128"] });
      const found = await detector.detect(videoRef.current);
      if (found[0]) verify(found[0].rawValue);
      else setError("Kod aniqlanmadi. Kodni ramka ichida barqaror tuting.");
    } catch { setError("Jonli skanerlash orqali kod o'qilmadi."); }
  }

  async function scanImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!window.BarcodeDetector) { setError("Bu brauzer rasm ichidan kod aniqlashni qo'llab-quvvatlamaydi. Kodni qo'lda kiriting."); return; }
    try {
      const detector = new window.BarcodeDetector({ formats: ["qr_code", "data_matrix", "ean_13", "ean_8", "code_128"] });
      const image = await createImageBitmap(file);
      const found = await detector.detect(image);
      image.close();
      if (found[0]) verify(found[0].rawValue);
      else setError("Rasm ichida kod topilmadi. Aniqroq surat tanlang.");
    } catch { setError("Rasmni o'qib bo'lmadi. Boshqa suratni sinab ko'ring."); }
  }

  const match = verifiedCode
    ? barcodes.find((item) => verifiedCode.includes(item.gtin) || item.gtin === verifiedCode.replace(/\D/g, "").slice(0, 14))
    : undefined;

  return <main className="scanShell">
    <header className="scanHeader"><button className="scanBrand" onClick={onBack}><span className="logoMark">S</span><strong>signal<b>code</b></strong></button><span>O'Z / RU / EN</span></header>
    <section className="scanHero"><div className="eyebrow">Dori vositasini jamoat tekshiruvi</div><h1>Ishonishdan oldin dorini tekshiring.</h1><p>Paketdagi 2D kodni skanerlab, mahsulot, partiya, yaroqlilik muddati va sifat dalillarini ko'ring.</p>
      <div className="scanCard"><div className="scanFrame">{cameraOn ? <video ref={videoRef} muted playsInline /> : <span>⌁</span>}<i /><i /><i /><i /></div><div><b>Kameradan foydalaning</b><span>Jonli aniqlash qo'llab-quvvatlanadigan brauzerlarda ishlaydi.</span><div className="scanActions"><button type="button" className="outlineButton" onClick={startCamera}>{cameraOn ? "Kamerani qayta ishga tushirish" : "Kamerani ishga tushirish"}</button>{cameraOn && <button type="button" className="primaryButton" onClick={scanFrame}>Kodni o'qish</button>}<label className="outlineButton uploadButton">Rasm yuklash<input type="file" accept="image/*" onChange={scanImage} /></label>{cameraOn && <button type="button" className="textButton" onClick={stopCamera}>To'xtatish</button>}</div></div></div>
      {error && <div className="scanError">{error}</div>}
      <div className="orRow"><span>yoki kodni qo'lda kiriting</span></div>
      <form className="verifyForm" onSubmit={(event) => { event.preventDefault(); verify(code); }}><input value={code} onChange={(event) => setCode(event.target.value)} placeholder="GTIN, seriya yoki shtrix kod ma'lumoti" required /><button className="primaryButton">Dorini tekshirish →</button></form>
      {verifiedCode && <article className="result">
        <div className="resultTop"><div><small>SignalCode natijasi · GS1 EPCIS tekshiruvi</small><h2>{match ? match.name : "Yozuv topilmadi"}</h2></div><b>{match ? "✓ Tasdiqlangan mahsulot" : "! Tekshiruvni talab qiladi"}</b></div>
        <div className="resultCode"><span>Tekshirilgan kod</span><code>{verifiedCode}</code></div>
        <div className="resultGrid">
          <div><span>Ishlab chiqaruvchi</span><b>{match ? match.manufacturer : "Aniqlanmadi"}</b></div>
          <div><span>GTIN / partiya / seriya</span><b>{match ? `${match.gtin} · ${match.batch} · ${match.serial}` : "—"}</b></div>
          <div><span>Ishlab chiqarilgan / yaroqlilik</span><b>{match ? `${localizeDate(match.manufactureDate)} · ${localizeDate(match.expiryDate)}` : "—"}</b></div>
          <div><span>Eng so'nggi bosqich</span><b>{match ? `${match.stages.at(-1)?.title} · ${match.stages.at(-1)?.location}` : "—"}</b></div>
        </div>
        {match && <div className="scanHistory"><h3>Partiya bosqichlari</h3><ol>{match.stages.slice(0, 4).map((stage) => <li key={stage.title}><span>{stage.title}</span><b>{stage.location} · {stage.date}</b></li>)}</ol></div>}
        {match && <div className="scanPassportAction"><button type="button" className="passportPrimary" onClick={() => onOpenPassport(verifiedCode)}>To'liq partiya pasportini ochish</button></div>}
      </article>}
    </section>
  </main>;
}
