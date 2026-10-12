// =====================================================================
//  INFINITY — saytning "miyasi"
//  Bo'limlar:
//   1. Yordamchilar         6. Taom oynasi
//   2. Holat (state)        7. Savatcha
//   3. Laganchа (hero)      8. Buyurtma berish (checkout)
//   4. Menyu                9. Kuzatuv va buyurtmalar tarixi
//   5. Oynalarni boshqarish 10. Ishga tushirish
// =====================================================================

/* ============ 1. YORDAMCHILAR ============ */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const byId = (id) => FOODS.find((f) => f.id === Number(id));
const fmt = (n) => Math.round(n).toLocaleString("ru-RU").replace(/ /g, " ") + " so'm";
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const store = {
  get(key, fallback) { try { const v = localStorage.getItem("inf_" + key); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; } },
  set(key, value) { try { localStorage.setItem("inf_" + key, JSON.stringify(value)); } catch (e) {} },
};

// Rasm; yuklanmasa emoji ko'rsatiladi
function pic(food, eager = false) {
  return `<img src="${food.img}" alt="${esc(food.name)}" ${eager ? "" : 'loading="lazy"'} onerror="this.outerHTML='<div class=&quot;fallback&quot;>${food.emoji}</div>'">`;
}

let toastTimer;
function toast(text) {
  const t = $("#toast");
  t.textContent = text;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2600);
}

const OPEN_HOUR = 10, CLOSE_HOUR = 23;
const isOpenNow = () => { const h = new Date().getHours(); return h >= OPEN_HOUR && h < CLOSE_HOUR; };
const hhmm = (d) => d.toTimeString().slice(0, 5);

/* ============ 2. HOLAT (state) ============ */
const state = {
  cart: store.get("cart", []),          // [{ key, id, size, extras:[], note, qty }]
  favs: new Set(store.get("favs", [])),
  promo: store.get("promo", null),
  orders: store.get("orders", []),
  profile: store.get("profile", {}),    // ism, telefon, manzil — keyingi safar o'zi to'ladi
  q: "",
  filters: new Set(),
  sort: "pop",
};
const saveCart = () => { store.set("cart", state.cart); store.set("promo", state.promo); };

/* ============ 3. LAGANCHA (hero) ============ */
function drawOrnament() {
  const svg = $("#ornament");
  const C = 200;
  const pol = (r, a) => [C + r * Math.cos(a), C + r * Math.sin(a)];
  let s = `<circle cx="200" cy="200" r="198" fill="#2440A8"/>`;
  // chekka nuqtalar
  for (let i = 0; i < 40; i++) { const [x, y] = pol(186, (i / 40) * Math.PI * 2); s += `<circle cx="${x}" cy="${y}" r="4.5" fill="#F7F9FD"/>`; }
  s += `<circle cx="200" cy="200" r="174" fill="#1B3184"/>`;
  // bodomsimon gul barglari
  const N = 16;
  for (let i = 0; i < N; i++) {
    const a = (i / N) * 360;
    s += `<g transform="rotate(${a} 200 200)">
      <path d="M200 30 C222 62 222 92 200 118 C178 92 178 62 200 30Z" fill="#12968F"/>
      <path d="M200 50 C211 70 211 88 200 104 C189 88 189 70 200 50Z" fill="#F7F9FD"/>
      <circle cx="200" cy="77" r="4" fill="#2440A8"/>
    </g>`;
    s += `<g transform="rotate(${a + 180 / N} 200 200)"><path d="M200 56 l7 10 -7 10 -7 -10Z" fill="#F2B33D"/></g>`;
  }
  s += `<circle cx="200" cy="200" r="130" fill="#F7F9FD"/><circle cx="200" cy="200" r="130" stroke="#2440A8" stroke-width="3" stroke-dasharray="2 7" fill="none"/>`;
  svg.innerHTML = s;
}

function setupPlate() {
  drawOrnament();
  const featured = [1, 9, 7].map(byId);
  const picker = $("#platePicker");
  picker.innerHTML = featured.map((f, i) =>
    `<button role="tab" aria-selected="${i === 0}" data-id="${f.id}"><img src="${f.img}" alt="" onerror="this.remove()">${esc(f.name)}</button>`).join("");
  const img = $("#plateImg");
  const emoji = $("#plateEmoji");
  const show = (f, animate = true) => {
    img.classList.remove("broken");
    img.src = f.img; img.alt = f.name; img.dataset.id = f.id;
    emoji.textContent = f.emoji;
    if (animate) { img.classList.remove("swap"); void img.offsetWidth; img.classList.add("swap"); }
  };
  img.onerror = () => img.classList.add("broken");   // rasm yuklanmasa emoji ko'rinadi
  show(featured[0], false);
  picker.addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    $$("button", picker).forEach((x) => x.setAttribute("aria-selected", x === b));
    show(byId(b.dataset.id));
  });
  img.style.cursor = "pointer";
  img.addEventListener("click", () => openDish(img.dataset.id));
}

function setupStatus() {
  const el = $("#openStatus");
  if (!isOpenNow()) {
    el.textContent = `Hozir yopiq. ${OPEN_HOUR}:00 dan qabul qilamiz, oldindan buyurtma bering`;
    el.parentElement.classList.add("closed");
  }
}

/* ============ 4. MENYU ============ */
function qtyInCart(id) { return state.cart.filter((l) => l.id === id).reduce((s, l) => s + l.qty, 0); }

function cardHTML(f) {
  const q = qtyInCart(f.id);
  const tag = f.badge ? `<span class="tag tag--${f.badge}">${{ hit: "Xit", new: "Yangi", sale: "−" + Math.round((1 - f.price / f.oldPrice) * 100) + "%" }[f.badge]}</span>` : "";
  const fav = state.favs.has(f.id);
  const extra = (f.tags || []).includes("spicy") ? "<span>🌶</span>" : (f.tags || []).includes("veg") ? "<span>🌿</span>" : "";
  return `
  <article class="card" data-id="${f.id}" tabindex="0" aria-label="${esc(f.name)}, ${fmt(f.price)}">
    <div class="card__media">
      ${pic(f)}
      ${tag}
      <button class="fav" data-fav="${f.id}" aria-pressed="${fav}" aria-label="Sevimlilarga qo'shish">
        <svg viewBox="0 0 24 24"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z"/></svg>
      </button>
    </div>
    <div class="card__body">
      <h3 class="card__title">${esc(f.name)}</h3>
      <div class="card__meta"><span class="star">★ ${f.rating.toFixed(1).replace(".", ",")}</span><span>${esc(f.weight)}</span><span>${f.time} daq</span>${extra}</div>
      <p class="card__desc">${esc(f.desc)}</p>
      <div class="card__foot">
        <span class="price ${f.oldPrice ? "price--sale" : ""}">${f.oldPrice ? `<s>${fmt(f.oldPrice)}</s>` : ""}${fmt(f.price)}</span>
        ${q ? `<div class="mini-stepper"><button data-dec="${f.id}" aria-label="Kamaytirish">−</button><output>${q}</output><button data-inc="${f.id}" aria-label="Ko'paytirish">+</button></div>`
            : `<button class="add" data-add="${f.id}">+ Qo'shish</button>`}
      </div>
    </div>
  </article>`;
}

function filteredFoods() {
  const q = state.q.trim().toLowerCase().replace(/[‘’ʻʼ`]/g, "'");
  let list = FOODS.filter((f) => {
    if (q && !(f.name + " " + f.desc).toLowerCase().replace(/[‘’ʻʼ`]/g, "'").includes(q)) return false;
    if (state.filters.has("fav") && !state.favs.has(f.id)) return false;
    if (state.filters.has("spicy") && !(f.tags || []).includes("spicy")) return false;
    if (state.filters.has("veg") && !(f.tags || []).includes("veg")) return false;
    return true;
  });
  const sorters = {
    pop: (a, b) => b.rating - a.rating,
    cheap: (a, b) => a.price - b.price,
    exp: (a, b) => b.price - a.price,
    fast: (a, b) => a.time - b.time,
  };
  return list.sort(sorters[state.sort]);
}

function renderCats() {
  $("#cats").innerHTML = CATEGORIES.map((c) => `<a class="cat" href="#cat-${c.key}" data-cat="${c.key}">${c.icon} ${c.name}</a>`).join("");
}

function renderMenu() {
  const list = filteredFoods();
  const html = CATEGORIES.map((c) => {
    const items = list.filter((f) => f.cat === c.key);
    if (!items.length) return "";
    return `<section class="menu-section" id="cat-${c.key}" data-cat="${c.key}">
      <div class="menu-section__head"><h2 class="h2">${c.name}</h2><span>${items.length} ta</span></div>
      <div class="grid">${items.map(cardHTML).join("")}</div>
    </section>`;
  }).join("");
  $("#menuSections").innerHTML = html;
  $("#menuEmpty").hidden = list.length > 0;
  $$(".cat").forEach((a) => (a.hidden = !document.getElementById("cat-" + a.dataset.cat)));
  observeSections();
}

// Faqat bitta kartochkani yangilash (butun menyuni qayta chizmaslik uchun)
function refreshCard(id) {
  const old = $(`.card[data-id="${id}"]`);
  if (!old) return;
  const tmp = document.createElement("div");
  tmp.innerHTML = cardHTML(byId(id)).trim();
  old.replaceWith(tmp.firstChild);
}

// Qaysi kategoriya ekranda ekanini kuzatish (scrollspy)
let spy;
function observeSections() {
  spy?.disconnect();
  spy = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      $$(".cat").forEach((a) => a.classList.toggle("active", a.dataset.cat === en.target.dataset.cat));
      const act = $(".cat.active");
      const bar = $("#cats");
      if (act) bar.scrollTo({ left: act.getBoundingClientRect().left - bar.getBoundingClientRect().left + bar.scrollLeft - 8, behavior: "smooth" });
    });
  }, { rootMargin: "-160px 0px -60% 0px" });
  $$(".menu-section").forEach((s) => spy.observe(s));
}

function setupMenu() {
  renderCats();
  renderMenu();

  let t;
  $("#search").addEventListener("input", (e) => {
    clearTimeout(t);
    t = setTimeout(() => {
      state.q = e.target.value;
      renderMenu();
      if (state.q) document.getElementById("menu").scrollIntoView({ behavior: "smooth" });
    }, 180);
  });

  $("#chips").addEventListener("click", (e) => {
    const c = e.target.closest(".chip"); if (!c) return;
    const f = c.dataset.filter;
    state.filters.has(f) ? state.filters.delete(f) : state.filters.add(f);
    c.setAttribute("aria-pressed", state.filters.has(f));
    renderMenu();
  });
  $$(".chip").forEach((c) => c.setAttribute("aria-pressed", "false"));

  $("#sort").addEventListener("change", (e) => { state.sort = e.target.value; renderMenu(); });

  $("#resetFilters").addEventListener("click", () => {
    state.q = ""; state.filters.clear(); $("#search").value = "";
    $$(".chip").forEach((c) => c.setAttribute("aria-pressed", "false"));
    renderMenu();
  });

  // Kartochkalardagi barcha bosishlar bitta joyda
  $("#menuSections").addEventListener("click", (e) => {
    const t = e.target;
    const fav = t.closest("[data-fav]");
    if (fav) return toggleFav(Number(fav.dataset.fav), fav);
    const add = t.closest("[data-add]");
    if (add) return quickAdd(Number(add.dataset.add), add.closest(".card"));
    const inc = t.closest("[data-inc]");
    if (inc) return quickAdd(Number(inc.dataset.inc));
    const dec = t.closest("[data-dec]");
    if (dec) return quickRemove(Number(dec.dataset.dec));
    const card = t.closest(".card");
    if (card) openDish(card.dataset.id);
  });
  $("#menuSections").addEventListener("keydown", (e) => {
    if (e.key === "Enter" && e.target.classList.contains("card")) openDish(e.target.dataset.id);
  });
}

function toggleFav(id, btn) {
  state.favs.has(id) ? state.favs.delete(id) : state.favs.add(id);
  store.set("favs", [...state.favs]);
  const on = state.favs.has(id);
  btn.setAttribute("aria-pressed", on);
  btn.classList.remove("pop"); void btn.offsetWidth; btn.classList.add("pop");
  toast(on ? "♥ Sevimlilarga qo'shildi" : "Sevimlilardan olib tashlandi");
  if (state.filters.has("fav")) renderMenu();
}

/* ============ 5. OYNALARNI BOSHQARISH ============ */
const stack = [];
let lastFocus = null;
function openLayer(el) {
  if (!stack.length) lastFocus = document.activeElement;
  el.hidden = false;
  stack.push(el);
  $("#scrim").classList.add("show");
  document.body.classList.add("locked");
  setTimeout(() => el.querySelector("input:not([type=radio]):not([type=checkbox]), button:not(.sheet__close)")?.focus({ preventScroll: true }), 50);
}
function closeLayer(el = stack[stack.length - 1]) {
  if (!el) return;
  el.hidden = true;
  stack.splice(stack.indexOf(el), 1);
  if (!stack.length) {
    $("#scrim").classList.remove("show");
    document.body.classList.remove("locked");
    lastFocus?.focus?.({ preventScroll: true });
  }
}
function closeAll() { while (stack.length) closeLayer(); }

/* ============ 6. TAOM OYNASI ============ */
let dishState = null;

function openDish(id) {
  const f = byId(id); if (!f) return;
  dishState = { id: f.id, size: f.sizes ? 0 : null, extras: new Set(), qty: 1 };
  if (f.sizes) { const i = f.sizes.findIndex((s) => s.add === 0); dishState.size = i < 0 ? 0 : i; }

  $("#dishMedia").innerHTML = pic(f, true);
  $("#dishName").textContent = f.name;
  $("#dishMeta").innerHTML = `<span>★ ${f.rating.toFixed(1).replace(".", ",")}</span><span>${esc(f.weight)}</span><span>⏱ ${f.time} daqiqa</span>${(f.tags || []).includes("spicy") ? "<span>🌶 Achchiq</span>" : ""}${(f.tags || []).includes("veg") ? "<span>🌿 Vegetarian</span>" : ""}`;
  $("#dishDesc").textContent = f.desc;
  $("#dishNote").value = "";

  $("#dishSizes").innerHTML = f.sizes ? `<p class="opt-title">Porsiya</p><div class="sizes" role="radiogroup">${f.sizes.map((s, i) =>
    `<label><input type="radio" name="size" value="${i}" ${i === dishState.size ? "checked" : ""}><span>${esc(s.name)}</span></label>`).join("")}</div>` : "";
  $("#dishExtras").innerHTML = f.extras ? `<p class="opt-title">Qo'shimchalar</p><div class="extras">${f.extras.map((x, i) =>
    `<label><input type="checkbox" value="${i}">${esc(x.name)}<em>+${fmt(x.price)}</em></label>`).join("")}</div>` : "";

  updateDishPrice();
  openLayer($("#dishSheet"));
}

function unitPrice(line) {
  const f = byId(line.id);
  let p = f.price;
  if (f.sizes && line.size != null) p += f.sizes[line.size].add;
  (line.extras || []).forEach((i) => (p += f.extras[i].price));
  return p;
}

function updateDishPrice() {
  const total = unitPrice({ id: dishState.id, size: dishState.size, extras: [...dishState.extras] }) * dishState.qty;
  $("#dishQty").textContent = dishState.qty;
  $("#dishAdd").innerHTML = `Savatchaga qo'shish <span class="btn__price">${fmt(total)}</span>`;
}

function setupDish() {
  $("#dishSizes").addEventListener("change", (e) => { dishState.size = Number(e.target.value); updateDishPrice(); });
  $("#dishExtras").addEventListener("change", (e) => {
    const i = Number(e.target.value);
    e.target.checked ? dishState.extras.add(i) : dishState.extras.delete(i);
    updateDishPrice();
  });
  $("#dishPlus").addEventListener("click", () => { dishState.qty = Math.min(50, dishState.qty + 1); updateDishPrice(); });
  $("#dishMinus").addEventListener("click", () => { dishState.qty = Math.max(1, dishState.qty - 1); updateDishPrice(); });
  $("#dishAdd").addEventListener("click", () => {
    const from = flySource($("#dishMedia img"));
    addLine({ id: dishState.id, size: dishState.size, extras: [...dishState.extras].sort(), note: $("#dishNote").value.trim(), qty: dishState.qty });
    flyToCart(from);
    closeLayer($("#dishSheet"));
  });
}

/* ============ 7. SAVATCHA ============ */
const lineKey = (l) => [l.id, l.size ?? "", (l.extras || []).join("."), l.note || ""].join("|");

function addLine(line, silent = false) {
  line.key = lineKey(line);
  const ex = state.cart.find((l) => l.key === line.key);
  ex ? (ex.qty += line.qty) : state.cart.push(line);
  saveCart();
  afterCartChange(line.id);
  if (!silent) toast(`${byId(line.id).name} savatchaga qo'shildi`);
}

function quickAdd(id, card) {
  const f = byId(id);
  const size = f.sizes ? Math.max(0, f.sizes.findIndex((s) => s.add === 0)) : null;
  const had = qtyInCart(id);
  const from = card ? flySource($(".card__media img", card)) : null;
  addLine({ id, size, extras: [], note: "", qty: 1 }, had > 0);
  flyToCart(from);
}

function quickRemove(id) {
  const lines = state.cart.filter((l) => l.id === id);
  const last = lines[lines.length - 1];
  if (!last) return;
  last.qty--;
  if (last.qty <= 0) state.cart.splice(state.cart.indexOf(last), 1);
  saveCart();
  afterCartChange(id);
}

function afterCartChange(id) {
  if (id) refreshCard(id);
  renderCartBadge();
  if (!$("#cartDrawer").hidden) renderCart();
}

function totals(mode = "delivery") {
  const subtotal = state.cart.reduce((s, l) => s + unitPrice(l) * l.qty, 0);
  let discount = 0;
  if (state.promo === "INFINITY10") discount = subtotal * 0.10;
  if (state.promo === "OSH20") discount = state.cart.filter((l) => l.id === 1).reduce((s, l) => s + unitPrice(l) * l.qty, 0) * 0.20;
  discount = Math.round(discount / 100) * 100;
  const delivery = mode === "pickup" || subtotal === 0 || subtotal >= DELIVERY.freeFrom ? 0 : DELIVERY.fee;
  const count = state.cart.reduce((s, l) => s + l.qty, 0);
  return { subtotal, discount, delivery, total: subtotal - discount + delivery, count };
}

function renderCartBadge() {
  const t = totals();
  const badge = $("#cartCount");
  badge.textContent = t.count;
  badge.classList.remove("bump"); void badge.offsetWidth; badge.classList.add("bump");
  $("#cartBtnSum").textContent = t.count ? fmt(t.subtotal) : "Savatcha";
  $("#mbar").hidden = t.count === 0;
  $("#mbarCount").textContent = t.count;
  $("#mbarSum").textContent = fmt(t.subtotal - t.discount);
}

function optionText(l) {
  const f = byId(l.id);
  const parts = [];
  if (f.sizes && l.size != null) parts.push(f.sizes[l.size].name);
  (l.extras || []).forEach((i) => parts.push("+ " + f.extras[i].name));
  if (l.note) parts.push(`«${l.note}»`);
  return parts.join(", ");
}

function renderCart() {
  const body = $("#cartBody"), foot = $("#cartFoot");
  $("#clearCart").hidden = !state.cart.length;
  if (!state.cart.length) {
    body.innerHTML = `<div class="cart-empty">
      <div class="cart-empty__plate">🍽️</div>
      <h3>Savatcha bo'sh</h3>
      <p>Menyudan taom tanlang, u shu yerda paydo bo'ladi.</p>
      <button class="btn btn--primary" data-goto-menu>Menyuni ochish</button>
    </div>`;
    foot.innerHTML = "";
    foot.hidden = true;
    return;
  }
  foot.hidden = false;
  const t = totals();
  const left = DELIVERY.freeFrom - t.subtotal;
  const pct = Math.min(100, (t.subtotal / DELIVERY.freeFrom) * 100);

  const inCart = new Set(state.cart.map((l) => l.id));
  const ups = FOODS.filter((f) => ["salat", "ichimlik", "shirin"].includes(f.cat) && !inCart.has(f.id)).slice(0, 6);

  body.innerHTML = `
    <div class="free">
      <p>${left > 0 ? `Bepul yetkazishgacha yana <b>${fmt(left)}</b>` : `<b>Yetkazib berish bepul</b> 🎉`}</p>
      <div class="bar"><i style="width:${pct}%"></i></div>
    </div>
    ${state.cart.map((l) => {
      const f = byId(l.id);
      return `<div class="line">
        <div class="line__img">${pic(f)}</div>
        <div>
          <h4>${esc(f.name)}</h4>
          ${optionText(l) ? `<small>${esc(optionText(l))}</small>` : ""}
          <div class="line__price">${fmt(unitPrice(l) * l.qty)}</div>
        </div>
        <div class="stepper">
          <button data-line-dec="${esc(l.key)}" aria-label="Kamaytirish">${l.qty === 1 ? "🗑" : "−"}</button>
          <output>${l.qty}</output>
          <button data-line-inc="${esc(l.key)}" aria-label="Ko'paytirish">+</button>
        </div>
      </div>`;
    }).join("")}
    ${ups.length ? `<div class="upsell"><h3>Buni ham qo'shasizmi?</h3><div class="upsell__row">
      ${ups.map((f) => `<button class="upsell__item" data-upsell="${f.id}"><div class="line__img">${pic(f)}</div><b>${esc(f.name)}</b><span>+ ${fmt(f.price)}</span></button>`).join("")}
    </div></div>` : ""}`;

  foot.innerHTML = `
    ${state.promo
      ? `<div class="promo-ok"><span>✓ ${state.promo} promokodi qo'llandi</span><button class="link-btn" id="removePromo">Bekor qilish</button></div>`
      : `<form class="promo-form" id="promoForm"><input id="promoInput" placeholder="Promokod" aria-label="Promokod" autocomplete="off"><button class="btn btn--ghost">Qo'llash</button></form>`}
    <div class="totals">
      <div><span>Taomlar (${t.count})</span><span>${fmt(t.subtotal)}</span></div>
      ${t.discount ? `<div><span>Chegirma</span><span>− ${fmt(t.discount)}</span></div>` : ""}
      <div><span>Yetkazib berish</span><span>${t.delivery ? fmt(t.delivery) : "Bepul"}</span></div>
      <div class="grand"><span>Jami</span><span>${fmt(t.total)}</span></div>
    </div>
    ${t.subtotal < DELIVERY.minOrder ? `<p class="min-note">Eng kam buyurtma — ${fmt(DELIVERY.minOrder)}</p>` : ""}
    <button class="btn btn--primary btn--lg" id="toCheckout" ${t.subtotal < DELIVERY.minOrder ? "disabled" : ""}>Rasmiylashtirish</button>`;
}

function applyPromo(code) {
  code = code.trim().toUpperCase();
  if (!code) return;
  if (!(code in PROMOCODES)) return toast("Bunday promokod yo'q. Harflarni tekshiring");
  if (code === "INFINITY10" && state.orders.length) return toast("INFINITY10 faqat birinchi buyurtma uchun");
  if (code === "OSH20" && new Date().getDay() !== 5) return toast("OSH20 faqat juma kuni ishlaydi");
  if (code === "OSH20" && !state.cart.some((l) => l.id === 1)) toast("OSH20 savatchadagi oshga qo'llanadi. Osh qo'shing");
  else toast(`✓ ${code} promokodi qo'llandi`);
  state.promo = code;
  saveCart();
  renderCart(); renderCartBadge();
}

function setupCart() {
  const open = () => { renderCart(); openLayer($("#cartDrawer")); };
  $("#cartBtn").addEventListener("click", open);
  $("#mbar").addEventListener("click", open);

  $("#cartDrawer").addEventListener("click", (e) => {
    const t = e.target;
    const inc = t.closest("[data-line-inc]"), dec = t.closest("[data-line-dec]");
    if (inc || dec) {
      const line = state.cart.find((l) => l.key === (inc || dec).dataset[inc ? "lineInc" : "lineDec"]);
      if (!line) return;
      line.qty += inc ? 1 : -1;
      if (line.qty <= 0) state.cart.splice(state.cart.indexOf(line), 1);
      saveCart(); afterCartChange(line.id);
      return;
    }
    const up = t.closest("[data-upsell]");
    if (up) return quickAdd(Number(up.dataset.upsell));
    if (t.closest("[data-goto-menu]")) { closeAll(); document.getElementById("menu").scrollIntoView({ behavior: "smooth" }); return; }
    if (t.id === "removePromo") { state.promo = null; saveCart(); renderCart(); renderCartBadge(); return; }
    if (t.id === "toCheckout") openCheckout();
  });
  $("#cartDrawer").addEventListener("submit", (e) => {
    if (e.target.id !== "promoForm") return;
    e.preventDefault();
    applyPromo($("#promoInput").value);
  });

  let armed = false;
  $("#clearCart").addEventListener("click", (e) => {
    // Tasodifan bosilmasligi uchun ikki marta bosish kerak
    if (!armed) { armed = true; e.target.textContent = "Rostdanmi?"; setTimeout(() => { armed = false; e.target.textContent = "Tozalash"; }, 2500); return; }
    const ids = state.cart.map((l) => l.id);
    state.cart = []; state.promo = null; saveCart();
    ids.forEach(refreshCard); renderCartBadge(); renderCart();
    armed = false; e.target.textContent = "Tozalash";
  });

  // Aksiya kartochkasidagi promokodni bosish — darhol qo'llanadi
  $$("[data-copy]").forEach((b) => b.addEventListener("click", () => {
    try { navigator.clipboard?.writeText(b.dataset.copy); } catch (e) {}
    if (state.cart.length) applyPromo(b.dataset.copy);
    else toast(`${b.dataset.copy} nusxalandi. Taom qo'shib, savatchada qo'llang`);
  }));
}

// Taom rasmi savatcha tomon "uchib" boradi
const flySource = (img) => (img ? { rect: img.getBoundingClientRect(), src: img.currentSrc || img.src } : null);
function flyToCart(from) {
  if (!from || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const target = matchMedia("(max-width: 640px)").matches ? $("#mbar") : $("#cartBtn");
  const a = from.rect, b = target.getBoundingClientRect();
  const fly = document.createElement("img");
  fly.src = from.src; fly.alt = "";
  fly.className = "flyer";
  fly.style.left = "0"; fly.style.top = "0";
  document.body.appendChild(fly);
  const x0 = a.left + a.width / 2 - 28, y0 = a.top + a.height / 2 - 28;
  const x1 = b.left + 24 - 28, y1 = b.top + b.height / 2 - 28;
  fly.animate([
    { transform: `translate(${x0}px, ${y0}px) scale(1.4)`, opacity: 1 },
    { transform: `translate(${(x0 + x1) / 2}px, ${Math.min(y0, y1) - 80}px) scale(1)`, opacity: 1, offset: .5 },
    { transform: `translate(${x1}px, ${y1}px) scale(.3)`, opacity: .4 },
  ], { duration: 700, easing: "cubic-bezier(.5,0,.3,1)", fill: "forwards" }).onfinish = () => fly.remove();
}

/* ============ 8. BUYURTMA BERISH (checkout) ============ */
let coStep = 1;
const form = () => $("#checkoutForm");

function formatPhone(v) {
  let d = v.replace(/\D/g, "");
  if (!d.startsWith("998")) d = "998" + d.replace(/^998?/, "");
  d = d.slice(0, 12);
  const p = [d.slice(0, 3), d.slice(3, 5), d.slice(5, 8), d.slice(8, 10), d.slice(10, 12)].filter(Boolean);
  return "+" + p.join(" ");
}

function timeOptions() {
  const opts = [];
  if (isOpenNow()) opts.push({ v: "asap", label: "Hoziroq" });
  const d = new Date();
  d.setMinutes(d.getMinutes() < 30 ? 30 : 60, 0, 0);
  d.setMinutes(d.getMinutes() + 60);
  while (opts.length < 6) {
    if (d.getHours() >= OPEN_HOUR && d.getHours() < CLOSE_HOUR) {
      const tomorrow = d.getDate() !== new Date().getDate();
      opts.push({ v: d.toISOString(), label: (tomorrow ? "Ertaga " : "") + hhmm(d) });
    }
    d.setMinutes(d.getMinutes() + 30);
  }
  return opts;
}

function openCheckout() {
  const f = form();
  const p = state.profile;
  if (p.name && !f.elements.name.value) f.elements.name.value = p.name;
  if (p.phone && !f.phone.value) f.phone.value = p.phone;
  if (p.address && !f.address.value) f.address.value = p.address;
  ["entrance", "floor", "apt"].forEach((k) => { if (p[k] && !f[k].value) f[k].value = p[k]; });

  $("#timeSeg").innerHTML = timeOptions().map((o, i) =>
    `<label><input type="radio" name="time" value="${o.v}" data-label="${o.label}" ${i === 0 ? "checked" : ""}><span>${o.label}</span></label>`).join("");

  closeLayer($("#cartDrawer"));
  goStep(1);
  openLayer($("#checkoutSheet"));
}

function goStep(n) {
  coStep = n;
  $$(".co-step").forEach((s) => (s.hidden = Number(s.dataset.step) !== n));
  $$("#coProgress li").forEach((li, i) => { li.classList.toggle("active", i === n - 1); li.classList.toggle("done", i < n - 1); });
  $("#coBack").hidden = n === 1;
  if (n === 3) renderSummary();
  $("#coNext").textContent = n === 3 ? `Buyurtma berish · ${fmt(totals(form().mode.value).total)}` : "Davom etish";
  $("#checkoutSheet").scrollTop = 0;
}

function validate(step) {
  const f = form();
  let ok = true;
  const mark = (input, bad) => { input.closest(".field").classList.toggle("invalid", bad); if (bad && ok) { input.focus(); ok = false; } };
  if (step === 1) {
    mark(f.elements.name, f.elements.name.value.trim().length < 2);
    mark(f.phone, f.phone.value.replace(/\D/g, "").length !== 12);
  }
  if (step === 2 && f.mode.value === "delivery") mark(f.address, f.address.value.trim().length < 5);
  return ok;
}

function renderSummary() {
  const f = form();
  const t = totals(f.mode.value);
  const time = $("#timeSeg input:checked");
  $("#coSummary").innerHTML = `
    ${state.cart.map((l) => `<div class="summary__row"><span>${l.qty} × ${esc(byId(l.id).name)}</span><span>${fmt(unitPrice(l) * l.qty)}</span></div>`).join("")}
    <hr>
    ${t.discount ? `<div class="summary__row"><span>Chegirma (${state.promo})</span><span>− ${fmt(t.discount)}</span></div>` : ""}
    <div class="summary__row"><span>${f.mode.value === "pickup" ? "Olib ketish" : "Yetkazib berish"}</span><span>${t.delivery ? fmt(t.delivery) : "Bepul"}</span></div>
    <div class="summary__row"><span>Vaqt</span><span>${time.value === "asap" ? "Hoziroq, 35–45 daq" : time.dataset.label}</span></div>
    <div class="summary__row grand"><span>Jami</span><span>${fmt(t.total)}</span></div>`;
}

function setupCheckout() {
  const f = form();
  f.phone.addEventListener("focus", () => { if (!f.phone.value) f.phone.value = "+998 "; });
  f.phone.addEventListener("input", () => { f.phone.value = formatPhone(f.phone.value); });
  f.addEventListener("input", (e) => e.target.closest(".field")?.classList.remove("invalid"));

  f.addEventListener("change", (e) => {
    if (e.target.name === "mode") {
      const pickup = e.target.value === "pickup";
      $("#addrFields").hidden = pickup;
      $("#pickupNote").hidden = !pickup;
    }
    if (e.target.name === "pay") $("#changeField").hidden = e.target.value !== "Naqd";
  });

  $("#coBack").addEventListener("click", () => goStep(coStep - 1));
  f.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!validate(coStep)) return;
    if (coStep < 3) return goStep(coStep + 1);
    placeOrder();
  });
}

function placeOrder() {
  const f = form();
  const mode = f.mode.value;
  const t = totals(mode);
  const time = $("#timeSeg input:checked");
  const order = {
    id: String(Math.floor(10000 + Math.random() * 90000)),
    createdAt: Date.now(),
    scheduled: time.value === "asap" ? null : time.value,
    mode,
    name: f.elements.name.value.trim(),
    phone: f.phone.value,
    address: mode === "pickup" ? "Olib ketish" : [f.address.value.trim(), f.entrance.value && `${f.entrance.value}-podyezd`, f.floor.value && `${f.floor.value}-qavat`, f.apt.value && `${f.apt.value}-xonadon`].filter(Boolean).join(", "),
    comment: f.comment.value.trim(),
    pay: f.pay.value,
    change: f.change.value,
    promo: state.promo,
    items: state.cart.map((l) => ({ ...l, name: byId(l.id).name, options: optionText(l), price: unitPrice(l) })),
    ...t,
  };

  // KEYINGI BOSQICH: shu "order" obyektini Django serverga yuboramiz,
  // server uni bazaga yozadi va Telegram orqali sizga xabar beradi.
  console.log("Yangi buyurtma:", order);

  state.orders.unshift(order);
  store.set("orders", state.orders.slice(0, 20));
  state.profile = { name: order.name, phone: order.phone, address: f.address.value.trim(), entrance: f.entrance.value, floor: f.floor.value, apt: f.apt.value };
  store.set("profile", state.profile);
  updateAddrLabel();

  const ids = state.cart.map((l) => l.id);
  state.cart = []; state.promo = null; saveCart();
  ids.forEach(refreshCard); renderCartBadge();
  f.comment.value = ""; f.change.value = "";

  closeLayer($("#checkoutSheet"));
  openTracking(order.id);
  refreshOrdersUI();
}

/* ============ 9. KUZATUV VA TARIX ============ */
// DEMO: holatlar vaqt o'tishi bilan o'zi o'zgaradi (sekundlarda).
// Haqiqiy saytda holatni oshxona admin paneldan o'zgartiradi.
const STAGES = [
  { at: 0,  title: "Buyurtma qabul qilindi", note: "Operator tez orada qo'ng'iroq qiladi" },
  { at: 15, title: "Oshxonada tayyorlanmoqda", note: "Oshpazlar ishga kirishdi" },
  { at: 40, title: "Kuryer yo'lda", pickupTitle: "Olib ketishga tayyor", note: "Telefoningiz yoningizda bo'lsin", pickupNote: "Amir Temur ko'chasi, 1" },
  { at: 70, title: "Yetkazildi", pickupTitle: "Topshirildi", note: "Yoqimli ishtaha!" },
];
function stageOf(o) {
  if (o.scheduled && Date.now() < new Date(o.scheduled).getTime() - 40 * 60000) return 0;
  const start = o.scheduled ? Math.max(o.createdAt, new Date(o.scheduled).getTime() - 40 * 60000) : o.createdAt;
  const s = (Date.now() - start) / 1000;
  let i = 0;
  STAGES.forEach((st, k) => { if (s >= st.at) i = k; });
  return i;
}
const isLive = (o) => stageOf(o) < STAGES.length - 1;

let trackTimer;
function openTracking(id) {
  const render = () => {
    const o = state.orders.find((x) => x.id === id);
    if (!o) return;
    const st = stageOf(o);
    const pickup = o.mode === "pickup";
    const eta = o.scheduled ? new Date(o.scheduled) : new Date(o.createdAt + 40 * 60000);
    const done = st === STAGES.length - 1;
    $("#trackBody").innerHTML = `
      <div class="track__head">
        <div class="track__icon">${done ? "✅" : ["🧾", "👨‍🍳", pickup ? "🛍️" : "🛵"][st]}</div>
        <h2 id="trackTitle">${done ? "Yoqimli ishtaha!" : `Buyurtma №${o.id}`}</h2>
        ${done ? `<p>Buyurtma №${o.id} ${pickup ? "topshirildi" : "yetkazildi"}</p>` : `<p>${pickup ? "Tayyor bo'ladi" : "Taxminan yetib keladi"}</p><div class="track__eta">${hhmm(eta)}</div>`}
      </div>
      <ol class="timeline">
        ${STAGES.map((s, i) => `<li class="${i < st || (done && i === st) ? "done" : i === st ? "current" : ""}">
          <div>${pickup && s.pickupTitle ? s.pickupTitle : s.title}${i === st && !done ? `<small>${pickup && s.pickupNote ? s.pickupNote : s.note}</small>` : ""}</div></li>`).join("")}
      </ol>
      <div class="summary">
        ${o.items.map((l) => `<div class="summary__row"><span>${l.qty} × ${esc(l.name)}</span><span>${fmt(l.price * l.qty)}</span></div>`).join("")}
        <hr>
        <div class="summary__row"><span>Manzil</span><span>${esc(o.address)}</span></div>
        <div class="summary__row"><span>To'lov</span><span>${esc(o.pay)}</span></div>
        <div class="summary__row grand"><span>Jami</span><span>${fmt(o.total)}</span></div>
      </div>
      <button class="btn btn--ghost" data-close>${done ? "Yopish" : "Menyuga qaytish"}</button>`;
    if (done) clearInterval(trackTimer);
    refreshOrdersUI();
  };
  clearInterval(trackTimer);
  render();
  trackTimer = setInterval(render, 2000);
  if ($("#trackSheet").hidden) openLayer($("#trackSheet"));
}

function refreshOrdersUI() {
  $("#ordersDot").hidden = !state.orders.some(isLive);
  $("#heroRepeat").hidden = !state.orders.length;
  if (!$("#ordersDrawer").hidden) renderOrders();
}

function renderOrders() {
  const body = $("#ordersBody");
  if (!state.orders.length) {
    body.innerHTML = `<div class="cart-empty"><div class="cart-empty__plate">🧾</div><h3>Hali buyurtma yo'q</h3><p>Birinchi buyurtmangizga INFINITY10 promokodi bilan 10% chegirma.</p><button class="btn btn--primary" data-goto-menu>Menyuni ochish</button></div>`;
    return;
  }
  body.innerHTML = state.orders.map((o) => {
    const live = isLive(o);
    const st = stageOf(o);
    const d = new Date(o.createdAt);
    return `<div class="order">
      <div class="order__top"><b>№${o.id}</b><span class="status ${live ? "status--live" : "status--done"}">${live ? STAGES[st].title : o.mode === "pickup" ? "Topshirildi" : "Yetkazildi"}</span></div>
      <p>${d.toLocaleDateString("ru-RU")} ${hhmm(d)} · ${fmt(o.total)}</p>
      <p>${o.items.map((l) => `${esc(l.name)} × ${l.qty}`).join(", ")}</p>
      <div class="order__actions">
        ${live ? `<button class="btn btn--primary" data-track="${o.id}">Kuzatish</button>` : ""}
        <button class="btn btn--ghost" data-repeat="${o.id}">Qayta buyurtma</button>
      </div>
    </div>`;
  }).join("");
}

function repeatOrder(id) {
  const o = state.orders.find((x) => x.id === id);
  if (!o) return;
  o.items.forEach((l) => { if (byId(l.id)) addLine({ id: l.id, size: l.size, extras: l.extras || [], note: l.note || "", qty: l.qty }, true); });
  toast("Taomlar savatchaga qo'shildi");
  closeAll();
  renderCart();
  openLayer($("#cartDrawer"));
}

function setupOrders() {
  $("#ordersBtn").addEventListener("click", () => { renderOrders(); openLayer($("#ordersDrawer")); });
  $("#ordersDrawer").addEventListener("click", (e) => {
    const tr = e.target.closest("[data-track]");
    if (tr) { closeLayer($("#ordersDrawer")); return openTracking(tr.dataset.track); }
    const rp = e.target.closest("[data-repeat]");
    if (rp) return repeatOrder(rp.dataset.repeat);
    if (e.target.closest("[data-goto-menu]")) { closeAll(); document.getElementById("menu").scrollIntoView({ behavior: "smooth" }); }
  });
  $("#heroRepeat").addEventListener("click", () => state.orders[0] && repeatOrder(state.orders[0].id));
  refreshOrdersUI();
  const live = state.orders.find(isLive);
  if (live) setTimeout(() => toast(`Buyurtma №${live.id}: ${STAGES[stageOf(live)].title.toLowerCase()}`), 800);
}

/* ============ Manzil oynasi (header) ============ */
function updateAddrLabel() {
  $("#addrLabel").textContent = state.profile.address || "Manzilni kiriting";
}
function setupAddress() {
  const sheet = document.createElement("div");
  sheet.className = "sheet sheet--checkout";
  sheet.id = "addrSheet";
  sheet.hidden = true;
  sheet.setAttribute("role", "dialog");
  sheet.setAttribute("aria-modal", "true");
  sheet.innerHTML = `<button class="sheet__close" data-close aria-label="Yopish">✕</button>
    <form class="checkout" id="addrForm">
      <h2>Yetkazish manzili</h2>
      <label class="field">Manzil<input name="address" placeholder="Tuman, ko'cha, uy raqami" autocomplete="street-address"></label>
      <p class="muted">Manzil buyurtma berishda avtomatik to'ldiriladi.</p>
      <button class="btn btn--primary btn--lg">Saqlash</button>
    </form>`;
  document.body.appendChild(sheet);
  $("#addrBtn").addEventListener("click", () => { $("#addrForm").address.value = state.profile.address || ""; openLayer(sheet); });
  $("#addrForm").addEventListener("submit", (e) => {
    e.preventDefault();
    state.profile.address = e.target.address.value.trim();
    store.set("profile", state.profile);
    form().address.value = state.profile.address;
    updateAddrLabel();
    closeLayer(sheet);
    toast("Manzil saqlandi");
  });
  updateAddrLabel();
}

/* ============ 10. ISHGA TUSHIRISH ============ */
function setupGlobal() {
  // Tungi / kunduzgi rejim
  $("#themeBtn").addEventListener("click", () => {
    const root = document.documentElement;
    const dark = root.dataset.theme ? root.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
    root.dataset.theme = dark ? "light" : "dark";
    try { localStorage.setItem("theme", root.dataset.theme); } catch (e) {}
  });

  // Oynalarni yopish: ✕ tugma, fon yoki Esc
  document.addEventListener("click", (e) => { if (e.target.closest("[data-close]")) closeLayer(e.target.closest(".sheet, .drawer")); });
  $("#scrim").addEventListener("click", () => closeLayer());
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && stack.length) return closeLayer();
    if (e.key === "/" && !/INPUT|TEXTAREA/.test(document.activeElement.tagName) && !stack.length) { e.preventDefault(); $("#search").focus(); }
  });

  // Sahifa aylantirilganda header chegarasi
  const hdr = $("#header");
  addEventListener("scroll", () => hdr.classList.toggle("scrolled", scrollY > 10), { passive: true });

  // Boshqa tabda o'zgargan savatchani sinxronlash
  addEventListener("storage", (e) => {
    if (e.key === "inf_cart") { state.cart = store.get("cart", []); renderMenu(); renderCartBadge(); }
  });
}

// Eskirgan savatcha qatorlarini tozalash (menyudan o'chirilgan taomlar)
state.cart = state.cart.filter((l) => byId(l.id));

setupStatus();
setupPlate();
setupMenu();
setupDish();
setupCart();
setupCheckout();
setupOrders();
setupAddress();
setupGlobal();
renderCartBadge();
