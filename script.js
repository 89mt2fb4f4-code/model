const $ = (sel) => document.querySelector(sel);
const pad = (n) => String(n).padStart(2, "0");
const el = (tag, cls, text) => {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text) node.textContent = text;
  return node;
};

// Image that fades in once loaded
function photo(src, alt = "") {
  const img = el("img", "loading");
  img.alt = alt;
  img.loading = "lazy";
  img.decoding = "async";
  img.onload = () => img.classList.remove("loading");
  img.src = src;
  return img;
}

// Header, hero, contact
document.title = `${SITE.name} — Model`;
$("#brand").textContent = SITE.name;
$("#hero-name").innerHTML = SITE.name.split(" ").map((w) => `<span>${w}</span>`).join("");
$("#hero-location").textContent = SITE.location;
$("#model-name").textContent = SITE.name;
$("#dig-date").textContent = `Taken ${SITE.digitalsDate}`;
$("#foot").innerHTML = `<span>© ${new Date().getFullYear()} ${SITE.name}</span><span>${SITE.location}</span>`;

const { email, instagram, tiktok, agency } = SITE.contact;
const rows = [];
if (email) rows.push(["Email", `<a href="mailto:${email}">${email}</a>`]);
if (instagram) rows.push(["Instagram", `<a href="https://instagram.com/${instagram}" target="_blank" rel="noopener">@${instagram}</a>`]);
if (tiktok) rows.push(["TikTok", `<a href="https://tiktok.com/@${tiktok}" target="_blank" rel="noopener">@${tiktok}</a>`]);
if (agency) rows.push(["Agency", agency]);
if (SITE.location) rows.push(["Based in", SITE.location]);
$("#contact-list").innerHTML = rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("");

// Digitals
$("#stats").innerHTML = SITE.stats.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("");

const digitals = SITE.digitals.map((src, i) => ({ src, caption: `Digital ${pad(i + 1)} · ${SITE.digitalsDate}` }));
const [main, side, ...extra] = digitals;
if (main) { $("#dig-main").append(photo(main.src, "Digital, full length")); $("#dig-main").onclick = () => openLightbox(digitals, 0); }
if (side) { $("#dig-head").append(photo(side.src, "Digital, waist up")); $("#dig-head").onclick = () => openLightbox(digitals, 1); }
extra.forEach((d, i) => {
  const fig = el("figure", "cell photo-cell");
  fig.append(photo(d.src, d.caption));
  fig.onclick = () => openLightbox(digitals, i + 2);
  $("#dig-extra").append(fig);
});

// Previous work
const work = SITE.work.map((w, i) => ({
  src: w.src,
  date: w.date || "",
  caption: [w.caption, w.date].filter(Boolean).join("  ·  "),
}));

const grid = $("#work-grid");
if (work.length) {
  const [first] = work;
  const feature = $("#feature");
  const fig = el("figure", "cell photo-cell");
  fig.append(photo(first.src, first.caption));
  fig.onclick = () => openLightbox(work, 0);

  const info = el("div", "cell feature-info");
  info.append(el("h3", "", first.date));

  feature.append(fig, info);
}
work.slice(1).forEach((w, i) => {
  const btn = el("button", "cell thumb");
  btn.setAttribute("aria-label", `Open ${w.caption}`);
  const meta = el("span", "meta");
  meta.innerHTML = `<b>${w.date.toUpperCase()}</b>`;
  const frame = el("span", "frame");
  frame.append(photo(w.src, w.caption));
  btn.append(meta, frame);
  btn.onclick = () => openLightbox(work, i + 1);
  grid.append(btn);
});

// Lightbox
const lb = $("#lightbox");
const lbImg = lb.querySelector("img");
const lbCap = lb.querySelector("figcaption");
let set = [];
let idx = 0;
let lastFocus = null;

function show() {
  const item = set[idx];
  lbImg.style.opacity = 0;
  const next = new Image();
  next.onload = () => {
    lbImg.src = item.src;
    lbImg.alt = item.caption;
    lbImg.style.opacity = 1;
  };
  next.src = item.src;
  lbCap.textContent = `${item.caption.toUpperCase()}   ${idx + 1} / ${set.length}`;
}
function openLightbox(items, i) {
  set = items;
  idx = i;
  lastFocus = document.activeElement;
  show();
  lb.classList.add("open");
  lb.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  lb.querySelector(".lb-next").focus();
}
function closeLightbox() {
  lb.classList.remove("open");
  lb.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  lastFocus?.focus();
}
const step = (d) => { idx = (idx + d + set.length) % set.length; show(); };

lb.querySelector(".lb-close").onclick = closeLightbox;
lb.querySelector(".lb-prev").onclick = () => step(-1);
lb.querySelector(".lb-next").onclick = () => step(1);
lb.onclick = (e) => { if (e.target === lb) closeLightbox(); };
document.addEventListener("keydown", (e) => {
  if (!lb.classList.contains("open")) return;
  if (e.key === "Escape") closeLightbox();
  if (e.key === "ArrowLeft") step(-1);
  if (e.key === "ArrowRight") step(1);
});

// Swipe between photos on phones
let touchX = null;
lb.addEventListener("touchstart", (e) => { touchX = e.touches[0].clientX; }, { passive: true });
lb.addEventListener("touchend", (e) => {
  if (touchX === null) return;
  const dx = e.changedTouches[0].clientX - touchX;
  if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
  touchX = null;
});

// Fade sections in as they scroll into view
const io = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("in");
      io.unobserve(entry.target);
    }
  });
}, { threshold: 0.08 });
document.querySelectorAll(".reveal").forEach((node) => io.observe(node));

// Pad the last row with empty cells so the grid lines stay continuous
function fillLastRow() {
  grid.querySelectorAll(".filler").forEach((f) => f.remove());
  const cols = getComputedStyle(grid).gridTemplateColumns.split(" ").length;
  const used = work.length - 1;
  const missing = (cols - (used % cols)) % cols;
  for (let i = 0; i < missing; i++) grid.append(el("div", "cell filler"));
}
fillLastRow();
window.addEventListener("resize", fillLastRow);
