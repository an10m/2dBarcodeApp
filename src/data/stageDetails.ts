import type { PassportStage, StageDocument, StageKind } from "../components/ProductPassport";

/** The minimum product data needed to build believable stage documents. */
export type DetailProduct = {
  name: string;
  gtin: string;
  batch: string;
  serial: string;
  manufacturer: string;
  category: string;
  netContent: string;
  manufactureDate: string;
  expiryDate: string;
  country: string;
};

export type StageDetail = {
  info: { label: string; value: string }[];
  docs: StageDocument[];
  who: { label: string; value: string }[];
  issue?: { label: string; value: string }[];
  extra: string;
};

type DocSeed = [title: string, num: string, by: string, date: string, ok: boolean, status: string];
type Pair = [label: string, value: string];

const rows = (pairs: Pair[]) => pairs.map(([label, value]) => ({ label, value }));

function makeDocs(seeds: DocSeed[], info: { label: string; value: string }[], who: { label: string; value: string }[]): StageDocument[] {
  return seeds.map(([title, num, by, date, ok, status]) => ({
    title,
    num,
    by,
    date,
    ok,
    status,
    pages: ok ? 1 : 2,
    body: [
      ...info
        .filter((row) => !["Hujjat turi", "Hujjat raqami", "Tashkilot", "Sana"].includes(row.label))
        .slice(0, 5),
      { label: "Xulosa", value: status }
    ],
    signature: `${who[0]?.value ?? "Mas'ul shaxs"} · ${who[1]?.value ?? ""}`
  }));
}

function whoRows(name: string, role: string, organization: string, date: string): Pair[] {
  return [
    ["Ism", name],
    ["Lavozim", role],
    ["Tashkilot", organization],
    ["Tasdiqlangan sana", date],
    ["Holat", "Shaxs va vakolatlar tasdiqlangan"]
  ];
}

/* ------------------------------------------------------------------ */
/* Paracetamol — the exact batch card content from the design reference */
/* ------------------------------------------------------------------ */

const PARACETAMOL_DETAILS: Omit<StageDetail, "docs">[] = [
  {
    info: rows([
      ["Yetkazib beruvchi", "AuroChem Industries"],
      ["Kelib chiqish davlati", "Hindiston"],
      ["Xomashyo nomi", "Paracetamol API"],
      ["Partiya raqami", "API-IN-260801"],
      ["Miqdor", "250 kg"],
      ["Xomashyo ishlab chiqarilgan sana", "01.08.2026"],
      ["Birlamchi tekshiruv natijasi", "Talablarga mos"]
    ]),
    who: rows(whoRows("Aleksandr Karimov", "Quality Control Manager", "AuroChem Industries", "02.08.2026")),
    extra: "Mas'ul mutaxassisning elektron imzosi va tahlil sertifikatining asl nusxasi ko'rish uchun mavjud.",
  },
  {
    info: rows([
      ["Tashuvchi", "SilkRoute Cargo Ltd"],
      ["Marshrut", "Xaydarobod → Toshkent"],
      ["Aviakladnoy raqami", "AWB-TSK-260803"],
      ["Xomashyo partiyasi", "API-IN-260801"],
      ["Miqdor", "250 kg, 14 joy"],
      ["Tashish sharti", "+15…+25 °C, harorat qaydlagichi"],
      ["Jo'natilgan sana", "03.08.2026"],
      ["Rejadagi yetib kelish", "05.08.2026"],
      ["Haqiqiy chiqarilgan sana", "09.08.2026"]
    ]),
    issue: rows([
      ["Nima bo'ldi", "Yuk Toshkent aeroporti bojxona punktida hujjatlarni qo'shimcha tekshirish uchun ushlab turildi."],
      ["Sabab", "Invoysda partiya raqami xato yozilgan va COA-IND-260801 sertifikatiga mos kelmagan."],
      ["Hodisa sanasi", "05.08.2026"],
      ["Ko'rilgan choralar", "Tashuvchi AuroChem Industries'dan tuzatish so'radi.\nTuzatilgan invoys 07.08.2026 da chiqarilib, qayta topshirildi.\nTashish harorat jurnali tekshirildi: og'ish yo'q."],
      ["Yakuniy yechim", "Yuk 09.08.2026 da chiqarildi. Kechikish 4 kun bo'ldi, sifat va partiya yaxlitligiga ta'sir qilmadi."],
      ["Joriy holat", "Hal qilindi. Hodisa partiya tarixida saqlandi."]
    ]),
    who: rows(whoRows("Rustam Yuldashev", "Logistika bo'limi rahbari", "SilkRoute Cargo Ltd", "09.08.2026")),
    extra: "Aviakladnoy, bojxona deklaratsiyasi va harorat jurnali skanerlari ko'rish uchun mavjud.",
  },
  {
    info: rows([
      ["Tashkilot", "PharmaMed Uzbekistan"],
      ["Ombor", "Xomashyo ombori №2, Chirchiq"],
      ["Qabul raqami", "ACC-260810-07"],
      ["Qabul qilindi", "250 kg, 14 joy"],
      ["Xomashyo partiyasi", "API-IN-260801"],
      ["Saqlash sharti", "15–25 °C, namlik 60% gacha"],
      ["Saqlash yacheykasi", "R2-14"],
      ["Kirish nazorati natijasi", "Talablarga mos"]
    ]),
    who: rows(whoRows("Dilnoza Rahimova", "Xomashyo ombori mudiri", "PharmaMed Uzbekistan", "10.08.2026")),
    extra: "Qabul akti va kirish nazorati protokoli ko'rish uchun mavjud.",
  },
  {
    info: rows([
      ["Ishlab chiqaruvchi", "PharmaMed Uzbekistan"],
      ["Maydon", "PharmaMed zavodi, 1-sex, 2-liniya"],
      ["Partiya raqami", "PM-260814"],
      ["Dori shakli", "Tabletka 500 mg"],
      ["Ishlatilgan xomashyo", "240 kg Paracetamol API (API-IN-260801)"],
      ["Chiqarilgan", "480 000 tabletka"],
      ["Ishlab chiqarilgan sana", "14.08.2026"],
      ["Yaroqlilik muddati", "14.08.2028"]
    ]),
    who: rows(whoRows("Marat Ahmedov", "Production Manager", "PharmaMed Uzbekistan", "14.08.2026")),
    extra: "Operatorlar imzolari bilan seriya ishlab chiqarish protokoli ko'rish uchun mavjud.",
  },
  {
    info: rows([
      ["Laboratoriya", "PharmaMed sifat nazorati laboratoriyasi"],
      ["Partiya raqami", "PM-260814"],
      ["Usullar", "HPLC, eruvchanlik testi"],
      ["Faol modda miqdori", "99,4% — e'lon qilingan miqdorga nisbatan"],
      ["Eruvchanlik normasi", "30 daqiqada kamida 80%"],
      ["Birlamchi natija (18.08.2026)", "74% — me'yorga mos emas"],
      ["Takroriy natija (24.08.2026)", "93% — me'yorga mos"]
    ]),
    issue: rows([
      ["Nima bo'ldi", "Birlamchi eruvchanlik testi 74% ko'rsatdi (norma kamida 80%). Partiya 18.08.2026 da vaqtincha bloklandi."],
      ["Sabab", "Eruvchanlik testi asbobining kalibrlash muddati tugagan (15.08.2026)."],
      ["Hodisa sanasi", "18.08.2026"],
      ["Ko'rilgan choralar", "Asbob 21.08.2026 da qayta kalibrlandi.\nDEV-260818-02 og'ish hisoboti rasmiylashtirildi.\nYangi namunalar 24.08.2026 da kalibrlangan asbobda sinovdan o'tkazildi."],
      ["Yakuniy yechim", "Takroriy natija 93% — me'yorga mos. Partiya 24.08.2026 da blokdan chiqarildi."],
      ["Joriy holat", "Hal qilindi. Birlamchi natija tarixda saqlanib qoldi."]
    ]),
    who: rows(whoRows("Elena Sokolova", "Head of Quality Control", "PharmaMed Uzbekistan", "24.08.2026")),
    extra: "Ikkala sinov protokoli va og'ish hisoboti ko'rish uchun mavjud. Birlamchi natija yashirilmagan.",
  },
  {
    info: rows([
      ["Tashkilot", "PharmaMed Uzbekistan"],
      ["Maydon", "Qadoqlash sexi, P-3 liniya"],
      ["Partiya raqami", "PM-260814"],
      ["Qadoq", "Blister, 20 tabletka"],
      ["Qadoqlar soni", "24 000"],
      ["Kodlar diapazoni", "PM260814-000001 … PM260814-024000"],
      ["Noyob kodlar soni", "24 000"]
    ]),
    who: rows(whoRows("Ulug'bek Toshmatov", "Packaging Supervisor", "PharmaMed Uzbekistan", "26.08.2026")),
    extra: "Kodlar reyestri har bir qadoqni PM-260814 partiyasi bilan bog'lash imkonini beradi.",
  },
  {
    info: rows([
      ["Tashkilot", "PharmaMed Uzbekistan"],
      ["Partiya raqami", "PM-260814"],
      ["Qaror", "Sotuvga chiqarishga ruxsat"],
      ["Miqdor", "24 000 qadoq"],
      ["Yaroqlilik muddati", "14.08.2028"],
      ["Tekshirilgan hujjatlar", "Ishlab chiqarish protokoli, sinov protokollari, og'ish hisoboti"]
    ]),
    who: rows(whoRows("Shohruh Ergashev", "Sifat bo'yicha vakolatli shaxs", "PharmaMed Uzbekistan", "28.08.2026")),
    extra: "Chiqarish qarori va seriya sifati sertifikati ko'rish uchun mavjud.",
  },
  {
    info: rows([
      ["Distribyutor", "UzMedLogistics"],
      ["Rejadagi ombor", "«Samarqand-Markaz» mintaqaviy ombori"],
      ["Haqiqiy ombor", "«Samarqand-Shimol» zaxira ombori"],
      ["Nakladnoya raqami", "TR-260902"],
      ["Yukdagi miqdor", "6 000 qadoq"],
      ["Partiya raqami", "PM-260814"],
      ["Saqlash sharti", "15–25 °C"],
      ["Zaxira omborga qabul sanasi", "02.09.2026"]
    ]),
    issue: rows([
      ["Nima bo'ldi", "Yuk «Samarqand-Markaz» asosiy omboridan «Samarqand-Shimol» zaxira omboriga yo'naltirildi."],
      ["Sabab", "Asosiy ombor iqlim nazorati tizimi tekshiruvi sabab qabulni vaqtincha to'xtatdi."],
      ["Hodisa sanasi", "02.09.2026"],
      ["Ko'rilgan choralar", "Tashuvchi asosiy omborda tushirishni to'xtatdi.\nQayta yo'naltirish PharmaMed Uzbekistan bilan kelishildi.\nYo'ldagi va zaxira ombordagi harorat qayd etildi."],
      ["Yakuniy yechim", "Yuk 02.09.2026 da zaxira omborga qabul qilindi va keyin dorixonaga jo'natildi."],
      ["Joriy holat", "Hal qilindi. Hodisa partiya tarixida saqlandi."]
    ]),
    who: rows(whoRows("Jasur Nuriddinov", "Distribution Manager", "UzMedLogistics", "02.09.2026")),
    extra: "Ko'chirish nakladnoyasi va zaxira ombor harorat jurnali ko'rish uchun mavjud.",
  },
  {
    info: rows([
      ["Dorixona", "«Zdorovye Plyus» dorixonasi, Samarqand"],
      ["Partiya raqami", "PM-260814"],
      ["Qabul qilindi", "120 qadoq"],
      ["Kirim nakladnoyasi", "INV-260909-0412"],
      ["Qadoq va QR kodlar tekshiruvi", "O'tdi"],
      ["Saqlash sharti", "15–25 °C"],
      ["Holat", "Sotuv uchun mavjud"]
    ]),
    who: rows(whoRows("Malika Ismoilova", "Dorixona mudiri", "«Zdorovye Plyus» dorixonasi", "09.09.2026")),
    extra: "Xaridor ushbu bosqichni aynan shu dorixonada sotib olingan qadoqdagi QR kodni skanerlaganda ko'radi.",
  }
];

const PARACETAMOL_DOCS: DocSeed[][] = [
  [["Xomashyo tahlil sertifikati (CoA)", "COA-IND-260801", "AuroChem Industries", "01.08.2026", true, "Tasdiqlangan"]],
  [
    ["Avia yuk xati (Air Waybill)", "AWB-TSK-260803", "SilkRoute Cargo Ltd", "03.08.2026", true, "Tasdiqlangan"],
    ["Bojxona deklaratsiyasi", "GTD-TSH-260809", "Toshkent aeroporti bojxona posti", "09.08.2026", true, "Tasdiqlangan"],
    ["Tashish harorat jurnali", "TL-260803", "SilkRoute Cargo Ltd", "09.08.2026", true, "Tasdiqlangan"]
  ],
  [
    ["Xomashyo qabul akti", "ACC-260810-07", "PharmaMed Uzbekistan", "10.08.2026", true, "Tasdiqlangan"],
    ["Kirish nazorati protokoli", "IC-260810-03", "PharmaMed Uzbekistan", "10.08.2026", true, "Tasdiqlangan"]
  ],
  [["Seriya ishlab chiqarish protokoli", "BPR-PM-260814", "PharmaMed Uzbekistan", "14.08.2026", true, "Tasdiqlangan"]],
  [
    ["Sinov protokoli (birlamchi)", "LAB-260818-01", "PharmaMed sifat nazorati laboratoriyasi", "18.08.2026", true, "Tasdiqlangan"],
    ["Og'ish hisoboti", "DEV-260818-02", "PharmaMed Uzbekistan", "21.08.2026", true, "Tasdiqlangan"],
    ["Sinov protokoli (takroriy)", "LAB-260824-03", "PharmaMed sifat nazorati laboratoriyasi", "24.08.2026", true, "Tasdiqlangan"]
  ],
  [
    ["Qadoqlash va markirovka protokoli", "PK-260826", "PharmaMed Uzbekistan", "26.08.2026", true, "Tasdiqlangan"],
    ["Noyob kodlar reyestri", "QR-REG-260826", "PharmaMed Uzbekistan", "26.08.2026", true, "Tasdiqlangan"]
  ],
  [
    ["Partiyani chiqarish qarori", "REL-260828", "PharmaMed Uzbekistan", "28.08.2026", true, "Tasdiqlangan"],
    ["Seriya sifati sertifikati", "CoC-PM-260814", "PharmaMed Uzbekistan", "28.08.2026", true, "Tasdiqlangan"]
  ],
  [
    ["Ko'chirish nakladnoyasi", "TR-260902", "UzMedLogistics", "02.09.2026", true, "Tasdiqlangan"],
    ["Qabulni to'xtatish xati", "LTR-SC-0902", "«Samarqand-Markaz» ombori", "02.09.2026", false, "Tashkilot tomonidan tasdiqlangan, mustaqil tekshiruv o'tkazilmagan"]
  ],
  [
    ["Kirim nakladnoyasi", "INV-260909-0412", "UzMedLogistics", "09.09.2026", true, "Tasdiqlangan"],
    ["Dorixona qabul jurnali", "JRN-260909", "«Zdorovye Plyus» dorixonasi", "09.09.2026", true, "Tasdiqlangan"]
  ]
];

/* ------------------------------------------------------------------ */
/* Generic stage content for every other product                      */
/* ------------------------------------------------------------------ */

const people: Record<StageKind, [string, string]> = {
  raw: ["Aleksandr Karimov", "Sifat nazorati menejeri"],
  transport: ["Rustam Yuldashev", "Logistika bo'limi rahbari"],
  storage: ["Dilnoza Rahimova", "Ombor mudiri"],
  production: ["Marat Ahmedov", "Ishlab chiqarish menejeri"],
  quality: ["Elena Sokolova", "Sifat nazorati bo'limi rahbari"],
  packaging: ["Ulug'bek Toshmatov", "Qadoqlash supervayzeri"],
  release: ["Shohruh Ergashev", "Sifat bo'yicha vakolatli shaxs"],
  distribution: ["Jasur Nuriddinov", "Taqsimot menejeri"],
  pharmacy: ["Malika Ismoilova", "Dorixona mudiri"]
};

const organizations: Record<StageKind, string> = {
  raw: "AuroChem Industries",
  transport: "SilkRoute Cargo Ltd",
  storage: "PharmaMed Uzbekistan",
  production: "PharmaMed Uzbekistan",
  quality: "PharmaMed sifat nazorati laboratoriyasi",
  packaging: "PharmaMed Uzbekistan",
  release: "PharmaMed Uzbekistan",
  distribution: "UzMedLogistics",
  pharmacy: "«Zdorovye Plyus» dorixonasi"
};

const docPrefix: Record<StageKind, string> = {
  raw: "COA",
  transport: "AWB",
  storage: "ACC",
  production: "BPR",
  quality: "LAB",
  packaging: "PK",
  release: "REL",
  distribution: "TR",
  pharmacy: "INV"
};

function compact(value: string, fallback: string) {
  return (value.replace(/[^A-Za-z0-9]/g, "") || fallback).toUpperCase().slice(0, 12);
}

function genericInfo(product: DetailProduct, stage: PassportStage): Pair[] {
  const batch = product.batch || "PARTIYA";
  switch (stage.kind) {
    case "raw":
      return [
        ["Yetkazib beruvchi", product.manufacturer],
        ["Kelib chiqish davlati", stage.country],
        ["Material", product.name],
        ["Partiya raqami", `RAW-${compact(batch, "RAW")}`],
        ["Miqdor", `${Math.max(1, Math.round(product.netContent.length * 18))} birlik`],
        ["Birlamchi tekshiruv", stage.state === "ok" ? "Talablarga mos" : "Qo'shimcha tekshiruv talab qilindi"]
      ];
    case "transport":
      return [
        ["Tashuvchi", organizations.transport],
        ["Marshrut", `${stage.location}`],
        ["Yuk xati", `AWB-${compact(batch, "AWB")}`],
        ["Partiya", batch],
        ["Tashish sharti", "+15…+25 °C, harorat qaydlagichi"],
        ["Yetib kelgan sana", stage.date]
      ];
    case "storage":
      return [
        ["Tashkilot", product.manufacturer],
        ["Ombor", `${stage.location} markaziy ombori`],
        ["Qabul raqami", `ACC-${compact(batch, "ACC")}`],
        ["Partiya", batch],
        ["Saqlash sharti", "15–25 °C, namlik 60% gacha"],
        ["Kirish nazorati", stage.state === "ok" ? "Talablarga mos" : "Og'ish qayd etildi"]
      ];
    case "production":
      return [
        ["Ishlab chiqaruvchi", product.manufacturer],
        ["Maydon", `${stage.location} ishlab chiqarish maydoni`],
        ["Partiya", batch],
        ["Mahsulot", product.name],
        ["Miqdor", product.netContent],
        ["Ishlab chiqarilgan sana", product.manufactureDate],
        ["Yaroqlilik muddati", product.expiryDate]
      ];
    case "quality":
      return [
        ["Laboratoriya", `${product.manufacturer} sifat nazorati laboratoriyasi`],
        ["Partiya", batch],
        ["Usullar", "Hujjatli tekshiruv, namuna sinovi"],
        ["Natija", stage.state === "ok" ? "Me'yorga mos" : "Birlamchi natija me'yorga mos emas"],
        ["Xulosa", stage.tag]
      ];
    case "packaging":
      return [
        ["Tashkilot", product.manufacturer],
        ["Maydon", `${stage.location} qadoqlash liniyasi`],
        ["Partiya", batch],
        ["Qadoq", product.netContent],
        ["Noyob kodlar", `SC-${compact(batch, "SC")}-000001 … 999999`],
        ["Markirovka", "GS1 DataMatrix"]
      ];
    case "release":
      return [
        ["Tashkilot", product.manufacturer],
        ["Partiya", batch],
        ["Qaror", stage.state === "ok" ? "Sotuvga chiqarishga ruxsat" : "Tasdiqlash kutilmoqda"],
        ["Miqdor", `${product.netContent}`],
        ["Yaroqlilik", product.expiryDate],
        ["Tekshirilgan hujjatlar", "Ishlab chiqarish va sifat nazorati hujjatlari"]
      ];
    case "distribution":
      return [
        ["Distribyutor", organizations.distribution],
        ["Marshrut", `${stage.location} → ${product.country}`],
        ["Nakladnoya", `TR-${compact(batch, "TR")}`],
        ["Partiya", batch],
        ["Miqdor", `${Math.max(12, product.netContent.length * 4)} birlik`],
        ["Saqlash sharti", "15–25 °C"]
      ];
    default:
      return [
        ["Dorixona", `${stage.location} dorixonasi`],
        ["Partiya", batch],
        ["Qabul qilindi", `${Math.max(10, product.netContent.length * 2)} qadoq`],
        ["Kirim nakladnoyasi", `INV-${compact(batch, "INV")}`],
        ["Tekshiruv", "Qadoq va 2D kodlar tekshirildi"],
        ["Holat", stage.state === "ok" ? "Sotuv uchun mavjud" : "Qo'shimcha tekshiruv"]
      ];
  }
}

function genericDocs(product: DetailProduct, stage: PassportStage, no: number): DocSeed[] {
  const batch = compact(product.batch, "PARTIYA");
  const by = organizations[stage.kind];
  const date = stage.date;
  const base = `${docPrefix[stage.kind]}-${batch}`;
  const ok = stage.state === "ok";
  const status = ok ? "Tasdiqlangan" : "Eslatma bilan tasdiqlangan";

  switch (stage.kind) {
    case "raw":
      return [["Xomashyo sertifikati (CoA)", base, by, date, ok, status]];
    case "transport":
      return [
        ["Avia yuk xati (Air Waybill)", base, by, date, ok, status],
        ["Bojxona deklaratsiyasi", `GTD-${batch}`, "Bojxona posti", date, true, "Tasdiqlangan"],
        ["Tashish harorat jurnali", `TL-${batch}`, by, date, true, "Tasdiqlangan"]
      ];
    case "storage":
      return [
        ["Qabul akti", base, by, date, ok, status],
        ["Kirish nazorati protokoli", `IC-${batch}`, by, date, ok, status]
      ];
    case "production":
      return [["Ishlab chiqarish protokoli", base, by, date, ok, status]];
    case "quality":
      return ok
        ? [["Sinov protokoli", base, by, date, true, "Tasdiqlangan"]]
        : [
            ["Sinov protokoli (birlamchi)", `${base}-01`, by, date, true, "Tasdiqlangan"],
            ["Qayta sinov protokoli", `${base}-02`, by, date, true, "Tasdiqlangan"]
          ];
    case "packaging":
      return [
        ["Qadoqlash va markirovka protokoli", base, by, date, ok, status],
        ["Noyob kodlar reyestri", `QR-REG-${batch}`, by, date, true, "Tasdiqlangan"]
      ];
    case "release":
      return [
        ["Partiyani chiqarish qarori", base, by, date, ok, status],
        ["Sifat sertifikati", `CoC-${batch}`, by, date, ok, status]
      ];
    case "distribution":
      return ok
        ? [["Ko'chirish nakladnoyasi", base, by, date, true, "Tasdiqlangan"]]
        : [
            ["Ko'chirish nakladnoyasi", base, by, date, true, "Tasdiqlangan"],
            ["Yo'nalish o'zgarishi xati", `LTR-${batch}`, by, date, false, "Ichki hujjat, mustaqil tekshiruv yo'q"]
          ];
    default:
      return [
        ["Kirim nakladnoyasi", base, by, date, ok, status],
        ["Dorixona qabul jurnali", `JRN-${batch}`, by, date, true, "Tasdiqlangan"]
      ];
  }
}

function genericIssue(product: DetailProduct, stage: PassportStage, no: number): Pair[] | undefined {
  if (stage.state === "ok") return undefined;
  const date = stage.date;
  switch (stage.kind) {
    case "transport":
      return [
        ["Nima bo'ldi", "Yuk bojxona punktida hujjatlarni qo'shimcha tekshirish uchun ushlab turildi."],
        ["Sabab", "Invoysdagi partiya raqami sertifikat bilan mos kelmadi."],
        ["Hodisa sanasi", date],
        ["Ko'rilgan choralar", "Yetkazib beruvchidan tuzatilgan invoys olindi.\nHujjatlar qayta topshirildi.\nHarorat jurnali tekshirildi: og'ish yo'q."],
        ["Yakuniy yechim", "Yuk qo'shimcha tekshiruvdan keyin chiqarildi. Sifatga ta'sir qilmadi."],
        ["Joriy holat", "Hal qilindi. Hodisa partiya tarixida saqlandi."]
      ];
    case "quality":
      return [
        ["Nima bo'ldi", "Birlamchi namuna sinovi me'yordan chetga chiqdi va partiya vaqtincha bloklandi."],
        ["Sabab", "Sinov asbobining kalibrlash muddati tugagan."],
        ["Hodisa sanasi", date],
        ["Ko'rilgan choralar", "Asbob qayta kalibrlandi.\nOg'ish hisoboti rasmiylashtirildi.\nYangi namunalar sinovdan o'tkazildi."],
        ["Yakuniy yechim", "Takroriy natija me'yorga mos. Partiya blokdan chiqarildi."],
        ["Joriy holat", "Hal qilindi. Birlamchi natija tarixda saqlanib qoldi."]
      ];
    case "distribution":
      return [
        ["Nima bo'ldi", "Yuk asosiy ombor o'rniga zaxira omborga yo'naltirildi."],
        ["Sabab", "Asosiy ombor qabulni vaqtincha to'xtatdi."],
        ["Hodisa sanasi", date],
        ["Ko'rilgan choralar", "Tushirish to'xtatildi.\nQayta yo'naltirish ishlab chiqaruvchi bilan kelishildi.\nHarorat qayd etildi."],
        ["Yakuniy yechim", "Yuk zaxira omborga qabul qilindi va dorixonaga jo'natildi."],
        ["Joriy holat", "Hal qilindi. Hodisa partiya tarixida saqlandi."]
      ];
    case "release":
      return [
        ["Nima bo'ldi", "Partiya hujjatlari bo'yicha yakuniy tasdiqlash tugallanmagan."],
        ["Sabab", "GS1 identifikatori va markirovka ma'lumotlari tasdiqlanishi kutilmoqda."],
        ["Hodisa sanasi", date],
        ["Ko'rilgan choralar", "Hujjatlar to'liqligi tekshirilmoqda.\nMas'ul xodimga eslatma yuborildi."],
        ["Yakuniy yechim", "Tasdiqlangach partiya sotuvga chiqariladi."],
        ["Joriy holat", "Jarayonda."]
      ];
    default:
      return [
        ["Nima bo'ldi", "Bosqichda kichik og'ish qayd etildi."],
        ["Sabab", "Qo'shimcha hujjat tekshiruvi talab qilindi."],
        ["Hodisa sanasi", date],
        ["Ko'rilgan choralar", "Mas'ul xodim hujjatlarni qayta ko'rib chiqdi."],
        ["Yakuniy yechim", "Og'ish hal qilindi va tarixda saqlandi."],
        ["Joriy holat", "Hal qilindi."]
      ];
  }
}

export function getStageDetail(product: DetailProduct, stage: PassportStage, stepNo: number): StageDetail {
  const isParacetamol = product.gtin === "09506000487120";
  if (isParacetamol) {
    const index = Math.max(0, Math.min(PARACETAMOL_DETAILS.length - 1, stepNo - 1));
    const data = PARACETAMOL_DETAILS[index];
    const seeds = PARACETAMOL_DOCS[index] ?? [];
    return {
      info: data.info,
      issue: data.issue,
      who: data.who,
      extra: data.extra,
      docs: makeDocs(seeds, data.info, data.who)
    };
  }

  const info = rows(genericInfo(product, stage));
  const [name, role] = people[stage.kind];
  const organization = organizations[stage.kind];
  const who = rows(whoRows(name, role, organization, stage.date));
  const seeds = genericDocs(product, stage, stepNo);
  return {
    info,
    who,
    issue: (() => { const issue = genericIssue(product, stage, stepNo); return issue ? rows(issue) : undefined; })(),
    extra:
      seeds.length > 1
        ? `Ushbu bosqichda ${seeds.length} ta hujjat mavjud. Har bir hujjatni ochib, tafsilotlarini ko'rishingiz mumkin.`
        : "Bosqich hujjati va mas'ul shaxs imzosi bilan tasdiqlangan.",
    docs: makeDocs(seeds, info, who)
  };
}