// The open cassette in 3D: press-v3's shell (rounded box, clearcoat, a cut
// face over a dark well, brown tape packs, cream six-notch hubs, glass),
// rebuilt on three 0.186.1 as the website's hero uses. Placed by screen
// pixels so it can grow out of the sticker's rect. Draws only on request.
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

const CW = 1, CH = 0.638, CD = 0.12;
const HUB_X = 0.2125, HUB_Y = 0.0623, HUB_R = 0.0575, WIN_R = 0.092;
const FOV = 28, DIST = 6;

export function createCassette(canvas, face) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "low-power" });
  } catch { return null; }
  if (!renderer.getContext()) return null;
  renderer.setPixelRatio(Math.min(2, devicePixelRatio));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const env = pmrem.fromScene(room, 0.04);
  room.dispose(); pmrem.dispose();
  scene.environment = env.texture;
  scene.environmentIntensity = 0.55;
  const key = new THREE.DirectionalLight(0xffffff, 1.5);
  key.position.set(-2.5, 3.5, 5);
  scene.add(key);
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100);
  camera.position.set(0, 0, DIST);

  const root = new THREE.Group();
  scene.add(root);
  const faceTex = new THREE.CanvasTexture(face);
  faceTex.colorSpace = THREE.SRGBColorSpace;
  faceTex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  const shellFace = new THREE.MeshPhysicalMaterial({ map: faceTex, roughness: 0.55, clearcoat: 0.45, clearcoatRoughness: 0.3, alphaTest: 0.5 });
  const shellEdge = new THREE.MeshPhysicalMaterial({ color: 0x221e1b, roughness: 0.45, clearcoat: 0.5, clearcoatRoughness: 0.3 });
  const shell = new THREE.Mesh(new RoundedBoxGeometry(CW, CH, CD, 2, 0.018), [shellEdge, shellEdge, shellEdge, shellEdge, shellFace, shellEdge]);
  root.add(shell);

  // Behind the windows.
  const well = new THREE.Mesh(new THREE.PlaneGeometry(0.72, 0.3), new THREE.MeshStandardMaterial({ color: 0x14110f, roughness: 0.95 }));
  well.position.set(0, HUB_Y, CD / 2 - 0.085);
  root.add(well);
  const packTex = (() => {
    const c = document.createElement("canvas"); c.width = c.height = 256;
    const g = c.getContext("2d"); g.translate(128, 128);
    g.fillStyle = "#2b1d14"; g.beginPath(); g.arc(0, 0, 128, 0, Math.PI * 2); g.fill();
    for (let r = 26; r < 128; r += 2.2) { g.strokeStyle = r % 6.6 < 2.2 ? "rgba(255,255,255,.07)" : "rgba(0,0,0,.24)"; g.lineWidth = 1.1; g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); g.stroke(); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  })();
  const packCap = new THREE.MeshStandardMaterial({ map: packTex, roughness: 0.36, metalness: 0.12 });
  const packSide = new THREE.MeshStandardMaterial({ color: 0x3d2a1b, roughness: 0.3, metalness: 0.25 });
  const packGeo = new THREE.CylinderGeometry(1, 1, 1, 64);
  const hubGeo = (() => {
    const s = new THREE.Shape(); const R = HUB_R, Rn = R * 0.72, step = Math.PI / 3, phi = 0.15;
    for (let i = 0; i < 6; i++) { const a = i * step; s.absarc(0, 0, R, a + phi, a + step - phi, false); s.absarc(0, 0, Rn, a + step - phi, a + step + phi, false); }
    s.closePath();
    const hole = new THREE.Path(); hole.absarc(0, 0, R * 0.24, 0, Math.PI * 2, true); s.holes.push(hole);
    return new THREE.ExtrudeGeometry(s, { depth: 0.012, bevelEnabled: true, bevelThickness: 0.002, bevelSize: 0.002, bevelSegments: 2, curveSegments: 16 });
  })();
  const hubMat = new THREE.MeshStandardMaterial({ color: 0xede6d8, roughness: 0.58 });
  const reels = [-1, 1].map((sx, i) => {
    const grp = new THREE.Group(); grp.position.set(sx * HUB_X, HUB_Y, 0); root.add(grp);
    const r = i ? 0.104 : 0.15;
    const pack = new THREE.Mesh(packGeo, [packSide, packCap, packCap]);
    pack.rotation.x = Math.PI / 2; pack.scale.set(r, 0.05, r); pack.position.z = CD / 2 - 0.05; grp.add(pack);
    const hub = new THREE.Mesh(hubGeo, hubMat); hub.position.z = CD / 2 - 0.03; grp.add(hub);
    return { grp, hub, pack };
  });
  const glass = new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.12, roughness: 0.05, clearcoat: 1, depthWrite: false });
  for (const sx of [-1, 1]) {
    const m = new THREE.Mesh(new THREE.CircleGeometry(WIN_R + 0.004, 40), glass);
    m.position.set(sx * HUB_X, HUB_Y, CD / 2 - 0.004); root.add(m);
  }

  let W = 1, H = 1;
  return {
    size(w, h) {
      W = w; H = h;
      renderer.setPixelRatio(Math.min(2, devicePixelRatio));
      renderer.setSize(w, h, false);
      camera.aspect = w / h; camera.updateProjectionMatrix();
    },
    // cx, cy, w in CSS px; rotations in radians.
    pose({ cx, cy, w, rx = 0, ry = 0, rz = 0 }) {
      const wpp = (2 * DIST * Math.tan((FOV * Math.PI) / 360)) / H;
      root.position.set((cx - W / 2) * wpp, -(cy - H / 2) * wpp, 0);
      root.scale.setScalar((w * wpp) / CW);
      root.rotation.set(rx, ry, rz);
    },
    reels(a) { for (const r of reels) r.hub.rotation.z = -a; },
    face(c) { faceTex.image = c; faceTex.needsUpdate = true; },
    render() { renderer.render(scene, camera); },
    // Compile and upload before the first open, so its first frame is cheap.
    warm() { renderer.setSize(4, 4, false); renderer.compile(scene, camera); renderer.render(scene, camera); },
    dispose() { renderer.dispose(); },
  };
}
