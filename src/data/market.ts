/**
 * Demo pharmacy/marketplace aggregation.
 * No partner API is connected yet, so prices are deterministic demo values that
 * are clearly labelled in the UI. Swap this module for real API calls later.
 */

export type MarketProduct = {
  id?: string;
  name: string;
  gtin: string;
  category: string;
  manufacturer: string;
  netContent?: string;
};

export type PharmacyOffer = {
  id: string;
  pharmacy: string;
  city: string;
  price: number;
  oldPrice?: number;
  inStock: boolean;
  delivery: string;
  rating: number;
  badge?: string;
  link: string;
};

export type SimilarProduct = {
  name: string;
  price: number;
  reason: string;
};

export type MarketData = {
  offers: PharmacyOffer[];
  min: number;
  max: number;
  average: number;
  savingsPercent: number;
  availability: number;
  trend: { label: string; price: number }[];
  similar: SimilarProduct[];
  isPharmacyProduct: boolean;
  aggregatorLinks: { name: string; url: string }[];
};

function hashString(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function basePrice(product: MarketProduct) {
  const seed = hashString(`${product.gtin}|${product.name}`);
  const text = `${product.name} ${product.category}`.toLowerCase();
  if (/(dori|tabletka|kapsula|mg|antibiotik|antigistamin)/.test(text)) return 8500 + (seed % 6500);
  if (/(ichimlik|sut|milk|oat)/.test(text)) return 22000 + (seed % 6000);
  if (/(kiyim|kurtka|jacket|apparel)/.test(text)) return 760000 + (seed % 220000);
  if (/(sovun|hand wash|parvarish)/.test(text)) return 27000 + (seed % 9000);
  if (/(mug|krujka|idish|tableware)/.test(text)) return 95000 + (seed % 45000);
  if (/(daftar|notebook|kanselyariya)/.test(text)) return 38000 + (seed % 14000);
  return 32000 + (seed % 18000);
}

const pharmacyNames = [
  { name: "Oson Apteka", city: "Toshkent", link: "https://osonapteka.uz" },
  { name: "Arzon Apteka", city: "Samarqand", link: "https://arzonapteka.uz" },
  { name: "Oxymed", city: "Toshkent", link: "https://oxymed.uz" },
  { name: "Dorixona 24/7", city: "Buxoro", link: "https://dorixona.uz" }
];

const shopNames = [
  { name: "Oson Market", city: "Toshkent", link: "https://osonapteka.uz" },
  { name: "Arzon Market", city: "Samarqand", link: "https://arzonapteka.uz" },
  { name: "Uzum Market", city: "Toshkent", link: "https://uzum.uz" },
  { name: "Yandex Market", city: "Toshkent", link: "https://market.yandex.uz" }
];

const pharmacyAlternatives = [
  { name: "Ibuprofen 400 mg", factor: 0.92, reason: "Xuddi shu ta'sir guruhi" },
  { name: "Paracetamol 1000 mg", factor: 1.18, reason: "Yuqori dozali variant" },
  { name: "Aspirin 500 mg", factor: 0.78, reason: "Arzon analoglar guruhi" },
  { name: "Analgin 500 mg", factor: 0.65, reason: "Tez ta'sir qiluvchi variant" }
];

export function getMarketData(product: MarketProduct, catalog: MarketProduct[] = []): MarketData {
  const seed = hashString(`${product.gtin}|${product.name}`);
  const isPharmacyProduct = /(dori|tabletka|kapsula|mg|antibiotik|antigistamin)/i.test(
    `${product.name} ${product.category}`
  );
  const base = basePrice(product);
  const partners = isPharmacyProduct ? pharmacyNames : shopNames;

  const offers: PharmacyOffer[] = partners.slice(0, 4).map((partner, index) => {
    const factor = [0.9, 1.04, 0.97, 1.12][index] + ((seed >> (index * 3)) % 9) / 100;
    const price = Math.round((base * factor) / 100) * 100;
    const discount = index === 0 || index === 2;
    return {
      id: `${product.gtin}-${index}`,
      pharmacy: partner.name,
      city: partner.city,
      price,
      oldPrice: discount ? Math.round((price * 1.13) / 100) * 100 : undefined,
      inStock: index !== partners.length - 1 || isPharmacyProduct,
      delivery: index % 2 === 0 ? "Bugun yetkaziladi" : "Ertaga yetkaziladi",
      rating: Number((4.4 + ((seed >> index) % 5) / 10).toFixed(1)),
      badge: index === 0 ? "Eng arzon" : index === 1 ? "Tez yetkazish" : undefined,
      link: partner.link
    };
  });

  const prices = offers.map((offer) => offer.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const average = Math.round(prices.reduce((sum, price) => sum + price, 0) / prices.length);
  const inStock = offers.filter((offer) => offer.inStock).length;

  const monthLabels = ["Iyun", "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr"];
  const trend = monthLabels.map((label, index) => ({
    label,
    price: Math.round((base * (0.93 + (((seed >> index) % 11) / 100) + index * 0.008)) / 100) * 100
  }));

  let similar: SimilarProduct[];
  if (isPharmacyProduct) {
    similar = pharmacyAlternatives.map((item, index) => ({
      name: item.name,
      price: Math.round((base * item.factor + index * 400) / 100) * 100,
      reason: item.reason
    }));
  } else {
    similar = catalog
      .filter((item) => item.name !== product.name && (item.category === product.category || item.manufacturer !== product.manufacturer))
      .slice(0, 3)
      .map((item, index) => ({
        name: item.name,
        price: Math.round((base * (0.85 + index * 0.12)) / 100) * 100,
        reason: item.category === product.category ? "Xuddi shu toifadagi mahsulot" : "Xaridorlar tez-tez solishtiradi"
      }));
    if (!similar.length) {
      similar = [
        { name: `${product.category} · alternativ A`, price: Math.round(base * 0.9), reason: "O'xshash xususiyatlar" },
        { name: `${product.category} · alternativ B`, price: Math.round(base * 1.1), reason: "Boshqa ishlab chiqaruvchi" }
      ];
    }
  }

  return {
    offers,
    min,
    max,
    average,
    savingsPercent: Math.max(1, Math.round(((max - min) / max) * 100)),
    availability: Math.round((inStock / offers.length) * 100),
    trend,
    similar,
    isPharmacyProduct,
    aggregatorLinks: isPharmacyProduct
      ? [
          { name: "Oson Apteka", url: "https://osonapteka.uz" },
          { name: "Arzon Apteka", url: "https://arzonapteka.uz" }
        ]
      : [
          { name: "Uzum Market", url: "https://uzum.uz" },
          { name: "Yandex Market", url: "https://market.yandex.uz" }
        ]
  };
}

export function formatSom(value: number) {
  return `${value.toLocaleString("uz-UZ").replace(/\u00a0/g, " ")} so'm`;
}