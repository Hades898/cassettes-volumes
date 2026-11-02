# Volumes v3: how a section plugs into the page

`press-v3/index.html` is the core: header, Editor's Note panel, hero (the 3D rack of Vol. 01's playlists), the teal band, routing, the tape page, the reader and the play sequence, plus one fixed WebGL canvas that draws every cassette case. Sections live in their own files and never edit the core.

| Section | Files | Container in index.html |
|---|---|---|
| Editor's Picks | `sections/picks.js`, `sections/picks.css` | `<section class="picks" id="picks"></section>` |
| Extended Play + Bonus Tracks | `sections/ep.js`, `sections/ep.css` | `<section class="ep" id="extended-play"></section>` |

The core links each section's CSS and imports its module:

```js
import { mount as mountPicks } from "./sections/picks.js";
mountPicks(document.getElementById("picks"), api);
```

`mount(root, api)` builds the section's DOM inside `root` and registers its 3D objects. It runs once, after fonts load and the 3D scene is ready, or when WebGL is unavailable (`api.has3d === false`).

## The page

- **Home** is a white page. The hero (dark photo) and the teal band come first, then the "Submissions opening soon" marquee, then Editor's Picks, then Extended Play.
- **The canvas** is `position: fixed`, full screen, `z-index: 1`, and transparent on home. So it draws above section backgrounds (static or `z-index: 0`) and below anything at `z-index: 2+`. Put the clickable slots at `z-index: 2`.
- **Tokens** are on `:root`:

  | Token | Value |
  |---|---|
  | `--teal` | `#347e92` |
  | `--brown` | `#48382a` |
  | `--paper-grey` | `#d9d9d9` |
  | `--ink` | `#000` |
  | `--paper` | `#fff` |
  | `--font-display` | Instrument Serif |
  | `--font-ui` | Inter, 300/400/500/600 |
  | `--font-mono` | IBM Plex Mono |
  | `--font-ar` | IBM Plex Sans Arabic |
  | `--gutter` | `clamp(16px, 4vw, 48px)` |

  Use these; don't add new colours without a reason.
- **Assets** in `assets/`:
  - `hub.png`: the teal cassette hub wheel;
  - `zigzag.svg`;
  - `tab-a.svg` and `tab-b.svg`: the open box's dashed corner flaps from the wireframe;
  - `picks-warp.svg`: "An ode to our contributors", set on a warp;
  - `lettering.webp`: the Cassettes lettering.
- **The wireframe**, exported in `evidence/figma/`:
  - `homepage.png`: the full HOMEPAGE frame, 591:1114;
  - `homepage-v2-hero.png`;
  - `picks-box-corners-and-label.png`;
  - `editors-note-panel.png`;
  - `structure.xml`: every node, with positions in the 1440-wide frame.

## The API

```js
api.has3d            // boolean
api.tapes            // [{ k, key, name, side, sideName, n, vol: { n, title }, colour, ground, accent,
                     //    pieces: [{ slug, title, subtitle, form, by }] }], TAPES order
api.byKey(key)       // -> tape
api.reduceMotion     // boolean

// A cassette case of tape k, drawn in el's border box. el is a focusable
// <a href="#/{key}"> with an accessible name. The core adds hover (it lifts
// toward the viewer) and opens the playlist with the case flying from this spot.
const c = api.addCase({
  k,                 // tape index
  el,                // anchor element
  pose: "lie",       // "lie": flat, spine toward the viewer, length = el width
                     // "stand": on its end, spine toward the viewer, length = el height
                     // "front": front cover toward the viewer, height = el height
  tilt: 0,           // radians about the case's long axis: "lie" shows its top (the J-card front)
  yaw: 0,            // radians about the vertical: "stand"/"front" turn to show the cover or back
  roll: 0,           // radians in the picture plane: a leaning case
  z: 0,              // px toward the viewer, to layer overlapping cases
});
c.set({ tilt, yaw, roll, z });   // change the pose at once (no easing: ease it yourself per frame)
c.remove();

// A cassette reel: a flat spool, wound tape and a teal hub, in el's box, facing the viewer.
const r = api.addReel({ el, tilt: 0.0, spin: 0 });  // el is decorative: aria-hidden
r.set({ tilt, spin }); r.remove();

api.kick();          // re-render after you move anchors yourself (e.g. a carousel's transform);
                     // scroll and resize already re-render
```

**Clipping.** A case or reel is drawn only while its anchor is rendered and on screen. If an ancestor has `data-clip`, it's hidden once its anchor's centre leaves that ancestor's box. That's for carousels.

**No WebGL** (`api.has3d === false`): `addCase` and `addReel` do nothing, and the section must still read. Show the tape's name in the slot, for example with a `.no3d` class on `root`.

## Rules

- **Own your files only.** Never edit `index.html` or another section's files. If you need something from the core, say so in your report.
- **Accessibility.** Each case's anchor is a real link with an accessible name: "Vol. 01, Side A, Playlist 02: Going Under". Decorative things are `aria-hidden`. Respect `prefers-reduced-motion`.
- **Responsive.** It must not break at 390px wide. Desktop (1440) is the priority: phone polish is paused, so keep 390 unbroken, not perfect.
- **Testing.** Serve `press-v3/` with `python3 -m http.server <port> --bind 127.0.0.1`. Ports: Fable 3481, the EP agent 3482; never 3101, 3489, 3495, 3497 or 3498. Capture with Playwright from `~/Documents/ChatGPT/Cassettes/dashboard` (`npm exec --no -- playwright …`, Chrome), at 1440×900 and 390×844. Stop your server when you're done.
- **Figma.** Don't call the Figma desktop server; use the exports in `evidence/figma/`.
