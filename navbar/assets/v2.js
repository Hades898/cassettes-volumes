// v2, "spilled tape on paper" (Hady, 9 Nov). A small cassette sticker; a
// click lifts the cassette off it, the hubs turn and tape spills from the
// opening at its foot and drapes on the white page, the sections riding it
// as numbered track tags: Side A (A1–A4), Side B (B1–B4). SVG and canvas
// only: no three.js on every page. Links are one real list per side.
import { sound } from "./sound.js";

const INK = "#48382a", SHELL = "#221e1b", LABEL = "#ede6d8", TEAL = "#347e92";
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, k) => a + (b - a) * k;
const easeOut = (x) => 1 - Math.pow(1 - x, 3);
const easeInOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const $ = (s, r = document) => r.querySelector(s);
const track = (i) => `${i < 4 ? "A" : "B"}${(i % 4) + 1}`;

// ---------- Art ----------
// The sticker: a tiny cassette printed on white sticker paper with a peeled
// corner. 124 x 84 units.
const miniHub = (x) => `<g class="mhub" style="transform-origin:${x}px 31.5px"><circle cx="${x}" cy="31.5" r="5.6" fill="${LABEL}"/>${[0, 60, 120, 180, 240, 300].map((a) => `<rect x="${x - 0.9}" y="26.4" width="1.8" height="2.6" fill="#1b1714" transform="rotate(${a} ${x} 31.5)"/>`).join("")}<circle cx="${x}" cy="31.5" r="1.5" fill="#1b1714"/></g>`;
export const STICKER = `<svg class="stk-svg" viewBox="0 0 124 84" aria-hidden="true" focusable="false">
  <defs><linearGradient id="stk-curl" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".55" stop-color="#e9e5de"/><stop offset="1" stop-color="#cfc9bf"/></linearGradient></defs>
  <path class="paper" d="M8 2H116a6 6 0 0 1 6 6V63L101 82H8a6 6 0 0 1-6-6V8a6 6 0 0 1 6-6Z" fill="#fff"/>
  <g class="mini">
    <rect x="10" y="9" width="100" height="64" rx="5" fill="${SHELL}"/>
    <rect x="15" y="13" width="90" height="33" rx="1.5" fill="${LABEL}"/>
    <rect x="15" y="13" width="90" height="3" fill="${TEAL}"/>
    <rect x="20" y="19.5" width="34" height="1.4" fill="${INK}" opacity=".55"/>
    <rect x="80" y="19.5" width="20" height="1.4" fill="${INK}" opacity=".55"/>
    <rect x="29" y="24.5" width="62" height="14" rx="7" fill="#1b1714"/>
    ${miniHub(42)}${miniHub(78)}
    <rect x="53" y="29.5" width="14" height="4" rx="2" fill="#5a3e28"/>
    <path d="M31 73L35 59H85L89 73Z" fill="#171412"/>
    <circle cx="44" cy="66" r="1.6" fill="#050404"/><circle cx="76" cy="66" r="1.6" fill="#050404"/>
    <rect x="46" y="71" width="28" height="1.6" fill="#7a5434"/>
  </g>
  <rect class="slot" x="10.5" y="9.5" width="99" height="63" rx="5" fill="none" stroke="${INK}" stroke-width="1" stroke-dasharray="3 2.5"/>
  <path class="curl" d="M122 63L101 82Q104 70 108 66.5Q113 63.5 122 63Z" fill="url(#stk-curl)"/>
</svg>`;

// The open cassette: face units 1000 x 638 (press-v3's proportions).
const HUBS = [287.5, 712.5], HUB_Y = 256.7, WIN = 92;
function hubSVG(x, i) {
  let teeth = "";
  for (let k = 0; k < 6; k++) teeth += `<rect x="${x - 9}" y="${HUB_Y - 58}" width="18" height="17" fill="#14110f" transform="rotate(${k * 60} ${x} ${HUB_Y})"/>`;
  return `<g class="hub" data-i="${i}" style="transform-origin:${x}px ${HUB_Y}px"><circle cx="${x}" cy="${HUB_Y}" r="57.5" fill="${LABEL}"/>${teeth}<circle cx="${x}" cy="${HUB_Y}" r="14" fill="#14110f"/></g>`;
}
export function bigCassette(lang, LETTERING) {
  const packs = [150, 104];
  const windows = HUBS.map((x, i) => `
    <clipPath id="cw${i}"><circle cx="${x}" cy="${HUB_Y}" r="${WIN}"/></clipPath>
    <circle cx="${x}" cy="${HUB_Y}" r="${WIN}" fill="#14110f"/>
    <g clip-path="url(#cw${i})"><circle class="pack" data-i="${i}" cx="${x}" cy="${HUB_Y}" r="${packs[i]}" fill="#2b1d14"/>
      ${[70, 85, 100, 115, 130, 145].map((r) => `<circle cx="${x}" cy="${HUB_Y}" r="${r}" fill="none" stroke="rgba(0,0,0,.3)" stroke-width="1.5"/>`).join("")}</g>
    ${hubSVG(x, i)}
    <circle cx="${x - 22}" cy="${HUB_Y - 26}" r="50" fill="rgba(255,255,255,.07)"/>
    <circle cx="${x}" cy="${HUB_Y}" r="${WIN + 7}" fill="none" stroke="rgba(72,56,42,.55)" stroke-width="2" stroke-dasharray="8 6"/>`).join("");
  const title = lang === "ar"
    ? `<text x="918" y="425" text-anchor="end" font-family="IBM Plex Sans Arabic" font-size="50" fill="${INK}">الأقسام</text><text x="82" y="420" font-family="Inter" font-weight="300" font-size="22" fill="${INK}">C60</text>`
    : `<text x="82" y="425" font-family="Instrument Serif" font-style="italic" font-size="60" fill="${INK}">the sections</text><text x="918" y="420" text-anchor="end" font-family="Inter" font-weight="300" font-size="22" fill="${INK}">C60</text>`;
  return `<svg class="cas-svg" viewBox="0 0 1000 638" direction="ltr" aria-hidden="true" focusable="false">
  <defs><linearGradient id="cas-sheen" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".08"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".2"/></linearGradient></defs>
  <rect width="1000" height="638" rx="34" fill="${SHELL}"/><rect width="1000" height="638" rx="34" fill="url(#cas-sheen)"/>
  ${[[26, 26], [974, 26], [26, 612], [974, 612], [500, 470]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="10" fill="#0e0c0b"/><path d="M${x - 6} ${y}h12" stroke="rgba(255,255,255,.28)" stroke-width="2"/>`).join("")}
  <rect x="52" y="44" width="896" height="404" rx="6" fill="${LABEL}"/><rect x="52" y="44" width="896" height="14" fill="${TEAL}"/>
  <path transform="translate(78 70) scale(${64 / LETTERING.h})" fill="${INK}" fill-rule="evenodd" d="${LETTERING.d}"/>
  <text x="918" y="100" text-anchor="end" font-family="Inter" font-weight="500" font-size="24" fill="${INK}">SIDE A</text>
  <path d="M78 150H918" stroke="${INK}" stroke-opacity=".7" stroke-width="2" stroke-dasharray="9 7"/>
  <rect x="168" y="166" width="664" height="182" rx="91" fill="#2a2522"/>
  ${windows}
  <rect x="420" y="238" width="160" height="40" rx="20" fill="#14110f"/><rect x="430" y="252" width="140" height="10" fill="#6b4a2f"/>
  ${title}
  <path d="M214 638L258 506H742L786 638Z" fill="#171412"/>
  <circle cx="318" cy="566" r="13" fill="#070606"/><circle cx="682" cy="566" r="13" fill="#070606"/>
  <rect x="409" y="556" width="22" height="22" fill="#070606"/><rect x="569" y="556" width="22" height="22" fill="#070606"/>
  <rect x="300" y="622" width="400" height="9" fill="#6b4a2f"/>
</svg>`;
}
// The guides where the tape leaves the case, in face units.
const GUIDE = [{ x: 330, y: 630 }, { x: 670, y: 630 }];

// Reels (806:2100), horizontal labels this time.
const REELS = { w: 441, h: 686, top: { x: 220, y: 188 }, r: 73 };
function reelSVG(cx, cy, r, len, thick, at, cls = "") {
  let s = `<g class="reel ${cls}"><circle class="reel-body" cx="${cx}" cy="${cy}" r="${r}"/>`;
  for (let k = 0; k < 8; k++) { const a = k * 45, rad = (a * Math.PI) / 180; s += `<rect class="spoke" x="${-len / 2}" y="${-thick / 2}" width="${len}" height="${thick}" rx="${thick * 0.25}" transform="translate(${(cx + at * Math.cos(rad)).toFixed(2)} ${(cy + at * Math.sin(rad)).toFixed(2)}) rotate(${a})"/>`; }
  return s + "</g>";
}
const REELS_ART = `<svg viewBox="0 0 441 686" aria-hidden="true" focusable="false"><g class="mirror">${reelSVG(220, 188, 73, 27, 15, 47, "top")}<path class="tape" pathLength="1" d="M147 190 C 150 330, 270 330, 295 522"/><g class="bottom">${reelSVG(222, 522, 73, 27, 15, 47)}</g></g></svg>`;

// ---------- Markup ----------
export function v2Header(c) {
  const { t, KEYS, S, esc, href, soonItem, langLink, letteringSVG, LETTERING } = c;
  const sides = [t.sideA, t.sideB];
  const list = (from) => KEYS.slice(from, from + 4).map((k, j) => {
    const i = from + j;
    return `<li><a class="track" href="${href(k)}" data-go="${k}" data-i="${i}"${S.at === k ? ' aria-current="page"' : ""}><span class="num" aria-hidden="true" lang="en" dir="ltr">${track(i)}</span><span class="ttl">${esc(t.nav[k])}</span></a></li>`;
  }).join("");
  return `
  <div class="bar v2bar" id="bar">
    <button id="tape-btn" class="stk-btn" type="button" aria-expanded="false" aria-controls="stage">
      <span class="stk">${STICKER}</span><span class="stk-cap">${esc(t.menu)}</span>
    </button>
    <div id="stage" class="stage2" hidden>
      <div class="veil"></div>
      <canvas class="tape2" aria-hidden="true"></canvas>
      <div class="cas2" aria-hidden="true"><div class="cas-shadow"></div>${bigCassette(S.lang, LETTERING)}</div>
      <div class="reels2" aria-hidden="true" hidden>${REELS_ART}</div>
      <nav class="tracks" aria-label="${esc(t.sections)}" data-layout="${S.layout === "reels" ? "reels" : "tape"}">
        <p class="side-head" id="side-a">${esc(sides[0])}</p><ul aria-labelledby="side-a">${list(0)}</ul>
        <p class="side-head" id="side-b">${esc(sides[1])}</p><ul aria-labelledby="side-b">${list(4)}</ul>
      </nav>
      <div class="strip2">
        <nav aria-label="${esc(t.site)}">
          <ul><li><a class="word" href="${href("about")}" data-go="about">${esc(t.util.about)}</a></li><li>${soonItem(t.util.note)}</li><li>${soonItem(t.util.newsletter)}</li><li>${soonItem(t.util.subscribe, true)}</li><li>${soonItem(t.util.signIn, true)}</li></ul>
        </nav>
        <button type="button" class="sound-btn" aria-pressed="${sound.on}">${esc(t.sound)}<span class="sound-state" aria-hidden="true">${sound.on ? t.on : t.off}</span></button>
      </div>
    </div>
    <a class="lettering" href="${href("home")}" data-go="home" aria-label="Cassettes" lang="en">${letteringSVG}</a>
    <ul class="bar-end"><li><a class="key" href="${href("search")}" data-go="search">${esc(t.search)}</a></li><li>${langLink("word")}</li></ul>
  </div>`;
}

// ---------- Controller ----------
export function v2Controller(c) {
  const { S, KEYS, setInert, trap, reduced } = c;
  const bar = $("#bar"), btn = $("#tape-btn"), stage = $("#stage");
  const veil = $(".veil", stage), cv = $("canvas.tape2", stage), cas = $(".cas2", stage), casSvg = $(".cas-svg", cas);
  const shadow = $(".cas-shadow", cas), reelsBox = $(".reels2", stage);
  const links = [...stage.querySelectorAll(".track")], sides = [...stage.querySelectorAll(".side-head")];
  const strip = $(".strip2", stage), soundBtn = $(".sound-btn", stage);
  const hubs = [...casSvg.querySelectorAll(".hub")], packs = [...casSvg.querySelectorAll(".pack")];
  const miniHubs = [...btn.querySelectorAll(".mhub")];
  const rtl = S.lang === "ar", mode = S.layout === "reels" ? "reels" : "tape";
  const OPEN_MS = mode === "reels" ? 1100 : 1700, CLOSE_MS = 700;
  const ac = new AbortController();
  const on = (el, ev, fn, o = {}) => el.addEventListener(ev, fn, { ...o, signal: ac.signal });
  let t = 0, dir = 0, raf = 0, last = 0, open = false, L = null;
  const hot = links.map(() => ({ v: 0, to: 0 })); // hover/focus tightening, eased
  const g2 = cv.getContext("2d");

  // ---- Layout ----
  function layout() {
    const W = stage.clientWidth, H = stage.clientHeight, phone = W < 820;
    const barH = bar.offsetHeight, bottom = H - strip.offsetHeight;
    const d = Math.min(2, devicePixelRatio);
    cv.width = Math.round(W * d); cv.height = Math.round(H * d);
    // The sticker's printed cassette (10..110 x 9..73 of 124 x 84), rotated -6°.
    const sb = $(".stk", btn).getBoundingClientRect();
    const from = { cx: sb.left + sb.width * (60 / 124), cy: sb.top + sb.height * (41 / 84), w: sb.width * (100 / 124) };
    L = { W, H, phone, barH, bottom, from };
    if (mode === "reels") return layoutReels();
    const w = phone ? Math.min(W * 0.42, 170) : clamp(W * 0.19, 230, 290);
    const h = w * 0.638;
    L.cas = { cx: W / 2, cy: barH + (phone ? 14 : 24) + h / 2, w, h };
    const k = w / 1000, ox = L.cas.cx - w / 2, oy = L.cas.cy - h / 2;
    const guides = GUIDE.map((g) => ({ x: ox + g.x * k, y: oy + g.y * k }));
    L.tw = phone ? 7 : Math.max(8, w * 0.034);
    const sizes = links.map((a) => ({ w: a.offsetWidth, h: a.offsetHeight }));
    const sideH = sides[0].offsetHeight;
    L.strands = [];
    if (!phone) {
      // Two strands, one per side: Side A falls on the start side.
      const y0 = L.cas.cy + h / 2 + 96, y1 = bottom - 58;
      // Not mirror twins: Side B hangs lower and nearer, each tag a little off.
      const spans = [Math.min(W * 0.26, 390), Math.min(W * 0.22, 330)];
      const JX = [[0, 26, -12, 14], [-20, 8, 30, -6]];
      for (const s of [0, 1]) {
        const sign = (s === 0 ? -1 : 1) * (rtl ? -1 : 1);
        const colX = W / 2 + sign * spans[s];
        const idx = [0, 1, 2, 3].map((j) => s * 4 + j);
        const ys = idx.map((_, j) => s ? lerp(y0 + 48, y1, j / 3) : lerp(y0, y1 - 36, j / 3));
        const g = guides[sign < 0 ? 0 : 1];
        L.strands.push(strand(g, colX, ys, idx, sizes, sign, s, 0.22 + s * 0.16, 0.6, JX[s].map((v) => v * sign)));
        sides[s].style.transform = `translate(${colX - sides[s].offsetWidth / 2}px, ${ys[0] - 52 - sideH / 2}px)`;
      }
    } else {
      // One tape down the screen, the eight tracks in order along it.
      const y0 = L.cas.cy + h / 2 + 70, y1 = bottom - 30;
      const step = (y1 - y0) / 7.6;
      const ys = KEYS.map((_, i) => y0 + step * (i + (i >= 4 ? 0.6 : 0)));
      const sign = rtl ? 1 : -1;
      L.strands.push(strand(guides[1], W / 2, ys, KEYS.map((_, i) => i), sizes, sign, 0, 0.2, 0.74));
      sides[0].style.transform = `translate(${W / 2 - sides[0].offsetWidth / 2}px, ${y0 - 40 - sideH / 2}px)`;
      sides[1].style.transform = `translate(${W / 2 - sides[1].offsetWidth / 2}px, ${(ys[3] + ys[4]) / 2 - sideH / 2 + 2}px)`;
    }
  }

  // A strand: from a guide, a short fall and curl, then back and forth
  // through its tags (riding flat under each), with a loose loop at each
  // turn, and a dangling end. Catmull-Rom through authored points.
  function strand(G, colX0, ys, idx, sizes, sign, seed, start, dur, jx = []) {
    let colX = colX0;
    const { phone } = L;
    const maxW = Math.max(...idx.map((i) => sizes[i].w));
    const way = [], tagAt = [];
    const push = (p) => way.push(p);
    push({ x: G.x, y: G.y - 2 });
    push({ x: G.x + sign * 6, y: G.y + (phone ? 18 : 26) });
    // A first curl just under the case.
    const c0 = { x: G.x + sign * (phone ? 26 : 44), y: G.y + (phone ? 40 : 58) }, r0 = phone ? 12 : 20;
    for (let a = -90; a <= 270; a += 60) push({ x: c0.x - sign * r0 * Math.cos((a * Math.PI) / 180), y: c0.y + r0 * Math.sin((a * Math.PI) / 180) });
    idx.forEach((i, j) => {
      const y = ys[j], dj = j % 2 ? -sign : sign; // direction of travel through this tag
      colX = colX0 + (jx[j] || 0);
      const half = sizes[i].w / 2 + (phone ? 10 : 16);
      push({ x: colX - dj * (half + 18), y: y + 2 });
      push({ x: colX - dj * half, y });
      tagAt.push({ i, n: way.length, y, x: colX }); push({ x: colX, y });
      push({ x: colX + dj * half, y });
      if (j === idx.length - 1) {
        // The loose end falls away.
        push({ x: colX + dj * (half + 26), y: y + 16 });
        push({ x: colX + dj * (half + 34), y: y + (phone ? 34 : 52) });
        push({ x: colX + dj * (half + 14), y: y + (phone ? 46 : 74) });
        return;
      }
      // The turn: a half loop outside the column, and on alternate turns a
      // little extra curl, as loose tape falls.
      const yn = ys[j + 1], cy = (y + yn) / 2, r = Math.min((yn - y) / 2, phone ? 30 : 46);
      const cx = colX0 + dj * (maxW / 2 + (phone ? 12 : 26) + (j % 2 ? 10 : 0));
      const extra = (j + seed) % 2 === 0;
      const steps = extra ? 14 : 6, sweep = extra ? 540 : 180;
      for (let k = 1; k < steps; k++) {
        const a = -90 + (sweep * k) / steps, rad = (a * Math.PI) / 180;
        const rr = extra ? r * (0.55 + 0.45 * (k / steps)) : r;
        push({ x: cx + dj * rr * Math.cos(rad) * (phone ? 0.7 : 1), y: cy + rr * Math.sin(rad) * (extra && k < steps / 2 ? 0.7 : 1) });
      }
    });
    // Sample.
    const N = 12, pts = [];
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
    const tags = tagAt.map((a) => ({ ...a, s: pts[a.n * N].s, half: sizes[a.i].w / 2 }));
    const period = phone ? 90 : 130;
    for (let k = 0; k < pts.length; k++) {
      const p = pts[k], a = pts[Math.max(0, k - 1)], b = pts[Math.min(pts.length - 1, k + 1)];
      const tx = b.x - a.x, ty = b.y - a.y, len = Math.hypot(tx, ty) || 1;
      p.nx = -ty / len; p.ny = tx / len; p.tx = tx / len; p.ty = ty / len;
      // Flat under each tag and at the guide; twisting between.
      let flat = 1 - clamp(p.s / 24);
      let near = Infinity;
      for (const g of tags) { const d = Math.abs(p.s - g.s); flat = Math.max(flat, 1 - clamp((d - g.half - 6) / 50)); if (d < Math.abs(near)) near = p.s - g.s; }
      p.c = Math.cos(((near / period) * Math.PI * 2) * (1 - flat));
      p.hotW = tags.map((g) => Math.exp(-Math.pow((p.s - g.s) / (g.half + 46), 2)));
    }
    return { pts, total: s, tags, start, dur };
  }

  function layoutReels() {
    const { W, barH, bottom } = L;
    const availH = bottom - barH - 24;
    const k = Math.min((W - 24) / (REELS.w + (W < 820 ? 40 : 120)), availH / REELS.h, 1.2);
    const ox = W / 2 - (REELS.w / 2) * k, oy = barH + 12 + (availH - REELS.h * k) / 2;
    Object.assign(L, { k, ox, oy });
    $(".mirror", reelsBox).setAttribute("transform", rtl ? `translate(${REELS.w} 0) scale(-1 1)` : "");
    const top = { x: rtl ? REELS.w - REELS.top.x : REELS.top.x, y: REELS.top.y };
    L.top = top;
    const ANG = [180, 225, 270, 315, 0, 45, 90, 135];
    const cx = ox + top.x * k, cy = oy + top.y * k, R0 = (REELS.r + 22) * k;
    links.forEach((a, i) => {
      let th = ANG[i]; if (rtl) th = (540 - th) % 360;
      const rad = (th * Math.PI) / 180, w = a.offsetWidth, h = a.offsetHeight;
      const diag = Math.abs(Math.cos(rad)) > 0.2 && Math.abs(Math.sin(rad)) > 0.2, vert = Math.abs(Math.cos(rad)) < 0.2;
      const f = vert ? 1.32 : diag ? 1.14 : 1;
      const ax = cx + R0 * f * Math.cos(rad), ay = cy + R0 * f * Math.sin(rad);
      const cos = Math.cos(rad), sin = Math.sin(rad);
      // Horizontal labels, pushed out from the reel by their own box.
      const x = Math.abs(cos) < 0.2 ? ax - w / 2 : cos > 0 ? ax : ax - w;
      const y = Math.abs(sin) < 0.2 ? ay - h / 2 : sin > 0 ? ay + (Math.abs(cos) < 0.2 ? 0 : -h * 0.2) : ay - h + (Math.abs(cos) < 0.2 ? 0 : h * 0.2);
      a.dataset.x = x; a.dataset.y = y;
    });
    sides.forEach((s) => (s.style.transform = "translate(-999px,-999px)"));
  }

  // ---- Drawing ----
  const SETTLE = 240; // px of tape behind the tip still settling
  function heads() {
    return L.strands.map((st) => easeInOut(clamp((t - st.start) / st.dur)) * (st.total + SETTLE));
  }
  // How far a point at arc s sits above rest: lifted at the tip, it falls
  // and bounces once as more tape comes out.
  const drop = (head, s) => {
    if (head <= s) return 0;
    const tau = (head - s) / 110;
    return -(L.phone ? 14 : 22) * Math.exp(-3 * tau) * Math.cos(5 * tau);
  };
  function draw(hs) {
    const d = cv.width / L.W;
    g2.setTransform(1, 0, 0, 1, 0, 0); g2.clearRect(0, 0, cv.width, cv.height); g2.setTransform(d, 0, 0, d, 0, 0);
    L.strands.forEach((st, si) => {
      const head = hs[si], upto = Math.min(head, st.total);
      if (upto <= 0) return;
      const P = st.pts;
      let prev = null;
      for (let k = 0; k < P.length; k++) {
        let p = P[k];
        if (p.s > upto) { if (!prev) break; const f = (upto - prev.p.s) / (p.s - prev.p.s); p = { ...p, x: lerp(prev.p.x, p.x, f), y: lerp(prev.p.y, p.y, f), s: upto }; }
        let tight = 0; for (let g = 0; g < st.tags.length; g++) tight = Math.max(tight, P[k].hotW[g] * hot[st.tags[g].i].v);
        const y = p.y + drop(head, p.s) - 3 * tight;
        const c = lerp(p.c, 1, tight);
        const hw = (L.tw * Math.max(0.14, Math.abs(c))) / 2;
        const cur = { x: p.x, y, nx: p.nx, ny: p.ny, hw, c, p };
        if (prev) {
          const front = (prev.c + c) / 2 >= 0, face = Math.abs((prev.c + c) / 2);
          const light = 0.66 + 0.34 * face + 0.14 * (-0.5 * p.nx - 0.85 * p.ny) + 0.12 * tight;
          const base = front ? [124, 84, 52] : [70, 48, 30];
          const col = `rgb(${base.map((v) => Math.round(clamp(v * light, 0, 255))).join(",")})`;
          g2.fillStyle = col; g2.strokeStyle = col; g2.lineWidth = 0.6;
          g2.beginPath();
          g2.moveTo(prev.x + prev.nx * prev.hw, prev.y + prev.ny * prev.hw);
          g2.lineTo(cur.x + cur.nx * cur.hw, cur.y + cur.ny * cur.hw);
          g2.lineTo(cur.x - cur.nx * cur.hw, cur.y - cur.ny * cur.hw);
          g2.lineTo(prev.x - prev.nx * prev.hw, prev.y - prev.ny * prev.hw);
          g2.closePath(); g2.fill(); g2.stroke();
          // The sheen: a thin light line along the face of the tape.
          if (front && face > 0.6) { g2.strokeStyle = `rgba(255,236,210,${0.18 * face})`; g2.lineWidth = 1; g2.beginPath(); g2.moveTo(prev.x - prev.nx * prev.hw * 0.3, prev.y - prev.ny * prev.hw * 0.3); g2.lineTo(cur.x - cur.nx * cur.hw * 0.3, cur.y - cur.ny * cur.hw * 0.3); g2.stroke(); }
        }
        prev = cur;
        if (p.s >= upto) break;
      }
    });
  }

  function placeTracks(hs) {
    L.strands.forEach((st, si) => {
      const head = hs[si];
      st.tags.forEach((g) => {
        const a = links[g.i];
        const k = st.pts.findIndex((p) => p.s >= g.s);
        const p = st.pts[k];
        const dy = drop(head, g.s), hv = hot[g.i].v;
        const tau = Math.max(0, (head - g.s) / 110);
        const swing = head > g.s ? 5 * Math.exp(-3 * tau) * Math.sin(5 * tau) : 0;
        let ang = (Math.atan2(p.ty, p.tx) * 180) / Math.PI; if (ang > 90) ang -= 180; if (ang < -90) ang += 180;
        ang = clamp(ang, -5, 5) + swing;
        a.style.transform = `translate(${(g.x - a.offsetWidth / 2).toFixed(1)}px, ${(g.y + dy - a.offsetHeight / 2 - 3 * hv).toFixed(1)}px) rotate(${ang.toFixed(2)}deg)`;
        a.classList.toggle("on", head >= g.s - g.half);
      });
    });
  }

  function apply() {
    veil.style.opacity = String(clamp(t / 0.15) * 0.95);
    if (mode === "reels") return applyReels();
    const g = easeOut(clamp(t / 0.3)), { from, cas: C } = L;
    const w = lerp(from.w, C.w, g), cx = lerp(from.cx, C.cx, g), cy = lerp(from.cy, C.cy, g) - Math.sin(Math.PI * g) * 18;
    const rz = lerp(-6, -1.5, g), rx = lerp(0, 4, g) + Math.sin(Math.PI * g) * 16;
    cas.style.width = `${C.w}px`; cas.style.height = `${C.h}px`;
    cas.style.transform = `translate(${cx - C.w / 2}px, ${cy - C.h / 2}px) scale(${w / C.w}) rotate(${rz}deg) skewX(${(rx * 0.15).toFixed(2)}deg)`;
    cas.style.opacity = t > 0 ? "1" : "0";
    shadow.style.opacity = String(0.25 + 0.35 * Math.sin(Math.PI * clamp(g)) + 0.15 * g);
    const hs = heads();
    // Hubs turn as tape leaves: by length out, over the hub's girth.
    const out = hs.reduce((a, h, i) => a + Math.min(h, L.strands[i].total), 0);
    const ang = (out / (Math.PI * 30)) * 180;
    hubs.forEach((h, i) => (h.style.transform = `rotate(${(i ? 1 : -1) * ang * (rtl ? -1 : 1)}deg)`));
    draw(hs); placeTracks(hs);
    sides.forEach((s, i) => s.classList.toggle("on", hs[Math.min(i, hs.length - 1)] > (L.phone && i ? L.strands[0].tags[4].s - 60 : 10)));
    strip.classList.toggle("on", t > 0.72);
  }

  function applyReels() {
    const g = easeOut(clamp(t / 0.45)), { k, ox, oy, top, from } = L;
    const k0 = (from.w * 0.056) / REELS.r; // the sticker's hub, about 5.6 of 100
    const sx = from.cx - from.w * 0.18;
    reelsBox.hidden = false;
    reelsBox.style.width = `${REELS.w}px`; reelsBox.style.height = `${REELS.h}px`;
    reelsBox.style.transform = `translate(${lerp(sx - top.x * k0, ox, g)}px, ${lerp(from.cy - top.y * k0, oy, g)}px) scale(${lerp(k0, k, g)})`;
    const spin = (1 - easeOut(clamp(t / 0.9))) * -540;
    $(".reel.top", reelsBox).setAttribute("transform", `rotate(${spin} ${REELS.top.x} ${REELS.top.y})`);
    const tape = $(".tape", reelsBox); tape.style.strokeDasharray = "1"; tape.style.strokeDashoffset = String(1 - easeInOut(clamp((t - 0.35) / 0.4)));
    $(".bottom", reelsBox).style.opacity = String(clamp((t - 0.6) / 0.2));
    links.forEach((a, i) => {
      a.classList.toggle("on", t >= 0.4 + i * 0.05);
      a.style.transform = `translate(${a.dataset.x}px, ${(+a.dataset.y - 3 * hot[i].v).toFixed(1)}px)`;
    });
    strip.classList.toggle("on", t > 0.72);
    cas.style.opacity = "0";
  }

  // ---- Clock (runs only while something moves) ----
  function frame(now) {
    raf = 0;
    const dt = last ? Math.min(100, now - last) : 16; last = now;
    if (dir) {
      t = clamp(t + (dir * dt) / (dir > 0 ? OPEN_MS : CLOSE_MS));
      if ((dir > 0 && t >= 1) || (dir < 0 && t <= 0)) { const d = dir; dir = 0; if (d < 0) finishClose(); }
    }
    let easing = false;
    for (const h of hot) { const k = reduced() ? 1 : 1 - Math.exp(-dt / 80); h.v += (h.to - h.v) * k; if (Math.abs(h.to - h.v) > 0.004) easing = true; else h.v = h.to; }
    if (!stage.hidden) apply();
    if (dir || easing) kick(); else last = 0;
  }
  const kick = () => { if (!raf) raf = requestAnimationFrame(frame); };

  function openMenu() {
    if (open) return;
    open = true;
    sound.wake(); sound.click();
    btn.setAttribute("aria-expanded", "true");
    bar.classList.add("is-open2");
    stage.hidden = false;
    setInert(true);
    layout();
    if (reduced()) { t = 1; dir = 0; apply(); return; }
    apply(); last = 0; dir = 1; kick();
  }
  function closeMenu({ focus = "button", instant = false } = {}) {
    if (!open) return;
    open = false;
    btn.setAttribute("aria-expanded", "false");
    setInert(false);
    hot.forEach((h) => (h.to = 0));
    if (focus === "button") btn.focus();
    if (reduced() || instant) { t = 0; dir = 0; finishClose(); return; }
    sound.whirr(CLOSE_MS * t);
    dir = -1; kick();
  }
  function finishClose() {
    stage.hidden = true; reelsBox.hidden = true;
    bar.classList.remove("is-open2");
    hot.forEach((h) => (h.v = h.to = 0));
  }

  // ---- Sticker: reels at rest; the pointer's speed turns them ----
  let spin = 0, spinV = 0, spinRaf = 0, lastP = null;
  const spinFrame = () => {
    spinRaf = 0;
    spin += spinV; spinV *= 0.9;
    miniHubs.forEach((h) => (h.style.transform = `rotate(${spin}deg)`));
    if (Math.abs(spinV) > 0.05) spinRaf = requestAnimationFrame(spinFrame);
  };
  const nudge = (v) => { if (reduced()) return; spinV = clamp(spinV + v, -40, 40); if (!spinRaf) spinRaf = requestAnimationFrame(spinFrame); };
  on(btn, "pointermove", (e) => {
    if (lastP) nudge(Math.hypot(e.clientX - lastP.x, e.clientY - lastP.y) * 0.35 * (e.clientX >= lastP.x ? 1 : -1));
    lastP = { x: e.clientX, y: e.clientY };
  });
  on(btn, "pointerleave", () => (lastP = null));
  on(btn, "focus", () => nudge(14));

  // ---- Events ----
  on(btn, "click", () => (open ? closeMenu() : openMenu()));
  on(document, "keydown", (e) => {
    if (!open) return;
    if (e.key === "Escape") { e.preventDefault(); closeMenu(); return; }
    trap(bar, e);
  });
  on(stage, "click", (e) => { if (e.target.closest("a, button, .strip2")) return; closeMenu(); });
  links.forEach((a, i) => {
    const heat = (v) => { hot[i].to = v; if (v) sound.note(i); kick(); };
    on(a, "pointerenter", () => heat(1)); on(a, "pointerleave", () => heat(0));
    on(a, "focus", () => heat(1)); on(a, "blur", () => heat(0));
  });
  on(soundBtn, "click", () => {
    sound.set(!sound.on);
    soundBtn.setAttribute("aria-pressed", String(sound.on));
    $(".sound-state", soundBtn).textContent = sound.on ? c.t.on : c.t.off;
    c.onSound?.();
    if (sound.on) sound.note(0);
  });
  on(window, "resize", () => { if (!stage.hidden) { layout(); apply(); } });

  window.__proto = {
    open: async () => openMenu(), close: closeMenu,
    seek(x) { dir = 0; t = clamp(x); if (!stage.hidden) apply(); },
    get t() { return t; }, get gl() { return "none (SVG)"; },
    hot(i) { hot.forEach((h, k) => (h.v = h.to = k === i ? 1 : 0)); if (!stage.hidden) apply(); },
  };
  return { isOpen: () => open, close: closeMenu, destroy() { ac.abort(); cancelAnimationFrame(raf); cancelAnimationFrame(spinRaf); setInert(false); } };
}
