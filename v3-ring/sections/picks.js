/* Editor's Picks: an open box of tapes you can pick up and move around.

   mount(root, api) builds the section in `root`, registers its cases and
   reels with the core, and runs a small 2D simulation in the box's front
   plane: gravity, the floor, the walls, and tapes resting on tapes. A tape
   is a link: a plain click opens its playlist; a drag moves it. The core
   draws each case at its anchor's box every frame, so moving the anchor
   moves the tape (see sections/CONTRACT.md and picks.css).

   Positions are design units: the desktop stage is 1344 × 650, the phone
   stage 358 × 700. picks.css turns a unit into px through `--k`. */

const DESK = { w: 1344, h: 650, inner: 1114, floor: 640, ceil: -90, case: [280, 45], stand: [45, 280], turned: [92, 280] };
const PHONE = { w: 358, h: 700, inner: 358, floor: 686, ceil: -10, case: [250, 40], stand: [40, 250], turned: [40, 250] };

// The picks, bottom of each pile first. `at` is where a case starts, on
// each stage; it then falls into place. A key the core lacks falls back to
// the next tape not yet shown.
const SLOTS = [
  { key: "01-a1", pose: "lie", tilt: 0.03, roll: 0.012, at: { d: [26, 590], m: [54, 640] } },
  { key: "01-b1", pose: "lie", tilt: 0.07, roll: -0.018, at: { d: [42, 540], m: [54, 594] } },
  { key: "88-a2", pose: "lie", tilt: 0.1, roll: 0.01, at: { d: [14, 490], m: [54, 548] } },
  { key: "01-a2", pose: "lie", tilt: 0.17, roll: -0.025, at: { d: [52, 440], m: [54, 502] } },
  { key: "01-b4", pose: "stand", yaw: 0.3, at: { d: [392, 350], m: [6, 400] } },
  { key: "88-a1", pose: "stand", roll: -0.015, at: { d: [506, 350], m: [312, 400] } },
  { key: "01-a3", pose: "lie", tilt: 0.04, roll: -0.01, at: { d: [690, 590], m: [54, 456] } },
  { key: "01-b2", pose: "lie", tilt: 0.09, roll: 0.02, at: { d: [712, 540], m: [54, 410] } },
  { key: "01-b3", pose: "lie", tilt: 0.16, roll: -0.014, at: { d: [678, 490], m: [54, 364] } },
];
// Loose reels: diameter and where they start.
const REELS = [
  { d: [330, 586, 50], m: [60, 340, 40] },
  { d: [388, 612, 26], m: [104, 362, 20] },
  { d: [600, 586, 50], m: [262, 342, 40] },
  { d: [654, 614, 24], m: [236, 366, 16] },
  { d: [1012, 586, 50], m: null },
  { d: [1068, 614, 24], m: null },
];

const G = 3400, BOUNCE = 0.26, BOUNCE_MIN = 180, FRICTION = 0.55, STILL = 0.22, MAX_V = 2200;
const SVG = "http://www.w3.org/2000/svg";
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const two = (n) => String(n).padStart(2, "0");

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
const line = (a, b, cls = "picks-fold") => s("line", { x1: a[0], y1: a[1], x2: b[0], y2: b[1], class: cls });
const grad = (id, x2, y2, stops) => s("linearGradient", { id, x1: 0, y1: 0, x2, y2 },
  ...stops.map(([o, c]) => s("stop", { offset: o, "stop-color": "#c9c9c9", "stop-opacity": c })));
const onColour = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return (0.2126 * (n >> 16) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255 > 0.6 ? "#000" : "#fff";
};

/* The desktop box, as a dieline: dashed folds, solid cuts, seen from the
   front and a little to the right, so the back recedes up and right. The
   front face is open to the eye, as the wireframe draws it; the floor, the
   inner left wall and the back wall show through it; the right wall shows
   its outside, with the lid's flap folded down over it and printed teal.
   The back flap stands open behind; the left flap lies open off the page. */
function desktopBox() {
  const svg = s("svg", { class: "picks-box picks-box--d", viewBox: `0 0 ${DESK.w} ${DESK.h}`, "aria-hidden": "true" });
  svg.append(s("defs", {},
    grad("picks-g-back", 0, 1, [[0, 0.1], [1, 0.5]]),
    grad("picks-g-left", 1, 0, [[0, 0.22], [1, 0.52]]),
    grad("picks-g-floor", 0, 1, [[0, 0.5], [1, 0.06]]),
    grad("picks-g-right", 1, 0, [[0, 0.04], [1, 0.24]]),
  ));
  svg.append(s("rect", { x: 8, y: 634, width: 1330, height: 10, rx: 5, class: "picks-ground" }));
  // the back flap, standing open; the left flap, lying open
  svg.append(poly([[230, 90], [1344, 90], [1364, 0], [250, 0]], "picks-face picks-paper"));
  svg.append(poly([[230, 90], [1344, 90], [1364, 0], [250, 0]], "picks-cut"));
  svg.append(poly([[0, 190], [230, 90], [10, 90], [-220, 190]], "picks-face picks-paper"));
  svg.append(poly([[0, 190], [230, 90], [10, 90], [-220, 190]], "picks-cut"));
  // inside: back wall, left wall, floor
  svg.append(poly([[230, 90], [1344, 90], [1344, 540], [230, 540]], "picks-face", { fill: "url(#picks-g-back)" }));
  svg.append(poly([[0, 190], [230, 90], [230, 540], [0, 640]], "picks-face", { fill: "url(#picks-g-left)" }));
  svg.append(poly([[0, 640], [1114, 640], [1344, 540], [230, 540]], "picks-face", { fill: "url(#picks-g-floor)" }));
  // the right wall from outside, the lid's flap folded down over it
  svg.append(poly([[1114, 190], [1344, 90], [1344, 540], [1114, 640]], "picks-face", { fill: "url(#picks-g-right)" }));
  svg.append(poly([[1114, 190], [1344, 90], [1344, 400], [1114, 500]], "picks-face picks-flap-teal"));
  svg.append(poly([[1114, 190], [1344, 90], [1344, 104], [1114, 204]], "picks-face picks-flap-fold"));
  svg.append(line([1114, 500], [1344, 400], "picks-cut"));
  svg.append(line([1114, 190], [1114, 500], "picks-cut"));
  svg.append(line([1344, 90], [1344, 400], "picks-cut"));
  // folds: rims, inner edges, and the open front face
  for (const [a, b] of [
    [[230, 90], [1344, 90]], [[0, 190], [230, 90]], [[1114, 190], [1344, 90]],
    [[230, 90], [230, 540]], [[230, 540], [1344, 540]], [[1344, 90], [1344, 540]],
    [[0, 640], [230, 540]], [[1114, 640], [1344, 540]], [[1344, 540], [1344, 640]],
    [[0, 190], [1114, 190]], [[0, 190], [0, 640]], [[1114, 190], [1114, 640]],
  ]) svg.append(line(a, b));
  svg.append(line([0, 640], [1114, 640], "picks-cut"));
  return svg;
}

// The phone box, from the front: the back flap standing behind, the lid's
// flap folded in across the top, printed with the label.
function phoneBox() {
  const svg = s("svg", { class: "picks-box picks-box--m", viewBox: `0 0 ${PHONE.w} ${PHONE.h}`, "aria-hidden": "true" });
  svg.append(s("defs", {}, grad("picks-g-mback", 0, 1, [[0, 0.12], [1, 0.46]])));
  svg.append(s("rect", { x: 6, y: 682, width: 346, height: 8, rx: 4, class: "picks-ground" }));
  svg.append(poly([[14, 0], [344, 0], [358, 100], [0, 100]], "picks-face picks-paper"));
  svg.append(poly([[14, 0], [344, 0], [358, 100], [0, 100]], "picks-cut"));
  svg.append(poly([[0, 100], [358, 100], [358, 686], [0, 686]], "picks-face", { fill: "url(#picks-g-mback)" }));
  svg.append(poly([[0, 100], [358, 100], [358, 248], [0, 248]], "picks-face picks-flap-teal"));
  svg.append(poly([[0, 100], [358, 100], [358, 112], [0, 112]], "picks-face picks-flap-fold"));
  svg.append(line([0, 248], [358, 248], "picks-cut"));
  for (const [a, b] of [[[0, 100], [358, 100]], [[0, 100], [0, 686]], [[358, 100], [358, 686]]]) svg.append(line(a, b));
  svg.append(line([0, 686], [358, 686], "picks-cut"));
  return svg;
}

export function mount(root, api) {
  const tapes = api.tapes ?? [];
  const reduce = !!api.reduceMotion;
  const used = new Set();
  const pick = (key) => {
    const t = tapes.find((x) => x.key === key && !used.has(x.key)) ?? tapes.find((x) => !used.has(x.key));
    if (t) used.add(t.key);
    return t;
  };
  const picks = SLOTS.map((slot) => ({ slot, t: pick(slot.key) })).filter((p) => p.t);
  const vols = new Set(picks.map((p) => p.t.vol.n));
  const plural = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;

  root.classList.add("picks");
  root.classList.toggle("picks-no3d", api.has3d === false);
  root.setAttribute("aria-labelledby", "picks-title");

  /* ------------------------------------------------------------ the DOM */
  const stage = h("div", { class: "picks-stage" });
  stage.append(desktopBox(), phoneBox());
  stage.append(h("p", { class: "picks-note", text: "A mixtape from the editors: the tapes we’d hand a friend this week." }));
  stage.append(h("div", { class: "picks-flap" },
    h("img", { class: "picks-warp", src: "assets/picks-warp.svg", alt: "", width: 198, height: 131, decoding: "async" }),
    h("div", { class: "picks-label" },
      h("span", { class: "picks-k", text: "Volume" }),
      h("h2", { id: "picks-title", text: "Editor’s Picks" }),
      h("span", { class: "picks-c", text: "Collection" }),
      h("span", { class: "picks-k picks-w", text: "Weekly updated" }),
    ),
  ));
  stage.append(h("p", { class: "picks-stamp", text: `Contents · ${plural(picks.length, "tape")} · ${plural(vols.size, "volume")}` }));
  stage.append(h("p", { class: "picks-sr", text: `${plural(picks.length, "tape")} from ${plural(vols.size, "volume")}, picked by the editors and updated weekly. Each tape is a link to its playlist; the arrow keys move it about the box.` }));

  const shade = h("div", { class: "picks-shade", "aria-hidden": "true" });
  const list = h("ul", { class: "picks-list", "aria-label": "Editor’s Picks" });
  const reels = h("div", { class: "picks-reels", "aria-hidden": "true" });
  const bodies = [];

  for (const { slot, t } of picks) {
    const tagId = `picks-tag-${t.key}`;
    const name = t.label ?? `Vol. ${t.vol.n}, Side ${t.side}, Playlist ${two(t.n)}: ${t.name}`;
    const a = h("a", {
      class: `picks-slot picks-${slot.pose}`, href: `#/${t.key}`, "aria-label": name, "aria-describedby": tagId, draggable: "false",
      style: `--tape:${t.colour};--tape-top:${t.accent};--on-tape:${onColour(t.colour)}`,
    },
      h("span", { class: "picks-spine", "aria-hidden": "true" }, h("b", { text: `Vol. ${t.vol.n} · ${t.side}${t.n}` }), h("i", { text: t.name })),
      h("span", { class: "picks-tag", id: tagId, "aria-hidden": "true" },
        h("small", { text: `Vol. ${t.vol.n} · Side ${t.side} · ${t.side}${t.n}` }),
        h("strong", { text: t.name }),
        h("em", { text: t.vol.title }),
        h("ol", {}, (t.pieces ?? []).map((p, i) => h("li", {}, h("span", { text: two(i + 1) }), h("span", { text: p.title }), h("span", { text: p.form })))),
      ),
    );
    const li = h("li", {}, a);
    const sh = h("i", { class: `picks-${slot.pose}` });
    list.append(li); shade.append(sh);
    const size = (L) => slot.pose === "lie" ? L.case : slot.yaw ? L.turned : L.stand;
    bodies.push({ kind: "case", el: li, a, sh, t, slot, size, at: slot.at, pose: slot.pose, yaw: slot.yaw ?? 0,
      restTilt: slot.tilt ?? 0, restRoll: slot.roll ?? 0, tilt: 0, roll: 0, z: 0, wob: 0, x: 0, y: 0, w: 0, h: 0, vx: 0, vy: 0, rest: false, still: 0, drag: null });
  }
  for (const r of REELS) {
    const el = h("i", { class: r.m ? null : "picks-d-only", draggable: "false" });
    const sh = h("i", { class: `picks-reel${r.m ? "" : " picks-d-only"}` });
    reels.append(el); shade.append(sh);
    bodies.push({ kind: "reel", el, sh, size: (L) => { const d = (L === DESK ? r.d : r.m ?? r.d)[2]; return [d, d]; }, at: { d: r.d, m: r.m }, spin: 0, tilt: 0, z: 0,
      x: 0, y: 0, w: 0, h: 0, vx: 0, vy: 0, rest: false, still: 0, drag: null });
  }
  stage.append(shade, list, reels);
  const hint = h("p", { class: "picks-hint", text: "Pick a tape up. Click to play it." });
  stage.append(hint);
  root.replaceChildren(stage);

  /* --------------------------------------------------- the stage's scale */
  const phone = matchMedia("(max-width: 760px)");
  let L = phone.matches ? PHONE : DESK, k = 1;
  const fit = () => {
    L = phone.matches ? PHONE : DESK;
    const pad = parseFloat(getComputedStyle(root).paddingLeft) || 0;
    const w = Math.min(Math.max(root.clientWidth - 2 * pad, 200), L.w);
    k = w / L.w;
    stage.style.setProperty("--k", `${k}px`);
  };
  fit();
  new ResizeObserver(fit).observe(root);

  /* ----------------------------------------------------------- the 3D */
  const live = api.has3d !== false;
  for (const b of bodies) {
    if (!live) continue;
    if (b.kind === "case") { b.tilt = b.restTilt; b.roll = b.restRoll; b.c = api.addCase({ k: b.t.k ?? tapes.indexOf(b.t), el: b.a, pose: b.pose, tilt: b.restTilt, yaw: b.yaw, roll: b.restRoll, z: 0 }); }
    else b.c = api.addReel({ el: b.el, tilt: 0.04, spin: 0, z: 2 });
  }

  /* ------------------------------------------------------- the physics */
  // Bodies are axis-aligned boxes in the stage's front plane; x, y is the
  // top left in design units. A body sleeps once still; a drag wakes all.
  const place = (b) => {
    const at = L === DESK ? b.at.d : b.at.m;
    [b.w, b.h] = b.size(L);
    if (!at) { b.x = -1000; b.y = -1000; b.off = true; return; }
    b.off = false; b.x = at[0]; b.y = at[1]; b.vx = b.vy = 0; b.rest = false; b.still = 0;
  };
  const wake = () => { for (const b of bodies) { b.rest = false; b.still = 0; } };
  const landed = (b, v) => { if (b.kind === "case" && v > BOUNCE_MIN) b.wob = Math.min(0.2, v / 5000); };
  function step(dt) {
    for (const b of bodies) {
      if (b.off || b.drag || b.rest) continue;
      b.vy = clamp(b.vy + G * dt, -MAX_V, MAX_V);
      b.x += b.vx * dt; b.y += b.vy * dt;
    }
    for (const b of bodies) {
      if (b.off || b.drag) continue;
      if (b.x < 0) { b.x = 0; b.vx = -b.vx * BOUNCE; }
      if (b.x + b.w > L.inner) { b.x = L.inner - b.w; b.vx = -b.vx * BOUNCE; }
      if (b.y < L.ceil) { b.y = L.ceil; b.vy = Math.max(0, b.vy); }
      if (b.y + b.h > L.floor) { b.y = L.floor - b.h; if (b.vy > 0) { landed(b, b.vy); b.vy = b.vy > BOUNCE_MIN ? -b.vy * BOUNCE : 0; b.vx *= FRICTION; } }
    }
    for (let it = 0; it < 4; it++) {
      for (let i = 0; i < bodies.length; i++) for (let j = i + 1; j < bodies.length; j++) {
        const a = bodies[i], c = bodies[j];
        if (a.off || c.off || (a.drag && c.drag)) continue;
        const ox = Math.min(a.x + a.w, c.x + c.w) - Math.max(a.x, c.x);
        const oy = Math.min(a.y + a.h, c.y + c.h) - Math.max(a.y, c.y);
        if (ox <= 0.01 || oy <= 0.01) continue;
        if (oy <= ox) {
          // one rests on the other
          const [up, low] = a.y + a.h / 2 < c.y + c.h / 2 ? [a, c] : [c, a];
          if (up.drag) { low.y += oy; low.vy = Math.max(low.vy, 0); low.rest = false; }
          else if (low.drag) { up.y -= oy; if (up.vy > 0) { landed(up, up.vy); up.vy = up.vy > BOUNCE_MIN ? -up.vy * BOUNCE : 0; up.vx *= FRICTION; } up.rest = false; }
          else { up.y -= oy; if (up.vy > 0) { landed(up, up.vy); up.vy = up.vy > BOUNCE_MIN ? -up.vy * BOUNCE : 0; up.vx *= FRICTION; } if (up.rest && !low.rest) up.rest = false; }
        } else {
          // side by side: the lighter mover gives way
          const [l, r] = a.x + a.w / 2 < c.x + c.w / 2 ? [a, c] : [c, a];
          if (l.drag) { r.x += ox; r.vx = Math.max(r.vx, 0); r.rest = false; }
          else if (r.drag) { l.x -= ox; l.vx = Math.min(l.vx, 0); l.rest = false; }
          else {
            const share = l.rest && !r.rest ? [0, 1] : r.rest && !l.rest ? [1, 0] : [0.5, 0.5];
            l.x -= ox * share[0]; r.x += ox * share[1]; l.vx = r.vx = 0;
          }
        }
        for (const b of [a, c]) { if (b.drag) continue; b.x = clamp(b.x, 0, L.inner - b.w); if (b.y + b.h > L.floor) b.y = L.floor - b.h; }
      }
    }
    let awake = false;
    for (const b of bodies) {
      if (b.off) continue;
      if (b.drag) awake = true;
      else if (!b.rest) {
        if (Math.abs(b.vx) < 3 && Math.abs(b.vy) < 3) { b.still += dt; if (b.still > STILL) { b.rest = true; b.vx = b.vy = 0; } }
        else b.still = 0;
        awake = true;
      }
      if (b.kind === "case") {
        const want = b.drag ? b.drag.tilt : b.restTilt;
        const wantRoll = b.drag ? b.drag.roll : b.restRoll;
        const wantZ = b.drag ? 120 : 0;
        b.wob *= Math.pow(0.02, dt);
        const nt = want + Math.sin(performance.now() / 60) * b.wob, nr = wantRoll, nz = wantZ;
        const e = reduce ? 1 : 1 - Math.pow(0.0005, dt);
        b.tilt += (nt - b.tilt) * e; b.roll += (nr - b.roll) * e; b.z += (nz - b.z) * e;
        if (Math.abs(nt - b.tilt) + Math.abs(nr - b.roll) + Math.abs(nz - b.z) > 0.002 || b.wob > 0.002) awake = true;
        b.c?.set({ tilt: b.tilt, roll: b.roll, z: b.z });
      } else if (b.c && (b.drag || !b.rest)) {
        b.c.set({ spin: b.spin, tilt: 0.04 + (b.drag ? 0.12 : 0), z: b.drag ? 60 : 2 });
      }
    }
    return awake;
  }
  // the top of whatever the body would land on: its shadow goes there
  const landing = (b) => {
    let top = L.floor;
    for (const c of bodies) if (c !== b && !c.off && c.y >= b.y + b.h - 1 && Math.min(b.x + b.w, c.x + c.w) - Math.max(b.x, c.x) > Math.min(b.w, c.w) * 0.3) top = Math.min(top, c.y);
    return top;
  };
  function draw() {
    for (const b of bodies) {
      if (b.off) continue;
      b.el.style.setProperty("--x", b.x.toFixed(1)); b.el.style.setProperty("--y", b.y.toFixed(1));
      b.el.style.setProperty("--w", b.w); b.el.style.setProperty("--h", b.h);
      const ly = landing(b), lift = clamp((ly - b.y - b.h) / 420, 0, 1);
      b.sh.style.setProperty("--x", b.x.toFixed(1)); b.sh.style.setProperty("--y", ly.toFixed(1)); b.sh.style.setProperty("--w", b.w);
      b.sh.style.setProperty("--lift", lift.toFixed(3));
    }
    api.kick?.();
  }
  let raf = 0, last = 0;
  const frame = (now) => {
    raf = 0;
    const dt = Math.min(0.05, last ? (now - last) / 1000 : 1 / 60); last = now;
    const awake = step(dt);
    draw();
    if (awake) raf = requestAnimationFrame(frame); else last = 0;
  };
  const run = () => { if (!raf) { last = 0; raf = requestAnimationFrame(frame); } };
  // Without motion, or at the start: settle at once.
  const settle = () => { for (let i = 0; i < 600 && step(1 / 60); i++); draw(); };
  // On the phone every case faces straight on, so none spills past the walls.
  const reset = () => { for (const b of bodies) { place(b); if (b.kind === "case") b.c?.set({ yaw: L === PHONE ? 0 : b.yaw }); } settle(); };
  reset();
  phone.addEventListener("change", () => { fit(); reset(); });

  /* ---------------------------------------------------------- dragging */
  const toStage = (e) => { const r = stage.getBoundingClientRect(); return [(e.clientX - r.left) / k, (e.clientY - r.top) / k]; };
  let hinted = false;
  try { hinted = sessionStorage.getItem("picks-hinted") === "1"; } catch {}
  if (hinted) hint.hidden = true;
  const dismissHint = () => { if (hinted) return; hinted = true; hint.classList.add("picks-gone"); try { sessionStorage.setItem("picks-hinted", "1"); } catch {} };

  for (const b of bodies) {
    const el = b.kind === "case" ? b.a : b.el;
    let down = null;
    el.addEventListener("pointerdown", (e) => {
      if (e.button) return;
      const [x, y] = toStage(e);
      down = { id: e.pointerId, x, y, ox: x - b.x, oy: y - b.y, moved: false, px: x, py: y, t: performance.now(), vx: 0, vy: 0, last: null };
      el.setPointerCapture(e.pointerId);
    });
    el.addEventListener("pointermove", (e) => {
      if (!down || e.pointerId !== down.id) return;
      const [x, y] = toStage(e);
      if (!down.moved) {
        if (Math.hypot(x - down.x, y - down.y) < 5) return;
        down.moved = true; b.drag = { tilt: b.restTilt ?? 0, roll: 0 }; b.rest = false; b.still = 0; wake();
        root.classList.add("picks-dragging"); el.classList.add("picks-grabbing"); dismissHint();
      }
      const now = performance.now(), dt = Math.max(1, now - down.t) / 1000;
      const vx = (x - down.px) / dt, vy = (y - down.py) / dt;
      down.vx += (vx - down.vx) * 0.35; down.vy += (vy - down.vy) * 0.35;
      down.px = x; down.py = y; down.t = now;
      const nx = clamp(x - down.ox, 0, L.inner - b.w), ny = clamp(y - down.oy, L.ceil, L.floor - b.h);
      if (b.kind === "reel") b.spin += (nx - b.x) / (b.w / 2);
      b.x = nx; b.y = ny; b.vx = down.vx; b.vy = down.vy;
      if (b.kind === "case") { b.drag.tilt = clamp((b.restTilt ?? 0) + 0.1 - down.vy * 0.00018, -0.25, 0.45); b.drag.roll = clamp(-down.vx * 0.00016, -0.3, 0.3); }
      run();
    });
    const release = (e) => {
      if (!down || e.pointerId !== down.id) return;
      if (down.moved) {
        b.drag = null; b.vx = clamp(down.vx, -MAX_V, MAX_V) * 0.6; b.vy = clamp(down.vy, -MAX_V, MAX_V) * 0.6;
        if (performance.now() - down.t > 80) b.vx = b.vy = 0;
        root.classList.remove("picks-dragging"); el.classList.remove("picks-grabbing");
        if (reduce) settle(); else run();
      }
      down = null;
    };
    el.addEventListener("pointerup", release);
    el.addEventListener("pointercancel", release);
    el.addEventListener("lostpointercapture", (e) => { if (down && down.moved) release(e); });
    if (b.kind !== "case") continue;
    // A drag is not a click: the core's own click handler, on the anchor in
    // the bubble phase, opens the playlist unless the event was prevented.
    let dragged = false;
    el.addEventListener("pointerup", () => { dragged = !!(down?.moved); }, true);
    el.addEventListener("click", (e) => { if (dragged) { e.preventDefault(); e.stopPropagation(); dragged = false; } else dismissHint(); }, true);
    // The arrow keys move a tape in steps; it settles after each.
    el.addEventListener("keydown", (e) => {
      const dx = e.key === "ArrowLeft" ? -48 : e.key === "ArrowRight" ? 48 : 0;
      const hop = e.key === "ArrowUp" ? -820 : dx ? -280 : e.key === "ArrowDown" ? 160 : null;
      if (hop == null) return;
      e.preventDefault(); wake(); dismissHint();
      b.x = clamp(b.x + dx, 0, L.inner - b.w);
      if (reduce) { b.y = clamp(b.y + (hop < 0 ? -60 : 24), L.ceil, L.floor - b.h); settle(); }
      else { b.vy = hop; b.vx = 0; run(); }
    });
    // Where the tag opens: above the tape when there is room, else below,
    // and against the right wall when near it.
    const aim = () => {
      const tag = el.querySelector(".picks-tag");
      tag.classList.toggle("picks-below", b.y < 250);
      tag.classList.toggle("picks-right", b.x + 300 > L.inner);
    };
    el.addEventListener("pointerenter", aim); el.addEventListener("focus", aim);
  }
}
