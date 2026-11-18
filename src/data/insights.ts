/** Deterministic, demo-only comment aggregation. No external marketplace API is used yet. */

export type InsightProduct = {
  name: string;
  gtin: string;
  category: string;
  manufacturer: string;
};

export type InsightComment = {
  id: string;
  author: string;
  city: string;
  date: string;
  rating: number;
  text: string;
  source: string;
  verified: boolean;
  helpful: number;
  theme: string;
};

export type ThemeInsight = { label: string; mentions: number; percent: number };
export type MonthlyInsight = { label: string; count: number; rating: number };

export type ProductInsights = {
  rating: number;
  count: number;
  positive: number;
  neutral: number;
  negative: number;
  distribution: number[];
  themes: ThemeInsight[];
  monthly: MonthlyInsight[];
  verifiedShare: number;
  repeatRate: number;
  returnRate: number;
  categoryReturnRate: number;
  categoryAvg: number;
  priceIndex: number;
  comments: InsightComment[];
  sources: string[];
  isPharmacyProduct: boolean;
};

function hashString(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function makeRng(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const people = [
  ["Dilnoza A.", "Toshkent"],
  ["Javohir S.", "Samarqand"],
  ["Nilufar R.", "Toshkent"],
  ["Aziz M.", "Buxoro"],
  ["Gulnora T.", "Andijon"],
  ["Bekzod Q.", "Farg'ona"],
  ["Malika I.", "Samarqand"],
  ["Sardor N.", "Namangan"],
  ["Kamola Y.", "Toshkent"],
  ["Umid H.", "Nukus"]
];

const sources = ["Oson Apteka", "Arzon Apteka", "SignalCode cheki", "Telegram guruhi"];

type Template = { rating: number; theme: string; text: (name: string) => string };

const pharmacyTemplates: Template[] = [
  { rating: 5, theme: "Ishonch", text: (name) => `${name} partiyasini skanerlaganimda barcha bosqichlar va dorixona qabuli ko'rindi. Shu kabi shaffoflik ishonchni oshiradi.` },
  { rating: 5, theme: "Samarasi", text: () => "Samarasi tez sezildi, qadoq butun va yaroqlilik muddati uzoq. Narxi ham hududdagi o'rtachadan past." },
  { rating: 5, theme: "Yetkazib berish", text: () => "Buyurtma bir kunda yetkazildi. Sotuvchi yo'riqnoma bo'yicha savollarga batafsil javob berdi." },
  { rating: 5, theme: "Qadoq sifati", text: (name) => `${name} blisteri mustahkam, transportda shikastlanmagan. Partiya raqami va QR kod ham mos keldi.` },
  { rating: 4, theme: "Narx", text: () => "Sifati yaxshi, lekin narx qo'shni dorixonalarga qaraganda 1 000 so'mcha yuqori. Aksiya bo'lsa yana olaman." },
  { rating: 4, theme: "Yo'riqnoma", text: () => "Yo'riqnoma to'liq, ammo doza jadvali kichik shriftda chop etilgan. Kattaroq yozuv qulay bo'lardi." },
  { rating: 4, theme: "Yetkazib berish", text: () => "Yetkazib berish bir kun kechikdi, ammo qadoq va sifatga shikoyat yo'q." },
  { rating: 3, theme: "Qadoq sifati", text: () => "Qadoqda kichik ezilish bor edi. Dorixona darhol almashtirib berdi, muammo hal bo'ldi." },
  { rating: 2, theme: "Narx", text: () => "Oxirgi oyda narx sezilarli oshdi. Shu ta'sir guruhidagi arzonroq variantlar ham bor." },
  { rating: 2, theme: "Yetkazib berish", text: () => "Buyurtma ikki kun kechikdi va qadoq ochilgan holda keldi. Qayta buyurtma qilishga ikkilanaman." }
];

const generalTemplates: Template[] = [
  { rating: 5, theme: "Sifat", text: (name) => `${name} kutilganidan yaxshi chiqdi. Qadoq butun, tashqi ko'rinishi ham toza.` },
  { rating: 5, theme: "Narx", text: () => "Narx bozordagi o'rtachadan past, yetkazib berish tez. Tavsiya qilaman." },
  { rating: 5, theme: "Yetkazib berish", text: () => "Buyurtma bir kunda keldi, kuryer xushmuomala. Qadoq shikastlanmagan." },
  { rating: 4, theme: "Sifat", text: (name) => `${name} sifati yaxshi, faqat rang haqidagi tavsif rasmdagidan biroz farq qiladi.` },
  { rating: 4, theme: "Narx", text: () => "Yaxshi variant, lekin boshqa sotuvchida 5-7% arzonroq topiladi. Sifati bilan qanoatlandim." },
  { rating: 4, theme: "Qadoq", text: () => "Qadoq ishonchli, ichida himoya qatlami bor. Ochish uchun biroz kuch kerak bo'ldi." },
  { rating: 3, theme: "Yetkazib berish", text: () => "Mahsulot yaxshi, ammo yetkazib berish kutilganidan bir kun kechikdi." },
  { rating: 3, theme: "Tavsif", text: () => "Tavsifda o'lcham aniqroq ko'rsatilsa yaxshi bo'lardi. Sotuvchi savolga tez javob berdi." },
  { rating: 2, theme: "Qadoq", text: () => "Qadoq ezilgan holda keldi, almashtirish jarayoni uzoq davom etdi." },
  { rating: 2, theme: "Narx", text: () => "Narxga nisbatan sifati kutilgan darajada emas. Boshqa variantni sinab ko'raman." }
];

export function getInsights(product: InsightProduct): ProductInsights {
  const seed = hashString(`${product.gtin}|${product.name}|${product.manufacturer}`);
  const random = makeRng(seed);
  const isPharmacyProduct = /(dori|tabletka|kapsula|mg|antibiotik|og'riq|antigistamin)/i.test(
    `${product.name} ${product.category}`
  );

  const count = 420 + Math.floor(random() * 1650);
  const shared = [
    0.58 + random() * 0.1,
    0.19 + random() * 0.07,
    0.08 + random() * 0.04,
    0.04 + random() * 0.025,
    0.025 + random() * 0.025
  ];
  const total = shared.reduce((sum, value) => sum + value, 0);
  const distribution = shared.map((value) => Math.round((value / total) * count));
  const rating = Number(
    ((distribution[0] * 5 + distribution[1] * 4 + distribution[2] * 3 + distribution[3] * 2 + distribution[4]) / count).toFixed(1)
  );

  const positive = Math.round(((distribution[0] + distribution[1]) / count) * 100);
  const neutral = Math.round((distribution[2] / count) * 100);
  const negative = Math.max(0, 100 - positive - neutral);

  const themeBase = isPharmacyProduct
    ? [
        ["Samarasi", 82 + random() * 9],
        ["Narx", 58 + random() * 12],
        ["Qadoq sifati", 46 + random() * 12],
        ["Yetkazib berish", 34 + random() * 14],
        ["Yo'riqnoma", 27 + random() * 12]
      ]
    : [
        ["Sifati", 78 + random() * 10],
        ["Narx", 60 + random() * 12],
        ["Qadoq", 47 + random() * 12],
        ["Yetkazib berish", 36 + random() * 14],
        ["Tashqi ko'rinish", 30 + random() * 12]
      ];
  const themes = themeBase.map(([label, percent]) => ({
    label: String(label),
    percent: Math.round(Number(percent)),
    mentions: Math.round((count * Number(percent)) / 100)
  }));

  const monthLabels = ["Iyun", "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr"];
  const monthly = monthLabels.map((label, index) => ({
    label,
    count: Math.round((count / 6) * (0.65 + random() * 0.45 + index * 0.05)),
    rating: Number((rating - 0.18 + random() * 0.36).toFixed(1))
  }));

  const templates = isPharmacyProduct ? pharmacyTemplates : generalTemplates;
  const dates = ["Bugun", "Kecha", "13 noy. 2026", "10 noy. 2026", "06 noy. 2026", "01 noy. 2026", "27 okt. 2026"];
  const templatePool = [...templates];
  for (let index = templatePool.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    [templatePool[index], templatePool[swap]] = [templatePool[swap], templatePool[index]];
  }
  const peoplePool = [...people];
  for (let index = peoplePool.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    [peoplePool[index], peoplePool[swap]] = [peoplePool[swap], peoplePool[index]];
  }
  const comments: InsightComment[] = Array.from({ length: 6 }, (_, index) => {
    const template = templatePool[index % templatePool.length];
    const [author, city] = peoplePool[index % peoplePool.length];
    return {
      id: `${product.gtin}-c${index + 1}`,
      author,
      city,
      date: dates[index] ?? dates[dates.length - 1],
      rating: template.rating,
      text: template.text(product.name),
      source: sources[Math.floor(random() * sources.length)],
      verified: random() > 0.18,
      helpful: 3 + Math.floor(random() * 46),
      theme: template.theme
    };
  });

  const returnRate = Number((0.5 + random() * 1.9).toFixed(1));

  return {
    rating,
    count,
    positive,
    neutral,
    negative,
    distribution: distribution.reverse(), // index 0 = 1 star
    themes,
    monthly,
    verifiedShare: Math.round(80 + random() * 14),
    repeatRate: Math.round(24 + random() * 26),
    returnRate,
    categoryReturnRate: Number((returnRate + 0.3 + random() * 0.7).toFixed(1)),
    categoryAvg: Number((rating + (random() - 0.5) * 0.8).toFixed(1)),
    priceIndex: Math.round(90 + random() * 20),
    comments,
    sources,
    isPharmacyProduct
  };
}