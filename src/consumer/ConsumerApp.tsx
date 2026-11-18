import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import { ProductPassport } from "../components/ProductPassport";
import { catalog } from "../data/catalog";
import type { CatalogProduct } from "../data/catalog";

const products = catalog;

type Product = CatalogProduct;

type ScanResult = {
  kind: "verified" | "unknown";
  payload: string;
  product?: Product;
};

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

const fixedLength: Record<string, number> = { "01": 14, "11": 6, "13": 6, "15": 6, "17": 6, "20": 2 };

/** Parses a raw GS1 element string as returned by scanners (FNC1 shown as \u001d or |). */
function parseRawGs1(value: string) {
  const fields: Record<string, string> = {};
  const text = value.replace(/\u001d/g, "|");
  let index = 0;

  while (index + 1 < text.length) {
    const ai = text.slice(index, index + 2);
    if (!/^\d{2}$/.test(ai)) break;
    index += 2;
    const length = fixedLength[ai];
    if (length) {
      fields[ai] = text.slice(index, index + length);
      index += length;
    } else {
      const separator = text.indexOf("|", index);
      const end = separator === -1 ? text.length : separator;
      fields[ai] = text.slice(index, end);
      index = separator === -1 ? end : end + 1;
    }
  }

  return fields;
}

function parseGs1Payload(value: string) {
  const compact = value.trim();
  const fields: Record<string, string> = {};
  const bracketed = Array.from(compact.matchAll(/\((\d{2})\)([^()]*)/g));
  for (const match of bracketed) fields[match[1]] = match[2];
  if (Object.keys(fields).length) return fields;

  if (/^01\d{13}/.test(compact)) return parseRawGs1(compact);

  const aiMatch = compact.match(/(?:\/01\/|01)(\d{14})/);
  if (aiMatch) fields["01"] = aiMatch[1];

  for (const ai of ["10", "21", "17"]) {
    const match = compact.match(new RegExp(`(?:\/${ai}\/|\\(${ai}\\))([A-Za-z0-9.-]+)`));
    if (match) fields[ai] = match[1];
  }

  return fields;
}

function findProduct(value: string): Product | undefined {
  const fields = parseGs1Payload(value);
  const gtin = fields["01"] || onlyDigits(value).slice(0, 14);
  const demo = /^(demo|namuna|paracetamol)$/i.test(value.trim());
  return products.find((product) => product.gtin === gtin ||
    value.includes(product.gtin) ||
    value.includes(product.value) ||
    (demo && product === products[0]));
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
    const product = findProduct(payload);
    const shown = product && /^(demo|namuna|paracetamol)$/i.test(payload) ? product.value : payload;
    setCode(shown);
    setError("");
    setResult(product ? { kind: "verified", payload: shown, product } : { kind: "unknown", payload });
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

  if (result?.kind === "verified" && result.product) {
    const product = result.product;
    return (
      <ProductPassport
        eyebrow="Mahsulot raqamli pasporti"
        name={product.name}
        description={product.description}
        meta={[
          { label: "Ishlab chiqaruvchi", value: product.manufacturer },
          { label: "Partiya", value: product.batch },
          { label: "Yaroqlilik muddati", value: product.expiryDate }
        ]}
        status={{ title: "Mahsulot haqiqiy", caption: "Barcha ishlab chiqarish bosqichlari tasdiqlangan" }}
        stages={product.stages}
        code={product.digitalLink}
        codeText={product.value}
        top={<button type="button" className="consumerBrand" onClick={reset} aria-label="SignalCode asosiy sahifa"><span className="brandMark">S</span><strong>signal<b>code</b></strong></button>}
        onBack={reset}
        backLabel="Yangi kodni tekshirish"
        actions={<button type="button" className="passportPrimary" onClick={reset}>Yangi kodni tekshirish</button>}
      />
    );
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
        <p className="eyebrow">Mahsulot raqamli pasporti</p>
        <h1>Paketdagi kodni skanerlang.</h1>
        <p className="intro">Mahsulot, ishlab chiqaruvchi, partiya va uning butun yo'li — bir zumda.</p>

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
        <p className="demoHint">Namuna uchun <b>demo</b> so'zini kiriting yoki <b>/verify/demo</b> sahifasini oching.</p>

        {result?.kind === "unknown" && (
          <article className="unknownCard">
            <div className="unknownTop">
              <span className="unknownIcon">!</span>
              <div><small>Tekshiruv natijasi</small><h2>Mahsulot bazadan topilmadi</h2></div>
            </div>
            <p>Bu kod SignalCode katalogida tasdiqlanmagan. Kodni qayta tekshiring yoki sotuvchidan tasdiqlovchi ma'lumot so'rang.</p>
            <div className="decodedPayload"><small>Kiritilgan kod</small><code>{result.payload}</code></div>
            <button type="button" className="button secondary newScan" onClick={reset}>Yana urinish</button>
          </article>
        )}
      </section>
    </main>
  );
}
