import type { PassportStage } from "../components/ProductPassport";
import {
  fieldNotesStages,
  handWashStages,
  jacketStages,
  mugStages,
  oatMilkStages,
  paracetamolStages
} from "./histories";

export const CONSUMER_ORIGIN =
  (import.meta.env.VITE_CONSUMER_ORIGIN as string | undefined)?.replace(/\/+$/, "") ??
  "https://2dbarcodeapp-consumer.pdostonh.workers.dev";

export type DemoProduct = {
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

const link = (gtin: string, batch: string, serial: string) =>
  `${CONSUMER_ORIGIN}/01/${gtin}/10/${batch}/21/${serial}`;

export const demoProducts: DemoProduct[] = [
  {
    id: "BX-12480",
    name: "Paracetamol 500 mg",
    format: "GS1 DataMatrix",
    value: "(01)09506000487120(10)PM-260814(21)48120007(17)280814",
    digitalLink: link("09506000487120", "PM-260814", "48120007"),
    scans: 128462,
    status: "Active",
    updated: "Today, 09:42",
    gtin: "09506000487120",
    batch: "PM-260814",
    serial: "48120007",
    manufactureDate: "14 Aug 2026",
    expiryDate: "14 Aug 2028",
    bestBefore: "14 Aug 2028",
    manufacturer: "PharmaMed Uzbekistan",
    category: "Dori vositasi",
    country: "O'zbekiston",
    netContent: "20 tabletka",
    packaging: "Blister, 2×10",
    lotSize: 24000,
    description:
      "Partiya xomashyodan dorixona javonigacha bo'lgan 9 bosqichni bosib o'tdi. Uchtasida og'ish bo'lgan, ular hal qilindi va tarixda saqlandi.",
    stages: paracetamolStages
  },
  {
    id: "BX-12479",
    name: "Organic Oat Milk 1L",
    format: "GS1 DataMatrix",
    value: "(01)09506000134352(10)NS20261104(21)10482001(17)271130",
    digitalLink: link("09506000134352", "NS20261104", "10482001"),
    scans: 89243,
    status: "Active",
    updated: "Yesterday",
    gtin: "09506000134352",
    batch: "NS20261104",
    serial: "10482001",
    manufactureDate: "04 Nov 2026",
    expiryDate: "30 Nov 2027",
    bestBefore: "30 Nov 2027",
    manufacturer: "Northstar Foods LLC",
    category: "O'simlik asosidagi ichimlik",
    country: "O'zbekiston",
    netContent: "1 L",
    packaging: "Karton, retail birlik",
    lotSize: 48000,
    description:
      "Suli ichimligi Toshkent quyish zavodida ishlab chiqarilib, Berlin savdo nuqtasiga yetkazildi. Barcha bosqichlar tasdiqlangan.",
    stages: oatMilkStages
  },
  {
    id: "BX-12478",
    name: "Alpine Trail Jacket",
    format: "GS1 Digital Link",
    value: "https://id.gs1.org/01/09506000184721",
    digitalLink: "https://id.gs1.org/01/09506000184721",
    scans: 63418,
    status: "Active",
    updated: "12 Nov 2026",
    gtin: "09506000184721",
    batch: "AJ20261109",
    serial: "847210042",
    manufactureDate: "09 Nov 2026",
    expiryDate: "Not applicable",
    bestBefore: "Not applicable",
    manufacturer: "Alpine Works AG",
    category: "Outdoor kiyim",
    country: "O'zbekiston",
    netContent: "M o'lcham",
    packaging: "Polibag, retail birlik",
    lotSize: 12500,
    description:
      "Samarqandda tikilgan kurtka partiyasi Berlin do'koniga yetkazildi. Barcha bosqichlar izohsiz o'tdi.",
    stages: jacketStages
  },
  {
    id: "BX-12477",
    name: "Citrus Hand Wash 250ml",
    format: "GS1 DataMatrix",
    value: "(01)09506000984716(10)HW261104(21)984716002",
    digitalLink: link("09506000984716", "HW261104", "984716002"),
    scans: 4210,
    status: "Draft",
    updated: "10 Nov 2026",
    gtin: "09506000984716",
    batch: "HW261104",
    serial: "984716002",
    manufactureDate: "04 Nov 2026",
    expiryDate: "31 Oct 2028",
    bestBefore: "31 Oct 2028",
    manufacturer: "Northstar Consumer Care",
    category: "Shaxsiy parvarish",
    country: "O'zbekiston",
    netContent: "250 ml",
    packaging: "Flakon, retail birlik",
    lotSize: 76000,
    description:
      "Sitrus hidli suyuq sovun partiyasi Toshkentda ishlab chiqarilib, mintaqaviy tarqatish markaziga jo'natildi.",
    stages: handWashStages
  },
  {
    id: "BX-12476",
    name: "Studio Mug / Clay",
    format: "GS1 Digital Link",
    value: "https://id.gs1.org/01/09506000821095",
    digitalLink: "https://id.gs1.org/01/09506000821095",
    scans: 7648,
    status: "Draft",
    updated: "08 Nov 2026",
    gtin: "09506000821095",
    batch: "MUG-DRAFT-04",
    serial: "821095104",
    manufactureDate: "08 Nov 2026",
    expiryDate: "Not applicable",
    bestBefore: "Not applicable",
    manufacturer: "Studio Northstar",
    category: "Idish-tovoq",
    country: "O'zbekiston",
    netContent: "1 krujka",
    packaging: "Sovg'a qutisi",
    lotSize: 3200,
    description:
      "Kulolchilik kolleksiyasidagi krujka partiyasi namuna sifatida tayyorlandi; GTIN tasdiqlanishi kutilmoqda.",
    stages: mugStages
  },
  {
    id: "BX-12475",
    name: "Field Notes No. 04",
    format: "GS1 DataMatrix",
    value: "(01)09506000018472(10)FN041108(21)184720004",
    digitalLink: link("09506000018472", "FN041108", "184720004"),
    scans: 21912,
    status: "Archived",
    updated: "18 Nov 2026",
    gtin: "09506000018472",
    batch: "FN041108",
    serial: "184720004",
    manufactureDate: "08 Nov 2026",
    expiryDate: "Not applicable",
    bestBefore: "Not applicable",
    manufacturer: "Field Station Publishing",
    category: "Kanselyariya",
    country: "O'zbekiston",
    netContent: "1 daftar",
    packaging: "Termoplyonka",
    lotSize: 18000,
    description:
      "Field Notes No. 04 nashri chop etildi, jamlandi va arxivga o'tkazildi. Yozuv keyingi tekshiruvlar uchun saqlanadi.",
    stages: fieldNotesStages
  }
];

/** Finds a demo product from a scanned payload, GTIN or the word "demo". */
export function findDemoProduct(value: string): DemoProduct | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const digits = trimmed.replace(/\D/g, "").slice(0, 14);
  const demo = /^(demo|namuna|paracetamol)$/i.test(trimmed);
  return demoProducts.find(
    (product) =>
      trimmed.includes(product.gtin) ||
      product.gtin === digits ||
      trimmed === product.value ||
      trimmed === product.digitalLink ||
      (demo && product === demoProducts[0])
  );
}