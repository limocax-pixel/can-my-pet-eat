// Procedural, toy-like pet characters. Each builder returns
// { root, rig, update(t, dt, mood) } where mood is one of
// 'idle' | 'happy' | 'nibble' | 'unsure' | 'refuse'.
import * as THREE from 'three';
import { mat, mesh, sph, G, onEllipsoid, group, canvasTexture, rng } from './kit.js';

const PINK = '#f2a3ad';
const EYE = '#17110f';

function eye(r, pos) {
  const g = group(
    sph(r, mat(EYE, { gloss: true, rough: 0.12, clearcoat: 1 })),
    sph(r * 0.32, mat('#ffffff', { rough: 0.2 }), { pos: [r * 0.28, r * 0.42, r * 0.72], shadow: false }),
    sph(r * 0.14, mat('#ffffff', { rough: 0.2 }), { pos: [-r * 0.3, -r * 0.3, r * 0.85], shadow: false })
  );
  g.position.set(...pos);
  return g;
}

function blinker(eyes) {
  let next = 1.5 + Math.random() * 3;
  let phase = -1;
  return (t, dt) => {
    if (phase < 0 && t > next) phase = 0;
    if (phase >= 0) {
      phase += dt;
      const k = phase < 0.08 ? 1 - phase / 0.08 : phase < 0.16 ? (phase - 0.08) / 0.08 : 1;
      eyes.forEach((e) => (e.scale.y = Math.max(0.08, k)));
      if (phase >= 0.16) { phase = -1; next = t + 2 + Math.random() * 4; }
    }
  };
}

const damp = (cur, target, k, dt) => cur + (target - cur) * (1 - Math.exp(-k * dt));

/** Vertical scale for bouncy hops: squash on the ground, stretch in the air. */
function squashStretch(mood, moodT, freq, dur) {
  if (mood !== 'happy') return 1;
  const k = Math.max(0, 1 - moodT / dur);
  return 1 - 0.13 * k * Math.cos(2 * ((moodT * freq) % Math.PI));
}

// ───────────────────────────── Hamster ─────────────────────────────
export function buildHamster({ fur = '#e0924a', cream = '#fff1df' } = {}) {
  const FUR = mat(fur, { sheen: true, rough: 0.9 });
  const CREAM = mat(cream, { sheen: true, rough: 0.9 });
  const SKIN = mat(PINK, { rough: 0.55 });

  const root = new THREE.Group();
  const bodyG = new THREE.Group();
  root.add(bodyG);

  const bodyC = [0, 0.86, -0.1], bodyR = [1.02, 0.86, 1.14];
  bodyG.add(sph(1, FUR, { pos: bodyC, scale: bodyR }));
  bodyG.add(sph(1, CREAM, { pos: [0, 0.7, 0.42], scale: [0.78, 0.66, 0.74] }));
  // back feet + tail
  bodyG.add(sph(1, SKIN, { pos: [-0.55, 0.07, 0.42], scale: [0.16, 0.08, 0.26] }));
  bodyG.add(sph(1, SKIN, { pos: [0.55, 0.07, 0.42], scale: [0.16, 0.08, 0.26] }));
  bodyG.add(sph(0.1, SKIN, { pos: [0, 0.42, -1.2] }));

  // head pivot at the neck
  const headG = new THREE.Group();
  headG.position.set(0, 1.25, 0.35);
  bodyG.add(headG);
  const hc = [0, 0.22, 0.28], hr = [0.8, 0.72, 0.74];
  headG.add(sph(1, FUR, { pos: hc, scale: hr }));
  // cream muzzle + puffy cheek pouches
  headG.add(sph(1, CREAM, { pos: [0, 0.02, 0.7], scale: [0.42, 0.34, 0.38] }));
  const cheekL = sph(1, CREAM, { pos: [-0.42, -0.02, 0.5], scale: [0.36, 0.32, 0.34] });
  const cheekR = sph(1, CREAM, { pos: [0.42, -0.02, 0.5], scale: [0.36, 0.32, 0.34] });
  headG.add(cheekL, cheekR);
  const nose = sph(0.085, SKIN, { pos: [0, 0.14, 1.07] });
  headG.add(nose);
  // mouth
  headG.add(mesh(G.torus(0.06, 0.012, Math.PI), mat('#8a4b45'), { pos: [0, -0.02, 1.06], rot: [0, 0, Math.PI], shadow: false }));

  const eyeL = eye(0.12, onEllipsoid(hc, hr, [-0.52, 0.32, 0.8], 0.93));
  const eyeR = eye(0.12, onEllipsoid(hc, hr, [0.52, 0.32, 0.8], 0.93));
  eyeL.lookAt(new THREE.Vector3(-0.8, 0.5, 3));
  eyeR.lookAt(new THREE.Vector3(0.8, 0.5, 3));
  headG.add(eyeL, eyeR);

  const ears = [-1, 1].map((s) => {
    const ear = group(
      sph(1, FUR, { scale: [0.27, 0.3, 0.09] }),
      sph(1, SKIN, { pos: [0, 0.01, 0.045], scale: [0.18, 0.21, 0.05], shadow: false })
    );
    ear.position.set(...onEllipsoid(hc, hr, [s * 0.62, 0.78, 0.05], 0.92));
    ear.rotation.set(-0.15, s * 0.35, s * -0.35);
    headG.add(ear);
    return ear;
  });

  // whiskers
  const wPts = [];
  for (const s of [-1, 1]) for (let i = 0; i < 3; i++) {
    const y = 0.04 + (i - 1) * 0.06;
    wPts.push(new THREE.Vector3(s * 0.28, y, 0.98), new THREE.Vector3(s * 0.95, y + (i - 1) * 0.1 + 0.05, 0.85));
  }
  const whiskers = new THREE.LineSegments(
    new THREE.BufferGeometry().setFromPoints(wPts),
    new THREE.LineBasicMaterial({ color: '#6b5646', transparent: true, opacity: 0.55 })
  );
  headG.add(whiskers);

  // front paws
  const pawL = sph(1, SKIN, { pos: [-0.32, 0.36, 1.02], scale: [0.12, 0.09, 0.14] });
  const pawR = sph(1, SKIN, { pos: [0.32, 0.36, 1.02], scale: [0.12, 0.09, 0.14] });
  bodyG.add(pawL, pawR);

  const blink = blinker([eyeL, eyeR]);
  const st = { lean: 0, turn: 0, hop: 0, cheeks: 1, paws: 0, tilt: 0 };

  function update(t, dt, mood, moodT) {
    blink(t, dt);
    const breathe = Math.sin(t * 3.2) * 0.012;
    const sy = squashStretch(mood, moodT, 7, 2.4);
    bodyG.scale.set((1 + breathe) / Math.sqrt(sy), (1 - breathe * 0.6) * sy, (1 + breathe) / Math.sqrt(sy));
    nose.position.y = 0.14 + Math.sin(t * 22) * 0.008 * (mood === 'refuse' ? 0 : 1);
    nose.position.z = 1.07 + Math.sin(t * 22 + 1) * 0.01;
    ears.forEach((e, i) => (e.rotation.x = -0.15 + Math.max(0, Math.sin(t * 1.3 + i * 2) - 0.97) * 6));

    let lean = 0, turn = 0, hop = 0, cheeks = 1, paws = 0, tilt = Math.sin(t * 0.7) * 0.05, shake = 0;
    if (mood === 'happy') { hop = Math.abs(Math.sin(moodT * 7)) * 0.35 * Math.max(0, 1 - moodT / 2.4); cheeks = 1.18; paws = 1; lean = 0.08; }
    else if (mood === 'nibble') { lean = 0.16; paws = 1; cheeks = 1 + (Math.sin(moodT * 10) * 0.5 + 0.5) * 0.12; }
    else if (mood === 'unsure') { tilt = 0.32; lean = -0.06; }
    else if (mood === 'refuse') { turn = -0.55; lean = -0.14; shake = moodT < 1.6 ? Math.sin(moodT * 18) * 0.28 * (1 - moodT / 1.6) : 0; }

    st.lean = damp(st.lean, lean, 6, dt);
    st.turn = damp(st.turn, turn, 5, dt);
    st.cheeks = damp(st.cheeks, cheeks, 8, dt);
    st.paws = damp(st.paws, paws, 6, dt);
    st.tilt = damp(st.tilt, tilt, 5, dt);
    root.position.y = hop;
    bodyG.rotation.x = st.lean;
    headG.rotation.set(st.lean * 0.6, st.turn + shake, st.tilt);
    cheekL.scale.set(0.36 * st.cheeks, 0.32 * st.cheeks, 0.34 * st.cheeks);
    cheekR.scale.copy(cheekL.scale);
    const p = st.paws;
    pawL.position.set(-0.32 + p * 0.14, 0.36 + p * 0.62, 1.02 + p * 0.22);
    pawR.position.set(0.32 - p * 0.14, 0.36 + p * 0.62, 1.02 + p * 0.22);
  }

  return { root, update, faceHeight: 1.5 };
}

// ───────────────────────────── Birds ─────────────────────────────
function barredTexture(base, bar, { from = 0.45, to = 1.05, rows = 9, top = 0.05, bottom = 0.62, scallop = false } = {}) {
  return canvasTexture(512, 256, (ctx, w, h) => {
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = bar;
    ctx.lineCap = 'round';
    for (let r = 0; r < rows; r++) {
      const y = h * (top + ((bottom - top) * r) / rows);
      ctx.lineWidth = h * 0.018 * (1 + r * 0.08);
      ctx.beginPath();
      const x0 = w * from, x1 = w * to;
      for (let x = x0; x <= x1; x += 4) {
        const xx = x % w;
        const yy = y + (scallop ? Math.abs(Math.sin(x / 18)) * -8 : Math.sin(x / 22) * 3);
        if (x === x0 || xx < 4) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
      }
      ctx.stroke();
    }
  });
}

function wingTexture(base, edge, marks) {
  return canvasTexture(256, 256, (ctx, w, h) => {
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, w, h);
    if (!marks) return;
    ctx.fillStyle = marks;
    for (let row = 0; row < 7; row++) for (let col = 0; col < 8; col++) {
      const x = (col + (row % 2) * 0.5) * (w / 8);
      const y = h * 0.12 + row * h * 0.11;
      ctx.beginPath();
      ctx.ellipse(x, y, w / 22, h / 34, 0, 0, Math.PI);
      ctx.fill();
      ctx.fillStyle = edge;
      ctx.beginPath();
      ctx.ellipse(x, y - h / 90, w / 30, h / 60, 0, 0, Math.PI);
      ctx.fill();
      ctx.fillStyle = marks;
    }
  });
}

function buildBird(o) {
  const BODY = mat(o.body, { sheen: true, rough: 0.75 });
  const BELLY = mat(o.belly ?? o.body, { sheen: true, rough: 0.75 });
  const FACE = mat(o.face, { sheen: true, rough: 0.75 });
  const BEAK = mat(o.beak, { rough: 0.35, clearcoat: 0.4 });
  const FEET = mat(o.feet ?? '#b9a3a0', { rough: 0.6 });

  const root = new THREE.Group();
  const bodyG = new THREE.Group();
  bodyG.rotation.x = -0.18;
  root.add(bodyG);

  bodyG.add(sph(1, BODY, { pos: [0, 0.62, -0.02], scale: [0.56, 0.74, 0.54] }));
  bodyG.add(sph(1, BELLY, { pos: [0, 0.55, 0.14], scale: [0.48, 0.6, 0.44] }));

  // tail
  const tail = new THREE.Group();
  tail.position.set(0, 0.22, -0.36);
  tail.rotation.x = -0.62;
  const tailMat = mat(o.tail, { rough: 0.7 });
  tail.add(mesh(G.cone(0.15, o.tailLen, 4), tailMat, { pos: [0, -o.tailLen / 2, 0], rot: [Math.PI, Math.PI / 4, 0], scale: [1.3, 1, 0.3] }));
  tail.add(mesh(G.cone(0.1, o.tailLen * 0.82, 4), tailMat, { pos: [0.08, -o.tailLen * 0.41, 0.02], rot: [Math.PI, Math.PI / 4, 0.06], scale: [1.3, 1, 0.3] }));
  tail.add(mesh(G.cone(0.1, o.tailLen * 0.82, 4), tailMat, { pos: [-0.08, -o.tailLen * 0.41, 0.02], rot: [Math.PI, Math.PI / 4, -0.06], scale: [1, 1, 0.35] }));
  bodyG.add(tail);

  // wings
  const wingMat = mat('#ffffff', { map: wingTexture(o.wing, o.wingEdge ?? o.wing, o.wingMarks), rough: 0.7, sheen: true });
  const wings = [-1, 1].map((s) => {
    const w = new THREE.Group();
    w.position.set(s * 0.4, 0.78, -0.08);
    w.add(sph(1, wingMat, { pos: [0, -0.18, -0.12], scale: [0.2, 0.6, 0.4], rot: [0.5, 0, 0] }));
    if (o.wingPatch) w.add(sph(1, mat(o.wingPatch, { rough: 0.7 }), { pos: [s * 0.08, 0.02, 0.05], scale: [0.14, 0.26, 0.2], rot: [0.5, 0, 0], shadow: false }));
    bodyG.add(w);
    return w;
  });

  // feet gripping the perch
  for (const s of [-1, 1]) {
    for (const a of [-0.35, 0.35]) {
      bodyG.add(mesh(G.capsule(0.035, 0.12), FEET, { pos: [s * 0.16 + a * 0.08, 0.02, 0.1], rot: [Math.PI / 2 + 0.3, a, 0] }));
    }
  }

  // head
  const headG = new THREE.Group();
  headG.position.set(0, 1.18, 0.02);
  bodyG.add(headG);
  const hc = [0, 0.18, 0], hr = [0.47, 0.45, 0.46];
  headG.add(sph(1, mat('#ffffff', { map: o.headMap, sheen: true, rough: 0.75 }), { pos: hc, scale: hr }));
  headG.add(sph(1, FACE, { pos: [0, 0.06, 0.18], scale: [0.38, 0.38, 0.33] }));

  const beak = new THREE.Group();
  beak.position.set(0, 0.06, 0.47);
  beak.add(sph(1, BEAK, { pos: [0, 0, 0], scale: [0.11, 0.12, 0.11] }));
  const tip = mesh(new THREE.TorusGeometry(0.1, 0.055, 10, 16, Math.PI * 0.55), BEAK, { pos: [0, 0.0, -0.02], rot: [0, -Math.PI / 2, -0.3] });
  beak.add(tip);
  headG.add(beak);
  if (o.cere) headG.add(sph(1, mat(o.cere, { rough: 0.4 }), { pos: [0, 0.17, 0.44], scale: [0.1, 0.06, 0.07] }));

  const eyeL = eye(0.085, onEllipsoid(hc, hr, [-0.72, 0.28, 0.52], 0.95));
  const eyeR = eye(0.085, onEllipsoid(hc, hr, [0.72, 0.28, 0.52], 0.95));
  eyeL.lookAt(new THREE.Vector3(-3, 0.6, 1.4));
  eyeR.lookAt(new THREE.Vector3(3, 0.6, 1.4));
  if (o.eyeRing) {
    for (const e of [eyeL, eyeR]) e.add(mesh(G.torus(0.078, 0.018), mat(o.eyeRing, { rough: 0.5 }), { pos: [0, 0, 0.03], shadow: false }));
  }
  headG.add(eyeL, eyeR);

  if (o.cheek) {
    for (const s of [-1, 1]) {
      const p = onEllipsoid(hc, hr, [s * 0.75, -0.25, 0.55], 0.98);
      const c = sph(1, mat(o.cheek, { rough: 0.6 }), { pos: p, scale: [0.12, 0.12, 0.05], shadow: false });
      c.lookAt(new THREE.Vector3(p[0] * 4, p[1], p[2] * 2));
      headG.add(c);
    }
  }
  if (o.throatSpots) {
    for (const x of [-0.14, 0, 0.14]) {
      headG.add(sph(0.035, mat('#15151a'), { pos: [x, -0.18 + Math.abs(x) * 0.3, 0.4 - Math.abs(x) * 0.4], shadow: false }));
    }
  }
  if (o.crest) {
    const crest = new THREE.Group();
    crest.position.set(0, 0.5, 0.18);
    const cm = mat(o.crest, { rough: 0.7, sheen: true });
    [[0, 0.7, -0.35], [-0.07, 0.6, -0.5], [0.07, 0.6, -0.5], [0, 0.5, -0.7]].forEach(([x, len, tilt]) => {
      const f = new THREE.Group();
      f.position.set(x, 0, 0);
      f.rotation.x = tilt;
      f.add(mesh(G.cone(0.045, len, 10), cm, { pos: [0, len / 2, 0] }));
      crest.add(f);
    });
    headG.add(crest);
  }

  const blink = blinker([eyeL, eyeR]);
  const st = { lean: -0.18, turn: 0, tilt: 0, hop: 0, flap: 0 };

  function update(t, dt, mood, moodT) {
    blink(t, dt);
    const breathe = Math.sin(t * 4) * 0.012;
    const sy = squashStretch(mood, moodT, 6, 2);
    bodyG.scale.set((1 + breathe) / Math.sqrt(sy), sy, (1 + breathe) / Math.sqrt(sy));
    tail.rotation.x = -0.62 + Math.sin(t * 2.1) * 0.03;

    let lean = -0.18, turn = Math.sin(t * 0.6) * 0.18, tilt = Math.sin(t * 0.9) * 0.08, hop = 0, flap = 0, shake = 0;
    const idleCock = Math.max(0, Math.sin(t * 0.45) - 0.8) * 2.2; // occasional curious head tilt
    tilt += idleCock * 0.35;
    if (mood === 'happy') { hop = Math.abs(Math.sin(moodT * 6)) * 0.22 * Math.max(0, 1 - moodT / 2); flap = moodT < 1.4 ? 1 : 0; lean = 0.05; turn = 0.35; }
    else if (mood === 'nibble') { lean = 0.3 + Math.max(0, Math.sin(moodT * 6)) * 0.18; turn = 0.5; tilt = 0.1 + Math.sin(moodT * 9) * 0.05; }
    else if (mood === 'unsure') { tilt = 0.55; turn = 0.3; }
    else if (mood === 'refuse') { turn = -0.7; lean = -0.3; shake = moodT < 1.5 ? Math.sin(moodT * 20) * 0.3 * (1 - moodT / 1.5) : 0; flap = moodT < 0.6 ? 0.6 : 0; }

    st.lean = damp(st.lean, lean, 5, dt);
    st.turn = damp(st.turn, turn, 4, dt);
    st.tilt = damp(st.tilt, tilt, 5, dt);
    st.flap = damp(st.flap, flap, 10, dt);
    root.position.y = hop;
    bodyG.rotation.x = st.lean;
    headG.rotation.set(-st.lean * 0.5, st.turn + shake, st.tilt);
    const f = st.flap * (Math.sin(t * 28) * 0.5 + 0.5);
    wings[0].rotation.set(0, -f * 0.2, -f * 0.9);
    wings[1].rotation.set(0, f * 0.2, f * 0.9);
  }

  return { root, update, faceHeight: 2.2 };
}

export function buildBudgie() {
  return buildBird({
    body: '#7cc84a', belly: '#8fd658', face: '#f6e257', beak: '#e7c98f', cere: '#4d7fd6',
    headMap: barredTexture('#f3dc4f', '#262626', { rows: 8 }),
    wing: '#e9d955', wingEdge: '#e9d955', wingMarks: '#232323',
    tail: '#2c5a92', tailLen: 1.15, cheek: '#5a5ccc', throatSpots: true, eyeRing: '#f3f0e6',
  });
}

export function buildCockatiel() {
  return buildBird({
    body: '#8f8e94', belly: '#9d9ca2', face: '#f5dc6c', beak: '#a9a0a0', feet: '#9d8f8f',
    headMap: canvasTexture(256, 128, (ctx, w, h) => {
      const g = ctx.createLinearGradient(0, 0, w, 0);
      g.addColorStop(0, '#f5dc6c'); g.addColorStop(0.4, '#f5dc6c'); g.addColorStop(0.62, '#9a999f'); g.addColorStop(0.88, '#9a999f'); g.addColorStop(1, '#f5dc6c');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    }),
    wing: '#86858b', wingPatch: '#f4f3ef', tail: '#6f6e74', tailLen: 1.45, cheek: '#f08a3c', crest: '#efd460',
  });
}

export function buildCharacter(species) {
  if (species === 'budgie') return buildBudgie();
  if (species === 'cockatiel') return buildCockatiel();
  return buildHamster();
}

/** A wooden perch stand for birds. */
export function buildPerch() {
  const WOOD = mat('#a9744a', { rough: 0.85 });
  const g = new THREE.Group();
  g.add(mesh(G.cyl(0.09, 0.09, 2.4, 20), WOOD, { pos: [0, 1.0, 0], rot: [0, 0, Math.PI / 2] }));
  for (const x of [-1.05, 1.05]) {
    g.add(mesh(G.cyl(0.07, 0.1, 1.0, 16), WOOD, { pos: [x, 0.5, 0] }));
    g.add(mesh(G.cyl(0.22, 0.26, 0.06, 24), WOOD, { pos: [x, 0.03, 0] }));
  }
  // a little knot
  g.add(sph(0.06, mat('#8b5a36'), { pos: [0.6, 1.05, 0.07] }));
  return g;
}

export { rng };
