import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import { ProductPassport } from "../components/ProductPassport";
import { demoProducts } from "../data/demoProducts";
import type { DemoProduct } from "../data/demoProducts";
import { pendingPharmacyStatus, useLiveStages } from "../lib/liveStages";
import { localizeDate } from "../lib/format";
import { AiSummary } from "../components/AiSummary";
import { ProductInsights } from "../components/ProductInsights";
import { PharmacyMarket } from "../components/PharmacyMarket";
import { getInsights } from "../data/insights";
import { formatSom, getMarketData } from "../data/market";

type Product = DemoProduct;

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
  const demo = /^(demo|namuna|paracetamol)$/i.test(value.trim());
  return demoProducts.find((product) => product.gtin === gtin ||
    value.includes(product.gtin) ||
    value.includes(product.value) ||
    (demo && product === demoProducts[0]));
}

export default function ConsumerApp() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [code, setCode] = useState("");
  const [cameraOn, setCameraOn] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [search, setSearch] = useState("");
  const [searchActive, setSearchActive] = useState(false);
  const live = useLiveStages(result?.product?.stages, result?.product);

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
    setSearchActive(false);
    setResult(product ? { kind: "verified", payload: shown, product } : { kind: "unknown", payload });
  }

  function openProduct(product: Product) {
    stopCamera();
    setError("");
    setCode(product.value);
    setSearchActive(false);
    setResult({ kind: "verified", payload: product.value, product });
    window.scrollTo({ top: 0, behavior: "smooth" });
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
    setSearch("");
    setSearchActive(false);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    verify(code);
  }

  const term = search.trim().toLowerCase();
  const matches = demoProducts.filter((product) =>
    !term ||
    `${product.name} ${product.manufacturer} ${product.category} ${product.gtin} ${product.batch} ${product.serial}`
      .toLowerCase()
      .includes(term)
  );

  if (result?.kind === "verified" && result.product) {
    const product = result.product;
    return (
      <ProductPassport
        eyebrow="Mahsulot raqamli pasporti"
        name={product.name}
        description={live.known ? `Partiya ${live.stages.length} bosqichni bosib o'tdi.${live.received ? "" : " Dorixona qabuli hali tasdiqlanmagan."}` : product.description}
        meta={[
          { label: "Ishlab chiqaruvchi", value: product.manufacturer },
          { label: "Partiya", value: product.batch },
          { label: "Yaroqlilik muddati", value: localizeDate(product.expiryDate) }
        ]}
        status={live.known && !live.received ? pendingPharmacyStatus : { title: "Mahsulot haqiqiy", caption: "Barcha ishlab chiqarish bosqichlari tasdiqlangan" }}
        stages={live.stages}
        detailProduct={product}
        code={product.digitalLink}
        codeFormat="GS1 Digital Link"
        ai={<AiSummary product={product} stages={live.stages} received={live.received} />}
        extras={<>
          <ProductInsights product={product} />
          <PharmacyMarket product={product} catalog={demoProducts} />
        </>}
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

        <div className="divider"><span>yoki mahsulotni nomi bo'yicha qidiring</span></div>
        <form
          className="searchForm"
          onSubmit={(event) => {
            event.preventDefault();
            setSearchActive(true);
          }}
          role="search"
        >
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setSearchActive(true);
            }}
            placeholder="Mahsulot nomi, ishlab chiqaruvchi, GTIN yoki partiya"
            aria-label="Mahsulot qidirish"
          />
          <button className="button primary" type="submit">
            <span aria-hidden="true">⌕</span> Qidirish
          </button>
        </form>
        <div className="searchSuggestions">
          <span>Mashhur:</span>
          {demoProducts.slice(0, 4).map((product) => (
            <button
              type="button"
              key={product.id}
              onClick={() => {
                setSearch(product.name);
                setSearchActive(true);
              }}
            >
              {product.name}
            </button>
          ))}
        </div>

        {searchActive && (
          <section className="consumerSearchResults" aria-label="Qidiruv natijalari">
            <header className="searchResultsHead">
              <h2>Qidiruv natijalari</h2>
              <span>{matches.length} ta mahsulot</span>
            </header>
            {matches.length === 0 && (
              <div className="searchEmpty">
                <b>Mahsulot topilmadi</b>
                <p>Nomni qisqaroq yozing yoki GTIN bo'yicha qidiring. Skanerlash ham ishlaydi.</p>
              </div>
            )}
            {matches.map((product) => {
              const insights = getInsights(product);
              const market = getMarketData(product, demoProducts);
              return (
                <button
                  type="button"
                  className="searchResult"
                  key={product.id}
                  onClick={() => openProduct(product)}
                >
                  <span className="searchResultMark" aria-hidden="true">{product.name.slice(0, 1)}</span>
                  <span className="searchResultText">
                    <b>{product.name}</b>
                    <small>{product.manufacturer} · {product.category}</small>
                    <span className="searchResultMeta">
                      <em>★ {insights.rating.toFixed(1)}</em>
                      <em>{insights.count.toLocaleString("uz-UZ")} sharh</em>
                      <em>{formatSom(market.min)} dan</em>
                      {product.status === "Draft" && <em className="draftChip">Qoralama</em>}
                    </span>
                  </span>
                  <span className="searchResultGo">Pasport →</span>
                </button>
              );
            })}
          </section>
        )}

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