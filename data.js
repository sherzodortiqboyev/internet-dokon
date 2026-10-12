// =====================================================================
//  MENYU MA'LUMOTLARI
//  Taom qo'shish, narxni o'zgartirish yoki o'chirish uchun faqat shu
//  faylni tahrirlang. Keyinchalik bu ma'lumotlar Django bazasidan keladi.
//
//  Maydonlar:
//    id      — takrorlanmas raqam
//    cat     — kategoriya kaliti (pastdagi CATEGORIES ro'yxatidan)
//    price   — narx (so'm)
//    weight  — porsiya hajmi
//    time    — tayyorlanish vaqti (daqiqa)
//    rating  — reyting (1–5)
//    badge   — "hit" | "new" | "sale" | null
//    oldPrice— chegirmadan oldingi narx (faqat "sale" uchun)
//    tags    — "spicy" (achchiq), "veg" (vegetarian)
//    img     — rasm manzili. O'z rasmingizni "images" papkasiga qo'yib,
//              masalan "images/osh.jpg" deb yozsangiz bo'ladi.
//    emoji   — rasm yuklanmasa ko'rinadigan belgi
//    sizes   — porsiya o'lchamlari: add = qo'shimcha narx
//    extras  — qo'shimchalar
// =====================================================================

const IMG = (id) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=800&q=70`;

const CATEGORIES = [
  { key: "milliy",  name: "Milliy taomlar", icon: "🍲" },
  { key: "kabob",   name: "Kaboblar",       icon: "🍢" },
  { key: "fastfood",name: "Fast food",      icon: "🍔" },
  { key: "salat",   name: "Salatlar",       icon: "🥗" },
  { key: "shirin",  name: "Shirinliklar",   icon: "🍰" },
  { key: "ichimlik",name: "Ichimliklar",    icon: "🥤" },
];

const FOODS = [
  // ---------- Milliy taomlar ----------
  {
    id: 1, cat: "milliy", name: "To'y oshi", price: 48000, weight: "450 g", time: 15, rating: 4.9, badge: "hit",
    img: IMG("1603133872878-684f208fb84b"), emoji: "🍛",
    desc: "Devzira guruch, mol go'shti, sariq sabzi va no'xat. Qozonda o'tinda damlangan.",
    sizes: [{ name: "Oddiy", add: 0 }, { name: "Katta", add: 14000 }],
    extras: [{ name: "Qazi", price: 12000 }, { name: "Bedana tuxumi (3 dona)", price: 6000 }, { name: "Achchiq-chuchuk", price: 8000 }],
  },
  {
    id: 2, cat: "milliy", name: "Lag'mon", price: 38000, weight: "400 g", time: 20, rating: 4.8, badge: null, tags: ["spicy"],
    img: IMG("1569718212165-3a8278d5f624"), emoji: "🍜",
    desc: "Qo'lda cho'zilgan xamir, mol go'shti, bulg'or qalampiri va maxsus qayla.",
    sizes: [{ name: "Oddiy", add: 0 }, { name: "Katta", add: 10000 }],
    extras: [{ name: "Qo'shimcha go'sht", price: 12000 }, { name: "Tuxum", price: 4000 }],
  },
  {
    id: 3, cat: "milliy", name: "Manti", price: 36000, weight: "5 dona", time: 25, rating: 4.7, badge: null,
    img: IMG("1496116218417-1a781b1c416c"), emoji: "🥟",
    desc: "Qo'y go'shti, piyoz va dumba yog'i bilan bug'da pishirilgan.",
    sizes: [{ name: "5 dona", add: 0 }, { name: "8 dona", add: 20000 }],
    extras: [{ name: "Qaymoq", price: 5000 }, { name: "Achchiq sous", price: 3000 }],
  },
  {
    id: 4, cat: "milliy", name: "Tandir somsa", price: 13000, weight: "1 dona", time: 10, rating: 4.9, badge: "hit",
    img: IMG("1601050690597-df0568f70950"), emoji: "🥐",
    desc: "Qatlama xamir, maydalangan go'sht. Tandirdan issiq holda.",
    extras: [{ name: "Qatiq", price: 5000 }],
  },
  {
    id: 5, cat: "milliy", name: "Sho'rva", price: 32000, weight: "500 ml", time: 15, rating: 4.6, badge: null,
    img: IMG("1547592166-23ac45744acd"), emoji: "🍲",
    desc: "Qo'y go'shti, kartoshka va sabzavotlar bilan uzoq qaynatilgan.",
  },

  // ---------- Kaboblar ----------
  {
    id: 6, cat: "kabob", name: "Mol go'shti shashlik", price: 19000, weight: "1 six", time: 20, rating: 4.8, badge: null,
    img: IMG("1555939594-58d7cb561ad1"), emoji: "🍢",
    desc: "Marinadlangan mol go'shti, ko'mirda pishirilgan. Piyoz va non bilan.",
    sizes: [{ name: "1 six", add: 0 }, { name: "3 six", add: 36000 }, { name: "5 six", add: 72000 }],
  },
  {
    id: 7, cat: "kabob", name: "Kabob assorti", price: 89000, weight: "650 g", time: 30, rating: 4.9, badge: "new",
    img: IMG("1529692236671-f1f6cf9683ba"), emoji: "🥩",
    desc: "Go'shtli, jigar va tovuq kabob, grillangan sabzavot va lavash. 2 kishiga.",
  },
  {
    id: 8, cat: "kabob", name: "Tovuq qanotlari", price: 42000, weight: "8 dona", time: 20, rating: 4.6, badge: "sale", oldPrice: 52000, tags: ["spicy"],
    img: IMG("1626082927389-6cd097cdc6ec"), emoji: "🍗",
    desc: "Qarsildoq qanotchalar, achchiq BBQ sousida.",
  },

  // ---------- Fast food ----------
  {
    id: 9, cat: "fastfood", name: "Infinity burger", price: 39000, weight: "320 g", time: 15, rating: 4.8, badge: "hit",
    img: IMG("1568901346375-23c9450c58cd"), emoji: "🍔",
    desc: "Ikki qavat mol go'shti kotleti, cheddar, karamellangan piyoz va firma sousi.",
    extras: [{ name: "Qo'shimcha kotlet", price: 15000 }, { name: "Bekon", price: 9000 }, { name: "Halopenyo", price: 4000 }],
  },
  {
    id: 10, cat: "fastfood", name: "Pepperoni pitsa", price: 72000, weight: "30 sm", time: 25, rating: 4.7, badge: null, tags: ["spicy"],
    img: IMG("1628840042765-356cda07504e"), emoji: "🍕",
    desc: "Pepperoni, mozzarella va pomidor sousi. Yupqa xamir.",
    sizes: [{ name: "25 sm", add: -14000 }, { name: "30 sm", add: 0 }, { name: "35 sm", add: 18000 }],
    extras: [{ name: "Qo'shimcha pishloq", price: 10000 }],
  },
  {
    id: 11, cat: "fastfood", name: "Margarita", price: 58000, weight: "30 sm", time: 25, rating: 4.5, badge: null, tags: ["veg"],
    img: IMG("1513104890138-7c749659a591"), emoji: "🍕",
    desc: "Mozzarella, pomidor va rayhon. Klassik italyancha.",
    sizes: [{ name: "25 sm", add: -12000 }, { name: "30 sm", add: 0 }, { name: "35 sm", add: 16000 }],
  },
  {
    id: 12, cat: "fastfood", name: "Kartoshka fri", price: 16000, weight: "150 g", time: 10, rating: 4.6, badge: null, tags: ["veg"],
    img: IMG("1573080496219-bb080dd4f877"), emoji: "🍟",
    desc: "Qarsildoq kartoshka, dengiz tuzi bilan.",
    sizes: [{ name: "O'rta", add: 0 }, { name: "Katta", add: 6000 }],
    extras: [{ name: "Pishloqli sous", price: 5000 }, { name: "Ketchup", price: 2000 }],
  },

  // ---------- Salatlar ----------
  {
    id: 13, cat: "salat", name: "Achchiq-chuchuk", price: 18000, weight: "250 g", time: 5, rating: 4.7, badge: null, tags: ["veg"],
    img: IMG("1540420773420-3366772f4999"), emoji: "🥗",
    desc: "Pomidor, piyoz va achchiq qalampir. Osh bilan ajoyib juftlik.",
  },
  {
    id: 14, cat: "salat", name: "Sezar tovuq bilan", price: 34000, weight: "280 g", time: 10, rating: 4.6, badge: "new",
    img: IMG("1512621776951-a57141f2eefd"), emoji: "🥗",
    desc: "Grillangan tovuq, salat bargi, parmezan, kruton va sezar sousi.",
  },

  // ---------- Shirinliklar ----------
  {
    id: 15, cat: "shirin", name: "Shokoladli tort", price: 26000, weight: "1 bo'lak", time: 5, rating: 4.9, badge: null,
    img: IMG("1578985545062-69928b1d9587"), emoji: "🍰",
    desc: "Uch qavat shokolad biskvit va ganash.",
  },
  {
    id: 16, cat: "shirin", name: "Chizkeyk", price: 29000, weight: "1 bo'lak", time: 5, rating: 4.8, badge: "sale", oldPrice: 35000,
    img: IMG("1533134242443-d4fd215305ad"), emoji: "🍰",
    desc: "Nyu-York uslubidagi chizkeyk, rezavor sousi bilan.",
  },

  // ---------- Ichimliklar ----------
  {
    id: 17, cat: "ichimlik", name: "Ko'k choy", price: 9000, weight: "choynak", time: 5, rating: 4.9, badge: null, tags: ["veg"],
    img: IMG("1544787219-7f47ccb76574"), emoji: "🍵",
    desc: "Choynakda damlangan ko'k choy. Limon so'rasangiz bepul.",
    extras: [{ name: "Navvot", price: 3000 }],
  },
  {
    id: 18, cat: "ichimlik", name: "Uy limonadi", price: 18000, weight: "500 ml", time: 5, rating: 4.7, badge: "new", tags: ["veg"],
    img: IMG("1556679343-c7306c1976bc"), emoji: "🍋",
    desc: "Yangi siqilgan limon, yalpiz va muz.",
    sizes: [{ name: "500 ml", add: 0 }, { name: "1 l", add: 12000 }],
  },
  {
    id: 19, cat: "ichimlik", name: "Kapuchino", price: 22000, weight: "300 ml", time: 5, rating: 4.6, badge: null, tags: ["veg"],
    img: IMG("1509042239860-f550ce710b93"), emoji: "☕",
    desc: "Ikki shot espresso va ko'pirtirilgan sut.",
  },
];

// Promokodlar: kod -> chegirma foizi
const PROMOCODES = { INFINITY10: 10, OSH20: 20 };

// Yetkazib berish sozlamalari
const DELIVERY = { fee: 12000, freeFrom: 150000, minOrder: 30000 };
