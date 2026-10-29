/* Editor's Picks: an open box of tapes. See picks.css for the drawing.

   mount(root, api) builds the section in `root` and registers its cases and
   reels with the core. Positions are in design units: `d` is [x, y, w, h] on
   the 1344 × 820 desktop stage, `m` on the 358 × 700 phone stage. */

// The picks, in the order they're stacked: bottom of a pile first, so a case
// higher in the DOM is also higher in the pile and takes the pointer first.
// Each tape comes from api.tapes by key; a key the core lacks falls back to
// the next tape not yet shown.
// The floor is a parallelogram: its front rim runs from x 230 to 1344, its
// back rim from 0 to 1114, so a case at the front starts at x ≥ 230.
const SLOTS = [
  // the left pile, at the front
  { key: "01-a1", pose: "lie", tilt: 0, d: [244, 733, 346, 55], m: [54, 644, 250, 40] },
  { key: "01-b1", pose: "lie", tilt: 0.12, d: [256, 652, 348, 80], m: [54, 604, 250, 40] },
  { key: "88-a2", pose: "lie", tilt: 0.27, roll: -0.03, z: 4, d: [234, 561, 350, 116], m: [54, 564, 250, 40], tagBelow: true },
  // two standing against the back wall
  { key: "01-a2", pose: "stand", z: -24, d: [628, 396, 55, 346], m: [6, 434, 40, 250] },
  { key: "01-b4", pose: "stand", yaw: 0.32, z: -24, d: [698, 396, 122, 346], m: [312, 434, 40, 250], tagRight: true },
  // the right pile, at the front
  { key: "01-a3", pose: "lie", tilt: 0, d: [850, 733, 346, 55], m: [54, 524, 250, 40] },
  { key: "01-b2", pose: "lie", tilt: 0.12, roll: 0.02, d: [864, 652, 348, 80], m: [54, 484, 250, 40] },
  { key: "88-a1", pose: "lie", tilt: 0.27, roll: -0.02, z: 4, d: [842, 561, 350, 116], m: [54, 444, 250, 40], tagRight: true },
  { key: "01-b3", pose: "lie", tilt: 0.27, roll: 0.03, z: 8, d: [860, 506, 350, 116], m: [54, 404, 250, 40], tagBelow: true, tagRight: true },
];

// Loose reels on the floor, leaning on the piles: [x, y, diameter].
const REELS = [
  { d: [612, 736, 56], m: [56, 362, 42], tilt: 0.08 },
  { d: [674, 764, 28], m: [100, 384, 20], tilt: -0.1 },
  { d: [748, 738, 56], m: [266, 364, 40], tilt: 0.05 },
  { d: [812, 764, 28], m: [240, 388, 16], tilt: 0.12 },
  { d: [1224, 736, 56], m: null, tilt: -0.06 },
  { d: [1288, 766, 26], m: null, tilt: 0.1 },
  { d: [582, 768, 24], m: null, tilt: -0.04 },
];

const DESK = { w: 1344, h: 820 };
const PHONE = { w: 358, h: 700 };
const SVG = "http://www.w3.org/2000/svg";

function h(tag, props = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (v == null || v === false) continue;
    if (k === "class") el.className = v;
    else if (k === "text") el.textContent = v;
    else if (k === "style") el.style.cssText = v;
    else el.setAttribute(k, v === true ? "" : v);
  }
  for (const c of kids.flat()) if (c != null && c !== false) el.append(c);
  return el;
}
function s(tag, attrs = {}, ...kids) {
  const el = document.createElementNS(SVG, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  for (const c of kids.flat()) if (c) el.append(c);
  return el;
}
const poly = (pts, cls, extra = {}) => s("polygon", { points: pts.map((p) => p.join(",")).join(" "), class: cls, ...extra });
const line = (a, b, cls = "fold") => s("line", { x1: a[0], y1: a[1], x2: b[0], y2: b[1], class: cls });
const grad = (id, x2, y2, stops) => s("linearGradient", { id, x1: 0, y1: 0, x2, y2 },
  ...stops.map(([o, c]) => s("stop", { offset: o, "stop-color": "#d9d9d9", "stop-opacity": c })));

// The desktop box: an oblique view from the front right. The back wall and
// the inner left wall sit behind the piles; the right wall shows its outside,
// with the lid's flap folded out over it; the back and left flaps stand open.
function desktopBox() {
  const svg = s("svg", { class: "picks-box picks-box--d", viewBox: `0 0 ${DESK.w} ${DESK.h}`, "aria-hidden": "true" });
  svg.append(s("defs", {},
    grad("picks-g-back", 0, 1, [[0, 0.16], [1, 0.58]]),
    grad("picks-g-left", 1, 0, [[0, 0.62], [1, 0.3]]),
    grad("picks-g-floor", 0, 1, [[0, 0.5], [1, 0.1]]),
    grad("picks-g-right", 1, 0, [[0, 0.06], [1, 0.3]]),
  ));
  // the box's weight on the page
  svg.append(s("rect", { x: 236, y: 796, width: 1104, height: 10, rx: 5, class: "ground" }));
  // lid flaps standing open behind and to the left
  svg.append(poly([[-50, 52], [1064, 52], [1114, 212], [0, 212]], "face", { fill: "#fff" }));
  svg.append(poly([[-50, 52], [1064, 52], [1114, 212], [0, 212]], "cut"));
  // the left flap lies open, out of the box and off the page's edge
  svg.append(poly([[0, 212], [230, 362], [20, 362], [-210, 212]], "face", { fill: "#fff" }));
  svg.append(poly([[0, 212], [230, 362], [20, 362], [-210, 212]], "cut"));
  // inside: back wall, left wall, floor
  svg.append(poly([[0, 212], [1114, 212], [1114, 652], [0, 652]], "face", { fill: "url(#picks-g-back)" }));
  svg.append(poly([[0, 212], [230, 362], [230, 802], [0, 652]], "face", { fill: "url(#picks-g-left)" }));
  svg.append(poly([[0, 652], [1114, 652], [1344, 802], [230, 802]], "face", { fill: "url(#picks-g-floor)" }));
  // the right wall, seen from outside, and the lid flap folded over it
  svg.append(poly([[1114, 212], [1344, 362], [1344, 802], [1114, 652]], "face", { fill: "url(#picks-g-right)" }));
  svg.append(poly([[1114, 212], [1344, 362], [1344, 702], [1114, 552]], "face flap-teal"));
  svg.append(poly([[1114, 212], [1344, 362], [1344, 378], [1114, 228]], "face flap-fold"));
  svg.append(line([1344, 702], [1114, 552], "cut"));
  svg.append(line([1114, 552], [1114, 212], "cut"));
  svg.append(line([1344, 362], [1344, 702], "cut"));
  // folds: the rims and the inner edges
  for (const [a, b] of [
    [[0, 212], [1114, 212]], [[0, 212], [230, 362]], [[1114, 212], [1344, 362]],
    [[0, 212], [0, 652]], [[0, 652], [1114, 652]], [[0, 652], [230, 802]],
    [[1114, 212], [1114, 652]], [[1114, 652], [1344, 802]], [[1344, 362], [1344, 802]],
    [[230, 362], [230, 802]],
  ]) svg.append(line(a, b));
  return svg;
}

// The phone box: seen from the front, the back flap standing behind, the
// lid's flap folded in across the top and printed with the label.
function phoneBox() {
  const svg = s("svg", { class: "picks-box picks-box--m", viewBox: `0 0 ${PHONE.w} ${PHONE.h}`, "aria-hidden": "true" });
  svg.append(s("defs", {}, grad("picks-g-mback", 0, 1, [[0, 0.14], [1, 0.5]])));
  svg.append(s("rect", { x: 6, y: 694, width: 346, height: 8, rx: 4, class: "ground" }));
  svg.append(poly([[14, 0], [344, 0], [358, 100], [0, 100]], "face", { fill: "#fff" }));
  svg.append(poly([[14, 0], [344, 0], [358, 100], [0, 100]], "cut"));
  svg.append(poly([[0, 100], [358, 100], [358, 686], [0, 686]], "face", { fill: "url(#picks-g-mback)" }));
  svg.append(poly([[0, 100], [358, 100], [358, 248], [0, 248]], "face flap-teal"));
  svg.append(poly([[0, 100], [358, 100], [358, 112], [0, 112]], "face flap-fold"));
  svg.append(line([0, 248], [358, 248], "cut"));
  for (const [a, b] of [[[0, 100], [358, 100]], [[0, 100], [0, 686]], [[358, 100], [358, 686]]]) svg.append(line(a, b));
  return svg;
}

const px = (v) => `${v}`;
function vars(d, m) {
  const out = `--x:${px(d[0])};--y:${px(d[1])};--w:${px(d[2])};--h:${px(d[3] ?? d[2])}`;
  if (!m) return out;
  return `${out};--mx:${px(m[0])};--my:${px(m[1])};--mw:${px(m[2])};--mh:${px(m[3] ?? m[2])}`;
}

const two = (n) => String(n).padStart(2, "0");
const onColour = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  const l = (0.2126 * (n >> 16) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255;
  return l > 0.6 ? "#000" : "#fff";
};

export function mount(root, api) {
  const tapes = api.tapes ?? [];
  const used = new Set();
  const pick = (key) => {
    let t = tapes.find((x) => x.key === key && !used.has(x.key));
    if (!t) t = tapes.find((x) => !used.has(x.key));
    if (t) used.add(t.key);
    return t;
  };
  const picks = SLOTS.map((slot) => ({ slot, t: pick(slot.key) })).filter((p) => p.t);
  const vols = new Set(picks.map((p) => p.t.vol.n));

  root.classList.add("picks");
  root.classList.toggle("no3d", api.has3d === false);
  root.setAttribute("aria-labelledby", "picks-title");

  const stage = h("div", { class: "picks-stage" });
  stage.append(desktopBox(), phoneBox());

  stage.append(h("p", { class: "picks-note", text: "A mixtape from the editors: the tapes we’d hand a friend this week." }));

  const flap = h("div", { class: "picks-flap" },
    h("img", { class: "picks-warp", src: "assets/picks-warp.svg", alt: "", width: 198, height: 131, decoding: "async" }),
    h("div", { class: "picks-label" },
      h("span", { class: "k", text: "Volume" }),
      h("h2", { id: "picks-title", text: "Editor’s Picks" }),
      h("span", { class: "c", text: "Collection" }),
      h("span", { class: "k w", text: "Weekly updated" }),
    ),
  );
  stage.append(flap);

  stage.append(h("p", { class: "picks-stamp", text: `Contents · ${picks.length} tapes · ${vols.size} volume${vols.size === 1 ? "" : "s"}` }));
  stage.append(h("p", { class: "sr", text: `${picks.length} tapes from ${vols.size} volume${vols.size === 1 ? "" : "s"}, picked by the editors and updated weekly. Each tape opens its playlist.` }));

  // shadows, below the canvas
  const shade = h("div", { class: "picks-shade", "aria-hidden": "true" });
  for (const { slot } of picks) shade.append(h("i", { class: slot.pose, style: vars(slot.d, slot.m) }));
  for (const r of REELS) shade.append(h("i", { class: `reel${r.m ? "" : " d-only"}`, style: vars(r.d, r.m) }));
  stage.append(shade);

  // the picks
  const list = h("ul", { class: "picks-list", "aria-label": "Editor’s Picks" });
  const cases = [];
  for (const { slot, t } of picks) {
    const tagId = `picks-tag-${t.key}`;
    const name = t.label ?? `Vol. ${t.vol.n}, Side ${t.side}, Playlist ${two(t.n)}: ${t.name}`;
    const a = h("a", {
      class: `slot ${slot.pose}${slot.tilt ? " tilted" : ""}`,
      href: `#/${t.key}`,
      "aria-label": name,
      "aria-describedby": tagId,
      style: `--tape:${t.colour};--tape-top:${t.accent};--on-tape:${onColour(t.colour)}`,
    },
      h("span", { class: "spine", "aria-hidden": "true" }, h("b", { text: `Vol. ${t.vol.n} · ${t.side}${t.n}` }), h("i", { text: t.name })),
      h("span", { class: `tag${slot.tagRight ? " right" : ""}${slot.tagBelow ? " below" : ""}`, id: tagId, "aria-hidden": "true" },
        h("small", { text: `Vol. ${t.vol.n} · Side ${t.side} · ${t.side}${t.n}` }),
        h("strong", { text: t.name }),
        h("em", { text: t.vol.title }),
        h("ol", {}, (t.pieces ?? []).map((p, i) => h("li", {}, h("span", { text: two(i + 1) }), h("span", { text: p.title }), h("span", { text: p.form })))),
      ),
    );
    list.append(h("li", { style: vars(slot.d, slot.m) }, a));
    cases.push({ slot, el: a, t });
  }
  stage.append(list);

  // the reels
  const reels = h("div", { class: "picks-reels", "aria-hidden": "true" });
  const reelEls = REELS.map((r) => { const el = h("i", { class: r.m ? null : "d-only", style: vars(r.d, r.m) }); reels.append(el); return { r, el }; });
  stage.append(reels);
  stage.append(h("div", { class: "picks-lip", "aria-hidden": "true" }));
  root.replaceChildren(stage);

  // one design unit in px, from the stage's real width
  const phone = matchMedia("(max-width: 760px)");
  const fit = () => {
    const basis = phone.matches ? PHONE.w : DESK.w;
    const w = Math.min(root.clientWidth - 2 * parseFloat(getComputedStyle(root).paddingLeft) || basis, basis);
    stage.style.setProperty("--k", `${w / basis}px`);
  };
  fit();
  new ResizeObserver(fit).observe(root);

  if (api.has3d === false) return;

  // the 3D cases and reels; on the phone every case lies or stands straight
  const poseOf = (slot) => phone.matches
    ? { tilt: 0, yaw: 0, roll: 0, z: slot.pose === "stand" ? -12 : 0 }
    : { tilt: slot.tilt ?? 0, yaw: slot.yaw ?? 0, roll: slot.roll ?? 0, z: slot.z ?? 0 };
  const live = cases.map(({ slot, el, t }) => ({ slot, c: api.addCase({ k: t.k ?? tapes.indexOf(t), el, pose: slot.pose, ...poseOf(slot) }) }));
  const liveReels = reelEls.map(({ r, el }) => ({ r, el, o: api.addReel({ el, tilt: r.tilt ?? 0, spin: 0, z: 2 }) }));
  phone.addEventListener("change", () => {
    fit();
    for (const { slot, c } of live) c.set(poseOf(slot));
    api.kick?.();
  });
}
