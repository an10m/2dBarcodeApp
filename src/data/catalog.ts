import type { PassportStage } from "../components/ProductPassport";

/** Origin used inside generated GS1 Digital Link codes. Override with VITE_CONSUMER_ORIGIN. */
export const CONSUMER_ORIGIN = (import.meta.env.VITE_CONSUMER_ORIGIN as string | undefined)?.replace(/\/+$/, "") ??
  "https://2dbarcodeapp-consumer.pdostonh.workers.dev";

const monthNames = ["yan", "fev", "mar", "apr", "may", "iyun", "iyul", "avg", "sen", "okt", "noy", "dek"];

function formatDate(iso: string) {
  const date = new Date(`${iso}T00:00:00Z`);
  return `${String(date.getUTCDate()).padStart(2, "0")} ${monthNames[date.getUTCMonth()]}. ${date.getUTCFullYear()}`;
}

function gs1Date(iso: string) {
  return iso.replaceAll("-", "").slice(2);
}

function addDays(iso: string, days: number) {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return `${String(date.getUTCDate()).padStart(2, "0")} ${monthNames[date.getUTCMonth()]}. ${date.getUTCFullYear()}`;
}

type Deviation = { customs?: boolean; lab?: boolean; route?: boolean };

type StageOptions = {
  start: string;
  form: string;
  apiCity?: string;
  apiCountry?: string;
  deviations?: Deviation;
  closed?: "draft" | "archived";
};

/** Builds the nine-stage pharmaceutical batch route shown in the product passport. */
function pharmaStages({ start, form, apiCity = "Xaydarobod", apiCountry = "Hindiston", deviations = {}, closed }: StageOptions): PassportStage[] {
  const stages: PassportStage[] = [
    {
      date: addDays(start, 0),
      title: "Xomashyo qabul qilindi",
      detail: `Faol modda va yordamchi moddalar ${apiCity} ishlab chiqaruvchisidan qabul qilindi.`,
      location: apiCity,
      country: apiCountry,
      state: "ok",
      tag: "Yakunlandi",
      kind: "raw"
    },
    {
      date: addDays(start, 16),
      title: "Xalqaro tashish",
      detail: deviations.customs
        ? "Yuk bojxona hujjatlari qo'shimcha tekshiruvi sabab ushlab turildi."
        : "Yuk xalqaro tranzit orqali Toshkentga yo'l oldi.",
      location: `${apiCity} → Toshkent`,
      country: "Tranzit",
      state: deviations.customs ? "warning" : "ok",
      tag: deviations.customs ? "Kechikish" : "Yo'lda",
      kind: "transport"
    },
    {
      date: addDays(start, 31),
      title: "Xomashyo qabuli va saqlash",
      detail: "Xomashyo omborga qabul qilindi, hujjatlar va harorat rejimi tekshirildi.",
      location: "Toshkent viloyati",
      country: "O'zbekiston",
      state: "ok",
      tag: "Yakunlandi",
      kind: "storage"
    },
    {
      date: addDays(start, 73),
      title: "Dori ishlab chiqarish",
      detail: `Partiya ${form} shaklida ishlab chiqarildi va GMP sharti bilan partiyaga biriktirildi.`,
      location: "Toshkent",
      country: "O'zbekiston",
      state: "ok",
      tag: "Yakunlandi",
      kind: "production"
    },
    {
      date: addDays(start, 80),
      title: "Laboratoriya sifat nazorati",
      detail: deviations.lab
        ? "Birlamchi natija me'yorga mos kelmadi; qayta tekshiruvda sifat tasdiqlandi."
        : "Namunalar laboratoriyada tekshirildi, barcha ko'rsatkichlar me'yorda.",
      location: "Toshkent",
      country: "O'zbekiston",
      state: deviations.lab ? "warning" : "ok",
      tag: deviations.lab ? "Qayta tekshiruv" : "Yakunlandi",
      kind: "quality"
    },
    {
      date: addDays(start, 87),
      title: "Qadoqlash va markirovka",
      detail: "Har bir birlik qadoqlandi va noyob GS1 DataMatrix kodi bilan markirovkalandi.",
      location: "Toshkent",
      country: "O'zbekiston",
      state: "ok",
      tag: "Yakunlandi",
      kind: "packaging"
    },
    {
      date: addDays(start, 93),
      title: "Sotuvga ruxsat",
      detail: "Partiya realizatsiyaga ruxsat etildi va omborga topshirildi.",
      location: "Toshkent",
      country: "O'zbekiston",
      state: "ok",
      tag: "Sotuvga ruxsat",
      kind: "release"
    },
    {
      date: addDays(start, 100),
      title: "Saqlash va taqsimlash",
      detail: deviations.route
        ? "Yuk zaxira omborga yo'naltirildi, marshrut qayta hisoblandi."
        : "Partiya mintaqaviy distribyutor omboriga yetkazildi.",
      location: deviations.route ? "Samarqand" : "Toshkent",
      country: "O'zbekiston",
      state: deviations.route ? "warning" : "ok",
      tag: deviations.route ? "Yo'nalish o'zgardi" : "Yo'lda",
      kind: "distribution"
    },
    {
      date: addDays(start, 107),
      title: "Dorixonaga qabul",
      detail: "Dori dorixona javonlariga joylashtirildi va savdoga qo'yildi.",
      location: "Samarqand",
      country: "O'zbekiston",
      state: "ok",
      tag: "Sotuvga tayyor",
      kind: "pharmacy"
    }
  ];

  if (closed === "draft") {
    return stages.slice(0, 6).concat({
      date: addDays(start, 88),
      title: "Ro'yxatga olish kutilmoqda",
      detail: "GTIN va savdo ruxsati tasdiqlanishi kutilmoqda; partiya hali sotuvga chiqarilmagan.",
      location: "SignalCode ish maydoni",
      country: "O'zbekiston",
      state: "warning",
      tag: "Tasdiqlash kutilmoqda",
      kind: "release"
    });
  }

  if (closed === "archived") {
    return stages.concat({
      date: addDays(start, 780),
      title: "Partiya arxivlandi",
      detail: "Yaroqlilik muddati tugagach partiya savdodan chiqarildi va arxivga o'tkazildi.",
      location: "Toshkent",
      country: "O'zbekiston",
      state: "ok",
      tag: "Arxivlandi",
      kind: "storage"
    });
  }

  return stages;
}

export type CatalogProduct = {
  id: string;
  name: string;
  format: string;
  value: string;
  digitalLink: string;
  scans: number;
  status: "Active" | "Draft" | "Archived";
  updated: string;
  gtin: string;
  batch: string;
  serial: string;
  manufactureDate: string;
  expiryDate: string;
  bestBefore: string;
  manufacturer: string;
  category: string;
  country: string;
  netContent: string;
  packaging: string;
  lotSize: number;
  description: string;
  stages: PassportStage[];
};

type Seed = {
  id: string;
  name: string;
  category: string;
  gtin: string;
  batch: string;
  serial: string;
  status: CatalogProduct["status"];
  updated: string;
  scans: number;
  manufacturer: string;
  netContent: string;
  packaging: string;
  lotSize: number;
  manufacture: string;
  expiry: string;
  start: string;
  form: string;
  apiCity?: string;
  apiCountry?: string;
  deviations?: Deviation;
  closed?: "draft" | "archived";
};

const seeds: Seed[] = [
  {
    id: "BX-12480",
    name: "Paracetamol 500 mg",
    category: "Og'riq qoldiruvchi",
    gtin: "09506000487120",
    batch: "PM-260814",
    serial: "48120007",
    status: "Active",
    updated: "Bugun, 09:42",
    scans: 128462,
    manufacturer: "PharmaMed Uzbekistan",
    netContent: "20 tabletka",
    packaging: "Blister, 2×10",
    lotSize: 48000,
    manufacture: "2026-08-14",
    expiry: "2028-08-14",
    start: "2026-06-02",
    form: "tabletka",
    deviations: { customs: true, lab: true, route: true }
  },
  {
    id: "BX-12479",
    name: "Amoxicillin 500 mg",
    category: "Antibiotik",
    gtin: "09506000487137",
    batch: "AMX-260902",
    serial: "48713704",
    status: "Active",
    updated: "Kecha",
    scans: 89243,
    manufacturer: "Toshkent Farm LLC",
    netContent: "16 kapsula",
    packaging: "Blister, 2×8",
    lotSize: 12500,
    manufacture: "2026-09-02",
    expiry: "2028-09-02",
    start: "2026-06-18",
    form: "kapsula",
    deviations: { lab: true }
  },
  {
    id: "BX-12478",
    name: "Ibuprofen 400 mg",
    category: "Og'riq qoldiruvchi",
    gtin: "09506000487144",
    batch: "IBU-260901",
    serial: "48714411",
    status: "Active",
    updated: "12 noy. 2026",
    scans: 63418,
    manufacturer: "Samarqand Pharma",
    netContent: "20 tabletka",
    packaging: "Blister, 2×10",
    lotSize: 76000,
    manufacture: "2026-09-01",
    expiry: "2028-09-01",
    start: "2026-06-25",
    form: "tabletka",
    deviations: { route: true }
  },
  {
    id: "BX-12477",
    name: "Omeprazole 20 mg",
    category: "Oshqozon-ichak",
    gtin: "09506000487151",
    batch: "OMP-260725",
    serial: "48715108",
    status: "Active",
    updated: "10 noy. 2026",
    scans: 21912,
    manufacturer: "PharmaMed Uzbekistan",
    netContent: "28 kapsula",
    packaging: "Blister, 4×7",
    lotSize: 32000,
    manufacture: "2026-07-25",
    expiry: "2028-07-25",
    start: "2026-05-19",
    form: "kapsula"
  },
  {
    id: "BX-12476",
    name: "Cetirizine 10 mg",
    category: "Antigistamin",
    gtin: "09506000487168",
    batch: "CET-260917",
    serial: "48716802",
    status: "Draft",
    updated: "08 noy. 2026",
    scans: 7648,
    manufacturer: "Andijon Remedies",
    netContent: "10 tabletka",
    packaging: "Blister, 1×10",
    lotSize: 18000,
    manufacture: "2026-09-17",
    expiry: "2028-09-17",
    start: "2026-07-06",
    form: "tabletka",
    deviations: { customs: true },
    closed: "draft"
  },
  {
    id: "BX-12475",
    name: "Ceftriaxone 1 g",
    category: "Antibiotik",
    gtin: "09506000487175",
    batch: "CFT-260804",
    serial: "48717505",
    status: "Archived",
    updated: "08 noy. 2026",
    scans: 4210,
    manufacturer: "Toshkent Farm LLC",
    netContent: "1 flakon",
    packaging: "Karton quti",
    lotSize: 6000,
    manufacture: "2024-08-04",
    expiry: "2026-08-04",
    start: "2024-06-10",
    form: "in'ektsiya uchun kukun",
    apiCity: "Sheroz",
    apiCountry: "Xitoy",
    closed: "archived"
  }
];

function toProduct(seed: Seed): CatalogProduct {
  const stages = pharmaStages({
    start: seed.start,
    form: seed.form,
    apiCity: seed.apiCity,
    apiCountry: seed.apiCountry,
    deviations: seed.deviations,
    closed: seed.closed
  });
  const warnings = stages.filter((stage) => stage.state === "warning").length;
  const manufactureDate = formatDate(seed.manufacture);
  const expiryDate = formatDate(seed.expiry);
  return {
    id: seed.id,
    name: seed.name,
    format: "GS1 DataMatrix",
    value: `(01)${seed.gtin}(10)${seed.batch}(21)${seed.serial}(17)${gs1Date(seed.expiry)}`,
    digitalLink: `${CONSUMER_ORIGIN}/01/${seed.gtin}/10/${seed.batch}/21/${seed.serial}`,
    scans: seed.scans,
    status: seed.status,
    updated: seed.updated,
    gtin: seed.gtin,
    batch: seed.batch,
    serial: seed.serial,
    manufactureDate,
    expiryDate,
    bestBefore: expiryDate,
    manufacturer: seed.manufacturer,
    category: seed.category,
    country: "O'zbekiston",
    netContent: seed.netContent,
    packaging: seed.packaging,
    lotSize: seed.lotSize,
    description: `Partiya ${seed.batch} ning xomashyodan dorixona javonigacha bo'lgan yo'li: ${stages.length} bosqich${warnings ? `, ${warnings} tasida og'ish bo'lib, ular hal qilindi` : ", barchasi izohsiz o'tdi"}.`,
    stages
  };
}

export const catalog: CatalogProduct[] = seeds.map(toProduct);

/** Creates a pending catalog record for a barcode added from the producer dashboard. */
export function makeDraft(name: string, format: string, payload: string): CatalogProduct {
  const gtin = (payload.replace(/\D/g, "").slice(0, 14) || "00000000000000").padEnd(14, "0");
  return {
    id: `BX-${12481 + catalog.length}`,
    name: name || "Nomsiz dori",
    format,
    value: payload,
    digitalLink: `${CONSUMER_ORIGIN}/01/${gtin}`,
    scans: 0,
    status: "Draft",
    updated: "Hozir",
    gtin,
    batch: "PENDING",
    serial: "PENDING",
    manufactureDate: "Kutilmoqda",
    expiryDate: "Kutilmoqda",
    bestBefore: "Kutilmoqda",
    manufacturer: "PharmaMed Uzbekistan",
    category: "Tasniflanmagan",
    country: "O'zbekiston",
    netContent: "Kutilmoqda",
    packaging: "Kutilmoqda",
    lotSize: 0,
    description: "Yangi yozuv yaratildi va GS1 identifikatori tasdiqlanishini kutmoqda.",
    stages: [{
      date: addDays(new Date().toISOString().slice(0, 10), 0),
      title: "Qoralama yaratildi",
      detail: "Yozuv yaratildi va GS1 identifikatori tasdiqlanishini kutmoqda.",
      location: "SignalCode ish maydoni",
      country: "O'zbekiston",
      state: "warning",
      tag: "Tasdiqlash kutilmoqda",
      kind: "release"
    }]
  };
}


