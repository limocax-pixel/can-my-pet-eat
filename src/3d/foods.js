// Procedural low-poly food models. buildFood(id) returns a Group about 1 unit
// wide that sits on y = 0.
import * as THREE from 'three';
import { mat, mesh, sph, G, lathe, leafGeometry, group, rng, hashStr, fitToSize, canvasTexture } from './kit.js';

const DS = THREE.DoubleSide;
const STEM = '#6e4b2e';
const LEAF = '#5aa13c';

// ── building blocks ────────────────────────────────────────────────
function leaf(color = LEAF, o = {}) {
  const m = mesh(leafGeometry(o), mat(color, { side: DS, rough: 0.55 }));
  return m;
}

function stem(h = 0.18, r = 0.025, color = STEM) {
  return mesh(G.cyl(r * 0.8, r, h, 8), mat(color, { rough: 0.8 }), { pos: [0, h / 2, 0] });
}

function roundFruit({ c, r = 0.45, sq = [1, 0.92, 1], stemC = STEM, leafC, dimple = true, gloss = true, blush, bumpy }) {
  const g = new THREE.Group();
  let geo = new THREE.SphereGeometry(r, 40, 28);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const v = new THREE.Vector3(p.getX(i), p.getY(i), p.getZ(i));
    const ny = v.y / r;
    if (dimple) v.multiplyScalar(1 - 0.16 * Math.exp(-((1 - ny) * 7)) - 0.08 * Math.exp(-((1 + ny) * 7)));
    if (bumpy) v.multiplyScalar(1 + (Math.sin(v.x * 60) * Math.sin(v.y * 55) * Math.sin(v.z * 58)) * 0.012);
    p.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  let material = mat(c, { gloss, rough: gloss ? 0.3 : 0.55 });
  if (blush) {
    material = mat('#ffffff', { gloss, rough: 0.45, map: canvasTexture(128, 64, (ctx, w, h) => {
      const gr = ctx.createLinearGradient(0, 0, w, 0);
      gr.addColorStop(0, c); gr.addColorStop(0.35, blush); gr.addColorStop(0.55, blush); gr.addColorStop(0.9, c);
      ctx.fillStyle = gr; ctx.fillRect(0, 0, w, h);
    }) });
  }
  g.add(mesh(geo, material, { pos: [0, r * sq[1], 0], scale: sq }));
  if (stemC) g.add(stem(0.22, 0.028, stemC).translateY(r * sq[1] * 1.72));
  if (leafC) {
    const l = leaf(leafC, { length: 0.32, width: 0.16, curl: 0.12 });
    l.position.set(0.02, r * sq[1] * 1.9, 0);
    l.rotation.set(-1.1, 0.4, -0.9);
    g.add(l);
  }
  return g;
}

function pile(n, makePiece, seed, spread = 0.38) {
  const g = new THREE.Group();
  const R = rng(seed);
  for (let i = 0; i < n; i++) {
    const piece = makePiece(R, i);
    const a = R() * Math.PI * 2;
    const d = Math.sqrt(R()) * spread * (i < n * 0.6 ? 1 : 0.55);
    piece.position.x += Math.cos(a) * d;
    piece.position.z += Math.sin(a) * d;
    piece.position.y += i < n * 0.6 ? 0 : 0.09 + R() * 0.06;
    piece.rotation.y += R() * Math.PI * 2;
    g.add(piece);
  }
  return g;
}

function tube(points, radius, color, o = {}) {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
  return mesh(new THREE.TubeGeometry(curve, 40, radius, 14, false), mat(color, o));
}

// ── specific foods ─────────────────────────────────────────────────
const B = {
  apple: () => roundFruit({ c: '#d7353a', r: 0.46, leafC: LEAF }),
  orange: () => {
    const g = roundFruit({ c: '#f5922b', r: 0.44, sq: [1, 0.95, 1], stemC: null, leafC: '#3f7d2c', bumpy: true, dimple: false, gloss: false });
    g.add(sph(0.05, mat('#7a8a2a'), { pos: [0, 0.86, 0] }));
    const seg = mesh(G.sphere(1), mat('#f7a54b', { rough: 0.5 }), { pos: [0.62, 0.16, 0.25], scale: [0.18, 0.16, 0.34], rot: [0, 0.4, 0] });
    g.add(seg);
    return g;
  },
  tomato: () => {
    const g = roundFruit({ c: '#e33b2c', r: 0.44, sq: [1, 0.82, 1], stemC: '#3e8a32', dimple: true });
    for (let i = 0; i < 5; i++) {
      const l = leaf('#3e8a32', { length: 0.2, width: 0.08, curl: -0.05 });
      l.position.set(0, 0.74, 0);
      l.rotation.set(-1.35, (i / 5) * Math.PI * 2, 0, 'YXZ');
      g.add(l);
    }
    return g;
  },
  peach: () => {
    const g = roundFruit({ c: '#f7b26d', blush: '#e8636a', r: 0.44, sq: [1, 0.98, 1], leafC: LEAF, gloss: false });
    g.add(mesh(G.torus(0.44, 0.012, Math.PI), mat('#d5585c'), { pos: [0, 0.44, 0], rot: [0, Math.PI / 2, 0], scale: [1, 0.98, 1] }));
    return g;
  },
  mango: () => {
    const g = roundFruit({ c: '#f6b62e', blush: '#e6593c', r: 0.44, sq: [0.8, 0.72, 1.18], stemC: STEM, dimple: false });
    g.rotation.z = 0.15;
    return g;
  },
  pear: () => {
    const g = new THREE.Group();
    const geo = lathe([[0, 0], [0.26, 0.02], [0.4, 0.16], [0.42, 0.32], [0.34, 0.5], [0.2, 0.66], [0.16, 0.8], [0.1, 0.9], [0, 0.93]]);
    g.add(mesh(geo, mat('#b9cf4c', { gloss: true, rough: 0.4 })));
    g.add(stem(0.16, 0.024).translateY(0.9));
    const l = leaf(LEAF, { length: 0.26, width: 0.13, curl: 0.1 });
    l.position.set(0.02, 1.0, 0); l.rotation.set(-1.1, 0.3, -1);
    g.add(l);
    return g;
  },
  banana: () => {
    const g = new THREE.Group();
    const pts = [];
    for (let i = 0; i <= 10; i++) { const t = i / 10; pts.push([-0.55 + t * 1.1, 0.14 + Math.sin(t * Math.PI) * 0.26, 0]); }
    const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)));
    const geo = new THREE.TubeGeometry(curve, 48, 0.13, 6, false);
    // taper the ends
    const p = geo.attributes.position;
    const tmp = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) {
      const seg = Math.floor(i / 7) / 48;
      const k = Math.min(1, Math.sin(seg * Math.PI) * 1.7 + 0.25);
      const c = curve.getPoint(seg);
      tmp.set(p.getX(i), p.getY(i), p.getZ(i)).sub(c).multiplyScalar(k).add(c);
      p.setXYZ(i, tmp.x, tmp.y, tmp.z);
    }
    geo.computeVertexNormals();
    const yellow = mat('#f4d44c', { rough: 0.45 });
    g.add(mesh(geo, yellow));
    const second = mesh(geo, yellow, { pos: [0.02, 0.02, 0.2], rot: [0.35, 0.1, 0] });
    g.add(second);
    g.add(mesh(G.cyl(0.035, 0.05, 0.12, 8), mat('#6b5a2a'), { pos: [0.6, 0.2, 0.1], rot: [0, 0, -0.8] }));
    return g;
  },
  blueberry: () => pile(7, (R) => {
    const b = sph(0.15, mat('#3f4f94', { rough: 0.6 }), { pos: [0, 0.14, 0] });
    b.add(mesh(G.torus(0.3, 0.1, Math.PI * 2, 5), mat('#2b3566'), { pos: [0, 0.95, 0], rot: [Math.PI / 2, 0, 0], scale: 0.9 }));
    return b;
  }, 11, 0.3),
  grape: () => {
    const g = new THREE.Group();
    const R = rng(4);
    const m = mat('#9ccc55', { gloss: true, rough: 0.25 });
    const rows = [5, 4, 3, 2, 1];
    let y = 0.95;
    rows.forEach((n, ri) => {
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + ri;
        const rr = n === 1 ? 0 : 0.1 + n * 0.035;
        g.add(sph(0.13, m, { pos: [Math.cos(a) * rr, y, Math.sin(a) * rr], scale: [1, 1.15, 1] }));
      }
      y -= 0.19 + R() * 0.02;
    });
    g.add(stem(0.2, 0.02, '#7b6b3a').translateY(1.02));
    return g;
  },
  cherry: () => {
    const g = new THREE.Group();
    const m = mat('#a3122f', { gloss: true, rough: 0.2 });
    g.add(sph(0.2, m, { pos: [-0.2, 0.2, 0] }));
    g.add(sph(0.2, m, { pos: [0.2, 0.2, 0.05] }));
    g.add(tube([[-0.2, 0.36, 0], [-0.12, 0.7, 0], [0.02, 0.92, 0]], 0.018, '#5c7a2a'));
    g.add(tube([[0.2, 0.36, 0.05], [0.14, 0.7, 0.02], [0.02, 0.92, 0]], 0.018, '#5c7a2a'));
    const l = leaf(LEAF, { length: 0.34, width: 0.16, curl: 0.1 });
    l.position.set(0.02, 0.9, 0); l.rotation.set(-0.8, 0, -1.2);
    g.add(l);
    return g;
  },
  strawberry: () => {
    const g = new THREE.Group();
    const geo = lathe([[0, 0], [0.1, 0.03], [0.24, 0.15], [0.34, 0.38], [0.36, 0.55], [0.3, 0.66], [0, 0.7]], 32);
    const m = mat('#e0303f', { gloss: true, rough: 0.3 });
    const body = mesh(geo, m);
    g.add(body);
    const R = rng(9);
    const seedM = mat('#f6e27a', { rough: 0.5 });
    for (let i = 0; i < 40; i++) {
      const y = 0.08 + R() * 0.55, a = R() * Math.PI * 2;
      const rad = [0.1, 0.24, 0.34, 0.36, 0.3][Math.min(4, Math.floor(y / 0.14))];
      g.add(sph(0.018, seedM, { pos: [Math.cos(a) * rad, y, Math.sin(a) * rad], scale: [1, 1.5, 1], shadow: false }));
    }
    for (let i = 0; i < 6; i++) {
      const l = leaf('#3f8f35', { length: 0.26, width: 0.1, curl: -0.12 });
      l.position.set(0, 0.68, 0);
      l.rotation.set(-1.25, (i / 6) * Math.PI * 2, 0, 'YXZ');
      g.add(l);
    }
    g.rotation.x = Math.PI; g.position.y = 0.72;
    return group(g);
  },
  raspberry: () => {
    const g = new THREE.Group();
    const m = mat('#d62c5b', { rough: 0.45, gloss: true });
    for (let ring = 0; ring < 6; ring++) {
      const y = 0.08 + ring * 0.1, rr = [0.14, 0.24, 0.28, 0.27, 0.22, 0.12][ring];
      const n = Math.max(3, Math.round(rr * 40));
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + ring * 0.4;
        g.add(sph(0.075, m, { pos: [Math.cos(a) * rr, y, Math.sin(a) * rr], shadow: false }));
      }
    }
    g.add(sph(0.1, m, { pos: [0, 0.66, 0] }));
    return g;
  },
  raisin: () => pile(10, (R) => sph(0.1, mat('#4b2a25', { rough: 0.75 }), { pos: [0, 0.07, 0], scale: [1.2, 0.7, 0.9], rot: [R(), R(), R()] }), 5, 0.3),
  watermelon: () => wedge('#f2545b', '#f7f3d9', '#3d8c3a', true),
  cantaloupe: () => wedge('#f7963f', '#d9ea9e', '#b9a878', false),
  pineapple: () => {
    const g = new THREE.Group();
    const geo = lathe([[0, 0], [0.26, 0.02], [0.34, 0.2], [0.35, 0.45], [0.3, 0.66], [0.18, 0.76], [0, 0.78]], 24);
    g.add(mesh(geo, mat('#ffffff', { rough: 0.6, map: canvasTexture(256, 128, (ctx, w, h) => {
      ctx.fillStyle = '#d99a2e'; ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#8a5a1c'; ctx.lineWidth = 3;
      for (let i = -10; i < 20; i++) {
        ctx.beginPath(); ctx.moveTo(i * 20, 0); ctx.lineTo(i * 20 + h, h); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(i * 20 + h, 0); ctx.lineTo(i * 20, h); ctx.stroke();
      }
    }) })));
    for (let i = 0; i < 9; i++) {
      const l = leaf('#4f8f3a', { length: 0.42 + (i % 3) * 0.08, width: 0.1, curl: 0.2 });
      l.position.set(0, 0.74, 0);
      l.rotation.set(-0.35 - (i % 3) * 0.2, (i / 9) * Math.PI * 2, 0, 'YXZ');
      g.add(l);
    }
    return g;
  },
  kiwi: () => {
    const g = new THREE.Group();
    const skin = mat('#8a6a3f', { rough: 0.95 });
    const half = new THREE.SphereGeometry(0.4, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    g.add(mesh(half, skin, { pos: [0, 0, 0], rot: [-Math.PI / 2, 0, 0], scale: [1, 1, 1.3] }).translateY(0));
    const face = mesh(new THREE.CircleGeometry(0.4, 40), mat('#ffffff', { rough: 0.45, map: canvasTexture(256, 256, (ctx, w) => {
      const c = w / 2;
      const gr = ctx.createRadialGradient(c, c, 10, c, c, c);
      gr.addColorStop(0, '#f4f1cf'); gr.addColorStop(0.28, '#e8eeb0'); gr.addColorStop(0.36, '#8fc13f'); gr.addColorStop(1, '#6aa632');
      ctx.fillStyle = gr; ctx.fillRect(0, 0, w, w);
      ctx.fillStyle = '#1b1b12';
      for (let i = 0; i < 44; i++) { const a = (i / 44) * Math.PI * 2; const r = 44 + (i % 3) * 6; ctx.beginPath(); ctx.ellipse(c + Math.cos(a) * r, c + Math.sin(a) * r, 4, 2, a, 0, 7); ctx.fill(); }
    }) }));
    face.position.z = 0.001;
    g.add(face);
    const out = group(g);
    g.rotation.x = -0.9; g.position.y = 0.36;
    return out;
  },
  avocado: () => {
    const g = new THREE.Group();
    const pts = [[0, 0], [0.3, 0.04], [0.4, 0.2], [0.36, 0.45], [0.24, 0.66], [0.12, 0.8], [0, 0.83]];
    const geo = lathe(pts, 36, Math.PI / 2, Math.PI);
    const shell = mesh(geo, mat('#3f5f2a', { rough: 0.8, side: DS }));
    g.add(shell);
    const flesh = mesh(new THREE.ShapeGeometry(new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)).concat(pts.slice().reverse().map(([x, y]) => new THREE.Vector2(-x, y))))), mat('#ffffff', { side: DS, map: canvasTexture(128, 128, (ctx, w) => {
      const gr = ctx.createRadialGradient(w / 2, w * 0.7, 5, w / 2, w * 0.6, w * 0.7);
      gr.addColorStop(0, '#e8ef9a'); gr.addColorStop(0.7, '#c9e07a'); gr.addColorStop(0.95, '#7fae3f');
      ctx.fillStyle = gr; ctx.fillRect(0, 0, w, w);
    }) }), { shadow: false });
    flesh.material.map.repeat.set(1.25, 1.2);
    g.add(flesh);
    g.add(sph(0.17, mat('#7a4a2a', { gloss: true, rough: 0.3 }), { pos: [0, 0.3, 0.03], scale: [1, 1.1, 0.6] }));
    g.scale.z = 0.7;
    const out = group(g);
    g.rotation.x = -1.2; g.position.y = 0.25;
    return out;
  },
  coconut: () => {
    const g = new THREE.Group();
    const shell = new THREE.SphereGeometry(0.45, 32, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
    g.add(mesh(shell, mat('#6b4428', { rough: 0.95, side: DS }), { pos: [0, 0.45, 0] }));
    g.add(mesh(new THREE.RingGeometry(0.34, 0.45, 40), mat('#fbf8f0', { side: DS, rough: 0.6 }), { pos: [0, 0.45, 0], rot: [-Math.PI / 2, 0, 0] }));
    const inner = new THREE.SphereGeometry(0.34, 32, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
    g.add(mesh(inner, mat('#fbf8f0', { side: DS, rough: 0.5 }), { pos: [0, 0.45, 0] }));
    return group(g);
  },

  carrot: () => {
    const g = new THREE.Group();
    const geo = lathe([[0, 0], [0.06, 0.08], [0.12, 0.35], [0.17, 0.7], [0.18, 0.86], [0.12, 0.92], [0, 0.93]], 24);
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) { const y = p.getY(i); const k = 1 + Math.sin(y * 40) * 0.025; p.setX(i, p.getX(i) * k); p.setZ(i, p.getZ(i) * k); }
    geo.computeVertexNormals();
    const body = mesh(geo, mat('#f07b24', { rough: 0.55 }));
    g.add(body);
    for (let i = 0; i < 5; i++) {
      const l = leaf('#4f9a36', { length: 0.45, width: 0.1, curl: -0.1, jag: 0.5 });
      l.position.set(0, 0.9, 0); l.rotation.set(-0.3 + (i % 2) * 0.15, (i / 5) * Math.PI * 2, 0, 'YXZ');
      g.add(l);
    }
    const out = group(g);
    g.rotation.z = Math.PI / 2.3; g.position.set(0.3, 0.18, 0);
    return out;
  },
  broccoli: () => floret('#3f8a3a', '#9cc460', 0),
  cauliflower: () => floret('#f4eedb', '#d6e2b0', 1),
  cucumber: () => {
    const g = new THREE.Group();
    const body = mesh(G.capsule(0.17, 0.75), mat('#2f6b2a', { rough: 0.45 }), { pos: [-0.1, 0.17, 0], rot: [0, 0, Math.PI / 2] });
    g.add(body);
    for (let i = 0; i < 2; i++) g.add(slice(0.17, 0.05, '#2f6b2a', '#d4ecb0', '#eef6d8', [0.45 + i * 0.12, 0.03 + i * 0.05, 0.28 - i * 0.1], i ? 0.5 : 0));
    return g;
  },
  zucchini: () => {
    const g = new THREE.Group();
    g.add(mesh(G.capsule(0.19, 0.85), mat('#3b6f2a', { rough: 0.5 }), { pos: [-0.1, 0.19, 0], rot: [0, 0, Math.PI / 2 - 0.05] }));
    g.add(mesh(G.cyl(0.06, 0.08, 0.12, 8), mat('#8a9a50'), { pos: [-0.72, 0.2, 0], rot: [0, 0, Math.PI / 2] }));
    g.add(slice(0.19, 0.06, '#3b6f2a', '#f4f0c8', '#fbf8e0', [0.5, 0.03, 0.32], 0));
    return g;
  },
  'bell-pepper': () => {
    const g = new THREE.Group();
    const geo = new THREE.SphereGeometry(0.42, 40, 30);
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      const a = Math.atan2(z, x);
      const lobe = 1 + Math.cos(a * 4) * 0.08;
      const yk = y > 0.25 ? 0.92 : 1;
      p.setXYZ(i, x * lobe * yk, y * 1.05 - (y < -0.3 ? (Math.cos(a * 4) * 0.06) : 0), z * lobe * yk);
    }
    geo.computeVertexNormals();
    g.add(mesh(geo, mat('#e2342a', { gloss: true, rough: 0.2 }), { pos: [0, 0.44, 0] }));
    g.add(mesh(G.cyl(0.08, 0.1, 0.06, 12), mat('#3e7a2c'), { pos: [0, 0.88, 0] }));
    g.add(mesh(G.cyl(0.03, 0.035, 0.18, 8), mat('#4f8a36'), { pos: [0.02, 0.98, 0], rot: [0, 0, -0.3] }));
    return g;
  },
  chili: () => {
    const g = new THREE.Group();
    const pts = [[-0.5, 0.12, 0], [-0.1, 0.16, 0], [0.25, 0.12, 0], [0.5, 0.26, 0]];
    const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)));
    const geo = new THREE.TubeGeometry(curve, 40, 0.11, 14, false);
    const pa = geo.attributes.position, tmp = new THREE.Vector3();
    for (let i = 0; i < pa.count; i++) {
      const seg = Math.floor(i / 15) / 40;
      const k = seg < 0.1 ? 0.8 + seg * 2 : Math.max(0.05, 1 - (seg - 0.1) * 1.05);
      const c = curve.getPoint(seg);
      tmp.set(pa.getX(i), pa.getY(i), pa.getZ(i)).sub(c).multiplyScalar(k).add(c);
      pa.setXYZ(i, tmp.x, tmp.y, tmp.z);
    }
    geo.computeVertexNormals();
    const red = mat('#d3231c', { gloss: true, rough: 0.2 });
    g.add(mesh(geo, red));
    g.add(mesh(geo, red, { pos: [0.05, 0, 0.28], rot: [0, 0.5, 0] }));
    g.add(mesh(G.cyl(0.08, 0.1, 0.08, 10), mat('#3e7a2c'), { pos: [-0.52, 0.12, 0], rot: [0, 0, Math.PI / 2] }));
    g.add(mesh(G.cyl(0.02, 0.025, 0.2, 6), mat('#4f8a36'), { pos: [-0.64, 0.16, 0], rot: [0, 0, 1.2] }));
    return g;
  },
  celery: () => stalks('#a5d16e', '#6aa843', 3),
  rhubarb: () => stalks('#c53a4c', '#4f9a3a', 3, true),
  cabbage: () => leafyBall('#7fbf5c', '#cfe8b0', 7),
  iceberg: () => leafyBall('#aad884', '#e6f4cf', 9),
  romaine: () => leafBunch('#5aa742', '#dff0c0', { length: 1, width: 0.42, curl: 0.18, wave: 0.03 }, 5),
  spinach: () => leafBunch('#2f7a34', '#a9d27d', { length: 0.62, width: 0.46, curl: 0.12, wave: 0.02 }, 6),
  kale: () => leafBunch('#2f5f3a', '#8fb07a', { length: 0.95, width: 0.5, curl: 0.2, wave: 0.06, waves: 16, jag: 0.35 }, 4),
  dandelion: () => leafBunch('#4f9a36', '#c7df9c', { length: 0.9, width: 0.3, curl: 0.12, wave: 0.02, jag: 0.8 }, 5),
  parsley: () => sprig('#3f8a2c', 0.16, 3, 'parsley'),
  cilantro: () => sprig('#4f9e3a', 0.14, 3, 'cilantro'),
  'sweet-potato': () => tuber('#a8523c', '#f29a3f', [1.5, 0.75, 0.8], 21),
  potato: () => tuber('#c9a46c', '#f5e9b8', [1.2, 0.8, 0.9], 3),
  pumpkin: () => {
    const g = new THREE.Group();
    const geo = new THREE.SphereGeometry(0.46, 48, 28);
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      const a = Math.atan2(z, x), k = 1 - Math.abs(Math.sin(a * 5)) ** 3 * 0.08;
      p.setXYZ(i, x * k, y * 0.78, z * k);
    }
    geo.computeVertexNormals();
    g.add(mesh(geo, mat('#f08a24', { rough: 0.45, gloss: true }), { pos: [0, 0.36, 0] }));
    g.add(mesh(G.cyl(0.05, 0.07, 0.2, 8), mat('#6b7a3a'), { pos: [0, 0.78, 0], rot: [0, 0, 0.2] }));
    return g;
  },
  peas: () => {
    const g = new THREE.Group();
    const pod = new THREE.SphereGeometry(1, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.62);
    g.add(mesh(pod, mat('#6cbf46', { side: DS, rough: 0.5 }), { pos: [0, 0.2, 0], rot: [Math.PI, 0, Math.PI / 2], scale: [0.62, 0.2, 0.2] }));
    for (let i = 0; i < 5; i++) g.add(sph(0.1, mat('#86d353', { gloss: true, rough: 0.3 }), { pos: [-0.36 + i * 0.18, 0.22, 0] }));
    g.add(sph(0.1, mat('#86d353', { gloss: true, rough: 0.3 }), { pos: [0.3, 0.1, 0.35] }));
    g.add(sph(0.1, mat('#86d353', { gloss: true, rough: 0.3 }), { pos: [0.1, 0.1, 0.42] }));
    return g;
  },
  corn: () => {
    const g = new THREE.Group();
    const cob = new THREE.Group();
    const kern = mat('#f6cf48', { gloss: true, rough: 0.35 });
    cob.add(mesh(G.capsule(0.2, 0.7), mat('#e9d58c'), { rot: [0, 0, Math.PI / 2] }));
    for (let i = 0; i < 12; i++) for (let j = 0; j < 12; j++) {
      const x = -0.36 + i * 0.066, a = (j / 12) * Math.PI * 2 + i * 0.25;
      const r = 0.2 * Math.min(1, (0.46 - Math.abs(x)) * 6);
      if (r < 0.05) continue;
      cob.add(sph(0.045, kern, { pos: [x, Math.cos(a) * r, Math.sin(a) * r], scale: [1, 1.1, 1.1], shadow: false }));
    }
    const husk = leaf('#9cc466', { length: 0.9, width: 0.34, curl: 0.25 });
    husk.position.set(0.45, -0.05, 0.1); husk.rotation.set(0, Math.PI / 2 + 0.3, Math.PI / 2 + 0.2);
    cob.add(husk);
    cob.position.y = 0.24; cob.rotation.y = 0.2;
    g.add(cob);
    return g;
  },
  'green-beans': () => pile(6, (R) => {
    const t = tube([[-0.4, 0, 0], [-0.1, 0.05, 0.05], [0.2, 0, -0.03], [0.42, 0.06, 0]], 0.05, '#4f9e3b', { rough: 0.4 });
    t.position.y = 0.06;
    return t;
  }, 8, 0.15),
  onion: () => {
    const g = new THREE.Group();
    const geo = lathe([[0, 0], [0.12, 0.02], [0.36, 0.2], [0.42, 0.4], [0.32, 0.62], [0.12, 0.8], [0.04, 0.95], [0, 0.98]], 36);
    g.add(mesh(geo, mat('#c77c3e', { gloss: true, rough: 0.35 })));
    g.add(mesh(G.cyl(0.08, 0.14, 0.04, 12), mat('#e6d2a4'), { pos: [0, 0.02, 0] }));
    return g;
  },
  garlic: () => {
    const g = new THREE.Group();
    const m = mat('#f3ede1', { rough: 0.55 });
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2;
      const clove = mesh(lathe([[0, 0], [0.12, 0.05], [0.16, 0.25], [0.1, 0.5], [0.02, 0.62], [0, 0.63]], 16), m);
      clove.position.set(Math.cos(a) * 0.14, 0, Math.sin(a) * 0.14);
      clove.rotation.set(Math.sin(a) * 0.3, 0, -Math.cos(a) * 0.3);
      g.add(clove);
    }
    g.add(mesh(G.cone(0.08, 0.3, 10), m, { pos: [0, 0.7, 0] }));
    return g;
  },
  mushroom: () => {
    const g = new THREE.Group();
    const capGeo = lathe([[0, 0.5], [0.3, 0.46], [0.46, 0.34], [0.48, 0.26], [0.4, 0.24], [0.15, 0.3], [0, 0.3]], 36);
    g.add(mesh(capGeo, mat('#eadfce', { rough: 0.6 }), { pos: [0, 0.2, 0] }));
    g.add(mesh(lathe([[0, 0], [0.14, 0], [0.12, 0.3], [0.13, 0.5], [0, 0.5]], 20), mat('#f7f1e6', { rough: 0.7 })));
    const small = group(
      mesh(capGeo, mat('#e2d4bf', { rough: 0.6 }), { pos: [0, 0.1, 0], scale: 0.55 }),
      mesh(lathe([[0, 0], [0.14, 0], [0.12, 0.3], [0, 0.3]], 16), mat('#f7f1e6'), { scale: 0.55 })
    );
    small.position.set(0.42, 0, 0.2); small.rotation.z = -0.3;
    g.add(small);
    return g;
  },

  oats: () => pile(26, (R) => sph(0.07, mat(R() > 0.5 ? '#e9d3a4' : '#dcc08a', { rough: 0.9 }), { pos: [0, 0.03, 0], scale: [1.2, 0.3, 1], rot: [R() * 0.5, R() * 3, R() * 0.5] }), 12, 0.36),
  rice: () => {
    const g = pile(60, (R) => sph(0.045, mat('#b89a6a', { rough: 0.7 }), { pos: [0, 0.03 + R() * 0.12, 0], scale: [1, 0.6, 2.2], rot: [R(), R(), R()] }), 17, 0.3);
    g.add(bowl('#f3efe8', 0.42));
    return g;
  },
  bread: () => {
    const g = new THREE.Group();
    const shape = new THREE.Shape();
    shape.moveTo(-0.38, 0); shape.lineTo(0.38, 0); shape.lineTo(0.38, 0.5);
    shape.bezierCurveTo(0.5, 0.85, -0.5, 0.85, -0.38, 0.5); shape.lineTo(-0.38, 0);
    const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.14, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 3 });
    const slice = mesh(geo, [mat('#e8c992', { rough: 0.9 }), mat('#a8672d', { rough: 0.8 })]);
    slice.rotation.x = -Math.PI / 2 + 0.25; slice.position.set(0, 0.12, 0.3);
    g.add(slice);
    return g;
  },
  pasta: () => pile(14, (R) => mesh(G.cyl(0.05, 0.05, 0.26, 12, true), mat('#f2d27e', { rough: 0.55, side: DS }), { pos: [0, 0.06, 0], rot: [Math.PI / 2 + R() * 0.3, R() * 3, 0.4] }), 21, 0.32),
  popcorn: () => pile(14, (R) => {
    const p = new THREE.Group();
    for (let i = 0; i < 5; i++) p.add(sph(0.06 + R() * 0.03, mat(i === 0 ? '#f0cf6a' : '#fbf5e3', { rough: 0.9 }), { pos: [(R() - 0.5) * 0.12, 0.08 + (R() - 0.5) * 0.1, (R() - 0.5) * 0.12] }));
    return p;
  }, 31, 0.32),
  millet: () => {
    const g = new THREE.Group();
    const m = mat('#e8cf7a', { rough: 0.6 });
    const stemT = tube([[-0.55, 0.1, 0], [-0.2, 0.14, 0], [0.15, 0.2, 0], [0.5, 0.34, 0]], 0.02, '#c7ab5f');
    g.add(stemT);
    const R = rng(3);
    for (let i = 0; i < 130; i++) {
      const t = R();
      const x = -0.4 + t * 0.85, y = 0.12 + t * t * 0.22;
      const a = R() * Math.PI * 2, r = 0.05 + R() * 0.07 * Math.sin(t * Math.PI + 0.2);
      g.add(sph(0.03, m, { pos: [x, y + Math.cos(a) * r, Math.sin(a) * r], shadow: false }));
    }
    return g;
  },
  'sunflower-seeds': () => {
    const tex = canvasTexture(64, 64, (ctx, w, h) => {
      ctx.fillStyle = '#2b2a2e'; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#e9e4d6';
      for (let i = 0; i < 4; i++) ctx.fillRect(i * 16 + 4, 0, 5, h);
    });
    const m = mat('#ffffff', { map: tex, rough: 0.5 });
    return pile(12, (R) => mesh(G.sphere(1), m, { pos: [0, 0.05, 0], scale: [0.07, 0.045, 0.16], rot: [0, 0, R() * 0.4] }), 7, 0.3);
  },
  'pumpkin-seeds': () => pile(12, () => sph(0.1, mat('#7aa04a', { rough: 0.6 }), { pos: [0, 0.03, 0], scale: [0.7, 0.28, 1.25] }), 15, 0.3),
  peanuts: () => pile(6, (R) => {
    const p = new THREE.Group();
    const m = mat('#d9b27a', { rough: 0.95 });
    p.add(sph(0.12, m, { pos: [-0.1, 0.11, 0], scale: [1.1, 1, 1] }));
    p.add(sph(0.12, m, { pos: [0.1, 0.11, 0], scale: [1.1, 1, 1] }));
    p.add(mesh(G.cyl(0.085, 0.085, 0.1, 12), m, { pos: [0, 0.11, 0], rot: [0, 0, Math.PI / 2] }));
    return p;
  }, 19, 0.28),
  almonds: () => pile(9, () => {
    const a = mesh(lathe([[0, 0], [0.08, 0.03], [0.1, 0.12], [0.06, 0.24], [0, 0.28]], 16), mat('#b07a4a', { rough: 0.8 }));
    a.rotation.x = Math.PI / 2; a.scale.set(1, 1, 0.55); a.position.set(0, 0.05, -0.12);
    return group(a);
  }, 23, 0.28),
  walnuts: () => pile(4, (R) => {
    const w = new THREE.Group();
    const m = mat('#c89b62', { rough: 0.95 });
    for (let i = 0; i < 6; i++) w.add(sph(0.08, m, { pos: [(i % 3 - 1) * 0.07, 0.07 + Math.floor(i / 3) * 0.02, (Math.floor(i / 3) - 0.5) * 0.1], scale: [1, 0.7, 1] }));
    return w;
  }, 29, 0.26),
  cashews: () => pile(8, () => {
    const c = mesh(G.torus(0.09, 0.055, Math.PI * 1.1, 16), mat('#efd8ad', { rough: 0.7 }));
    c.position.y = 0.05; c.rotation.x = Math.PI / 2;
    return group(c);
  }, 33, 0.28),

  egg: () => {
    const g = new THREE.Group();
    const white = mat('#fbfaf6', { rough: 0.4 });
    const halfGeo = new THREE.SphereGeometry(0.3, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    for (const [x, rz] of [[-0.24, 0], [0.26, 0.3]]) {
      const h = new THREE.Group();
      h.add(mesh(halfGeo, white, { rot: [Math.PI, 0, 0], scale: [1, 1.25, 1] }));
      h.add(mesh(new THREE.CircleGeometry(0.3, 32), white, { rot: [-Math.PI / 2, 0, 0], shadow: false }));
      h.add(sph(0.14, mat('#f6b92c', { rough: 0.7 }), { pos: [0, -0.02, 0], scale: [1, 0.55, 1] }));
      h.position.set(x, 0.37, rz * 0.3);
      h.rotation.set(-0.35, rz, 0);
      g.add(h);
    }
    return g;
  },
  chicken: () => {
    const g = new THREE.Group();
    const m = mat('#e2b27c', { rough: 0.75 });
    const R = rng(12);
    for (let i = 0; i < 7; i++) {
      g.add(mesh(G.box(0.2, 0.14, 0.16), m, { pos: [(R() - 0.5) * 0.6, 0.07 + (i > 4 ? 0.12 : 0), (R() - 0.5) * 0.5], rot: [R() * 0.3, R() * 3, R() * 0.3] }));
    }
    return g;
  },
  mealworms: () => pile(6, (R) => {
    const pts = [];
    const bend = (R() - 0.5) * 0.5;
    for (let i = 0; i < 6; i++) pts.push([-0.22 + i * 0.09, 0.05, Math.sin(i * 0.8) * bend * 0.2]);
    const t = tube(pts, 0.042, '#c98a3c', { rough: 0.35, gloss: true });
    return t;
  }, 41, 0.22),
  tofu: () => {
    const g = new THREE.Group();
    const m = mat('#efe6cc', { rough: 0.5 });
    g.add(mesh(G.box(0.5, 0.36, 0.5), m, { pos: [-0.1, 0.18, 0] }));
    g.add(mesh(G.box(0.22, 0.22, 0.22), m, { pos: [0.36, 0.11, 0.22], rot: [0, 0.4, 0] }));
    return g;
  },
  cheese: () => {
    const g = new THREE.Group();
    const shape = new THREE.Shape();
    shape.moveTo(0, 0); shape.lineTo(0.8, 0.2); shape.lineTo(0.8, -0.2); shape.lineTo(0, 0);
    const holes = [[0.45, 0.02, 0.06], [0.64, -0.08, 0.04]];
    const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.4, bevelEnabled: true, bevelSize: 0.015, bevelThickness: 0.015 });
    const w = mesh(geo, mat('#f6cd4c', { rough: 0.5 }));
    w.rotation.x = -Math.PI / 2; w.position.set(-0.4, 0, 0.2);
    g.add(w);
    holes.forEach(([x, z, r]) => g.add(sph(r, mat('#d9a92f'), { pos: [x - 0.4, 0.4, z], scale: [1, 0.3, 1], shadow: false })));
    g.add(sph(0.05, mat('#d9a92f'), { pos: [0.1, 0.22, 0.12], scale: [0.4, 1, 1], shadow: false }));
    return g;
  },
  yogurt: () => {
    const g = new THREE.Group();
    g.add(mesh(lathe([[0, 0], [0.28, 0], [0.36, 0.55], [0.38, 0.58], [0, 0.58]], 36), mat('#ffffff', { rough: 0.35, map: canvasTexture(128, 64, (ctx, w, h) => {
      ctx.fillStyle = '#f3f6ff'; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#7ab0e6'; ctx.fillRect(0, h * 0.35, w, h * 0.22);
    }) })));
    g.add(mesh(new THREE.SphereGeometry(0.36, 32, 12, 0, Math.PI * 2, 0, 0.6), mat('#fffdf8', { rough: 0.25 }), { pos: [0, 0.3, 0] }));
    g.add(mesh(G.box(0.05, 0.02, 0.6), mat('#c9ced6', { gloss: true }), { pos: [0.1, 0.72, 0], rot: [0.9, 0.4, 0] }));
    return g;
  },

  chocolate: () => {
    const g = new THREE.Group();
    const m = mat('#5a2f1d', { gloss: true, rough: 0.3 });
    for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) {
      g.add(mesh(new THREE.BoxGeometry(0.24, 0.1, 0.24, 1, 1, 1), m, { pos: [-0.26 + i * 0.26, 0.06, -0.13 + j * 0.26] }));
      g.add(mesh(G.box(0.18, 0.04, 0.18), m, { pos: [-0.26 + i * 0.26, 0.12, -0.13 + j * 0.26] }));
    }
    g.add(mesh(G.box(0.82, 0.03, 0.56), mat('#c9c4bb', { gloss: true, rough: 0.2 }), { pos: [0.06, 0.015, 0.05], rot: [0, 0.1, 0] }));
    g.rotation.y = -0.4;
    return group(g);
  },
  coffee: () => {
    const g = new THREE.Group();
    const cup = mat('#fbf7f1', { gloss: true, rough: 0.2 });
    g.add(mesh(G.cyl(0.42, 0.42, 0.04, 40), cup, { pos: [0, 0.02, 0] }));
    g.add(mesh(lathe([[0, 0.04], [0.2, 0.04], [0.3, 0.2], [0.32, 0.46], [0.3, 0.46], [0.28, 0.2], [0.18, 0.08], [0, 0.08]], 40), cup));
    g.add(mesh(G.cyl(0.29, 0.29, 0.01, 32), mat('#4a2716', { gloss: true, rough: 0.1 }), { pos: [0, 0.41, 0] }));
    g.add(mesh(G.torus(0.1, 0.03, Math.PI * 1.3), cup, { pos: [0.34, 0.28, 0], rot: [0, 0, -Math.PI * 0.65] }));
    return g;
  },
  alcohol: () => {
    const g = new THREE.Group();
    const glass = mat('#e8f1f6', { gloss: true, rough: 0.05, opacity: 0.42 });
    g.add(mesh(G.cyl(0.2, 0.22, 0.02, 32), glass, { pos: [0, 0.01, 0] }));
    g.add(mesh(G.cyl(0.025, 0.025, 0.36, 12), glass, { pos: [0, 0.2, 0] }));
    g.add(mesh(lathe([[0.02, 0.38], [0.2, 0.46], [0.25, 0.64], [0.23, 0.86]], 36), mat('#e8f1f6', { gloss: true, rough: 0.05, opacity: 0.35, side: DS })));
    g.add(mesh(lathe([[0, 0.4], [0.19, 0.47], [0.235, 0.64], [0, 0.64]], 36), mat('#8e1f35', { gloss: true, rough: 0.1 })));
    return g;
  },
  chips: () => pile(10, (R) => {
    const geo = new THREE.SphereGeometry(0.3, 20, 8, 0, Math.PI * 2, 0, 0.5);
    const c = mesh(geo, mat('#efc45c', { side: DS, rough: 0.55 }), { pos: [0, 0.05, 0], rot: [Math.PI + (R() - 0.5) * 0.8, 0, (R() - 0.5) * 0.8], scale: [1, 0.5, 1] });
    return c;
  }, 51, 0.34),
  candy: () => pile(4, (R, i) => {
    const colors = ['#e85a8a', '#4fb3e6', '#f2c43c', '#7fcf5a'];
    const c = new THREE.Group();
    const m = mat(colors[i % 4], { gloss: true, rough: 0.15 });
    c.add(sph(0.13, m, { pos: [0, 0.13, 0], scale: [1.2, 1, 1] }));
    c.add(mesh(G.cone(0.1, 0.14, 12), m, { pos: [0.24, 0.13, 0], rot: [0, 0, Math.PI / 2] }));
    c.add(mesh(G.cone(0.1, 0.14, 12), m, { pos: [-0.24, 0.13, 0], rot: [0, 0, -Math.PI / 2] }));
    return c;
  }, 61, 0.26),
};

// ── shared shapes ──────────────────────────────────────────────────
function wedge(flesh, inner, rind, seeds) {
  const g = new THREE.Group();
  const r = 0.62, t = 0.3, ang = 0.9;
  const shape = new THREE.Shape();
  shape.moveTo(0, 0); shape.absarc(0, 0, r, Math.PI / 2 - ang / 2, Math.PI / 2 + ang / 2, false); shape.lineTo(0, 0);
  const fleshM = mat(flesh, { rough: 0.45, gloss: true });
  const geo = new THREE.ExtrudeGeometry(shape, { depth: t, bevelEnabled: false, curveSegments: 24 });
  g.add(mesh(geo, fleshM));
  const rindArc = new THREE.Shape();
  rindArc.absarc(0, 0, r + 0.08, Math.PI / 2 - ang / 2, Math.PI / 2 + ang / 2, false);
  rindArc.absarc(0, 0, r, Math.PI / 2 + ang / 2, Math.PI / 2 - ang / 2, true);
  g.add(mesh(new THREE.ExtrudeGeometry(rindArc, { depth: t, bevelEnabled: false, curveSegments: 24 }), mat(rind, { rough: 0.5 })));
  const innerArc = new THREE.Shape();
  innerArc.absarc(0, 0, r + 0.001, Math.PI / 2 - ang / 2, Math.PI / 2 + ang / 2, false);
  innerArc.absarc(0, 0, r - 0.06, Math.PI / 2 + ang / 2, Math.PI / 2 - ang / 2, true);
  g.add(mesh(new THREE.ExtrudeGeometry(innerArc, { depth: t + 0.004, bevelEnabled: false, curveSegments: 24 }), mat(inner, { rough: 0.5 }), { pos: [0, 0, -0.002] }));
  if (seeds) {
    const R = rng(2);
    for (let i = 0; i < 7; i++) {
      const a = Math.PI / 2 + (R() - 0.5) * ang * 0.7, d = 0.25 + R() * 0.2;
      g.add(sph(0.025, mat('#1c1a18', { gloss: true }), { pos: [Math.cos(a) * d, Math.sin(a) * d, t + 0.005], scale: [1, 1.6, 0.4], shadow: false }));
    }
  }
  g.rotation.set(0, 0.5, 0);
  g.position.set(0, 0, 0);
  return group(g);
}

function slice(r, t, skin, flesh, core, pos, rotZ) {
  const g = new THREE.Group();
  g.add(mesh(G.cyl(r, r, t, 32), [mat(skin), mat('#ffffff', { rough: 0.5, map: canvasTexture(128, 128, (ctx, w) => {
    const c = w / 2;
    ctx.fillStyle = skin; ctx.fillRect(0, 0, w, w);
    ctx.fillStyle = flesh; ctx.beginPath(); ctx.arc(c, c, c * 0.9, 0, 7); ctx.fill();
    ctx.fillStyle = core; ctx.beginPath(); ctx.arc(c, c, c * 0.5, 0, 7); ctx.fill();
    ctx.fillStyle = '#e8e2b0';
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; ctx.beginPath(); ctx.ellipse(c + Math.cos(a) * c * 0.32, c + Math.sin(a) * c * 0.32, 5, 3, a, 0, 7); ctx.fill(); }
  }) }), mat(flesh)]));
  g.position.set(pos[0], pos[1] + t / 2, pos[2]);
  g.rotation.z = rotZ;
  return g;
}

function floret(head, stalk, seed) {
  const g = new THREE.Group();
  g.add(mesh(G.cyl(0.08, 0.13, 0.4, 12), mat(stalk, { rough: 0.6 }), { pos: [0, 0.2, 0] }));
  const R = rng(7 + seed);
  const hm = mat(head, { rough: 0.85 });
  for (let i = 0; i < 16; i++) {
    const a = R() * Math.PI * 2, d = Math.sqrt(R()) * 0.28;
    g.add(sph(0.13 + R() * 0.04, hm, { pos: [Math.cos(a) * d, 0.52 + (0.28 - d) * 0.45, Math.sin(a) * d] }));
  }
  if (seed) {
    for (let i = 0; i < 4; i++) {
      const l = leaf('#6aa84f', { length: 0.5, width: 0.28, curl: 0.25 });
      l.position.set(0, 0.12, 0); l.rotation.set(-0.7, (i / 4) * Math.PI * 2 + 0.4, 0, 'YXZ');
      g.add(l);
    }
  }
  return g;
}

function stalks(color, leafC, n, red = false) {
  const g = new THREE.Group();
  for (let i = 0; i < n; i++) {
    const s = new THREE.Group();
    const geo = new THREE.CylinderGeometry(0.07, 0.08, 1.1, 16, 1, false, 0, Math.PI * 1.3);
    s.add(mesh(geo, mat(color, { rough: 0.5, side: DS })));
    const l = leaf(leafC, { length: red ? 0.5 : 0.3, width: red ? 0.5 : 0.22, curl: 0.2, jag: red ? 0 : 0.4 });
    l.position.y = 0.52; l.rotation.set(-0.3, 0, 0);
    s.add(l);
    s.rotation.set(0, i * 0.4, Math.PI / 2 - 0.08);
    s.position.set(0, 0.09 + (i === 2 ? 0.14 : 0), -0.14 + (i % 2) * 0.18);
    g.add(s);
  }
  return g;
}

function leafyBall(outer, inner, n) {
  const g = new THREE.Group();
  g.add(sph(0.36, mat(inner, { rough: 0.6 }), { pos: [0, 0.36, 0] }));
  for (let i = 0; i < n; i++) {
    const l = leaf(i % 2 ? outer : inner, { length: 0.8, width: 0.75, curl: 0.55, wave: 0.03, waves: 7 });
    l.position.set(0, 0.04, 0);
    l.rotation.set(-0.35 - (i % 3) * 0.08, (i / n) * Math.PI * 2, 0, 'YXZ');
    g.add(l);
  }
  return g;
}

function leafBunch(color, rib, o, n) {
  const g = new THREE.Group();
  for (let i = 0; i < n; i++) {
    const l = leaf(i % 2 ? color : shade(color, 0.12), o);
    l.position.set(0, 0.02 + i * 0.012, 0);
    l.rotation.set(-0.45 - (i % 2) * 0.25, (i / n) * Math.PI * 2, 0, 'YXZ');
    g.add(l);
    const ribM = mesh(G.cyl(0.012, 0.02, o.length * 0.9, 6), mat(rib), { shadow: false });
    ribM.position.set(0, o.length * 0.45, 0.02);
    l.add(ribM);
  }
  return g;
}

function sprig(color, leafSize, n, kind) {
  const g = new THREE.Group();
  const R = rng(kind.length);
  for (let s = 0; s < n; s++) {
    const sp = new THREE.Group();
    sp.add(tube([[0, 0, 0], [0.05, 0.3, 0], [0.02, 0.6, 0]], 0.012, '#6aa84f'));
    for (let i = 0; i < 7; i++) {
      const cl = leaf(color, { length: leafSize, width: leafSize * (kind === 'parsley' ? 1.1 : 0.9), curl: 0.08, jag: kind === 'parsley' ? 0.6 : 0.35 });
      const y = 0.25 + i * 0.055;
      cl.position.set(0.03, y, 0);
      cl.rotation.set(-0.5, (i / 7) * Math.PI * 2 + R(), 0.4, 'YXZ');
      sp.add(cl);
    }
    sp.rotation.set((s - 1) * 0.1, s * 0.9, (s - 1) * 0.45);
    sp.position.set(0, 0, 0);
    g.add(sp);
  }
  return g;
}

function tuber(skin, flesh, sc, seed) {
  const g = new THREE.Group();
  const geo = new THREE.SphereGeometry(0.3, 32, 20);
  const R = rng(seed);
  const bumps = Array.from({ length: 6 }, () => [R() * 6, R() * 6, R() * 0.06]);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const v = new THREE.Vector3(p.getX(i), p.getY(i), p.getZ(i));
    let k = 1;
    bumps.forEach(([a, b, amp]) => (k += Math.sin(v.x * 10 + a) * Math.sin(v.z * 10 + b) * amp));
    v.multiplyScalar(k);
    p.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  g.add(mesh(geo, mat(skin, { rough: 0.85 }), { pos: [0, 0.24, 0], scale: sc }));
  g.add(slice(0.2, 0.05, skin, flesh, flesh, [0.52, 0, 0.32], 0));
  return g;
}

function bowl(color, r) {
  return mesh(lathe([[0, 0], [r * 0.6, 0], [r, r * 0.35], [r * 1.02, r * 0.4], [r * 0.97, r * 0.4], [r * 0.58, r * 0.06], [0, r * 0.06]], 40), mat(color, { gloss: true, rough: 0.25 }));
}

function shade(hex, k) {
  const c = new THREE.Color(hex);
  c.offsetHSL(0, 0, k);
  return '#' + c.getHexString();
}

/** Build a food model. Unknown ids get a neutral "mystery" box. */
export function buildFood(id) {
  const make = B[id];
  const inner = make ? make() : group(mesh(G.box(0.5, 0.5, 0.5), mat('#cfc7bb')));
  inner.traverse((o) => { if (o.isMesh) { o.castShadow = true; } });
  const wrap = new THREE.Group();
  wrap.add(fitToSize(inner, id === 'rice' ? 0.95 : 1));
  wrap.userData.seed = hashStr(id);
  return wrap;
}

export const FOOD_IDS = Object.keys(B);
