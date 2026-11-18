import { useCallback, useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { api, ApiError, formatDateTime } from "./api";
import type { Batch, HistoryItem, Stage, User } from "./api";

type Tab = "pending" | "scan" | "history";

const REASONS: [string, string][] = [
  ["damaged_package", "Qadoq shikastlangan"],
  ["temperature", "Harorat rejimi buzilgan"],
  ["quantity", "Miqdor hujjatga mos kelmaydi"],
  ["documents", "Hujjatlar mos kelmaydi"],
  ["other", "Boshqa sabab"]
];

type BarcodeDetectorApi = new (options: { formats: string[] }) => { detect(source: CanvasImageSource): Promise<{ rawValue: string }[]> };
declare global { interface Window { BarcodeDetector?: BarcodeDetectorApi } }

export default function PharmacyApp() {
  const [user, setUser] = useState<User | null | undefined>(undefined); // undefined = still checking
  const [tab, setTab] = useState<Tab>("pending");
  const [openId, setOpenId] = useState<number | null>(null);
  const [toast, setToast] = useState("");
  const [version, setVersion] = useState(0); // bump to refresh lists after a change

  const notify = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 3200);
  }, []);

  useEffect(() => {
    api<{ user: User }>("/api/me").then((r) => setUser(r.user)).catch(() => setUser(null));
  }, []);

  const expire = useCallback(() => { setUser(null); setOpenId(null); }, []);

  async function logout() {
    await api("/api/logout", {}).catch(() => undefined);
    setUser(null);
    setOpenId(null);
  }

  if (user === undefined) return <div className="phLoading">Yuklanmoqda…</div>;
  if (user === null) return <Login onLogin={setUser} />;

  return (
    <div className="phShell">
      <header className="phHeader">
        <div className="phBrand"><span className="phMark">S</span><strong>signal<b>code</b></strong><em>Dorixona kabineti</em></div>
        <div className="phUser"><span><b>{user.pharmacyName}</b><small>{user.city}</small></span><button className="phGhost" onClick={logout}>Chiqish</button></div>
      </header>
      <nav className="phTabs" aria-label="Asosiy menyu">
        <button className={tab === "pending" ? "active" : ""} onClick={() => { setTab("pending"); setOpenId(null); }}>Partiyalar</button>
        <button className={tab === "scan" ? "active" : ""} onClick={() => { setTab("scan"); setOpenId(null); }}>Skanerlash</button>
        <button className={tab === "history" ? "active" : ""} onClick={() => { setTab("history"); setOpenId(null); }}>Qabul tarixi</button>
      </nav>
      <main className="phMain">
        {openId !== null
          ? <BatchDetail id={openId} onClose={() => setOpenId(null)} onChanged={() => setVersion((v) => v + 1)} notify={notify} onExpired={expire} />
          : tab === "pending" ? <BatchList version={version} onOpen={setOpenId} onExpired={expire} />
          : tab === "scan" ? <ScanTab onOpen={setOpenId} onExpired={expire} />
          : <History version={version} onExpired={expire} />}
      </main>
      {toast && <div className="phToast" role="status">{toast}</div>}
    </div>
  );
}

function useLoader<T>(load: () => Promise<T>, deps: unknown[], onExpired: () => void) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let alive = true;
    setError("");
    load().then((d) => alive && setData(d)).catch((e: unknown) => {
      if (!alive) return;
      if (e instanceof ApiError && e.status === 401) onExpired();
      else setError(e instanceof Error ? e.message : "Xatolik");
    });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return { data, error, setData };
}

function Login({ onLogin }: { onLogin: (user: User) => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const r = await api<{ user: User }>("/api/login", { username, password });
      onLogin(r.user);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Xatolik");
    } finally { setBusy(false); }
  }

  return <div className="phLogin">
    <form className="phCard phLoginCard" onSubmit={submit}>
      <div className="phBrand"><span className="phMark">S</span><strong>signal<b>code</b></strong></div>
      <h1>Dorixona kabineti</h1>
      <p>Partiyani qabul qilish va holatini yangilash uchun kiring.</p>
      <label>Login<input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" autoCapitalize="none" required /></label>
      <label>Parol<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required /></label>
      {error && <div className="phError" role="alert">{error}</div>}
      <button className="phPrimary" disabled={busy}>{busy ? "Kirilmoqda…" : "Kirish"}</button>
      <small>Hisob yo'qmi? Ishlab chiqaruvchi yoki administratorga murojaat qiling.</small>
    </form>
  </div>;
}

function statusOf(b: Batch) {
  if (b.receivedAt) return { label: "Qabul qilingan", cls: "ok" };
  if (b.deviations) return { label: "Og'ish bor", cls: "warn" };
  return { label: "Kutilmoqda", cls: "wait" };
}

function BatchRow({ b, onOpen }: { b: Batch; onOpen: (id: number) => void }) {
  const s = statusOf(b);
  return <button className="phRow" onClick={() => onOpen(b.id)}>
    <span><b>{b.name}</b><small>{b.gtin} · {b.batch} · {b.serial}</small></span>
    <i className={`phBadge ${s.cls}`}>{s.label}</i>
  </button>;
}

function BatchList({ version, onOpen, onExpired }: { version: number; onOpen: (id: number) => void; onExpired: () => void }) {
  const { data, error } = useLoader(() => api<{ batches: Batch[] }>("/api/batches"), [version], onExpired);
  const [filter, setFilter] = useState<"wait" | "done" | "all">("wait");
  const [query, setQuery] = useState("");
  if (error) return <div className="phError">{error}</div>;
  if (!data) return <div className="phLoading">Yuklanmoqda…</div>;
  const q = query.trim().toLowerCase();
  const list = data.batches.filter((b) =>
    (filter === "all" || (filter === "done") === Boolean(b.receivedAt)) &&
    (!q || `${b.name} ${b.gtin} ${b.batch} ${b.serial}`.toLowerCase().includes(q)));
  const waiting = data.batches.filter((b) => !b.receivedAt).length;
  return <section className="phCard">
    <div className="phHead"><div><h2>Partiyalar</h2><p>Qabul kutayotgan: <b>{waiting}</b></p></div></div>
    <div className="phFilters">
      <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Nom, GTIN, partiya yoki seriya" aria-label="Qidirish" />
      <div className="phChips">
        {([["wait", "Kutilmoqda"], ["done", "Qabul qilingan"], ["all", "Hammasi"]] as const).map(([k, l]) =>
          <button key={k} className={filter === k ? "active" : ""} onClick={() => setFilter(k)}>{l}</button>)}
      </div>
    </div>
    {list.length ? <div className="phList">{list.map((b) => <BatchRow key={b.id} b={b} onOpen={onOpen} />)}</div>
      : <div className="phEmpty">Bu bo'limda partiya yo'q.</div>}
  </section>;
}

function ScanTab({ onOpen, onExpired }: { onOpen: (id: number) => void; onExpired: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [matches, setMatches] = useState<Batch[] | null>(null);

  async function lookup(value: string) {
    const trimmed = value.trim();
    if (!trimmed) return;
    setCode(trimmed);
    setError("");
    setMatches(null);
    try {
      const r = await api<{ matches: Batch[] }>("/api/lookup", { code: trimmed });
      if (r.matches.length === 1) onOpen(r.matches[0].id);
      else if (r.matches.length === 0) setError("Bu kod bazada topilmadi. Partiya hali tizimga kiritilmagan bo'lishi mumkin.");
      else setMatches(r.matches);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) onExpired();
      else setError(e instanceof Error ? e.message : "Xatolik");
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraOn(false);
  }
  async function startCamera() {
    setError("");
    if (!navigator.mediaDevices?.getUserMedia) { setError("Bu qurilmada kamera mavjud emas. Kodni qo'lda kiriting."); return; }
    try {
      stopCamera();
      streamRef.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
      setCameraOn(true);
    } catch { setError("Kamera ruxsat berilmadi yoki ishlamayapti."); }
  }
  useEffect(() => () => streamRef.current?.getTracks().forEach((t) => t.stop()), []);
  useEffect(() => {
    if (!cameraOn || !videoRef.current || !streamRef.current) return;
    videoRef.current.srcObject = streamRef.current;
    void videoRef.current.play();
  }, [cameraOn]);

  const makeDetector = () => new window.BarcodeDetector!({ formats: ["qr_code", "data_matrix", "ean_13", "ean_8", "code_128"] });

  async function readFrame() {
    if (!window.BarcodeDetector || !videoRef.current) { setError("Bu brauzer jonli skanerlashni qo'llab-quvvatlamaydi. Kodni qo'lda kiriting."); return; }
    try {
      const found = await makeDetector().detect(videoRef.current);
      if (found[0]) { stopCamera(); void lookup(found[0].rawValue); }
      else setError("Kod aniqlanmadi. Paketni ramka ichida barqaror tuting.");
    } catch { setError("Skanerlashda xatolik yuz berdi."); }
  }
  async function readImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!window.BarcodeDetector) { setError("Bu brauzer rasmdan kod o'qiy olmaydi. Kodni qo'lda kiriting."); return; }
    try {
      const image = await createImageBitmap(file);
      const found = await makeDetector().detect(image);
      image.close();
      if (found[0]) void lookup(found[0].rawValue);
      else setError("Rasmda 2D kod topilmadi.");
    } catch { setError("Rasmni o'qib bo'lmadi."); }
  }

  return <section className="phCard">
    <div className="phHead"><div><h2>Partiyani skanerlash</h2><p>Paketdagi 2D kodni skanerlang yoki qo'lda kiriting.</p></div></div>
    <div className="phScan">
      <div className="phFrame">{cameraOn ? <video ref={videoRef} muted playsInline /> : <span>⌁</span>}</div>
      <div className="phScanActions">
        <button className="phOutline" onClick={startCamera}>{cameraOn ? "Kamerani qayta yoqish" : "Kamerani yoqish"}</button>
        {cameraOn && <button className="phPrimary" onClick={readFrame}>Kodni o'qish</button>}
        <label className="phOutline">Rasm yuklash<input type="file" accept="image/*" hidden onChange={readImage} /></label>
        {cameraOn && <button className="phGhost" onClick={stopCamera}>To'xtatish</button>}
      </div>
    </div>
    {error && <div className="phError" role="alert">{error}</div>}
    <form className="phManual" onSubmit={(e) => { e.preventDefault(); void lookup(code); }}>
      <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="(01)09506000487120(10)PM-260814(21)48120007" aria-label="Kod" />
      <button className="phPrimary">Topish</button>
    </form>
    {matches && <div className="phList"><p className="phHint">Bir nechta partiya topildi, kerakligini tanlang:</p>{matches.map((b) => <BatchRow key={b.id} b={b} onOpen={onOpen} />)}</div>}
  </section>;
}

function BatchDetail({ id, onClose, onChanged, notify, onExpired }: {
  id: number; onClose: () => void; onChanged: () => void; notify: (m: string) => void; onExpired: () => void;
}) {
  const { data, error, setData } = useLoader(() => api<{ batch: Batch; stages: Stage[] }>(`/api/batch?id=${id}`), [id], onExpired);
  const [mode, setMode] = useState<"" | "receive" | "deviation">("");
  const [note, setNote] = useState("");
  const [reason, setReason] = useState("damaged_package");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");

  if (error) return <section className="phCard"><button className="phGhost" onClick={onClose}>← Orqaga</button><div className="phError">{error}</div></section>;
  if (!data) return <div className="phLoading">Yuklanmoqda…</div>;
  const { batch, stages } = data;
  const s = statusOf(batch);

  async function send(kind: "receive" | "deviation") {
    setBusy(true);
    setFormError("");
    try {
      const payload = kind === "receive" ? { batchId: id, note } : { batchId: id, reason, note };
      const r = await api<{ stages: Stage[] }>(`/api/${kind}`, payload);
      const fresh = await api<{ batch: Batch; stages: Stage[] }>(`/api/batch?id=${id}`).catch(() => ({ batch, stages: r.stages }));
      setData(fresh);
      setMode("");
      setNote("");
      onChanged();
      notify(kind === "receive" ? "Partiya qabul qilindi va tarixga yozildi" : "Og'ish qayd etildi");
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) onExpired();
      else {
        setFormError(e instanceof Error ? e.message : "Xatolik");
        if (e instanceof ApiError && e.code === "already_received") api<{ batch: Batch; stages: Stage[] }>(`/api/batch?id=${id}`).then(setData).catch(() => undefined);
      }
    } finally { setBusy(false); }
  }

  return <section className="phCard">
    <button className="phGhost" onClick={onClose}>← Orqaga</button>
    <div className="phHead"><div><h2>{batch.name}</h2><p>{batch.manufacturer}</p></div><i className={`phBadge ${s.cls}`}>{s.label}</i></div>
    <dl className="phFacts">
      <div><dt>GTIN</dt><dd>{batch.gtin}</dd></div>
      <div><dt>Partiya</dt><dd>{batch.batch}</dd></div>
      <div><dt>Seriya</dt><dd>{batch.serial}</dd></div>
      <div><dt>Yaroqlilik muddati</dt><dd>{batch.expiry ?? "Amal qilmaydi"}</dd></div>
    </dl>

    {batch.receivedAt
      ? <div className="phBanner ok">✓ Qabul qilingan: {formatDateTime(batch.receivedAt)}{batch.receivedByMe ? " (siz tomoningizdan)" : ""}</div>
      : mode === "" && <div className="phActions">
          <button className="phPrimary big" onClick={() => setMode("receive")}>✓ Qabul qildim</button>
          <button className="phOutline big" onClick={() => setMode("deviation")}>! Og'ish haqida xabar</button>
        </div>}

    {!batch.receivedAt && mode === "receive" && <div className="phForm">
      <h3>Qabulni tasdiqlash</h3>
      <p>Partiya jismonan yetib kelganini va qadoq butunligini tekshirdingizmi? Tasdiqlagandan so'ng mijozlar partiya tarixida «Dorixonaga qabul» bosqichini ko'radi.</p>
      <label>Izoh (ixtiyoriy)<textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} rows={2} /></label>
      {formError && <div className="phError" role="alert">{formError}</div>}
      <div className="phActions"><button className="phPrimary" disabled={busy} onClick={() => send("receive")}>{busy ? "Saqlanmoqda…" : "Ha, qabul qilindi"}</button><button className="phGhost" onClick={() => { setMode(""); setFormError(""); }}>Bekor qilish</button></div>
    </div>}

    {mode === "deviation" && <div className="phForm">
      <h3>Og'ishni qayd etish</h3>
      <label>Sabab<select value={reason} onChange={(e) => setReason(e.target.value)}>{REASONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
      <label>Izoh{reason === "other" ? " (majburiy)" : " (ixtiyoriy)"}<textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} rows={3} /></label>
      {formError && <div className="phError" role="alert">{formError}</div>}
      <div className="phActions"><button className="phPrimary" disabled={busy} onClick={() => send("deviation")}>{busy ? "Saqlanmoqda…" : "Og'ishni yuborish"}</button><button className="phGhost" onClick={() => { setMode(""); setFormError(""); }}>Bekor qilish</button></div>
    </div>}

    <h3 className="phSub">Dorixona bosqichlari</h3>
    {stages.length ? <ol className="phStages">{stages.map((st, i) =>
      <li key={i} className={st.state}><b>{st.title}</b><small>{formatDateTime(st.at)} · {st.location}</small><p>{st.detail}</p></li>)}</ol>
      : <div className="phEmpty">Hali hech qanday dorixona bosqichi qayd etilmagan.</div>}
  </section>;
}

function History({ version, onExpired }: { version: number; onExpired: () => void }) {
  const { data, error } = useLoader(() => api<{ history: HistoryItem[] }>("/api/history"), [version], onExpired);
  if (error) return <div className="phError">{error}</div>;
  if (!data) return <div className="phLoading">Yuklanmoqda…</div>;
  return <section className="phCard">
    <div className="phHead"><div><h2>Qabul tarixi</h2><p>Siz qayd etgan so'nggi amallar.</p></div></div>
    {data.history.length ? <div className="phList">{data.history.map((h) =>
      <div key={h.id} className="phRow static">
        <span><b>{h.name}</b><small>{h.batch} · {h.serial} · {formatDateTime(h.at)}{h.reason ? ` · ${h.reason}` : ""}{h.note ? ` · ${h.note}` : ""}</small></span>
        <i className={`phBadge ${h.eventType === "received" ? "ok" : "warn"}`}>{h.eventType === "received" ? "Qabul" : "Og'ish"}</i>
      </div>)}</div>
      : <div className="phEmpty">Hali hech narsa qabul qilinmagan.</div>}
  </section>;
}
