// The cassette's front, drawn once in 2D: the WebGL case maps it on its
// face (windows cut through), and the no-WebGL fallback paints it flat over
// the reels. Proportions are press-v3's (CW 1, CH 0.638, hubs at x ±0.2125,
// y +0.0623, windows r 0.092), in face units: 1000 x 638.
import { LETTERING } from "./lettering-path.js";

export const FACE = { w: 1000, h: 638 };
export const HUBS = [{ x: 287.5, y: 256.7 }, { x: 712.5, y: 256.7 }];
export const WIN_R = 92;
export const HUB_R = 57.5;
// Where the tape leaves the case: the opening along its foot.
export const SLOT = { x: 500, y: 620, w: 380 };

const SHELL = "#221e1b";
const LABEL = "#ede6d8";
const INK = "#48382a";
const TEAL = "#347e92";
const letters = new Path2D(LETTERING.d);

const rr = (g, x, y, w, h, r) => { g.beginPath(); g.roundRect(x, y, w, h, r); };

// The face, at `scale` px per face unit; windows and slot cut through.
export function faceCanvas(lang, scale = 1.6) {
  const c = document.createElement("canvas");
  c.width = Math.round(FACE.w * scale);
  c.height = Math.round(FACE.h * scale);
  const g = c.getContext("2d");
  g.scale(scale, scale);
  // Shell, edge to edge (the 3D corners are rounded by the geometry).
  g.fillStyle = SHELL; g.fillRect(0, 0, FACE.w, FACE.h);
  const sheen = g.createLinearGradient(0, 0, 0, FACE.h);
  sheen.addColorStop(0, "rgba(255,255,255,.07)"); sheen.addColorStop(0.5, "rgba(255,255,255,0)"); sheen.addColorStop(1, "rgba(0,0,0,.18)");
  g.fillStyle = sheen; g.fillRect(0, 0, FACE.w, FACE.h);
  // Screws.
  for (const [x, y] of [[26, 26], [974, 26], [26, 612], [974, 612], [500, 470]]) {
    g.fillStyle = "#0e0c0b"; g.beginPath(); g.arc(x, y, 10, 0, Math.PI * 2); g.fill();
    g.strokeStyle = "rgba(255,255,255,.28)"; g.lineWidth = 2; g.beginPath(); g.moveTo(x - 6, y); g.lineTo(x + 6, y); g.stroke();
  }
  // The label: cream, square, the lettering, a side mark, a ruled line and
  // a handwritten title, as a J-card's.
  g.fillStyle = LABEL; rr(g, 52, 44, 896, 404, 6); g.fill();
  g.fillStyle = TEAL; g.fillRect(52, 44, 896, 14);
  g.save(); g.translate(78, 70); const ls = 64 / LETTERING.h; g.scale(ls, ls); g.fillStyle = INK; g.fill(letters, "evenodd"); g.restore();
  g.fillStyle = INK; g.font = '500 24px "Inter"'; g.textBaseline = "alphabetic";
  g.textAlign = "right"; g.fillText("SIDE A", 918, 100);
  g.textAlign = "left";
  g.save(); g.strokeStyle = INK; g.globalAlpha = 0.7; g.lineWidth = 2; g.setLineDash([9, 7]);
  g.beginPath(); g.moveTo(78, 150); g.lineTo(918, 150); g.stroke(); g.restore();
  // The window band, dark, across the label.
  g.fillStyle = "#2a2522"; rr(g, 168, 166, 664, 182, 91); g.fill();
  // The title, in the reader's language.
  g.fillStyle = INK;
  if (lang === "ar") {
    g.direction = "rtl"; g.textAlign = "right"; g.font = '400 50px "IBM Plex Sans Arabic"';
    g.fillText("الأقسام", 918, 425);
    g.direction = "ltr"; g.textAlign = "left"; g.font = '300 22px "Inter"'; g.fillText("C60", 82, 420);
  } else {
    g.font = 'italic 400 60px "Instrument Serif"'; g.fillText("the sections", 82, 425);
    g.textAlign = "right"; g.font = '300 22px "Inter"'; g.fillText("C60", 918, 420);
  }
  // The foot: the head opening, a trapezoid, with its holes.
  g.fillStyle = "#171412";
  g.beginPath(); g.moveTo(214, FACE.h); g.lineTo(258, 506); g.lineTo(742, 506); g.lineTo(786, FACE.h); g.closePath(); g.fill();
  g.fillStyle = "#070606";
  for (const x of [318, 682]) { g.beginPath(); g.arc(x, 566, 13, 0, Math.PI * 2); g.fill(); }
  for (const x of [420, 580]) g.fillRect(x - 11, 556, 22, 22);
  // The tape, showing along the foot.
  g.fillStyle = "#6b4a2f"; g.fillRect(SLOT.x - SLOT.w / 2, 622, SLOT.w, 9);
  // Cut the windows and the slot between them.
  g.globalCompositeOperation = "destination-out";
  for (const h of HUBS) { g.beginPath(); g.arc(h.x, h.y, WIN_R, 0, Math.PI * 2); g.fill(); }
  rr(g, 420, 238, 160, 40, 20); g.fill();
  g.globalCompositeOperation = "source-over";
  g.save(); g.strokeStyle = "rgba(237,230,216,.55)"; g.lineWidth = 2; g.setLineDash([8, 6]);
  for (const h of HUBS) { g.beginPath(); g.arc(h.x, h.y, WIN_R + 7, 0, Math.PI * 2); g.stroke(); }
  g.restore();
  return c;
}

// The cream hub with six notches (reel.tsx), centred, radius r.
export function hubPath(r) {
  const p = new Path2D(); const rn = r * 0.72, step = Math.PI / 3, phi = 0.15;
  for (let i = 0; i < 6; i++) {
    const a = i * step;
    p.arc(0, 0, r, a + phi, a + step - phi);
    p.arc(0, 0, rn, a + step - phi, a + step + phi);
  }
  p.closePath();
  p.moveTo(r * 0.24, 0); p.arc(0, 0, r * 0.24, 0, Math.PI * 2, true);
  return p;
}

// The flat cassette for no WebGL: the insides, then the cut face over them.
export function paintFlat(g, face, angle, scale) {
  g.save(); g.scale(scale, scale);
  g.clearRect(0, 0, FACE.w, FACE.h);
  g.fillStyle = "#14110f"; rr(g, 160, 150, 680, 214, 100); g.fill();
  const packs = [150, 104];
  HUBS.forEach((h, i) => {
    g.save(); g.translate(h.x, h.y);
    g.fillStyle = "#2b1d14"; g.beginPath(); g.arc(0, 0, packs[i], 0, Math.PI * 2); g.fill();
    g.strokeStyle = "rgba(0,0,0,.35)"; g.lineWidth = 1.2;
    for (let r = 64; r < packs[i]; r += 5) { g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); g.stroke(); }
    g.rotate(angle);
    g.fillStyle = "#ede6d8"; g.fill(hubPath(HUB_R), "evenodd");
    g.restore();
  });
  g.drawImage(face, 0, 0, FACE.w, FACE.h);
  g.fillStyle = "rgba(255,255,255,.06)";
  for (const h of HUBS) { g.beginPath(); g.arc(h.x - 18, h.y - 22, WIN_R * 0.6, 0, Math.PI * 2); g.fill(); }
  g.restore();
}
