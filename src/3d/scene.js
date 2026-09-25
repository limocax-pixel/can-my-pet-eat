// The interactive 3D stage: a pet on a bed of paper bedding, a food dish, and a
// verdict badge. createStage(container, opts) → { setSpecies, setFood, destroy }.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { mat, mesh, sph, G, lathe, rng } from './kit.js';
import { buildCharacter, buildPerch } from './characters.js';
import { buildFood } from './foods.js';

export const VERDICT_COLORS = { yes: '#2f9e6a', limit: '#e5a031', avoid: '#e0703a', no: '#d63e3e' };
const MOOD = { yes: 'happy', limit: 'nibble', avoid: 'unsure', no: 'refuse' };

const reduceMotion = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

function buildStage() {
  const g = new THREE.Group();
  const base = mesh(
    lathe([[0, 0], [3.1, 0], [3.3, 0.08], [3.34, 0.22], [3.24, 0.32], [0, 0.32]], 96),
    mat('#f3e6d4', { rough: 0.8 })
  );
  base.position.y = -0.32;
  g.add(base);

  // paper-bedding flakes
  const R = rng(20240925);
  const flakeGeo = new THREE.BoxGeometry(0.2, 0.03, 0.12);
  const palette = ['#fffaf2', '#fdf1e0', '#f8e3d6', '#e9f1f7', '#fbeef2', '#f4efe6'];
  const n = 900;
  const flakes = new THREE.InstancedMesh(flakeGeo, new THREE.MeshStandardMaterial({ roughness: 0.95 }), n);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s = new THREE.Vector3(), p = new THREE.Vector3();
  const col = new THREE.Color();
  for (let i = 0; i < n; i++) {
    const a = R() * Math.PI * 2, d = Math.sqrt(R()) * 3.05;
    const mound = Math.max(0, d - 1.6) * 0.09;
    p.set(Math.cos(a) * d, 0.015 + R() * 0.06 + mound * R(), Math.sin(a) * d);
    e.set((R() - 0.5) * 0.9, R() * Math.PI, (R() - 0.5) * 0.9);
    q.setFromEuler(e);
    const sc = 0.6 + R() * 0.8;
    s.set(sc, 1, sc * (0.7 + R() * 0.6));
    m4.compose(p, q, s);
    flakes.setMatrixAt(i, m4);
    flakes.setColorAt(i, col.set(palette[Math.floor(R() * palette.length)]));
  }
  flakes.castShadow = false;
  flakes.receiveShadow = true;
  g.add(flakes);
  return g;
}

function buildDish() {
  const g = new THREE.Group();
  const dish = mesh(
    lathe([[0, 0], [0.6, 0], [0.82, 0.14], [0.86, 0.2], [0.8, 0.21], [0.62, 0.08], [0, 0.08]], 64),
    mat('#ffffff', { gloss: true, rough: 0.2 })
  );
  g.add(dish);
  const ringMat = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0, depthWrite: false });
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.08, 64), ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.012;
  g.add(ring);
  return { group: g, ring, ringMat };
}

function buildBadge() {
  const g = new THREE.Group();
  const discMat = new THREE.MeshStandardMaterial({ color: '#2f9e6a', roughness: 0.35 });
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.1, 48), discMat);
  disc.rotation.x = Math.PI / 2;
  disc.castShadow = true;
  g.add(disc);
  const W = mat('#ffffff', { rough: 0.3 });
  const icons = {
    yes: [mesh(G.capsule(0.045, 0.14), W, { pos: [-0.08, -0.03, 0.07], rot: [0, 0, 0.8] }), mesh(G.capsule(0.045, 0.3), W, { pos: [0.07, 0.04, 0.07], rot: [0, 0, -0.6] })],
    // a little spoon = "small amounts"
    limit: [
      sph(1, W, { pos: [0.06, 0.09, 0.07], scale: [0.1, 0.13, 0.03], rot: [0, 0, -0.6] }),
      mesh(G.capsule(0.03, 0.2), W, { pos: [-0.08, -0.1, 0.07], rot: [0, 0, -0.6] }),
    ],
    avoid: [mesh(G.capsule(0.05, 0.16), W, { pos: [0, 0.05, 0.07] }), sph(0.055, W, { pos: [0, -0.16, 0.07] })],
    no: [mesh(G.capsule(0.045, 0.3), W, { pos: [0, 0, 0.07], rot: [0, 0, 0.78] }), mesh(G.capsule(0.045, 0.3), W, { pos: [0, 0, 0.07], rot: [0, 0, -0.78] })],
  };
  const iconGroups = {};
  for (const [k, parts] of Object.entries(icons)) {
    const ig = new THREE.Group();
    parts.forEach((p) => { p.castShadow = false; ig.add(p); });
    ig.visible = false;
    g.add(ig);
    iconGroups[k] = ig;
  }
  g.visible = false;
  return { group: g, discMat, iconGroups };
}

function heartShape() {
  const s = new THREE.Shape();
  s.moveTo(0, -0.12);
  s.bezierCurveTo(-0.02, -0.08, -0.16, -0.02, -0.16, 0.06);
  s.bezierCurveTo(-0.16, 0.14, -0.06, 0.17, 0, 0.09);
  s.bezierCurveTo(0.06, 0.17, 0.16, 0.14, 0.16, 0.06);
  s.bezierCurveTo(0.16, -0.02, 0.02, -0.08, 0, -0.12);
  return new THREE.ExtrudeGeometry(s, { depth: 0.05, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02, bevelSegments: 2 });
}

export function createStage(container, opts = {}) {
  const { species = 'hamster', food = null, verdict = null, interactive = true, thumbnail = false } = opts;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: !!opts.preserveDrawingBuffer });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, thumbnail ? 2 : 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.domElement.setAttribute('aria-hidden', 'true');
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.45;

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  const target = new THREE.Vector3(0.25, 1.0, 0);

  scene.add(new THREE.HemisphereLight('#fff6ea', '#d8c6ae', 1.1));
  const key = new THREE.DirectionalLight('#ffffff', 2.1);
  key.position.set(4, 8, 6);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  Object.assign(key.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4, near: 1, far: 25 });
  key.shadow.bias = -0.0005;
  key.shadow.radius = 3;
  key.shadow.normalBias = 0.02;
  scene.add(key);
  const fill = new THREE.DirectionalLight('#ffd7b0', 0.55);
  fill.position.set(-6, 3, 3);
  scene.add(fill);
  const rim = new THREE.DirectionalLight('#d6e8ff', 0.9);
  rim.position.set(-2, 5, -7);
  scene.add(rim);

  const world = new THREE.Group();
  scene.add(world);
  const stage = buildStage();
  if (!thumbnail) world.add(stage);

  const dish = buildDish();
  const DISH_POS = thumbnail ? new THREE.Vector3(0, 0, 0) : new THREE.Vector3(1.25, 0, 1.05);
  dish.group.position.copy(DISH_POS);
  if (!thumbnail) world.add(dish.group);

  const badge = buildBadge();
  world.add(badge.group);

  const foodHolder = new THREE.Group();
  foodHolder.position.copy(DISH_POS).add(new THREE.Vector3(0, thumbnail ? 0 : 0.1, 0));
  world.add(foodHolder);

  const heartGeo = heartShape();
  const particles = [];

  let character = null, perch = null, currentSpecies = null;
  let mood = 'idle', moodStart = 0, currentVerdict = null;
  let foodObj = null, foodDrop = 0, prevFood = null, prevT = 0;

  function setSpecies(sp) {
    if (thumbnail || sp === currentSpecies) return;
    currentSpecies = sp;
    if (character) world.remove(character.root);
    if (perch) { world.remove(perch); perch = null; }
    character = buildCharacter(sp);
    const bird = sp !== 'hamster';
    if (bird) {
      perch = buildPerch();
      perch.position.set(-0.55, 0, -0.35);
      perch.rotation.y = 0.2;
      world.add(perch);
      character.root.position.set(-0.55, 1.09, -0.35);
      character.baseY = 1.09;
      character.root.rotation.y = 0.45;
    } else {
      character.root.position.set(-0.6, 0, -0.25);
      character.baseY = 0;
      character.root.rotation.y = 0.42;
    }
    character.root.scale.setScalar(bird ? 0.95 : 0.92);
    world.add(character.root);
    character.root.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    if (currentVerdict) { mood = MOOD[currentVerdict]; moodStart = clock.getElapsed(); }
  }

  function setFood(foodId, v) {
    if (thumbnail) foodHolder.clear();
    else if (foodObj) { if (prevFood) foodHolder.remove(prevFood); prevFood = foodObj; prevFood.userData.out = 0; }
    currentVerdict = v || null;
    if (!foodId) {
      foodObj = null;
      badge.group.visible = false;
      mood = 'idle';
      return;
    }
    foodObj = buildFood(foodId);
    foodObj.scale.setScalar(thumbnail ? 1 : 0.95);
    foodHolder.add(foodObj);
    foodDrop = reduceMotion || thumbnail ? 1 : 0;
    const color = VERDICT_COLORS[v] ?? '#999999';
    badge.discMat.color.set(color);
    dish.ringMat.color.set(color);
    Object.entries(badge.iconGroups).forEach(([k, ig]) => (ig.visible = k === v));
    badge.group.visible = !!v && !thumbnail;
    mood = 'idle';
    moodStart = clock.getElapsed();
    if (thumbnail) render();
  }

  function spawnHearts(color) {
    for (let i = 0; i < 5; i++) {
      const m = new THREE.Mesh(heartGeo, new THREE.MeshStandardMaterial({ color, roughness: 0.4, transparent: true }));
      const base = character ? character.root.position : new THREE.Vector3();
      m.position.set(base.x + (Math.random() - 0.5) * 0.9, (character?.baseY ?? 0) + 1.8 + Math.random() * 0.3, base.z + 0.4);
      m.userData = { vy: 0.55 + Math.random() * 0.4, life: 0, max: 1.6 + Math.random() * 0.6, spin: (Math.random() - 0.5) * 2 };
      m.scale.setScalar(0.8 + Math.random() * 0.5);
      scene.add(m);
      particles.push(m);
    }
  }

  // camera framing
  function frame() {
    const w = container.clientWidth || 300, h = container.clientHeight || 300;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    if (thumbnail) {
      camera.fov = 26;
      camera.position.set(0, 1.5, 3.6);
      target.set(0, 0.42, 0);
    } else {
      // keep the pet + dish (x ≈ -1.6 … 2.2) in frame at any aspect ratio
      const dist = Math.max(8.4, 9.6 / Math.min(camera.aspect, 1.45) ** 0.9);
      camera.position.set(0.8, 2.9 + dist * 0.06, dist);
      target.set(0.3, 0.8, 0.2);
    }
    camera.lookAt(target);
    camera.updateProjectionMatrix();
    if (controls) { controls.target.copy(target); controls.update(); }
  }

  let controls = null;
  if (interactive && !thumbnail) {
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minPolarAngle = 0.6;
    controls.maxPolarAngle = 1.45;
    controls.minAzimuthAngle = -1.1;
    controls.maxAzimuthAngle = 1.1;
    controls.rotateSpeed = 0.6;
    renderer.domElement.style.touchAction = 'pan-y';
  }

  const clock = new THREE.Timer();
  clock.connect?.(document);
  let running = true, visible = true, raf = 0;

  function tick() {
    raf = 0;
    if (!running || !visible) return;
    clock.update();
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.getElapsed();
    step(t, dt);
    render();
    raf = requestAnimationFrame(tick);
  }

  function step(t, dt) {
    // food drop-in with a little bounce
    if (foodObj && foodDrop < 1) {
      foodDrop = Math.min(1, foodDrop + dt * 1.6);
      const k = foodDrop;
      const bounce = k < 0.6 ? 1 - (k / 0.6) ** 2 : Math.abs(Math.sin((k - 0.6) * Math.PI * 2.5)) * 0.18 * (1 - k);
      foodObj.position.y = bounce * 2.4;
      foodObj.rotation.y = (1 - k) * 2.5;
      if (foodDrop === 1 && currentVerdict) {
        mood = MOOD[currentVerdict];
        moodStart = t;
        if (currentVerdict === 'yes' && !reduceMotion) spawnHearts('#f07a8f');
      }
    }
    if (prevFood) {
      prevFood.userData.out += dt * 4;
      prevFood.scale.setScalar(Math.max(0.001, 0.95 * (1 - prevFood.userData.out)));
      if (prevFood.userData.out >= 1) { foodHolder.remove(prevFood); prevFood = null; }
    }
    if (foodObj && foodDrop >= 1 && !reduceMotion) foodObj.rotation.y = Math.sin(t * 0.5) * 0.25;

    if (character) {
      character.update(reduceMotion ? 0 : t, dt, mood, t - moodStart);
      character.root.position.y += character.baseY;
    }

    // badge floats above the dish and faces the camera
    if (badge.group.visible) {
      const k = Math.min(1, (t - moodStart) * 3);
      const s = foodDrop >= 1 ? 0.2 + 0.8 * easeOutBack(k) : 0.001;
      badge.group.scale.setScalar(s);
      badge.group.position.set(DISH_POS.x, 1.75 + (reduceMotion ? 0 : Math.sin(t * 2) * 0.06), DISH_POS.z);
      badge.group.lookAt(camera.position.x, badge.group.position.y, camera.position.z);
      if (currentVerdict === 'no' && !reduceMotion && t - moodStart < 1.2) badge.group.rotation.z = Math.sin((t - moodStart) * 25) * 0.15 * (1.2 - (t - moodStart));
      dish.ringMat.opacity = foodDrop >= 1 ? 0.55 + (reduceMotion ? 0 : Math.sin(t * 3) * 0.2) : 0;
    } else {
      dish.ringMat.opacity = 0;
    }

    for (let i = particles.length - 1; i >= 0; i--) {
      const m = particles[i];
      const u = m.userData;
      u.life += dt;
      m.position.y += u.vy * dt;
      m.rotation.y += u.spin * dt;
      m.material.opacity = Math.max(0, 1 - u.life / u.max);
      if (u.life >= u.max) { scene.remove(m); m.material.dispose(); particles.splice(i, 1); }
    }
    controls?.update();
    prevT = t;
  }

  function render() {
    renderer.render(scene, camera);
  }

  function start() {
    if (!raf && running && visible) { clock.update(); raf = requestAnimationFrame(tick); }
  }

  const ro = new ResizeObserver(() => { frame(); if (!raf) render(); });
  ro.observe(container);
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) start(); }, { rootMargin: '100px' });
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
    destroy() {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect(); io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      controls?.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}

function easeOutBack(x) {
  const c1 = 1.70158, c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
}
