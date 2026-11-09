// Tape-deck sounds for v2, on the Web Audio API alone (no library). Off by
// default; the reader turns it on (a gesture), and the choice is kept in
// localStorage. Nothing plays before that, and nothing loops.
const KEY = "cassettes-proto-sound";
let ctx = null, out = null, on = false;
try { on = localStorage.getItem(KEY) === "on"; } catch { on = false; }

function ensure() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    // Warm and a little dull, like a cassette: a gentle low-pass at the end.
    const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 1800; lp.Q.value = 0.4;
    out = ctx.createGain(); out.gain.value = 0.6;
    out.connect(lp).connect(ctx.destination);
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

// C major pentatonic from C4, one note per track, A1 to B4.
const STEPS = [0, 2, 4, 7, 9, 12, 14, 16];
const freq = (i) => 261.63 * Math.pow(2, STEPS[i % STEPS.length] / 12);

export const sound = {
  get on() { return on; },
  set(v) {
    on = !!v;
    try { localStorage.setItem(KEY, on ? "on" : "off"); } catch { /* private mode */ }
    if (on) ensure();
  },
  // Call from a click: lets a stored "on" start the context.
  wake() { if (on) ensure(); },
  note(i) {
    if (!on || !ensure() || ctx.state !== "running") return;
    const t = ctx.currentTime, f = freq(i);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.16, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
    g.connect(out);
    // Two voices a few cents apart, and a slow wobble on both: tape wow.
    const wow = ctx.createOscillator(); wow.frequency.value = 5.2;
    const depth = ctx.createGain(); depth.gain.value = 7; wow.connect(depth);
    for (const [type, cents, lvl] of [["triangle", -5, 0.7], ["sine", 6, 0.5]]) {
      const o = ctx.createOscillator(); o.type = type; o.frequency.value = f; o.detune.value = cents;
      depth.connect(o.detune);
      const v = ctx.createGain(); v.gain.value = lvl;
      o.connect(v).connect(g); o.start(t); o.stop(t + 0.75);
    }
    wow.start(t); wow.stop(t + 0.75);
  },
  // The deck's latch: a short filtered click.
  click() {
    if (!on || !ensure()) return;
    const t = ctx.currentTime, n = Math.floor(ctx.sampleRate * 0.03);
    const buf = ctx.createBuffer(1, n, ctx.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 6);
    const s = ctx.createBufferSource(); s.buffer = buf;
    const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 2400; bp.Q.value = 1.2;
    const g = ctx.createGain(); g.gain.value = 0.5;
    s.connect(bp).connect(g).connect(out); s.start(t);
  },
  // Rewind: a rising whirr that fades.
  whirr(ms = 650) {
    if (!on || !ensure()) return;
    const t = ctx.currentTime, d = ms / 1000;
    const o = ctx.createOscillator(); o.type = "sawtooth";
    o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(520, t + d);
    const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 900;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.05, t + 0.06); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(lp).connect(g).connect(out); o.start(t); o.stop(t + d + 0.05);
  },
};
