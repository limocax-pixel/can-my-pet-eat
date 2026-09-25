// Small helpers for building toy-like models out of primitives.
import * as THREE from 'three';

const matCache = new Map();

/** Cached MeshStandard/Physical material. opts: rough, gloss, sheen, emissive, side, map */
export function mat(color, opts = {}) {
  const key = color + JSON.stringify(opts);
  if (!opts.map && matCache.has(key)) return matCache.get(key);
  let m;
  if (opts.sheen || opts.gloss || opts.clearcoat) {
    m = new THREE.MeshPhysicalMaterial({
      color,
      roughness: opts.rough ?? (opts.gloss ? 0.25 : 0.8),
      metalness: 0,
      sheen: opts.sheen ? 1 : 0,
      sheenRoughness: 0.7,
      sheenColor: new THREE.Color(opts.sheenColor ?? color).lerp(new THREE.Color('#ffffff'), 0.25),
      clearcoat: opts.clearcoat ?? (opts.gloss ? 0.6 : 0),
      clearcoatRoughness: 0.2,
    });
  } else {
    m = new THREE.MeshStandardMaterial({ color, roughness: opts.rough ?? 0.6, metalness: 0 });
  }
  if (opts.map) m.map = opts.map;
  if (opts.side) m.side = opts.side;
  if (opts.emissive) { m.emissive = new THREE.Color(opts.emissive); m.emissiveIntensity = opts.emissiveIntensity ?? 0.4; }
  if (opts.opacity != null) { m.transparent = true; m.opacity = opts.opacity; }
  if (!opts.map) matCache.set(key, m);
  return m;
}

export function mesh(geo, material, { pos, rot, scale, shadow = true } = {}) {
  const m = new THREE.Mesh(geo, material);
  if (pos) m.position.set(...pos);
  if (rot) m.rotation.set(...rot);
  if (scale != null) Array.isArray(scale) ? m.scale.set(...scale) : m.scale.setScalar(scale);
  m.castShadow = shadow;
  m.receiveShadow = shadow;
  return m;
}

const geoCache = new Map();
function cached(key, make) {
  if (!geoCache.has(key)) geoCache.set(key, make());
  return geoCache.get(key);
}

export const G = {
  sphere: (r = 1, w = 32, h = 24) => cached(`s${r}${w}${h}`, () => new THREE.SphereGeometry(r, w, h)),
  cyl: (rt, rb, h, seg = 24, open = false) =>
    cached(`c${rt}|${rb}|${h}|${seg}|${open}`, () => new THREE.CylinderGeometry(rt, rb, h, seg, 1, open)),
  cone: (r, h, seg = 24) => cached(`k${r}|${h}|${seg}`, () => new THREE.ConeGeometry(r, h, seg)),
  capsule: (r, len, seg = 8) => cached(`p${r}|${len}|${seg}`, () => new THREE.CapsuleGeometry(r, len, seg, 16)),
  torus: (r, t, arc = Math.PI * 2, seg = 48) =>
    cached(`t${r}|${t}|${arc}|${seg}`, () => new THREE.TorusGeometry(r, t, 16, seg, arc)),
  box: (x, y, z) => cached(`b${x}|${y}|${z}`, () => new THREE.BoxGeometry(x, y, z)),
};

/** Sphere primitive shortcut: sph(radius, material, {pos, scale, rot}) */
export function sph(r, material, o) {
  return mesh(G.sphere(1), material, { ...o, scale: scaleOf(r, o?.scale) });
}
function scaleOf(r, s) {
  if (s == null) return [r, r, r];
  return Array.isArray(s) ? [r * s[0], r * s[1], r * s[2]] : [r * s, r * s, r * s];
}

/** Point on the surface of an axis-aligned ellipsoid (center c, radii rad) in direction dir. */
export function onEllipsoid(c, rad, dir, out = 1) {
  const d = new THREE.Vector3(...dir).normalize();
  const t = 1 / Math.sqrt((d.x / rad[0]) ** 2 + (d.y / rad[1]) ** 2 + (d.z / rad[2]) ** 2);
  return [c[0] + d.x * t * out, c[1] + d.y * t * out, c[2] + d.z * t * out];
}

/** Lathe from [x,y] profile points (x = radius). */
export function lathe(points, seg = 40, phiStart = 0, phiLength = Math.PI * 2) {
  return new THREE.LatheGeometry(points.map(([x, y]) => new THREE.Vector2(x, y)), seg, phiStart, phiLength);
}

/** A leaf: 2D outline bent into 3D. */
export function leafGeometry({ length = 1, width = 0.45, curl = 0.35, wave = 0.04, waves = 5, jag = 0, seg = 18 } = {}) {
  const shape = new THREE.Shape();
  const pts = [];
  for (let i = 0; i <= seg; i++) {
    const t = i / seg;
    let w = Math.sin(Math.PI * t) ** 0.8 * width * 0.5;
    if (jag) w *= 1 - jag * (0.5 + 0.5 * Math.sin(t * Math.PI * 10));
    pts.push([w, t * length]);
  }
  shape.moveTo(0, 0);
  pts.forEach(([x, y]) => shape.lineTo(x, y));
  for (let i = pts.length - 1; i >= 0; i--) shape.lineTo(-pts[i][0], pts[i][1]);
  const geo = new THREE.ShapeGeometry(shape, 6);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i);
    const t = y / length;
    const z = curl * t * t + (Math.abs(x) / (width * 0.5 || 1)) ** 2 * 0.08 + Math.sin(t * Math.PI * waves + x * 12) * wave;
    p.setZ(i, z);
  }
  geo.computeVertexNormals();
  return geo;
}

/** Canvas texture helper. */
export function canvasTexture(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

export function group(...children) {
  const g = new THREE.Group();
  children.flat().filter(Boolean).forEach((c) => g.add(c));
  return g;
}

/** Deterministic pseudo-random generator so models look the same on every load. */
export function rng(seed = 1) {
  let s = seed >>> 0 || 1;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

export function hashStr(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** Scale & center a group so it fits in a box of `size` and sits on y = 0. */
export function fitToSize(obj, size = 1) {
  const box = new THREE.Box3().setFromObject(obj);
  const dim = new THREE.Vector3();
  box.getSize(dim);
  const s = size / Math.max(dim.x, dim.y * 0.9, dim.z);
  obj.scale.multiplyScalar(s);
  const box2 = new THREE.Box3().setFromObject(obj);
  const center = new THREE.Vector3();
  box2.getCenter(center);
  obj.position.x -= center.x;
  obj.position.z -= center.z;
  obj.position.y -= box2.min.y;
  return obj;
}
