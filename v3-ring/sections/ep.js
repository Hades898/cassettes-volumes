// Extended Play: every tape on one shelf, paged by two cassette hubs,
// with "Bonus Tracks" upside down at the foot until it is fully in view.
// See CONTRACT.md for the api.

const HUB = new URL("../assets/hub.png", import.meta.url).href;

// A case is 110 long, 70 wide and 17 thick; everything here is in lengths.
const THICK = 17 / 110;
const WIDE = 70 / 110;
const TURN = 1.25;  // yaw of a case turned to show its spine and part of its cover
const LEAN = 0.38;  // roll of a leaning case, about 22 degrees
const GAP = 0.07;   // between cases: the wireframe's 17px plus the side wall the perspective shows
const VOL_GAP = 0.06; // a little more between volumes
// Rolls here are clockwise, as CSS rotate() is; the core's roll is a
// three.js turn about Z, counter-clockwise.
const ROLL_SIGN = -1;
// Degrees the hubs turn per pixel of shelf: about one turn per page.
const SPIN = 0.32;
// The core's camera (index.html): 30 degree field of view, centred on the
// viewport, the anchor's centre at depth 0, a focused case lifted 30px
// toward the viewer and 6px up. Used only to ring the focused case where
// it is drawn; see the report's request for a core API to replace it.
const FOV = 30, LIFT_Z = 30, LIFT_Y = 6;

// The shelf's rhythm, after the wireframe: spines, a case turned to show
// its cover, a pair leaning on the next spine.
const RHYTHM = ["stand", "stand", "turn+", "stand", "stand", "lean", "lean", "stand", "turn-", "stand", "stand", "stand"];

const pad2 = (n) => String(n).padStart(2, "0");

function h(tag, props = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (v == null || v === false) continue;
    if (k === "class") el.className = v;
    else if (k === "text") el.textContent = v;
    else if (k === "style") for (const [p, x] of Object.entries(v)) el.style.setProperty(p, x);
    else el.setAttribute(k, v === true ? "" : v);
  }
  for (const c of kids.flat()) if (c != null && c !== false) el.append(c);
  return el;
}

// Playlist number within its side, if the core doesn't give one.
function numberOf(t, tapes) {
  if (Number.isFinite(t.n)) return t.n;
  return tapes.filter((u) => u.vol.n === t.vol.n && u.side === t.side && u.k < t.k).length + 1;
}

// Each tape's pose and its slot, in lengths: w is the slot's width (what
// the case covers on screen), fw the face that takes the pointer and the
// focus ring, ml the space before it.
function layout(tapes) {
  const out = [];
  tapes.forEach((t, i) => {
    const prev = tapes[i - 1], nxt = tapes[i + 1];
    let kind = RHYTHM[i % RHYTHM.length];
    const newVol = prev && prev.vol.n !== t.vol.n;
    // A case only leans on a neighbour from its own volume.
    if (kind === "lean" && (!nxt || nxt.vol.n !== t.vol.n)) kind = "stand";
    if (kind === "lean" && out[i - 1]?.kind !== "lean" && RHYTHM[(i + 1) % RHYTHM.length] !== "lean") kind = "stand";
    const s = { t, kind, pose: "stand", yaw: 0, roll: 0, w: THICK + 0.006, fw: THICK, ml: i ? GAP : 0 };
    if (kind.startsWith("turn")) {
      const sign = kind === "turn+" ? 1 : -1;
      s.pose = "front";
      s.yaw = sign * TURN;
      s.w = s.fw = WIDE * Math.cos(TURN) + THICK * Math.sin(TURN);
    } else if (kind === "lean") {
      s.roll = LEAN;
      s.w = THICK * Math.cos(LEAN) + Math.sin(LEAN);
      // The second of a pair rests on the first, a hair apart.
      if (out[i - 1]?.kind === "lean") s.ml = (THICK + 0.02) / Math.cos(LEAN) - out[i - 1].w;
    }
    // A spine the pair leans on stands close to it.
    if (kind !== "lean" && out[i - 1]?.kind === "lean") s.ml = GAP * 0.6;
    if (newVol) s.ml += VOL_GAP;
    out.push(s);
  });
  return out;
}

export function mount(root, api) {
  const reduce = Boolean(api.reduceMotion ?? matchMedia("(prefers-reduced-motion: reduce)").matches);
  const tapes = api.tapes ?? [];
  const kick = () => api.kick?.();
  const smooth = reduce ? "auto" : "smooth";

  root.classList.add("ep");
  root.classList.toggle("no3d", !api.has3d);
  root.setAttribute("aria-labelledby", "ep-title");
  root.replaceChildren();

  /* ------------------------------------------------------------ DOM */
  const title = h("h2", { class: "ep-title", id: "ep-title", text: "Extended Play" });
  const hint = h("p", { class: "ep-sr", id: "ep-hint", text: "Use the left and right arrow keys to move along the shelf." });
  const hub = (dir, label) => h("button", { type: "button", class: `ep-hub ep-hub--${dir}`, "aria-label": label, "aria-controls": "ep-shelf" },
    h("img", { src: HUB, alt: "", width: 385, height: 379, draggable: "false", decoding: "async" }));
  const prevBtn = hub("prev", "Previous");
  const nextBtn = hub("next", "Next");
  const track = h("ul", { class: "ep-track", id: "ep-shelf", "aria-label": "Tapes" });
  const win = h("div", { class: "ep-window", "data-clip": "" }, track);
  const capWhere = h("span", { class: "ep-cap-where" });
  const capName = h("span", { class: "ep-cap-name" });
  // The caption repeats each link's name for the eye; the links carry it for
  // a screen reader.
  const caption = h("p", { class: "ep-caption", "aria-hidden": "true" }, capName, capWhere);
  const bonus = h("h2", { class: "ep-bonus", id: "bonus-tracks", text: "Bonus Tracks" });
  // The focus ring. The core draws the case in perspective, so a ring
  // round its link would sit off the case; this one rings where it's drawn.
  const mark = h("i", { class: "ep-mark", "aria-hidden": "true", hidden: true });
  const box = h("div", { class: "ep-box" }, prevBtn, win, nextBtn, caption, bonus, mark);
  root.append(title, hint, box);

  const plan = layout(tapes);
  const slots = [], links = [];
  for (const s of plan) {
    const t = s.t, n = numberOf(t, tapes);
    const name = t.label || `Vol. ${t.vol.n}, Side ${t.side}, Playlist ${pad2(n)}: ${t.name}`;
    const a = h("a", { class: "ep-case", href: `#/${t.key}`, "aria-label": name, "aria-describedby": "ep-hint", tabindex: "-1" },
      h("span", { class: "ep-face", "aria-hidden": "true" },
        h("b", { text: t.name }),
        h("small", { text: `${t.vol.n} · ${t.side} · ${pad2(n)}` })));
    const li = h("li", {
      class: `ep-slot ep-slot--${s.pose === "front" ? "front" : s.roll ? "lean" : "stand"}`,
      style: { "--w": s.w.toFixed(4), "--fw": s.fw.toFixed(4), "--ml": s.ml.toFixed(4), "--roll": `${s.roll.toFixed(4)}rad`, "--c": t.colour },
    }, a);
    a.dataset.i = String(slots.length);
    track.append(li);
    slots.push(li); links.push(a);
    s.n = n;
  }

  /* ------------------------------------------------------ the cases */
  if (api.has3d) {
    plan.forEach((s, i) => api.addCase({ k: s.t.k, el: links[i], pose: s.pose, yaw: s.yaw, roll: s.roll * ROLL_SIGN, tilt: 0, z: s.kind === "lean" ? 2 : 0 }));
  }

  /* ------------------------------------------------------- geometry */
  // Slot edges in the track's own coordinates.
  const edges = (li) => ({ l: li.offsetLeft, r: li.offsetLeft + li.offsetWidth });
  const inset = () => parseFloat(getComputedStyle(track).paddingLeft) || 0;
  const maxX = () => Math.max(0, win.scrollWidth - win.clientWidth);
  const scrollTo = (x) => win.scrollTo({ left: Math.max(0, Math.min(maxX(), x)), behavior: smooth });
  const fullyIn = (li, x = win.scrollLeft) => { const e = edges(li); return e.l >= x - 1 && e.r <= x + win.clientWidth + 1; };

  // One page on: the first case cut by the right edge comes to the left.
  function pageNext() {
    const x = win.scrollLeft, w = win.clientWidth;
    const cut = slots.find((li) => edges(li).r > x + w + 1);
    scrollTo(cut ? edges(cut).l - inset() : maxX());
  }
  // One page back: the case cut by the left edge comes to the right, and
  // the page starts on a whole case.
  function pagePrev() {
    const x = win.scrollLeft, w = win.clientWidth, p = inset();
    const first = slots.findIndex((li) => edges(li).l >= x + p - 1);
    const lastWanted = first > 0 ? slots[first - 1] : null;
    if (!lastWanted) return scrollTo(0);
    const target = edges(lastWanted).r + p - w;
    const start = slots.find((li) => edges(li).l - p >= target - 1);
    scrollTo(start ? Math.min(edges(start).l - p, x - 1) : 0);
  }
  function show(li) {
    const e = edges(li), x = win.scrollLeft, w = win.clientWidth, p = inset();
    if (e.l < x + p) scrollTo(e.l - p);
    else if (e.r > x + w - p) scrollTo(e.r - w + p);
  }

  /* --------------------------------------------------------- caption */
  function volumesInView() {
    const x = win.scrollLeft, w = win.clientWidth;
    const seen = [];
    plan.forEach((s, i) => { const e = edges(slots[i]); if (e.r > x && e.l < x + w && !seen.some((v) => v.n === s.t.vol.n)) seen.push(s.t.vol); });
    return seen;
  }
  function setCaption(i) {
    if (i < 0) {
      const vols = volumesInView();
      capName.textContent = "";
      capWhere.textContent = `${tapes.length} tapes · ${vols.map((v) => `Vol. ${v.n}, ${v.title}`).join(" · ")}`;
      return;
    }
    const s = plan[i], t = s.t;
    const side = t.sideName && t.sideName !== t.side && t.sideName !== `Side ${t.side}` ? `Side ${t.side}, ${t.sideName}` : `Side ${t.side}`;
    capWhere.replaceChildren(`Vol. ${t.vol.n}`, h("span", { class: "ep-cap-vol", text: ` · ${t.vol.title}` }), ` · ${side} · Playlist ${pad2(s.n)}`);
    capName.textContent = t.name;
  }
  let hovered = -1, focused = -1;
  const recaption = () => setCaption(hovered >= 0 ? hovered : focused);
  const indexOf = (node) => { const a = node instanceof Element ? node.closest(".ep-case") : null; return a ? Number(a.dataset.i) : -1; };
  track.addEventListener("pointerover", (e) => { const i = indexOf(e.target); if (i >= 0 && i !== hovered) { hovered = i; recaption(); } });
  track.addEventListener("pointerout", (e) => { if (indexOf(e.relatedTarget) !== hovered) { hovered = -1; recaption(); } });
  track.addEventListener("focusout", (e) => { if (!track.contains(e.relatedTarget)) { focused = -1; recaption(); } });

  /* ------------------------------------------------- keyboard: one stop */
  let stop = 0;
  function setStop(i) {
    if (!links.length) return;
    links[stop].tabIndex = -1;
    stop = Math.max(0, Math.min(links.length - 1, i));
    links[stop].tabIndex = 0;
  }
  setStop(0);
  track.addEventListener("keydown", (e) => {
    const i = indexOf(e.target);
    if (i < 0 || e.altKey || e.ctrlKey || e.metaKey) return;
    const j = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: links.length - 1 }[e.key];
    if (j == null) return;
    e.preventDefault();
    if (j < 0 || j >= links.length || j === i) return;
    setStop(j);
    slots[j].classList.remove("is-cut");
    links[j].focus({ preventScroll: true });
    show(slots[j]);
  });

  /* ------------------------------------------------------- focus mark */
  let marked = -1;
  // The screen box of case i as the core draws it when focused: its eight
  // corners, posed and projected through the core's camera.
  function drawnBox(i, lifted = true) {
    const s = plan[i], r = slots[i].getBoundingClientRect();
    const W = innerWidth, H = innerHeight, camZ = (H / 2) / Math.tan((FOV * Math.PI) / 360);
    const len = r.height, ext = s.pose === "front" ? [len * WIDE, len, len * THICK] : [len * THICK, len, len * WIDE];
    const up = lifted ? 1 : 0;
    const cx = r.left + r.width / 2 - W / 2, cy = H / 2 - (r.top + r.height / 2) + up * LIFT_Y, cz = (s.kind === "lean" ? 2 : 0) + up * LIFT_Z;
    const yaw = s.yaw - up * 0.06, roll = s.roll * ROLL_SIGN;
    const out = { l: Infinity, t: Infinity, r: -Infinity, b: -Infinity };
    for (const sx of [-0.5, 0.5]) for (const sy of [-0.5, 0.5]) for (const sz of [-0.5, 0.5]) {
      let x = sx * ext[0], y = sy * ext[1], z = sz * ext[2];
      [x, z] = [x * Math.cos(yaw) + z * Math.sin(yaw), -x * Math.sin(yaw) + z * Math.cos(yaw)];
      [x, y] = [x * Math.cos(roll) - y * Math.sin(roll), x * Math.sin(roll) + y * Math.cos(roll)];
      const k = camZ / (camZ - (z + cz)), px = W / 2 + (x + cx) * k, py = H / 2 - (y + cy) * k;
      out.l = Math.min(out.l, px); out.r = Math.max(out.r, px); out.t = Math.min(out.t, py); out.b = Math.max(out.b, py);
    }
    return out;
  }
  function placeMark() {
    if (marked < 0 || !api.has3d) { mark.hidden = true; return; }
    const b = box.getBoundingClientRect(), wr = win.getBoundingClientRect(), r = slots[marked].getBoundingClientRect();
    const c = r.left + r.width / 2;
    mark.hidden = c < wr.left || c > wr.right;
    const d = drawnBox(marked);
    Object.assign(mark.style, { left: `${d.l - b.left}px`, top: `${d.t - b.top}px`, width: `${d.r - d.l}px`, height: `${d.b - d.t}px` });
  }
  track.addEventListener("focusout", () => { marked = -1; placeMark(); requestAnimationFrame(cut); });

  // A case takes focus: it becomes the tab stop, the caption names it and,
  // from the keyboard, the mark goes under it.
  track.addEventListener("focusin", (e) => {
    const i = indexOf(e.target);
    if (i >= 0 && i !== stop) setStop(i);
    focused = i;
    recaption();
    marked = i >= 0 && e.target.matches(":focus-visible") ? i : -1;
    placeMark();
  });

  /* ----------------------------------------------- clean ends (WebGL) */
  // The core draws a case while its link's centre is in the window, so a
  // case cut by the window's edge would be drawn whole, under a hub. Here a
  // case whose drawn box would reach past the room beside the hubs has its
  // link taken out of layout (a link with no box isn't drawn); the focused
  // case always stays.
  function cut() {
    if (!api.has3d) return;
    const wr = win.getBoundingClientRect(), pr = prevBtn.getBoundingClientRect(), nr = nextBtn.getBoundingClientRect();
    const beside = pr.top < wr.bottom && pr.bottom > wr.top; // hubs either side, not below
    const lo = beside ? pr.right + 12 : wr.left - 8, hi = beside ? nr.left - 12 : wr.right + 8;
    slots.forEach((li, i) => {
      if (links[i] === document.activeElement) { li.classList.remove("is-cut"); return; }
      const d = drawnBox(i, false);
      li.classList.toggle("is-cut", d.l < lo || d.r > hi);
    });
  }

  /* ------------------------------------------------------------ hubs */
  function sync() {
    const x = win.scrollLeft, m = maxX(), w = win.clientWidth;
    cut();
    placeMark();
    box.style.setProperty("--ep-spin", `${(x * SPIN).toFixed(2)}deg`);
    setDisabled(prevBtn, x <= 1);
    setDisabled(nextBtn, x >= m - 1);
  }
  function setDisabled(btn, off) {
    if (off) btn.setAttribute("aria-disabled", "true"); else btn.removeAttribute("aria-disabled");
  }
  prevBtn.addEventListener("click", () => { if (prevBtn.getAttribute("aria-disabled") !== "true") pagePrev(); });
  nextBtn.addEventListener("click", () => { if (nextBtn.getAttribute("aria-disabled") !== "true") pageNext(); });

  // After the shelf settles: keep the tab stop on a case that's in view.
  let settle = 0;
  function settled() {
    if (!track.contains(document.activeElement)) {
      const i = slots.findIndex((li) => fullyIn(li) && !li.classList.contains("is-cut"));
      if (i >= 0) setStop(i);
    }
    if (hovered < 0 && focused < 0) setCaption(-1);
  }
  win.addEventListener("scroll", () => {
    sync();
    kick();
    clearTimeout(settle);
    settle = setTimeout(settled, 120);
  }, { passive: true });
  new ResizeObserver(() => { sync(); settled(); }).observe(win);
  addEventListener("resize", placeMark, { passive: true });
  addEventListener("scroll", () => { if (marked >= 0) placeMark(); }, { passive: true });

  /* ------------------------------------------------- Bonus Tracks turns */
  if (reduce) bonus.classList.add("is-upright");
  else if ("IntersectionObserver" in window) {
    new IntersectionObserver((entries) => {
      for (const en of entries) {
        if (en.intersectionRatio >= 0.99) bonus.classList.add("is-upright");
        // Turn it back only once it's fully gone below, so it turns again
        // on the way down, never while half in view.
        else if (!en.isIntersecting && en.boundingClientRect.top > (en.rootBounds?.bottom ?? innerHeight)) bonus.classList.remove("is-upright");
      }
    }, { threshold: [0, 0.99, 1] }).observe(bonus);
  } else bonus.classList.add("is-upright");

  sync();
  setCaption(-1);
  kick();
}
