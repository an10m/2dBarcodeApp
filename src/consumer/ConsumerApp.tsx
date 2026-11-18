import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";

type Product = {
  name: string;
  gtin: string;
  batch: string;
  serial: string;
  payload: string;
  manufacturer: string;
  category: string;
  netContent: string;
  manufactureDate: string;
  expiryDate: string;
  country: string;
};

type ScanResult = {
  kind: "verified" | "unknown";
  payload: string;
  product?: Product;
};

const products: Product[] = [
  {
    name: "Organic Oat Milk 1L",
    gtin: "09506000134352",
    batch: "NS20261104",
    serial: "10482001",
    payload: "(01)09506000134352(10)NS20261104(21)10482001(17)271130",
    manufacturer: "Northstar Foods LLC",
    category: "Plant-based beverages",
    netContent: "1 L",
    manufactureDate: "04 Nov 2026",
    expiryDate: "30 Nov 2027",
    country: "Uzbekistan"
  },
  {
    name: "Alpine Trail Jacket",
    gtin: "09506000184721",
    batch: "AJ20261109",
    serial: "847210042",
    payload: "https://id.gs1.org/01/09506000184721",
    manufacturer: "Alpine Works AG",
    category: "Outdoor apparel",
    netContent: "Size M",
    manufactureDate: "09 Nov 2026",
    expiryDate: "Not applicable",
    country: "Uzbekistan"
  }
];

type BarcodeDetectorResult = { rawValue: string };
type BarcodeDetectorApi = new (options: { formats: string[] }) => { detect(source: CanvasImageSource): Promise<BarcodeDetectorResult[]> };
declare global { interface Window { BarcodeDetector?: BarcodeDetectorApi } }

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

function getUrlPayload() {
  const path = window.location.pathname;
  const match = path.match(/\/(?:scan|verify)\/(.+)$/);
  if (match) return decodeURIComponent(match[1].replaceAll("/", ""));
  const digitalLink = path.match(/\/01\/([^/]+)(?:\/10\/([^/]+))?(?:\/21\/([^/]+))?/);
  if (digitalLink) return `${window.location.origin}${path}${window.location.search}`;
  const params = new URLSearchParams(window.location.search);
  return params.get("payload") || params.get("code") || "";
}

function parseGs1Payload(value: string) {
  const compact = value.trim();
  const fields: Record<string, string> = {};
  const bracketed = Array.from(compact.matchAll(/\((\d{2})\)([^()]*)/g));
  for (const match of bracketed) fields[match[1]] = match[2];

  if (!Object.keys(fields).length) {
    const aiMatch = compact.match(/(?:\/01\/|01)(\d{14})/);
    if (aiMatch) fields["01"] = aiMatch[1];

    for (const ai of ["10", "21", "17"]) {
      const match = compact.match(new RegExp(`(?:\/${ai}\/|\\(${ai}\\))([A-Za-z0-9.-]+)`));
      if (match) fields[ai] = match[1];
    }
  }

  return fields;
}

function findProduct(value: string): Product | undefined {
  const fields = parseGs1Payload(value);
  const gtin = fields["01"] || onlyDigits(value).slice(0, 14);
  return products.find((product) => product.gtin === gtin ||
    value.includes(product.gtin) ||
    value.includes(product.payload));
}

export default function ConsumerApp() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [code, setCode] = useState("");
  const [cameraOn, setCameraOn] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ScanResult | null>(null);

  useEffect(() => {
    const urlPayload = getUrlPayload();
    if (urlPayload) verify(urlPayload);
  }, []);

  useEffect(() => () => streamRef.current?.getTracks().forEach((track) => track.stop()), []);

  useEffect(() => {
    if (!cameraOn || !videoRef.current || !streamRef.current) return;
    videoRef.current.srcObject = streamRef.current;
    void videoRef.current.play();
  }, [cameraOn]);

  function verify(value: string) {
    const payload = value.trim();
    if (!payload) return;
    setCode(payload);
    setError("");
    const product = findProduct(payload);
    setResult(product ? { kind: "verified", payload, product } : { kind: "unknown", payload });
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraOn(false);
  }

  async function startCamera() {
    setError("");
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Bu qurilmada kamera mavjud emas. Kodni qo'lda kiriting.");
      return;
    }
    try {
      stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false
      });
      streamRef.current = stream;
      setCameraOn(true);
    } catch {
      setError("Kamera ruxsat berilmadi yoki ishlamayapti.");
    }
  }

  async function scanFrame() {
    if (!window.BarcodeDetector || !videoRef.current) {
      setError("Bu brauzer jonli 2D kod skanerlashni qo'llab-quvvatlamaydi. Kodni qo'lda kiriting.");
      return;
    }
    try {
      const detector = new window.BarcodeDetector({
        formats: ["qr_code", "data_matrix", "ean_13", "ean_8", "code_128"]
      });
      const found = await detector.detect(videoRef.current);
      if (found[0]) verify(found[0].rawValue);
      else setError("Kod aniqlanmadi. Paketni ramka ichiga tushiring.");
    } catch {
      setError("Jonli skanerlashda xatolik yuz berdi.");
    }
  }

  async function scanImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!window.BarcodeDetector) {
      setError("Bu brauzer rasm ichidan kodni o'qiy olmaydi. Kodni qo'lda kiriting.");
      return;
    }
    try {
      const detector = new window.BarcodeDetector({
        formats: ["qr_code", "data_matrix", "ean_13", "ean_8", "code_128"]
      });
      const image = await createImageBitmap(file);
      const found = await detector.detect(image);
      image.close();
      if (found[0]) verify(found[0].rawValue);
      else setError("Rasm ichida 2D kod topilmadi.");
    } catch {
      setError("Rasmni o'qib bo'lmadi.");
    }
  }

  function reset() {
    setResult(null);
    setCode("");
    setError("");
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    verify(code);
  }

  return (
    <main className="consumer">
      <header className="consumerHeader">
        <button type="button" className="consumerBrand" onClick={reset} aria-label="SignalCode asosiy sahifa">
          <span className="brandMark">S</span>
          <strong>signal<b>code</b></strong>
        </button>
        <span className="secureLabel">Jamoat tekshiruvi</span>
      </header>

      <section className="consumerMain">
        <div className="eyebrow">Mahsulot ishonchliligini tekshirish</div>
        <h1>Paketdagi kodni skanerlang.</h1>
        <p className="intro">Mahsulot, ishlab chiqaruvchi, partiya va yaroqlilik ma'lumotlarini bir zumda ko'ring.</p>

        {!result && (
          <>
            <div className="cameraCard">
              <div className="cameraFrame">
                {cameraOn ? <video ref={videoRef} muted playsInline /> : <span className="cameraGlyph" aria-hidden="true">⌗</span>}
                <i /><i /><i /><i />
              </div>
              <div className="cameraCopy">
                <strong>2D kodni kameraga tuting</strong>
                <span>QR yoki GS1 DataMatrix kodni o'qing.</span>
                <div className="cameraActions">
                  <button type="button" className="button secondary" onClick={startCamera}>
                    {cameraOn ? "Kamerani qayta boshlash" : "Kamerani boshlash"}
                  </button>
                  {cameraOn && <button type="button" className="button primary" onClick={scanFrame}>Kodni o'qish</button>}
                  <label className="button secondary uploadButton">
                    Rasm yuklash
                    <input type="file" accept="image/*" onChange={scanImage} />
                  </label>
                  {cameraOn && <button type="button" className="stopButton" onClick={stopCamera}>To'xtatish</button>}
                </div>
              </div>
            </div>

            {error && <div className="consumerError" role="alert">{error}</div>}

            <div className="divider"><span>yoki kodni qo'lda kiriting</span></div>
            <form className="manualForm" onSubmit={submit}>
              <input
                value={code}
                onChange={(event) => setCode(event.target.value)}
                placeholder="GTIN, Digital Link yoki GS1 ma'lumot"
                aria-label="Mahsulot kodi"
              />
              <button className="button primary" type="submit">Tekshirish</button>
            </form>
          </>
        )}

        {result?.kind === "verified" && result.product && (
          <article className="verifiedCard">
            <div className="verifiedTop">
              <span className="verifiedIcon">✓</span>
              <div><small>Tekshiruv natijasi</small><h2>{result.product.name}</h2></div>
              <b>Tasdiqlangan</b>
            </div>
            <div className="productGrid">
              <Info label="Ishlab chiqaruvchi" value={result.product.manufacturer} />
              <Info label="Kategoriya" value={result.product.category} />
              <Info label="GTIN" value={result.product.gtin} />
              <Info label="Partiya" value={result.product.batch} />
              <Info label="Seriya" value={result.product.serial} />
              <Info label="Sof hajmi" value={result.product.netContent} />
              <Info label="Ishlab chiqarilgan" value={result.product.manufactureDate} />
              <Info label="Yaroqlilik muddati" value={result.product.expiryDate} />
            </div>
            <div className="decodedPayload"><small>O'qilgan kod</small><code>{result.payload}</code></div>
            <button type="button" className="button secondary newScan" onClick={reset}>Yangi kodni tekshirish</button>
          </article>
        )}

        {result?.kind === "unknown" && (
          <article className="unknownCard">
            <span className="unknownIcon">!</span>
            <div><small>Tekshiruv natijasi</small><h2>Mahsulot bazadan topilmadi</h2></div>
            <p>Bu kod SignalCode katalogida tasdiqlanmagan. Kodni qayta tekshiring yoki sotuvchidan tasdiqlovchi ma'lumot so'rang.</p>
            <div className="decodedPayload"><small>Kiritilgan kod</small><code>{result.payload}</code></div>
            <button type="button" className="button secondary newScan" onClick={reset}>Yana urinish</button>
          </article>
        )}
      </section>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="productInfo"><span>{label}</span><b>{value}</b></div>;
}
