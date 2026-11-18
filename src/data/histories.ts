import type { PassportStage } from "../components/ProductPassport";

export const paracetamolStages: PassportStage[] = [
  {
    date: "01 avg. 2026",
    iso: "2026-08-01",
    title: "Boshlang'ich xomashyo qabuli",
    detail: "AuroChem Industries yetkazib beruvchisi Paracetamol API faol moddasini O'zbekistonda Paracetamol 500 mg dori ishlab chiqarish uchun tayyorladi. Xomashyo birlamchi sifat tekshiruvidan o'tdi va xalqaro tashishga tayyorlandi.",
    location: "Xaydarobod",
    country: "Hindiston",
    state: "ok",
    tag: "Muvaffaqiyatli yakunlandi",
    kind: "raw"
  },
  {
    date: "03–09 avg. 2026",
    iso: "2026-08-09",
    title: "Xalqaro tashish",
    detail: "Xomashyo partiyasi Xaydaroboddan aviareys bilan Toshkentga yetkazildi. Bojxona rasmiylashtiruvi paytida yuk hujjatlarni qo'shimcha tekshirish uchun ushlab turildi; hujjatlar tuzatilgach, yuk chiqarildi.",
    location: "Xaydarobod → Toshkent",
    country: "Hindiston → O'zbekiston",
    state: "warning",
    tag: "Kechikish bilan yakunlandi",
    kind: "transport"
  },
  {
    date: "10 avg. 2026",
    iso: "2026-08-10",
    title: "Xomashyoni qabul qilish va saqlash",
    detail: "PharmaMed Uzbekistan Chirchiqdagi xomashyo omboriga Paracetamol API ni qabul qildi. Hujjatlar va qadoq yaxlitligi tekshirildi, xomashyo harorat nazorat qilinadigan zonaga joylashtirildi.",
    location: "Toshkent viloyati",
    country: "O'zbekiston",
    state: "ok",
    tag: "Muvaffaqiyatli yakunlandi",
    kind: "storage"
  },
  {
    date: "14 avg. 2026",
    iso: "2026-08-14",
    title: "Dori ishlab chiqarish",
    detail: "PharmaMed Uzbekistan zavodida Paracetamol API va yordamchi komponentlardan Paracetamol 500 mg tabletkalari partiyasi ishlab chiqarildi.",
    location: "Toshkent",
    country: "O'zbekiston",
    state: "ok",
    tag: "Muvaffaqiyatli yakunlandi",
    kind: "production"
  },
  {
    date: "18–24 avg. 2026",
    iso: "2026-08-24",
    title: "Laboratoriya sifat nazorati",
    detail: "PM-260814 partiyasidan olingan namunalar tarkib, doza va eruvchanlik bo'yicha tekshirildi. Birlamchi eruvchanlik natijasi me'yorga mos kelmadi va partiya vaqtincha bloklandi. Tekshiruvdan so'ng takroriy sinov ijobiy natija berdi.",
    location: "Toshkent",
    country: "O'zbekiston",
    state: "warning",
    tag: "Qayta tekshiruvdan keyin yakunlandi",
    kind: "quality"
  },
  {
    date: "26 avg. 2026",
    iso: "2026-08-26",
    title: "Qadoqlash va markirovka",
    detail: "Tabletkalar 20 donadan blisterlarga qadoqlandi, har bir qadoqqa raqamli pasportning noyob QR kodi qo'llanildi.",
    location: "Toshkent",
    country: "O'zbekiston",
    state: "ok",
    tag: "Muvaffaqiyatli yakunlandi",
    kind: "packaging"
  },
  {
    date: "28 avg. 2026",
    iso: "2026-08-28",
    title: "Tayyor mahsulotni chiqarish",
    detail: "Sifat bo'yicha vakolatli shaxs partiya hujjatlarini, jumladan takroriy sinov natijalarini tekshirib, partiyani sotuvga chiqarishga ruxsat berdi.",
    location: "Toshkent",
    country: "O'zbekiston",
    state: "ok",
    tag: "Sotuvga ruxsat",
    kind: "release"
  },
  {
    date: "02–08 sen. 2026",
    iso: "2026-09-08",
    title: "Saqlash va taqsimlash",
    detail: "Partiya Samarqanddagi distribyutorga jo'natildi. Asosiy ombor qabulni vaqtincha to'xtatgani sabab yuk zaxira omborga yo'naltirildi.",
    location: "Samarqand",
    country: "O'zbekiston",
    state: "warning",
    tag: "Marshrut o'zgartirildi",
    kind: "distribution"
  },
  {
    date: "09 sen. 2026",
    iso: "2026-09-09",
    title: "Dorixonaga qabul",
    detail: "Dorixona partiyani qabul qilib, qadoq va QR kodlarni tekshirdi va dorini javonlarga joylashtirdi.",
    location: "Samarqand",
    country: "O'zbekiston",
    state: "ok",
    tag: "Sotuv uchun mavjud",
    kind: "pharmacy"
  }
];

export const oatMilkStages: PassportStage[] = [
  {
    date: "01 noy. 2026",
    title: "Xomashyo qabul qilindi",
    detail: "Sertifikatlangan suli donasi yetkazib beruvchidan qabul qilindi.",
    location: "Kostanay",
    country: "Qozog'iston",
    state: "ok",
    tag: "Yakunlandi",
    kind: "raw"
  },
  {
    date: "02 noy. 2026",
    title: "Xalqaro tashish",
    detail: "Yuk bojxona hujjatlari tekshiruvi sabab bir kunga kechikdi.",
    location: "Qozog'iston → O'zbekiston",
    country: "Tranzit",
    state: "warning",
    tag: "Kechikish",
    kind: "transport"
  },
  {
    date: "03 noy. 2026",
    title: "Ombor qabuli",
    detail: "Xomashyo Toshkent omboriga qabul qilindi va saqlashga qo'yildi.",
    location: "Toshkent",
    country: "O'zbekiston",
    state: "ok",
    tag: "Yakunlandi",
    kind: "storage"
  },
  {
    date: "04 noy. 2026",
    title: "Ishlab chiqarish",
    detail: "Suli ichimligi 3-qadoqlash liniyasida ishlab chiqarildi.",
    location: "Toshkent",
    country: "O'zbekiston",
    state: "ok",
    tag: "Yakunlandi",
    kind: "production"
  },
  {
    date: "04 noy. 2026",
    title: "Laboratoriya nazorati",
    detail: "Birlamchi namuna me'yordan chetga chiqdi; takroriy tekshiruvda sifat tasdiqlandi.",
    location: "Toshkent",
    country: "O'zbekiston",
    state: "warning",
    tag: "Qayta tekshiruv",
    kind: "quality"
  },
  {
    date: "04 noy. 2026",
    title: "Qadoqlash va markirovka",
    detail: "Retail birliklar GS1 DataMatrix kodlari bilan markirovkalandi.",
    location: "Toshkent",
    country: "O'zbekiston",
    state: "ok",
    tag: "Yakunlandi",
    kind: "packaging"
  },
  {
    date: "05 noy. 2026",
    title: "Sotuvga ruxsat",
    detail: "Partiya eksport va ichki bozor uchun tasdiqlandi.",
    location: "Toshkent",
    country: "O'zbekiston",
    state: "ok",
    tag: "Sotuvga ruxsat",
    kind: "release"
  },
  {
    date: "08 noy. 2026",
    title: "Saqlash va taqsimlash",
    detail: "Yuk Berlin yo'nalishiga jo'natildi, marshrut zaxira ombor orqali o'tdi.",
    location: "Toshkent → Berlin",
    country: "Tranzit",
    state: "warning",
    tag: "Yo'nalish o'zgardi",
    kind: "distribution"
  },
  {
    date: "18 noy. 2026",
    title: "Do'konga yetkazildi",
    detail: "Mahsulot Berlin savdo nuqtasida javonga joylashtirildi va tasdiqlandi.",
    location: "Berlin",
    country: "Germaniya",
    state: "ok",
    tag: "Sotuvga tayyor",
    kind: "pharmacy"
  }
];

export const jacketStages: PassportStage[] = [
  {
    date: "09 noy. 2026",
    title: "Material qabul qilindi",
    detail: "Matolar sertifikatlangan yetkazib beruvchidan qabul qilindi.",
    location: "Buxoro",
    country: "O'zbekiston",
    state: "ok",
    tag: "Yakunlandi",
    kind: "raw"
  },
  {
    date: "09 noy. 2026",
    title: "Ishlab chiqarish",
    detail: "Kurtkalar Samarqand tikuv sexida tikildi va partiyaga biriktirildi.",
    location: "Samarqand",
    country: "O'zbekiston",
    state: "ok",
    tag: "Yakunlandi",
    kind: "production"
  },
  {
    date: "10 noy. 2026",
    title: "Sifat nazorati",
    detail: "Tikuv sifati va o'lchamlar bo'yicha nazorat o'tkazildi.",
    location: "Samarqand",
    country: "O'zbekiston",
    state: "ok",
    tag: "Yakunlandi",
    kind: "quality"
  },
  {
    date: "10 noy. 2026",
    title: "Qadoqlash va markirovka",
    detail: "Har bir birlikka GS1 Digital Link yorlig'i qo'llanildi.",
    location: "Samarqand",
    country: "O'zbekiston",
    state: "ok",
    tag: "Yakunlandi",
    kind: "packaging"
  },
  {
    date: "13 noy. 2026",
    title: "Do'konga yetkazildi",
    detail: "Buyurtma NS-88421 Berlin do'koniga yetkazildi va qabul qilindi.",
    location: "Berlin",
    country: "Germaniya",
    state: "ok",
    tag: "Sotuvga tayyor",
    kind: "pharmacy"
  }
];

export const handWashStages: PassportStage[] = [
  {
    date: "04 noy. 2026",
    title: "Xomashyo qabuli",
    detail: "Faol komponentlar va qadoqlash materiallari omborga qabul qilindi.",
    location: "Toshkent",
    country: "O'zbekiston",
    state: "ok",
    tag: "Yakunlandi",
    kind: "raw"
  },
  {
    date: "04 noy. 2026",
    title: "Ishlab chiqarish",
    detail: "Suyuq sovun partiyasi aralashtirish liniyasida tayyorlandi.",
    location: "Toshkent",
    country: "O'zbekiston",
    state: "ok",
    tag: "Yakunlandi",
    kind: "production"
  },
  {
    date: "06 noy. 2026",
    title: "Qadoqlash va markirovka",
    detail: "Flakonlar qadoqlandi va noyob seriya kodlari bilan markirovkalandi.",
    location: "Toshkent",
    country: "O'zbekiston",
    state: "ok",
    tag: "Yakunlandi",
    kind: "packaging"
  },
  {
    date: "08 noy. 2026",
    title: "Eksportga jo'natildi",
    detail: "Manifest HSW-2468 mintaqaviy tarqatish markaziga yo'l oldi.",
    location: "Toshkent",
    country: "O'zbekiston",
    state: "ok",
    tag: "Yo'lda",
    kind: "distribution"
  }
];

export const mugStages: PassportStage[] = [
  {
    date: "08 noy. 2026",
    title: "Dizayn tasdiqlandi",
    detail: "Kulolchilik kolleksiyasi uchun dizayn va o'lchamlar tasdiqlandi.",
    location: "Toshkent",
    country: "O'zbekiston",
    state: "ok",
    tag: "Yakunlandi",
    kind: "production"
  },
  {
    date: "08 noy. 2026",
    title: "Namuna ishlab chiqarildi",
    detail: "Birinchi namuna partiyasi tayyorlandi va sifat nazoratidan o'tdi.",
    location: "Toshkent",
    country: "O'zbekiston",
    state: "ok",
    tag: "Yakunlandi",
    kind: "quality"
  },
  {
    date: "10 noy. 2026",
    title: "Identifikator kutilmoqda",
    detail: "GTIN tasdiqlanishi va sotuvga chiqarish ruxsati kutilmoqda.",
    location: "SignalCode ish maydoni",
    country: "O'zbekiston",
    state: "warning",
    tag: "Tasdiqlash kutilmoqda",
    kind: "release"
  }
];

export const fieldNotesStages: PassportStage[] = [
  {
    date: "08 noy. 2026",
    title: "Nashr tayyorlandi",
    detail: "Field Notes No. 04 nashri chop etishga topshirildi.",
    location: "Toshkent",
    country: "O'zbekiston",
    state: "ok",
    tag: "Yakunlandi",
    kind: "production"
  },
  {
    date: "08 noy. 2026",
    title: "Chop etish va jamlash",
    detail: "Daftarlar chop etildi, jamlandi va termoplyonkaga o'raldi.",
    location: "Toshkent",
    country: "O'zbekiston",
    state: "ok",
    tag: "Yakunlandi",
    kind: "packaging"
  },
  {
    date: "18 noy. 2026",
    title: "Arxivga o'tkazildi",
    detail: "Nashr tugadi va yozuv keyingi tekshiruvlar uchun arxivlandi.",
    location: "Northstar katalogi",
    country: "O'zbekiston",
    state: "ok",
    tag: "Arxivlandi",
    kind: "storage"
  }
];

