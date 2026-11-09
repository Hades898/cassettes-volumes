// The cassette navbar prototype (raerae, ~6 Nov; Hady, 9 Nov "Prototype it
// now"). One real list of eight section links; the art (3D case, ribbons,
// reels) is decoration around it. Links stay on this page: a pick changes
// the stub page and the current mark. Not the website.
import { LETTERING } from "./lettering-path.js";
import { FACE, faceCanvas, paintFlat } from "./face.js";
import { v2Header, v2Controller } from "./v2.js";
import { sound } from "./sound.js";

// ---------- Copy: the website's src/lib/i18n.ts (origin/main 40cdbca) ----------
const T = {
  en: {
    brand: "Cassettes", tagline: "Cinematic journaling", skip: "Skip to the content",
    menu: "Menu", close: "Close", sections: "Sections", site: "Site", search: "Search", switchTo: "العربية",
    nav: { text: "Catalogue", volumes: "Volumes", visual: "Artworks", interviews: "Interviews", exclusives: "Extended Play", curation: "Bonus Tracks", contributors: "Contributors", submissions: "Submissions", about: "About Cassettes", contact: "Contact Us" },
    util: { about: "About", note: "Editor's Note", newsletter: "Newsletter", subscribe: "Subscribe", signIn: "Sign In", soon: "Coming soon", comingSoon: ", coming soon" },
    lede: "A film can be the way in: to musicians and songs, painters and paintings, writers and writings.",
    sample: "Sample content for design work. Not published.",
    rows: ["Room for One", "The Doorway Holds", "Good Light"],
    sideA: "Side A", sideB: "Side B", sound: "Sound", on: "on", off: "off",
  },
  ar: {
    brand: "شريط كوكتيل", tagline: "تدوين سينمائي", skip: "انتقل إلى المحتوى",
    menu: "القائمة", close: "إغلاق", sections: "الأقسام", site: "الموقع", search: "بحث", switchTo: "English",
    nav: { text: "كتالوج", volumes: "أعداد", visual: "الأعمال الفنية", interviews: "الحوارات", exclusives: "حصريات", curation: "مختارات", contributors: "المساهمين والمساهمات", submissions: "تقديمات", about: "عن «شريط كوكتيل»", contact: "اتصل بنا" },
    util: { about: "عنّا", note: "كلمة المحرر", newsletter: "النشرة البريدية", subscribe: "اشتراك", signIn: "تسجيل الدخول", soon: "قريبًا", comingSoon: "، قريبًا" },
    lede: "",
    sample: "محتوى تجريبي لأعمال التصميم. غير منشور.",
    rows: ["غرفة لشخص واحد", "الباب يصمد", "ضوء جيد"],
    sideA: "الوجه الأول", sideB: "الوجه الثاني", sound: "الصوت", on: "تشغيل", off: "إيقاف",
  },
};
const KEYS = ["text", "volumes", "visual", "interviews", "exclusives", "curation", "contributors", "submissions"];
const PATHS = { text: "text/", volumes: "volumes/", visual: "visual/", interviews: "interviews/", exclusives: "exclusives/", curation: "curation/", contributors: "contributors/", submissions: "contribute/" };

// ---------- Prototype state, mirrored in the address ----------
const q = new URLSearchParams(location.search);
const one = (k, opts, dflt) => (opts.includes(q.get(k)) ? q.get(k) : dflt);
const S = {
  v: one("v", ["v2", "v1"], "v2"),
  header: one("header", ["cassette", "calm"], "cassette"),
  layout: one("layout", ["ribbons", "reels"], "ribbons"),
  lang: one("lang", ["en", "ar"], "en"),
  motion: one("motion", ["full", "reduce"], matchMedia("(prefers-reduced-motion: reduce)").matches ? "reduce" : "full"),
  gl: one("gl", ["on", "off"], "on"),
  ground: one("ground", ["dark", "paper"], "dark"),
  at: one("at", KEYS.concat(["search", "about"]), null),
  chrome: q.get("chrome") !== "0",
};
S.sound = sound.on ? "on" : "off";
const syncUrl = () => {
  const p = new URLSearchParams();
  for (const k of ["v", "header", "layout", "lang", "motion", "gl", "ground", "at"]) if (S[k]) p.set(k, S[k]);
  if (!S.chrome) p.set("chrome", "0");
  history.replaceState(null, "", `?${p}`);
};

// ---------- Helpers ----------
const $ = (s, r = document) => r.querySelector(s);
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, k) => a + (b - a) * k;
const easeOut = (x) => 1 - Math.pow(1 - x, 3);
const easeInOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const rng = (seed) => () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let x = Math.imul(seed ^ (seed >>> 15), 1 | seed); x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };
const reduced = () => S.motion === "reduce";
const t_ = () => T[S.lang];
const other = () => (S.lang === "ar" ? "en" : "ar");
const href = (k, l = S.lang) => `/${l}/${k === "home" ? "" : k === "search" ? "search/" : k === "about" ? "about/" : PATHS[k]}`;

const letteringSVG = `<svg viewBox="0 0 ${LETTERING.w} ${LETTERING.h}" aria-hidden="true" focusable="false"><path fill-rule="evenodd" d="${LETTERING.d}"/></svg>`;
// A reel: a disc with eight spokes (804:2019 black, 806:2100 teal).
function reelSVG(cx, cy, r, len, thick, at) {
  let s = `<g class="reel" data-cx="${cx}" data-cy="${cy}"><circle class="reel-body" cx="${cx}" cy="${cy}" r="${r}"/>`;
  for (let k = 0; k < 8; k++) {
    const a = k * 45, rad = (a * Math.PI) / 180;
    s += `<rect class="spoke" x="${-len / 2}" y="${-thick / 2}" width="${len}" height="${thick}" rx="${thick * 0.25}" transform="translate(${(cx + at * Math.cos(rad)).toFixed(2)} ${(cy + at * Math.sin(rad)).toFixed(2)}) rotate(${a})"/>`;
  }
  return s + "</g>";
}
const stickerSVG = `<svg viewBox="0 0 228 84" aria-hidden="true" focusable="false"><rect class="box" x=".6" y=".6" width="226.8" height="82.8" rx="5"/>${reelSVG(52, 42, 30, 9, 5, 19)}${reelSVG(176, 42, 30, 9, 5, 19)}<path class="tape" d="M80 55 C 112 72, 122 22, 148 29"/></svg>`;
// Figma 806:2100 in its own units (441 x 686): the reel, the tape, the second reel.
const REELS = { w: 441, h: 686, top: { x: 220, y: 188 }, bottom: { x: 222, y: 522 }, r: 73 };
const reelsArtSVG = `<svg viewBox="0 0 441 686" aria-hidden="true" focusable="false"><g class="mirror">${reelSVG(220, 188, 73, 27, 15, 47).replace('class="reel"', 'class="reel top"')}<path class="tape" pathLength="1" d="M147 190 C 150 330, 270 330, 295 522"/><g class="bottom">${reelSVG(222, 522, 73, 27, 15, 47)}</g></g></svg>`;

// ---------- Markup ----------
function soonItem(label, box) {
  const t = t_();
  return `<span class="${box ? "key" : "word"}" data-soon title="${esc(t.util.soon)}">${esc(label)}<span class="sr-only">${esc(t.util.comingSoon)}</span></span>`;
}
function langLink(cls) {
  return `<a class="${cls}" href="${href("home", other())}" lang="${other()}" data-go="lang">${esc(t_().switchTo)}</a>`;
}
function sectionLinks(cls) {
  const t = t_();
  return KEYS.map((k) => `<li><a class="${cls}" href="${href(k)}" data-go="${k}"${S.at === k ? ' aria-current="page"' : ""}>${esc(t.nav[k])}</a></li>`).join("");
}
function cassetteHeader() {
  const t = t_();
  return `
  <div class="bar" id="bar">
    <button id="tape-btn" class="sticker-wrap" type="button" aria-expanded="false" aria-controls="stage">
      <span class="sticker">${stickerSVG}</span><span class="sticker-cap">${esc(t.menu)}</span>
    </button>
    <div id="stage" class="stage" hidden>
      <div class="ground"></div>
      <canvas class="rib" aria-hidden="true"></canvas>
      <canvas class="gl" aria-hidden="true"></canvas>
      <div class="flat" aria-hidden="true" hidden><canvas></canvas></div>
      <div class="reels" aria-hidden="true" hidden>${reelsArtSVG}</div>
      <nav aria-label="${esc(t.sections)}"><ul class="tags">${sectionLinks(S.layout === "reels" ? "rlabel" : "tag")}</ul></nav>
      <nav class="strip" aria-label="${esc(t.site)}">
        <ul><li><a class="word" href="${href("about")}" data-go="about">${esc(t.util.about)}</a></li><li>${soonItem(t.util.note)}</li><li>${soonItem(t.util.newsletter)}</li></ul>
        <ul><li>${soonItem(t.util.subscribe, true)}</li><li>${soonItem(t.util.signIn, true)}</li></ul>
      </nav>
    </div>
    <a class="lettering" href="${href("home")}" data-go="home" aria-label="Cassettes" lang="en">${letteringSVG}</a>
    <ul class="bar-end"><li><a class="key" href="${href("search")}" data-go="search">${esc(t.search)}</a></li><li>${langLink("word")}</li></ul>
  </div>`;
}
function calmHeader() {
  const t = t_();
  return `
  <div class="calm-util">
    <ul class="start" style="grid-column:1;grid-row:1"><li><a class="word" href="${href("about")}" data-go="about">${esc(t.util.about)}</a></li><li>${soonItem(t.util.note)}</li><li>${soonItem(t.util.newsletter)}</li></ul>
    <button class="menu-btn" type="button" style="grid-column:1;grid-row:1" aria-expanded="false" aria-controls="side" aria-label="${esc(t.menu)}"><svg width="28" height="20" viewBox="0 0 28 20" aria-hidden="true"><path d="M0 1h28M0 10h28M0 19h28" stroke="currentColor" stroke-width="1.2"/></svg></button>
    <a class="lettering" style="grid-column:2" href="${href("home")}" data-go="home" aria-label="Cassettes" lang="en">${letteringSVG}</a>
    <ul class="end" style="grid-column:3"><li class="soon-item">${soonItem(t.util.subscribe, true)}</li><li class="soon-item">${soonItem(t.util.signIn, true)}</li><li><a class="key" href="${href("search")}" data-go="search">${esc(t.search)}</a></li><li>${langLink("word")}</li></ul>
  </div>
  <nav class="calm-sec" aria-label="${esc(t.sections)}"><ul>${sectionLinks("")}</ul></nav>
  <div class="side" id="side" role="dialog" aria-modal="true" aria-label="${esc(t.menu)}" hidden>
    <div class="side-top"><button type="button" class="side-close"><svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true"><path d="M1 1l20 20M21 1L1 21" stroke="currentColor" stroke-width="1.2"/></svg>${esc(t.close)}</button></div>
    <ul>${sectionLinks("")}<li><a href="${href("about")}" data-go="about">${esc(t.nav.about)}</a></li></ul>
  </div>`;
}
function page() {
  const t = t_();
  const title = S.at === "search" ? t.search : S.at === "about" ? t.nav.about : S.at ? t.nav[S.at] : t.tagline;
  return `
  <p class="eyebrow">${esc(t.brand)}</p>
  <h1>${esc(title)}</h1>
  ${t.lede ? `<p class="lede">${esc(t.lede)}</p>` : ""}
  <ul class="rows">${t.rows.map((r, i) => `<li><span class="n">0${i + 1}</span><span class="t">${esc(r)}</span><span class="m"></span></li>`).join("")}</ul>
  <p class="sample">${esc(t.sample)}</p>
  <div style="height:120vh" aria-hidden="true"></div>`;
}

// What v2 needs from here.
const v2ctx = () => ({ S, t: t_(), KEYS, esc, href, setInert, trap, soonItem, langLink, letteringSVG, LETTERING, reduced, onSound: () => { S.sound = sound.on ? "on" : "off"; renderToolbar(); } });

// ---------- Render ----------
const app = $("#app");
let ctl = null;
function render() {
  ctl?.destroy();
  const t = t_();
  const root = document.documentElement;
  root.lang = S.lang; root.dir = S.lang === "ar" ? "rtl" : "ltr";
  root.dataset.ground = S.v === "v2" ? "paper" : S.ground;
  root.dataset.v = S.v;
  root.classList.toggle("motion-full", !reduced());
  root.classList.toggle("motion-reduce", reduced());
  root.classList.remove("locked");
  app.innerHTML = `
    <a class="skip" href="#main">${esc(t.skip)}</a>
    <header id="hdr">${S.header !== "cassette" ? calmHeader() : S.v === "v2" ? v2Header(v2ctx()) : cassetteHeader()}</header>
    <main id="main" tabindex="-1">${page()}</main>
    <footer lang="en">Cassettes</footer>`;
  ctl = S.header !== "cassette" ? calmController() : S.v === "v2" ? v2Controller(v2ctx()) : cassetteController();
  renderToolbar();
  syncUrl();
}
function go(key) {
  if (key === "lang") { S.lang = other(); render(); return; }
  S.at = key === "home" ? null : key;
  $("#main").innerHTML = page();
  for (const a of document.querySelectorAll("[data-go]")) {
    if (!KEYS.includes(a.dataset.go)) continue;
    if (a.dataset.go === S.at) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  }
  syncUrl();
  scrollTo(0, 0);
  $("#main").focus({ preventScroll: true });
}
app.addEventListener("click", (e) => {
  const a = e.target.closest("a[data-go]");
  if (!a) return;
  e.preventDefault();
  const k = a.dataset.go;
  if (ctl?.isOpen?.()) ctl.close({ focus: "none", instant: k === "lang" });
  go(k);
});

// The page and toolbar go inert while a menu is open.
const setInert = (on) => {
  for (const el of [$(".skip"), $("#main"), $("footer"), $("#proto")]) if (el) el.inert = on;
  document.documentElement.classList.toggle("locked", on);
};
const trap = (scope, e) => {
  if (e.key !== "Tab") return;
  const f = [...scope.querySelectorAll("a[href], button")].filter((el) => el.getClientRects().length && !el.closest("[hidden]"));
  if (!f.length) return;
  const first = f[0], last = f[f.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
};

// ---------- The cassette menu ----------
function cassetteController() {
  const bar = $("#bar"), btn = $("#tape-btn"), stage = $("#stage");
  const ground = $(".ground", stage), rib = $("canvas.rib", stage), glc = $("canvas.gl", stage);
  const flat = $(".flat", stage), flatC = $("canvas", flat), reelsBox = $(".reels", stage);
  const links = [...stage.querySelectorAll(".tags a")];
  const strip = $(".strip", stage);
  const rtl = S.lang === "ar";
  const mode = S.layout;
  const OPEN_MS = mode === "reels" ? 1100 : 1300, CLOSE_MS = 650;
  let t = 0, dir = 0, raf = 0, last = 0, open = false, L = null, hot = -1;
  let gl = null, glState = S.gl === "off" ? "off" : "untried", face = null;
  const tilt = { x: 0, y: 0, tx: 0, ty: 0 };
  const ac = new AbortController();
  const on = (el, ev, fn, o = {}) => el.addEventListener(ev, fn, { ...o, signal: ac.signal });

  let artP = null;
  const ensureArt = () => (artP ??= (async () => {
    if (mode !== "ribbons") { glc.hidden = true; flat.hidden = true; return; }
    face = faceCanvas(S.lang);
    if (glState === "untried") {
      try {
        const m = await import("./cassette3d.js");
        if (ac.signal.aborted) return;
        gl = m.createCassette(glc, face);
        gl?.warm();
      } catch (err) { console.warn("3D cassette unavailable:", err?.message); gl = null; }
      glState = gl ? "on" : "off";
    }
    flat.hidden = glState === "on";
    glc.hidden = glState !== "on";
  })());

  // ---- Layout ----
  function layout() {
    const W = stage.clientWidth, H = stage.clientHeight, phone = W < 820;
    const barH = bar.offsetHeight, stripH = strip.offsetHeight;
    const bottom = H - stripH;
    const sb = $(".sticker", bar).getBoundingClientRect();
    const from = { cx: sb.left + sb.width / 2, cy: sb.top + sb.height / 2, w: sb.width * 0.94 };
    L = { W, H, phone, barH, bottom, from };
    rib.width = Math.round(W * Math.min(2, devicePixelRatio)); rib.height = Math.round(H * Math.min(2, devicePixelRatio));
    if (mode === "reels") return layoutReels();
    const w = phone ? Math.min(W * 0.66, 300) : clamp(W * 0.29, 300, 430);
    const h = w * (FACE.h / FACE.w);
    const cas = { cx: W / 2, cy: barH + (phone ? 18 : 26) + h / 2, w, h };
    L.cas = cas;
    L.slot = { x: cas.cx, y: cas.cy + h / 2 - h * 0.035, w: w * 0.38 };
    L.tw = Math.max(8, w * 0.036);
    gl?.size(W, H);
    if (!gl) { const d = Math.min(2, devicePixelRatio); flatC.width = Math.round(w * d); flatC.height = Math.round(h * d); }
    // Where each tag sits: a U of tape pooling under the case on a desktop,
    // a zig-zag spill down a phone. Mirrored in Arabic.
    const sizes = links.map((a) => ({ w: a.offsetWidth, h: a.offsetHeight }));
    const maxW = Math.max(...sizes.map((s) => s.w));
    const R = rng(7);
    const spots = KEYS.map((_, i) => {
      let x, y, ang;
      if (!phone) {
        const u = i / 7, yTop = cas.cy - h * 0.05, yBot = bottom - 64 - sizes[i].h / 2;
        const Rx = Math.min(W / 2 - 90 - maxW / 2, W * 0.36, 540);
        x = W / 2 - Rx * Math.cos(Math.PI * u) + (R() - 0.5) * 30;
        y = yTop + (yBot - yTop) * Math.sin(Math.PI * u) + (R() - 0.5) * 24;
        ang = clamp(Math.atan2((yBot - yTop) * Math.cos(Math.PI * u), Rx * Math.sin(Math.PI * u) + 1) * (180 / Math.PI) * 0.12 + (R() - 0.5) * 6, -9, 9);
      } else {
        const y0 = cas.cy + h / 2 + 46 + sizes[i].h / 2, y1 = bottom - 16 - sizes[i].h / 2;
        y = lerp(y0, y1, i / 7);
        const side = i % 2 ? 1 : -1;
        x = W / 2 + side * Math.min(W * 0.2, W / 2 - 12 - sizes[i].w / 2) + (R() - 0.5) * 14;
        ang = side * (2.5 + R() * 3);
      }
      if (rtl) { x = W - x; ang = -ang; }
      return { x, y, ang, ...sizes[i] };
    });
    L.spots = spots;
    L.ribbons = spots.map((sp, i) => ribbon(i, sp));
    links.forEach((a, i) => {
      const sp = spots[i];
      a.style.transform = `translate(${(sp.x - sp.w / 2).toFixed(1)}px, ${(sp.y - sp.h / 2).toFixed(1)}px) rotate(${sp.ang.toFixed(2)}deg)`;
    });
  }

  // A ribbon from the case's foot to its tag, a curl on the way, flat
  // under the tag, then a loose tail. Catmull-Rom through the points.
  function ribbon(i, sp) {
    const R = rng(101 + i * 17), { slot, tw, phone } = L;
    const sgn = Math.abs(sp.x - slot.x) < 4 ? (i % 2 ? 1 : -1) : Math.sign(sp.x - slot.x);
    const a = (sp.ang * Math.PI) / 180, d = { x: Math.cos(a) * sgn, y: Math.sin(a) * sgn };
    const half = sp.w / 2 + 10;
    const A = { x: sp.x, y: sp.y };
    const Ain = { x: A.x - d.x * half, y: A.y - d.y * half }, Aout = { x: A.x + d.x * half, y: A.y + d.y * half };
    const off = (i - 3.5) * (slot.w / 8);
    const S0 = { x: slot.x + off, y: slot.y - 4 };
    const S1 = { x: slot.x + off * 1.25, y: slot.y + (phone ? 16 : 26) + R() * (phone ? 14 : 30) };
    const M = { x: lerp(S1.x, Ain.x, 0.5) + (R() - 0.5) * (phone ? 60 : 110), y: lerp(S1.y, Ain.y, 0.55) + (R() - 0.35) * (phone ? 30 : 70) };
    const r = (phone ? 12 : 20) + R() * (phone ? 10 : 24), spin = R() < 0.5 ? 1 : -1, th0 = R() * Math.PI * 2;
    const loop = [0, 1, 2, 3].map((k) => ({ x: M.x + r * Math.cos(th0 + spin * k * (Math.PI / 2)), y: M.y + r * Math.sin(th0 + spin * k * (Math.PI / 2)) }));
    const Apre = { x: Ain.x - d.x * 34, y: Ain.y - d.y * 34 };
    // The loose end falls: a little further out, then down, then back.
    const T1 = { x: Aout.x + d.x * (22 + R() * 30), y: Aout.y + d.y * 22 + 18 + R() * 22 };
    const T2 = { x: T1.x + d.x * (6 + R() * 12), y: T1.y + 26 + R() * 24 };
    const T3 = { x: T2.x - d.x * (14 + R() * 16), y: T2.y + 12 + R() * 10 };
    const way = [S0, S1, ...loop, Apre, Ain, A, Aout, T1, T2, T3];
    const N = 18, pts = [];
    for (let k = 0; k < way.length - 1; k++) {
      const p0 = way[Math.max(0, k - 1)], p1 = way[k], p2 = way[k + 1], p3 = way[Math.min(way.length - 1, k + 2)];
      for (let j = 0; j < N; j++) {
        const u = j / N, u2 = u * u, u3 = u2 * u;
        pts.push({
          x: 0.5 * (2 * p1.x + (-p0.x + p2.x) * u + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * u2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * u3),
          y: 0.5 * (2 * p1.y + (-p0.y + p2.y) * u + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * u2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * u3),
        });
      }
    }
    pts.push({ ...way[way.length - 1] });
    let s = 0;
    pts.forEach((p, k) => { if (k) s += Math.hypot(p.x - pts[k - 1].x, p.y - pts[k - 1].y); p.s = s; });
    const sA = pts[8 * N].s, sIn = pts[7 * N].s;
    const period = 110 + R() * 90;
    for (let k = 0; k < pts.length; k++) {
      const p = pts[k], a2 = pts[Math.max(0, k - 1)], b2 = pts[Math.min(pts.length - 1, k + 1)];
      const tx = b2.x - a2.x, ty = b2.y - a2.y, len = Math.hypot(tx, ty) || 1;
      p.nx = -ty / len; p.ny = tx / len;
      const flatA = 1 - clamp((Math.abs(p.s - sA) - half - 4) / 40);
      const flatS = 1 - clamp(p.s / 30);
      // Twist counted from the tag, so the tape leaves it turning slowly.
      const phi = (((p.s - sA) / period) * Math.PI * 2) * (1 - Math.max(flatA, flatS));
      p.c = Math.cos(phi);
    }
    return { pts, total: s, sIn, sA, tw };
  }

  function layoutReels() {
    const { W, barH, bottom } = L;
    const availH = bottom - barH - 24;
    const k = Math.min((W - 24) / REELS.w, availH / REELS.h, 1.3);
    const ox = W / 2 - (REELS.w / 2) * k, oy = barH + 12 + (availH - REELS.h * k) / 2;
    L.k = k; L.ox = ox; L.oy = oy;
    $(".mirror", reelsBox).setAttribute("transform", rtl ? `translate(${REELS.w} 0) scale(-1 1)` : "");
    const top = { x: rtl ? REELS.w - REELS.top.x : REELS.top.x, y: REELS.top.y };
    L.top = top;
    // The 806:2100 angles, clockwise from catalogue at nine o'clock.
    const ANG = [180, 225, 270, 315, 0, 45, 90, 135];
    const font = Math.max(18, Math.round((S.lang === "ar" ? 22 : 27) * k));
    links.forEach((a, i) => {
      a.style.fontSize = `${font}px`;
      let th = ANG[i]; if (rtl) th = (540 - th) % 360;
      const rad = (th * Math.PI) / 180, R0 = (REELS.r + 8) * k;
      const ax = ox + top.x * k + R0 * Math.cos(rad), ay = oy + top.y * k + R0 * Math.sin(rad);
      const right = th > 270 || th <= 90;
      const rot = right ? (th > 270 ? th - 360 : th) : th - 180;
      const w = a.offsetWidth, h = a.offsetHeight;
      a.style.transformOrigin = right ? `0 50%` : `${w}px 50%`;
      a.style.transform = `translate(${(right ? ax : ax - w).toFixed(1)}px, ${(ay - h / 2).toFixed(1)}px) rotate(${rot}deg)`;
    });
  }

  // ---- Drawing ----
  const gctx = rib.getContext("2d");
  function drawRibbons(progress) {
    const d = rib.width / L.W;
    gctx.setTransform(1, 0, 0, 1, 0, 0);
    gctx.clearRect(0, 0, rib.width, rib.height);
    gctx.setTransform(d, 0, 0, d, 0, 0);
    gctx.lineJoin = "round";
    L.ribbons.forEach((rb, i) => {
      const upto = progress[i] * rb.total;
      if (upto <= 0) return;
      const P = rb.pts, lit = i === hot ? 1.3 : 1;
      for (let k = 1; k < P.length; k++) {
        const p0 = P[k - 1]; let p1 = P[k];
        if (p0.s >= upto) break;
        if (p1.s > upto) { const f = (upto - p0.s) / (p1.s - p0.s); p1 = { ...p1, x: lerp(p0.x, p1.x, f), y: lerp(p0.y, p1.y, f) }; }
        const w0 = (rb.tw * Math.max(0.12, Math.abs(p0.c))) / 2, w1 = (rb.tw * Math.max(0.12, Math.abs(p1.c))) / 2;
        const front = (p0.c + p1.c) / 2 >= 0;
        const face = Math.abs((p0.c + p1.c) / 2);
        const light = 0.62 + 0.38 * face + 0.12 * (-0.5 * p0.nx - 0.85 * p0.ny);
        const base = front ? [132, 92, 58] : [64, 44, 28];
        const col = `rgb(${base.map((v) => Math.round(clamp(v * light * lit, 0, 255))).join(",")})`;
        gctx.fillStyle = col; gctx.strokeStyle = col; gctx.lineWidth = 0.6;
        gctx.beginPath();
        gctx.moveTo(p0.x + p0.nx * w0, p0.y + p0.ny * w0);
        gctx.lineTo(p1.x + p1.nx * w1, p1.y + p1.ny * w1);
        gctx.lineTo(p1.x - p1.nx * w1, p1.y - p1.ny * w1);
        gctx.lineTo(p0.x - p0.nx * w0, p0.y - p0.ny * w0);
        gctx.closePath(); gctx.fill(); gctx.stroke();
      }
    });
  }

  function apply() {
    ground.style.opacity = clamp(t / 0.12);
    if (mode === "reels") return applyReels();
    const g = easeOut(clamp(t / 0.32));
    const { from, cas } = L;
    const sideTurn = rtl ? -1 : 1;
    const pose = {
      cx: lerp(from.cx, cas.cx, g), cy: lerp(from.cy, cas.cy, g), w: lerp(from.w, cas.w, g),
      rx: lerp(0, -0.14, g) + tilt.y, ry: lerp(0, 0.2 * sideTurn, g) + tilt.x, rz: lerp(-0.035, 0.015, g),
    };
    const progress = L.ribbons.map((_, i) => easeInOut(clamp((t - 0.22 - i * 0.035) / 0.55)));
    const reel = t * 11;
    if (gl) {
      gl.pose(pose); gl.reels(reel); gl.render();
    } else {
      const h = pose.w * (FACE.h / FACE.w);
      flat.style.width = `${cas.w}px`; flat.style.height = `${cas.h}px`;
      flat.style.transform = `translate(${pose.cx - pose.w / 2}px, ${pose.cy - h / 2}px) scale(${pose.w / cas.w}) rotate(${pose.rz}rad)`;
      const fg = flatC.getContext("2d"); fg.setTransform(1, 0, 0, 1, 0, 0);
      paintFlat(fg, face, reel, flatC.width / FACE.w);
    }
    drawRibbons(progress);
    links.forEach((a, i) => a.classList.toggle("on", progress[i] * L.ribbons[i].total >= L.ribbons[i].sIn));
    strip.classList.toggle("on", t > 0.75);
  }

  function applyReels() {
    const g = easeOut(clamp(t / 0.45));
    const { k, ox, oy, top, from } = L;
    // Grow from the sticker's first reel (radius 30 of 228) to the big reel.
    const k0 = (from.w / 0.94 / 228) * 30 / REELS.r;
    const sx = from.cx - (from.w / 0.94) * (62 / 228);
    const k1 = lerp(k0, k, g);
    const x1 = lerp(sx - top.x * k0, ox, g), y1 = lerp(from.cy - top.y * k0, oy, g);
    reelsBox.hidden = false;
    reelsBox.style.width = `${REELS.w}px`; reelsBox.style.height = `${REELS.h}px`;
    reelsBox.style.transform = `translate(${x1}px, ${y1}px) scale(${k1})`;
    const spin = (1 - easeOut(clamp(t / 0.9))) * -540;
    $(".reel.top", reelsBox).setAttribute("transform", `rotate(${spin} ${REELS.top.x} ${REELS.top.y})`);
    const tp = easeInOut(clamp((t - 0.35) / 0.4));
    const tape = $(".tape", reelsBox);
    tape.style.strokeDasharray = "1"; tape.style.strokeDashoffset = String(1 - tp);
    const b = $(".bottom", reelsBox);
    b.style.opacity = clamp((t - 0.6) / 0.2);
    links.forEach((a, i) => a.classList.toggle("on", t >= 0.4 + i * 0.05));
    strip.classList.toggle("on", t > 0.75);
  }

  // ---- The clock ----
  function frame(now) {
    raf = 0;
    const dt = last ? Math.min(100, now - last) : 16;
    last = now;
    if (dir) {
      t = clamp(t + (dir * dt) / (dir > 0 ? OPEN_MS : CLOSE_MS));
      if ((dir > 0 && t >= 1) || (dir < 0 && t <= 0)) { const d = dir; dir = 0; done(d); }
    }
    let settling = false;
    if (!reduced() && gl && mode === "ribbons") {
      tilt.x += (tilt.tx - tilt.x) * 0.12; tilt.y += (tilt.ty - tilt.y) * 0.12;
      settling = Math.abs(tilt.tx - tilt.x) + Math.abs(tilt.ty - tilt.y) > 0.0005;
    }
    if (!stage.hidden) apply();
    if (dir || settling) kick(); else last = 0;
  }
  const kick = () => { if (!raf) raf = requestAnimationFrame(frame); };
  function done(d) {
    if (d < 0) {
      stage.hidden = true; reelsBox.hidden = true;
      bar.classList.remove("is-open");
      hot = -1; tilt.tx = tilt.ty = tilt.x = tilt.y = 0;
    }
  }

  async function openMenu() {
    if (open) return;
    open = true;
    btn.setAttribute("aria-expanded", "true");
    bar.classList.add("is-open");
    stage.hidden = false;
    setInert(true);
    await ensureArt();
    if (!open) return;
    layout();
    if (reduced()) { t = 1; dir = 0; apply(); return; }
    apply(); last = 0;
    dir = 1; kick();
  }
  function closeMenu({ focus = "button", instant = false } = {}) {
    if (!open) return;
    open = false;
    btn.setAttribute("aria-expanded", "false");
    setInert(false);
    if (focus === "button") btn.focus();
    if (reduced() || instant) { t = 0; dir = 0; done(-1); return; }
    dir = -1; kick();
  }

  // ---- Events ----
  on(btn, "click", () => (open ? closeMenu() : openMenu()));
  // Build the case before it's asked for: on idle, or when the pointer or
  // focus reaches the sticker.
  const warm = () => { ensureArt(); };
  on(btn, "pointerenter", warm, { once: true });
  on(btn, "focus", warm, { once: true });
  if (window.requestIdleCallback) requestIdleCallback(warm, { timeout: 1500 }); else setTimeout(warm, 600);
  on(document, "keydown", (e) => {
    if (!open) return;
    if (e.key === "Escape") { e.preventDefault(); closeMenu(); return; }
    trap(bar, e);
  });
  // A click on the ground, the case or loose tape closes; on a ribbon it
  // follows that ribbon's link.
  on(stage, "click", (e) => {
    if (e.target.closest("a, .strip")) return;
    if (hot >= 0 && t === 1) { links[hot].click(); return; }
    closeMenu();
  });
  on(stage, "pointermove", (e) => {
    if (!open || t < 1) return;
    if (mode === "ribbons" && !e.target.closest("a, .strip")) {
      let best = -1, bd = Infinity;
      L.ribbons.forEach((rb, i) => {
        for (let k = 0; k < rb.pts.length; k += 2) {
          const p = rb.pts[k], dd = Math.hypot(p.x - e.clientX, p.y - e.clientY);
          if (dd < bd) { bd = dd; best = i; }
        }
      });
      const inCase = Math.abs(e.clientX - L.cas.cx) < L.cas.w / 2 && Math.abs(e.clientY - L.cas.cy) < L.cas.h / 2;
      const nh = !inCase && bd < L.tw / 2 + 7 ? best : -1;
      if (nh !== hot) {
        links[hot]?.classList.remove("hot"); hot = nh; links[hot]?.classList.add("hot");
        stage.style.cursor = hot >= 0 ? "pointer" : "";
        drawRibbons(L.ribbons.map(() => 1));
      }
      if (gl && !reduced()) { tilt.tx = ((e.clientX - L.W / 2) / L.W) * 0.35; tilt.ty = ((e.clientY - L.cas.cy) / L.H) * 0.25; kick(); }
    }
  });
  links.forEach((a, i) => {
    on(a, "pointerenter", () => { if (mode === "ribbons" && t === 1) { hot = i; drawRibbons(L.ribbons.map(() => 1)); } });
    on(a, "pointerleave", () => { if (mode === "ribbons" && t === 1) { hot = -1; drawRibbons(L.ribbons.map(() => 1)); } });
    on(a, "focus", () => { if (mode === "ribbons" && t === 1) { hot = i; drawRibbons(L.ribbons.map(() => 1)); } });
    on(a, "blur", () => { if (mode === "ribbons" && t === 1) { hot = -1; drawRibbons(L.ribbons.map(() => 1)); } });
  });
  on(window, "resize", () => { if (open || !stage.hidden) { layout(); apply(); } });

  // Hooks for the evidence script.
  window.__proto = {
    open: openMenu, close: closeMenu,
    seek(x) { dir = 0; t = clamp(x); if (!stage.hidden) apply(); },
    play() { dir = 1; kick(); },
    get t() { return t; },
    get gl() { return glState; },
  };
  return {
    isOpen: () => open,
    close: closeMenu,
    destroy() { ac.abort(); cancelAnimationFrame(raf); gl?.dispose(); setInert(false); },
  };
}

// ---------- The calm header's phone menu ----------
function calmController() {
  const btn = $(".menu-btn"), side = $("#side"), x = $(".side-close");
  const ac = new AbortController();
  let open = false;
  const show = () => { open = true; side.hidden = false; btn.setAttribute("aria-expanded", "true"); setInert(true); for (const el of [$(".calm-util"), $(".calm-sec")]) el.inert = true; x.focus(); };
  const hide = ({ focus = "button" } = {}) => { if (!open) return; open = false; side.hidden = true; btn.setAttribute("aria-expanded", "false"); setInert(false); for (const el of [$(".calm-util"), $(".calm-sec")]) el.inert = false; if (focus === "button") btn.focus(); };
  btn.addEventListener("click", show, { signal: ac.signal });
  x.addEventListener("click", () => hide(), { signal: ac.signal });
  document.addEventListener("keydown", (e) => { if (!open) return; if (e.key === "Escape") hide(); else trap(side, e); }, { signal: ac.signal });
  window.__proto = { open: show, close: hide };
  return { isOpen: () => open, close: hide, destroy() { ac.abort(); setInert(false); } };
}

// ---------- Prototype toolbar ----------
const proto = $("#proto");
function renderToolbar() {
  proto.hidden = !S.chrome;
  const wasOpen = proto.querySelector("details")?.open ?? innerWidth >= 820;
  const seg = (name, label, opts) => `<fieldset><legend>${label}</legend><span class="seg">${opts.map(([v, l]) => `<label><input type="radio" name="${name}" value="${v}"${S[name] === v ? " checked" : ""}><span>${l}</span></label>`).join("")}</span></fieldset>`;
  proto.innerHTML = `<details${wasOpen ? " open" : ""}><summary>Prototype controls</summary><div class="rows-p">
    ${seg("v", "Version", [["v2", "v2 tape on paper"], ["v1", "v1 dark 3D"]])}
    ${seg("header", "Header", [["cassette", "Cassette"], ["calm", "Calm (today)"]])}
    ${seg("layout", "Open as", [["ribbons", S.v === "v2" ? "Tape" : "Ribbons"], ["reels", "Reels"]])}
    ${seg("lang", "Language", [["en", "EN"], ["ar", "AR"]])}
    ${seg("motion", "Motion", [["full", "Full"], ["reduce", "Reduced"]])}
    ${S.v === "v2" ? seg("sound", "Sound", [["off", "Off"], ["on", "On"]]) : ""}
    ${S.v === "v1" ? seg("gl", "WebGL", [["on", "On"], ["off", "Off"]]) : ""}
    ${S.v === "v1" ? seg("ground", "Ground", [["dark", "Dark"], ["paper", "Paper"]]) : ""}
    <p class="hint">Not part of the design. Links stay on this page. Esc, the cassette, or a click on the ground closes.</p>
  </div></details>`;
}
proto.addEventListener("change", (e) => {
  const i = e.target;
  if (!(i instanceof HTMLInputElement)) return;
  if (i.name === "sound") { sound.set(i.value === "on"); S.sound = i.value; render(); return; }
  S[i.name] = i.value;
  render();
});

// ---------- Boot ----------
await Promise.all([
  document.fonts.load('400 30px "Instrument Serif"'),
  document.fonts.load('italic 400 60px "Instrument Serif"'),
  document.fonts.load('300 20px "Inter"'),
  document.fonts.load('500 24px "Inter"'),
  document.fonts.load('400 24px "IBM Plex Sans Arabic"', "الأقسام"),
]).catch(() => {});
render();
if (q.get("open") === "1") window.__proto?.open();
