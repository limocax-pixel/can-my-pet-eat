// The interactive 3D stage: a pet in a soft photo-studio set on paper bedding,
// a food dish, and a "thought bubble" verdict. The whole set is tinted by the
// verdict. createStage(container, opts) → { setSpecies, setFood, render, destroy }.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { mat, mesh, sph, G, lathe, rng, canvasTexture } from './kit.js';
import { buildCharacter, buildPerch } from './characters.js';
import { buildFood } from './foods.js';

export const VERDICT_COLORS = { yes: '#2f9e6a', limit: '#e5a031', avoid: '#e0703a', no: '#d63e3e' };
const MOOD = { yes: 'happy', limit: 'nibble', avoid: 'unsure', no: 'refuse' };
const TINT = {
  light: { idle: '#f7eee3', yes: '#dcf1e2', limit: '#f9ebcb', avoid: '#f9e0d1', no: '#f7d9d9' },
  dark: { idle: '#3a322c', yes: '#23392d', limit: '#3d3320', avoid: '#40291e', no: '#412424' },
};

const reduceMotion = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarse = typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches;
const isDark = () => {
  const t = document.documentElement.dataset.theme;
  return t ? t === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
};

// Per-species layout of the set (world units).
const LAYOUT = {
  hamster: { pet: [-0.6, 0, 0], rotY: 0.45, head: [-0.35, 1.5, 0.45], bubble: [0.45, 2.25, 0.35], center: 1.05, height: 3.0 },
  bird: { pet: [-0.55, 1.09, -0.3], rotY: 0.45, head: [-0.45, 2.45, -0.1], bubble: [0.55, 2.7, 0.2], center: 1.35, height: 3.5 },
};
const DISH = new THREE.Vector3(1.2, 0, 0.9);

// ── set pieces ─────────────────────────────────────────────────────
function buildBackdrop() {
  // A photo-studio "cove": floor that curves up into a back wall.
  const W = 30, floorFront = 14, floorBack = -2.2, R = 3.2, H = 9;
  const arc = (Math.PI / 2) * R;
  const L = floorFront - floorBack + arc + H;
  const geo = new THREE.PlaneGeometry(W, L, 1, 90);
  const pos = geo.attributes.position;
  const colors = [];
  for (let i = 0; i < pos.count; i++) {
    const s = (pos.getY(i) + L / 2); // 0 … L along the profile
    let y, z;
    if (s <= floorFront - floorBack) { z = floorFront - s; y = 0; }
    else if (s <= floorFront - floorBack + arc) { const th = (s - (floorFront - floorBack)) / R; z = floorBack - R * Math.sin(th); y = R * (1 - Math.cos(th)); }
    else { z = floorBack - R; y = R + (s - (floorFront - floorBack) - arc); }
    pos.setXYZ(i, pos.getX(i), y, z);
    // gentle vignette: lighter around the set, darker towards the top of the wall and the front
    const k = 1 - Math.min(0.12, y * 0.018) - Math.max(0, (z - 4) * 0.012);
    colors.push(k, k, k);
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  const m = new THREE.MeshStandardMaterial({ color: '#ffffff', vertexColors: true, roughness: 0.95 });
  const mesh = new THREE.Mesh(geo, m);
  mesh.receiveShadow = true;
  return { mesh, material: m };
}

function buildBedding(bird) {
  // JOMIZOO-style paper bedding: soft pastel paper flakes in a low mound.
  const R = rng(bird ? 7 : 20240925);
  const geo = new THREE.BoxGeometry(0.18, 0.022, 0.115);
  const palette = ['#fffaf3', '#fdf0e3', '#f8e2d6', '#e8f0f6', '#fbe8ee', '#f3eadb', '#ffffff'];
  const n = bird ? 320 : 620;
  const inst = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ roughness: 0.95 }), n);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s = new THREE.Vector3(), p = new THREE.Vector3(), c = new THREE.Color();
  const cx = bird ? 0 : -0.45;
  let i = 0;
  while (i < n) {
    const a = R() * Math.PI * 2, d = Math.sqrt(R()) * (bird ? 3.4 : 2.9);
    const x = cx + Math.cos(a) * d, z = Math.sin(a) * d * 0.8;
    if (Math.hypot(x - DISH.x, z - DISH.z) < 0.95) continue;
    const mound = bird ? 0.03 : 0.34 * Math.exp(-(d * d) / 3.2);
    p.set(x, 0.012 + mound * (0.35 + 0.65 * R()) + R() * 0.03, z);
    e.set((R() - 0.5) * 1.1, R() * Math.PI, (R() - 0.5) * 1.1);
    q.setFromEuler(e);
    const sc = 0.55 + R() * 0.9;
    s.set(sc, 1, sc * (0.6 + R() * 0.7));
    inst.setMatrixAt(i, m4.compose(p, q, s));
    inst.setColorAt(i, c.set(palette[Math.floor(R() * palette.length)]));
    i++;
  }
  inst.receiveShadow = true;
  inst.castShadow = true;
  return inst;
}

let blobTex;
function contactShadow(w, d, opacity = 0.32) {
  blobTex ??= canvasTexture(128, 128, (ctx, W) => {
    const g = ctx.createRadialGradient(W / 2, W / 2, 0, W / 2, W / 2, W / 2);
    g.addColorStop(0, 'rgba(60,35,15,1)'); g.addColorStop(0.45, 'rgba(60,35,15,.55)'); g.addColorStop(1, 'rgba(60,35,15,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, W);
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, opacity, depthWrite: false }));
  m.rotation.x = -Math.PI / 2;
  m.position.y = 0.006;
  m.renderOrder = 1;
  return m;
}

function buildDish() {
  const g = new THREE.Group();
  g.add(mesh(lathe([[0, 0], [0.6, 0], [0.82, 0.14], [0.86, 0.2], [0.8, 0.21], [0.62, 0.08], [0, 0.08]], 64), mat('#ffffff', { gloss: true, rough: 0.18 })));
  g.add(contactShadow(2.1, 2.1, 0.28));
  const ringMat = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0, depthWrite: false });
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.95, 1.05, 64), ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.01;
  g.add(ring);
  return { group: g, ringMat };
}

function glowTexture() {
  return canvasTexture(128, 128, (ctx, W) => {
    const g = ctx.createRadialGradient(W / 2, W / 2, 0, W / 2, W / 2, W / 2);
    g.addColorStop(0, 'rgba(255,255,255,.9)'); g.addColorStop(0.4, 'rgba(255,255,255,.35)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, W);
  });
}

function buildBubble() {
  // verdict "thought bubble": a bevelled coin with an icon + two trailing puffs
  const g = new THREE.Group();
  const coin = new THREE.Group();
  const discMat = new THREE.MeshPhysicalMaterial({ color: '#2f9e6a', roughness: 0.3, clearcoat: 0.6, clearcoatRoughness: 0.2 });
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.12, 48), discMat);
  disc.rotation.x = Math.PI / 2;
  coin.add(disc);
  coin.add(mesh(G.torus(0.37, 0.045, Math.PI * 2, 64), mat('#ffffff', { rough: 0.3 }), { shadow: false }));
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: '#ffffff', transparent: true, depthWrite: false, opacity: 0.7 }));
  glow.scale.setScalar(1.6);
  glow.position.z = -0.1;
  coin.add(glow);
  const W = mat('#ffffff', { rough: 0.3 });
  const icons = {
    yes: [mesh(G.capsule(0.05, 0.14), W, { pos: [-0.09, -0.03, 0.08], rot: [0, 0, 0.8] }), mesh(G.capsule(0.05, 0.3), W, { pos: [0.07, 0.04, 0.08], rot: [0, 0, -0.6] })],
    limit: [sph(1, W, { pos: [0.06, 0.09, 0.08], scale: [0.1, 0.13, 0.035], rot: [0, 0, -0.6] }), mesh(G.capsule(0.032, 0.2), W, { pos: [-0.08, -0.1, 0.08], rot: [0, 0, -0.6] })],
    avoid: [mesh(G.capsule(0.055, 0.15), W, { pos: [0, 0.05, 0.08] }), sph(0.06, W, { pos: [0, -0.16, 0.08] })],
    no: [mesh(G.capsule(0.05, 0.3), W, { pos: [0, 0, 0.08], rot: [0, 0, 0.78] }), mesh(G.capsule(0.05, 0.3), W, { pos: [0, 0, 0.08], rot: [0, 0, -0.78] })],
  };
  const iconGroups = {};
  for (const [k, parts] of Object.entries(icons)) {
    const ig = new THREE.Group();
    parts.forEach((p) => { p.castShadow = false; ig.add(p); });
    ig.visible = false;
    coin.add(ig);
    iconGroups[k] = ig;
  }
  g.add(coin);
  const puffs = [0.07, 0.11].map((r) => { const p = sph(r, mat('#ffffff', { rough: 0.4 }), { shadow: false }); g.add(p); return p; });
  g.visible = false;
  return { group: g, coin, discMat, glow, iconGroups, puffs };
}

function heartGeometry() {
  const s = new THREE.Shape();
  s.moveTo(0, -0.12);
  s.bezierCurveTo(-0.02, -0.08, -0.16, -0.02, -0.16, 0.06);
  s.bezierCurveTo(-0.16, 0.14, -0.06, 0.17, 0, 0.09);
  s.bezierCurveTo(0.06, 0.17, 0.16, 0.14, 0.16, 0.06);
  s.bezierCurveTo(0.16, -0.02, 0.02, -0.08, 0, -0.12);
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.05, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02, bevelSegments: 2 });
  g.center();
  return g;
}

function questionMark() {
  const g = new THREE.Group();
  const m = mat('#e0703a', { rough: 0.4 });
  g.add(mesh(G.torus(0.13, 0.045, Math.PI * 1.35, 32), m, { pos: [0, 0.14, 0], rot: [0, 0, -Math.PI * 0.35] }));
  g.add(mesh(G.capsule(0.045, 0.08), m, { pos: [0, -0.04, 0] }));
  g.add(sph(0.05, m, { pos: [0, -0.2, 0] }));
  return g;
}

const easeOutCubic = (x) => 1 - Math.pow(1 - x, 3);
const easeOutBack = (x) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
const damp = (cur, target, k, dt) => cur + (target - cur) * (1 - Math.exp(-k * dt));

// ── stage ─────────────────────────────────────────────────────────
export function createStage(container, opts = {}) {
  const { species = 'hamster', food = null, verdict = null, interactive = true, thumbnail = false } = opts;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: thumbnail, preserveDrawingBuffer: !!opts.preserveDrawingBuffer, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.shadowMap.enabled = !thumbnail;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.domElement.setAttribute('aria-hidden', 'true');
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.5;
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 80);

  scene.add(new THREE.HemisphereLight('#fff7ee', '#d9c5ad', 1.05));
  const key = new THREE.DirectionalLight('#fffaf2', 2.2);
  key.position.set(3.5, 7.5, 5.5);
  key.castShadow = true;
  key.shadow.mapSize.setScalar(coarse ? 1024 : 2048);
  Object.assign(key.shadow.camera, { left: -4, right: 4, top: 4, bottom: -3, near: 1, far: 22 });
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.02;
  key.shadow.radius = 5;
  scene.add(key);
  const fill = new THREE.DirectionalLight('#ffd9b8', 0.5);
  fill.position.set(-6, 3, 4);
  scene.add(fill);
  const rim = new THREE.DirectionalLight('#dfeaff', 1.3);
  rim.position.set(-2.5, 4.5, -6);
  scene.add(rim);

  const world = new THREE.Group();
  scene.add(world);
  const palette = isDark() ? TINT.dark : TINT.light;
  const tint = new THREE.Color(palette.idle), tintTarget = new THREE.Color(palette.idle);
  let backdrop = null;
  if (!thumbnail) {
    backdrop = buildBackdrop();
    world.add(backdrop.mesh);
    scene.background = new THREE.Color(palette.idle);
    scene.fog = new THREE.Fog(palette.idle, 16, 34);
  }

  const dish = buildDish();
  const dishPos = thumbnail ? new THREE.Vector3() : DISH.clone();
  dish.group.position.copy(dishPos);
  if (!thumbnail) world.add(dish.group);

  const bubble = buildBubble();
  world.add(bubble.group);
  const qmark = questionMark();
  qmark.visible = false;
  world.add(qmark);

  const foodHolder = new THREE.Group();
  foodHolder.position.copy(dishPos).add(new THREE.Vector3(0, thumbnail ? 0 : 0.09, 0));
  world.add(foodHolder);

  const heartGeo = heartGeometry();
  const particles = [];
  const clock = new THREE.Timer();

  let character = null, perch = null, bedding = null, petShadow = null, layout = LAYOUT.hamster, currentSpecies = null;
  let mood = 'idle', moodStart = 0, currentVerdict = null, pokeUntil = -1;
  let foodObj = null, foodDrop = 1, prevFood = null, foodSpin = 0;

  function setSpecies(sp) {
    if (thumbnail || sp === currentSpecies) return;
    currentSpecies = sp;
    const bird = sp !== 'hamster';
    layout = bird ? LAYOUT.bird : LAYOUT.hamster;
    [character?.root, perch, bedding, petShadow].forEach((o) => o && world.remove(o));
    perch = null;
    character = buildCharacter(sp);
    character.root.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    character.root.position.set(...layout.pet);
    character.baseY = layout.pet[1];
    character.root.rotation.y = layout.rotY;
    character.root.scale.setScalar(bird ? 0.95 : 0.92);
    character.enter = 0;
    world.add(character.root);
    bedding = buildBedding(bird);
    world.add(bedding);
    if (bird) {
      perch = buildPerch();
      perch.position.set(layout.pet[0], 0, layout.pet[2]);
      perch.rotation.y = 0.2;
      world.add(perch);
      petShadow = contactShadow(3.0, 1.1, 0.26);
      petShadow.position.set(layout.pet[0], 0.006, layout.pet[2]);
    } else {
      petShadow = contactShadow(2.6, 2.4, 0.34);
      petShadow.position.set(layout.pet[0] + 0.05, 0.03, layout.pet[2] + 0.1);
    }
    world.add(petShadow);
    if (currentVerdict) { mood = MOOD[currentVerdict]; moodStart = clock.getElapsed(); }
    frame();
  }

  function setFood(foodId, v) {
    if (thumbnail) foodHolder.clear();
    else if (foodObj) { if (prevFood) foodHolder.remove(prevFood); prevFood = foodObj; prevFood.userData.out = 0; }
    currentVerdict = v || null;
    tintTarget.set(palette[v] ?? palette.idle);
    if (!foodId) { foodObj = null; bubble.group.visible = false; mood = 'idle'; return; }
    foodObj = buildFood(foodId);
    foodObj.scale.setScalar(thumbnail ? 1 : 0.95);
    foodHolder.add(foodObj);
    foodDrop = reduceMotion || thumbnail ? 1 : 0;
    const color = VERDICT_COLORS[v] ?? '#999999';
    bubble.discMat.color.set(color);
    bubble.glow.material.color.set(color);
    dish.ringMat.color.set(color);
    Object.entries(bubble.iconGroups).forEach(([k, ig]) => (ig.visible = k === v));
    bubble.group.visible = !!v && !thumbnail;
    qmark.visible = false;
    mood = 'idle';
    moodStart = clock.getElapsed();
    if (reduceMotion && v) mood = MOOD[v];
    if (thumbnail) render();
  }

  function spawnHearts() {
    const base = character.root.position;
    for (let i = 0; i < 6; i++) {
      const m = new THREE.Mesh(heartGeo, new THREE.MeshStandardMaterial({ color: i % 2 ? '#f27a91' : '#ff9fb0', roughness: 0.35, transparent: true }));
      m.position.set(base.x + (Math.random() - 0.5) * 1.0, layout.head[1] + 0.2 + Math.random() * 0.3, base.z + 0.5);
      m.userData = { vy: 0.6 + Math.random() * 0.4, vx: (Math.random() - 0.5) * 0.3, life: 0, max: 1.6 + Math.random() * 0.7, spin: (Math.random() - 0.5) * 3 };
      m.scale.setScalar(0.001);
      m.userData.size = 0.8 + Math.random() * 0.6;
      scene.add(m);
      particles.push(m);
    }
  }

  // ── camera rig: intro dolly, idle sway, drag, device tilt ──
  const target = new THREE.Vector3();
  let dist = 9, baseYaw = 0.1, basePitch = 0.3;
  let userYaw = 0, userYawTarget = 0, gyroYaw = 0, gyroPitch = 0, lastInteract = -99, intro = thumbnail || reduceMotion ? 1 : 0;

  function frame() {
    const w = container.clientWidth || 300, h = container.clientHeight || 300;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    if (thumbnail) {
      camera.fov = 26;
      camera.position.set(0, 1.5, 3.6);
      camera.lookAt(0, 0.42, 0);
    } else {
      const tan = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
      const needH = layout.height + 0.5, needW = 4.5;
      dist = Math.min(16, Math.max(needH / 2 / tan, needW / 2 / (tan * camera.aspect)) + 1.7);
      target.set(0.3, layout.center, 0.2);
    }
    camera.updateProjectionMatrix();
  }

  function placeCamera(t, dt) {
    const e = easeOutCubic(intro);
    const idle = t - lastInteract > 2.5;
    if (idle) userYawTarget = damp(userYawTarget, 0, 0.6, dt);
    userYaw = damp(userYaw, userYawTarget, 8, dt);
    const sway = reduceMotion ? 0 : Math.sin(t * 0.3) * 0.08;
    const yaw = baseYaw + userYaw + sway + gyroYaw - (1 - e) * 0.5;
    const pitch = basePitch + gyroPitch + (1 - e) * 0.25;
    const d = dist * (1 + (1 - e) * 0.35);
    camera.position.set(target.x + Math.sin(yaw) * Math.cos(pitch) * d, target.y + Math.sin(pitch) * d, target.z + Math.cos(yaw) * Math.cos(pitch) * d);
    camera.lookAt(target);
  }

  // pointer: horizontal drag orbits (vertical swipes scroll the page); taps poke the pet or spin the food
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  let down = null;
  const el = renderer.domElement;
  if (interactive && !thumbnail) {
    el.style.touchAction = 'pan-y';
    el.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY, t: performance.now(), yaw: userYawTarget, moved: false }; requestGyro(); });
    el.addEventListener('pointermove', (e) => {
      if (!down) return;
      const dx = e.clientX - down.x;
      if (Math.abs(dx) > 6) down.moved = true;
      if (down.moved) { userYawTarget = THREE.MathUtils.clamp(down.yaw - dx * 0.007, -1.1, 1.1); lastInteract = clock.getElapsed(); }
    });
    const up = (e) => {
      if (down && !down.moved && performance.now() - down.t < 400) tap(e);
      down = null;
    };
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', () => (down = null));
    el.addEventListener('pointerleave', () => (down = null));
  }

  function tap(e) {
    const r = el.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    if (character && ray.intersectObject(character.root, true).length) {
      pokeUntil = clock.getElapsed() + 1.3;
      moodStart = clock.getElapsed();
      if (!reduceMotion) spawnHearts();
    } else if (foodObj && ray.intersectObject(foodHolder, true).length) {
      foodSpin = 14;
    }
  }

  let gyroAsked = false, gyroBase = null;
  function onOrient(e) {
    if (e.gamma == null) return;
    gyroBase ??= e.beta;
    gyroYaw = THREE.MathUtils.clamp(e.gamma / 40, -1, 1) * 0.28;
    gyroPitch = THREE.MathUtils.clamp((e.beta - gyroBase) / 40, -1, 1) * 0.08;
  }
  function requestGyro() {
    if (gyroAsked || !coarse || reduceMotion || thumbnail) return;
    gyroAsked = true;
    const D = window.DeviceOrientationEvent;
    if (D && typeof D.requestPermission === 'function') {
      D.requestPermission().then((s) => s === 'granted' && addEventListener('deviceorientation', onOrient)).catch(() => {});
    }
  }
  if (coarse && !reduceMotion && !thumbnail && window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission !== 'function') {
    gyroAsked = true;
    addEventListener('deviceorientation', onOrient);
  }

  let running = true, visible = true, raf = 0;
  function tick() {
    raf = 0;
    if (!running || !visible) return;
    clock.update();
    step(clock.getElapsed(), Math.min(clock.getDelta(), 0.05));
    render();
    raf = requestAnimationFrame(tick);
  }

  function step(t, dt) {
    intro = Math.min(1, intro + dt / 1.6);

    // set colour follows the verdict
    tint.lerp(tintTarget, 1 - Math.exp(-4 * dt));
    if (backdrop) { backdrop.material.color.copy(tint); scene.background.copy(tint).multiplyScalar(0.9); scene.fog.color.copy(scene.background); }

    // character entrance: pops up with a bounce
    if (character && character.enter < 1) {
      character.enter = Math.min(1, character.enter + dt * (reduceMotion ? 99 : 1.8));
      const s = (currentSpecies === 'hamster' ? 0.92 : 0.95) * easeOutBack(character.enter);
      character.root.scale.setScalar(Math.max(0.001, s));
    }

    // food drop-in with squash on landing
    if (foodObj && foodDrop < 1) {
      foodDrop = Math.min(1, foodDrop + dt * 1.5);
      const k = foodDrop;
      const fall = k < 0.55 ? 1 - (k / 0.55) ** 2 : Math.abs(Math.sin((k - 0.55) * Math.PI * 2.2)) * 0.16 * (1 - k);
      foodObj.position.y = fall * 2.6;
      const squash = k > 0.55 && k < 0.7 ? Math.sin(((k - 0.55) / 0.15) * Math.PI) * 0.18 : 0;
      foodObj.scale.set(0.95 * (1 + squash * 0.6), 0.95 * (1 - squash), 0.95 * (1 + squash * 0.6));
      foodObj.rotation.y = (1 - k) * 3;
      if (foodDrop === 1 && currentVerdict) {
        mood = MOOD[currentVerdict];
        moodStart = t;
        if (currentVerdict === 'yes' && !reduceMotion) spawnHearts();
      }
    }
    if (prevFood) {
      prevFood.userData.out += dt * 4;
      prevFood.scale.setScalar(Math.max(0.001, 0.95 * (1 - prevFood.userData.out)));
      if (prevFood.userData.out >= 1) { foodHolder.remove(prevFood); prevFood = null; }
    }
    if (foodObj && foodDrop >= 1) {
      foodSpin = damp(foodSpin, 0, 2.5, dt);
      foodObj.rotation.y += (foodSpin + (reduceMotion ? 0 : 0.25)) * dt;
    }

    if (character) {
      const m = t < pokeUntil ? 'happy' : mood;
      character.update(reduceMotion ? 0 : t, dt, m, t - moodStart);
      character.root.position.y += character.baseY;
      if (petShadow) petShadow.material.opacity = (currentSpecies === 'hamster' ? 0.34 : 0.26) * (1 - Math.min(0.6, (character.root.position.y - character.baseY) * 1.5));
    }

    // verdict bubble
    if (bubble.group.visible) {
      const k = foodDrop >= 1 ? Math.min(1, (t - moodStart) * 2.5) : 0;
      const [hx, hy, hz] = layout.head;
      const [bx, by, bz] = layout.bubble;
      const bob = reduceMotion ? 0 : Math.sin(t * 2) * 0.05;
      bubble.coin.position.set(bx, by + bob, bz);
      bubble.coin.scale.setScalar(Math.max(0.001, easeOutBack(k)));
      bubble.coin.lookAt(camera.position.x, bubble.coin.position.y, camera.position.z);
      if (currentVerdict === 'no' && !reduceMotion && t - moodStart < 1.2) bubble.coin.rotation.z = Math.sin((t - moodStart) * 26) * 0.18 * (1.2 - (t - moodStart));
      bubble.puffs.forEach((p, i) => {
        const f = [0.32, 0.62][i];
        p.position.set(hx + (bx - hx) * f, hy + (by - hy) * f + bob * f, hz + (bz - hz) * f);
        p.scale.setScalar(Math.max(0.001, easeOutBack(Math.min(1, Math.max(0, k * 2 - (1 - i) * 0.5)))) * [0.07, 0.11][i]);
      });
      bubble.glow.material.opacity = 0.55 + (reduceMotion ? 0 : Math.sin(t * 3) * 0.15);
      dish.ringMat.opacity = foodDrop >= 1 ? 0.32 + (reduceMotion ? 0 : Math.sin(t * 3) * 0.12) : 0;
    } else {
      dish.ringMat.opacity = 0;
    }

    // "?" for "better not"
    qmark.visible = currentVerdict === 'avoid' && foodDrop >= 1 && t - moodStart < 3.2 && !reduceMotion;
    if (qmark.visible) {
      const k = Math.min(1, (t - moodStart) * 3);
      qmark.position.set(layout.head[0] - 0.35, layout.head[1] + 0.55 + Math.sin(t * 4) * 0.04, layout.head[2]);
      qmark.scale.setScalar(Math.max(0.001, easeOutBack(k) * (t - moodStart > 2.8 ? (3.2 - (t - moodStart)) / 0.4 : 1)));
      qmark.lookAt(camera.position);
    }

    for (let i = particles.length - 1; i >= 0; i--) {
      const m = particles[i], u = m.userData;
      u.life += dt;
      m.position.y += u.vy * dt;
      m.position.x += u.vx * dt;
      m.rotation.y += u.spin * dt;
      m.scale.setScalar(u.size * Math.min(1, u.life * 5));
      m.material.opacity = Math.max(0, 1 - u.life / u.max);
      if (u.life >= u.max) { scene.remove(m); m.material.dispose(); particles.splice(i, 1); }
    }
    placeCamera(t, dt);
  }

  function render() {
    if (!thumbnail) placeCamera(clock.getElapsed(), 0);
    renderer.render(scene, camera);
  }

  function start() {
    if (!raf && running && visible) { clock.update(); raf = requestAnimationFrame(tick); }
  }

  const ro = new ResizeObserver(() => { frame(); if (!raf) render(); });
  ro.observe(container);
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) start(); }, { rootMargin: '80px' });
  if (!thumbnail) io.observe(container);
  const onVis = () => { running = !document.hidden; if (running) start(); };
  document.addEventListener('visibilitychange', onVis);

  setSpecies(species);
  frame();
  if (food) setFood(food, verdict);
  if (!thumbnail) start(); else render();

  return {
    setSpecies,
    setFood,
    render,
    renderer,
    get canvas() { return renderer.domElement; },
    /** Skip intro/drop animations (used for posters). */
    settle() { intro = 1; foodDrop = 1; if (character) character.enter = 1; },
    destroy() {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect(); io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      removeEventListener('deviceorientation', onOrient);
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
