// Progressive enhancement: every page works without JavaScript. This adds the
// 3D stage, the food finder on the home page, and card tilt.

const LABELS = { yes: 'Yes', limit: 'Small amounts', avoid: 'Better not', no: 'Never' };
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

// ── 3D stages (three.js is loaded only when a stage scrolls into view) ──
let scenePromise;
const loadScene = () => (scenePromise ??= import('./3d/scene.js'));
const stages = new Map();

function webglOK() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch { return false; }
}

function initStages() {
  const els = document.querySelectorAll('[data-stage]');
  if (!els.length || !webglOK()) return;
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      io.unobserve(e.target);
      mountStage(e.target);
    }
  }, { rootMargin: '200px' });
  els.forEach((el) => io.observe(el));
}

async function mountStage(el) {
  const { createStage } = await loadScene();
  const d = el.dataset;
  const stage = createStage(el, { species: d.species, food: d.food, verdict: d.verdict });
  el.classList.add('is-live');
  stages.set(el, stage);
}

// ── Home: food finder ──────────────────────────────────────────────
function initFinder() {
  const dataEl = document.getElementById('food-index');
  if (!dataEl) return;
  const { base, species, foods } = JSON.parse(dataEl.textContent);
  const byId = Object.fromEntries(foods.map((f) => [f.id, f]));
  const spById = Object.fromEntries(species.map((s) => [s.id, s]));
  const input = document.getElementById('q');
  const list = document.getElementById('q-list');
  const result = document.querySelector('[data-result]');
  const grid = document.querySelector('[data-grid]');
  const stageEl = document.querySelector('.hero [data-stage]');
  const radios = [...document.querySelectorAll('[data-species-picker] input')];

  const params = new URLSearchParams(location.search);
  let pet = spById[params.get('pet')] ? params.get('pet') : safeGet('pet') ?? species[0].id;
  if (!spById[pet]) pet = species[0].id;
  let current = byId[params.get('food')] ?? foods.find((f) => f.s === params.get('food')) ?? byId.apple ?? foods[0];
  let active = -1;
  let matches = [];

  radios.forEach((r) => {
    r.checked = r.value === pet;
    r.addEventListener('change', () => { if (r.checked) setPet(r.value); });
  });

  const norm = (s) => s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9 ]/g, '').trim();
  const index = foods.map((f) => ({ f, keys: [f.n, f.s.replace(/-/g, ' '), ...f.a].map(norm) }));

  function search(q) {
    q = norm(q);
    if (!q) return [];
    const scored = [];
    for (const { f, keys } of index) {
      let best = 0;
      for (const k of keys) {
        if (k === q) best = Math.max(best, 100);
        else if (k.startsWith(q)) best = Math.max(best, 80);
        else if (k.split(' ').some((w) => w.startsWith(q))) best = Math.max(best, 60);
        else if (k.includes(q)) best = Math.max(best, 40);
        else if (q.length > 3 && q.endsWith('s') && k.startsWith(q.slice(0, -1))) best = Math.max(best, 70);
      }
      if (best) scored.push([best, f]);
    }
    return scored.sort((a, b) => b[0] - a[0] || a[1].n.localeCompare(b[1].n)).slice(0, 8).map(([, f]) => f);
  }

  function renderList() {
    const q = input.value.trim();
    matches = search(q);
    active = matches.length ? 0 : -1;
    if (!q) { closeList(); return; }
    list.innerHTML = matches.length
      ? matches.map((f, i) => {
          const [st] = f.v[pet];
          return `<li role="option" id="opt-${f.id}" data-id="${f.id}" aria-selected="${i === active}"><img src="${base}img/foods/${f.id}.webp" alt="" width="32" height="32"><span>${esc(f.n)}</span><span class="pill pill--${st}"><span class="pill__dot"></span>${LABELS[st]}</span></li>`;
        }).join('')
      : `<li class="combo__empty">We haven’t rated “${esc(q)}” yet. <a href="https://github.com/limocax-pixel/can-my-pet-eat/issues/new?labels=food-request&title=${encodeURIComponent('Food request: ' + q)}" target="_blank" rel="noopener">Request it on GitHub</a></li>`;
    list.hidden = false;
    input.setAttribute('aria-expanded', 'true');
    input.setAttribute('aria-activedescendant', active >= 0 ? `opt-${matches[active].id}` : '');
  }

  function closeList() {
    list.hidden = true;
    input.setAttribute('aria-expanded', 'false');
    input.removeAttribute('aria-activedescendant');
  }

  function moveActive(d) {
    if (!matches.length) return;
    active = (active + d + matches.length) % matches.length;
    [...list.children].forEach((li, i) => li.setAttribute('aria-selected', String(i === active)));
    input.setAttribute('aria-activedescendant', `opt-${matches[active].id}`);
  }

  input.addEventListener('input', renderList);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); moveActive(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); moveActive(-1); }
    else if (e.key === 'Enter') { e.preventDefault(); if (matches[active]) pick(matches[active].id); else renderList(); }
    else if (e.key === 'Escape') closeList();
  });
  list.addEventListener('mousedown', (e) => {
    const li = e.target.closest('[data-id]');
    if (li) { e.preventDefault(); pick(li.dataset.id); }
  });
  input.addEventListener('blur', () => setTimeout(closeList, 120));
  document.querySelectorAll('[data-pick]').forEach((b) => b.addEventListener('click', () => pick(b.dataset.pick)));

  function pick(id) {
    current = byId[id];
    input.value = current.n;
    closeList();
    update(true);
  }

  function setPet(id) {
    pet = id;
    safeSet('pet', id);
    update(true);
    updateGrid();
  }

  function update(push) {
    const sp = spById[pet];
    const [st, short, portion, freq] = current.v[pet];
    const q = current.s.replace(/-/g, ' ');
    const href = `${base}can-${sp.plural}-eat/${current.s}/`;
    result.innerHTML = `<div class="answer answer--${st}"><span class="pill pill--${st}"><span class="pill__dot"></span>${LABELS[st]}</span><p class="answer__text"><strong>Can ${sp.plural} eat ${esc(q)}?</strong> ${esc(short)}</p>${
      portion ? `<dl class="facts facts--mini"><div><dt>Portion</dt><dd>${esc(portion)}</dd></div><div><dt>How often</dt><dd>${esc(freq)}</dd></div></dl>` : ''
    }</div><a class="result__more" href="${href}">Portion, prep &amp; sources →</a>`;
    result.classList.remove('flash'); void result.offsetWidth; result.classList.add('flash');
    const stage = stages.get(stageEl);
    if (stage) { stage.setSpecies(pet); stage.setFood(current.id, st); }
    else if (stageEl) { stageEl.dataset.species = pet; stageEl.dataset.food = current.id; stageEl.dataset.verdict = st; }
    if (push) {
      const u = new URL(location.href);
      u.searchParams.set('pet', pet);
      u.searchParams.set('food', current.s);
      history.replaceState(null, '', u);
    }
  }

  function updateGrid() {
    const sp = spById[pet];
    document.querySelectorAll('[data-species-name]').forEach((el) => (el.textContent = sp.plural));
    grid.querySelectorAll('.card').forEach((card) => {
      const f = byId[card.dataset.food];
      const [st] = f.v[pet];
      card.href = `${base}can-${sp.plural}-eat/${f.s}/`;
      const p = card.querySelector('.pill');
      p.className = `pill pill--${st}`;
      p.innerHTML = `<span class="pill__dot"></span>${LABELS[st]}`;
    });
  }

  // category filters
  document.querySelectorAll('[data-cat]').forEach((b) => b.addEventListener('click', () => {
    document.querySelectorAll('[data-cat]').forEach((x) => x.classList.toggle('is-on', x === b));
    const cat = b.dataset.cat;
    grid.querySelectorAll('.card').forEach((card) => {
      card.hidden = cat !== 'all' && byId[card.dataset.food].c !== cat;
    });
  }));

  if (pet !== species[0].id || params.get('food')) { update(false); updateGrid(); }
  if (params.get('food')) input.value = current.n;
}

// ── CSS 3D tilt on cards ──────────────────────────────────────────
function initTilt() {
  if (reduceMotion || matchMedia('(hover: none)').matches) return;
  document.addEventListener('pointermove', (e) => {
    const card = e.target.closest?.('.tilt');
    if (!card) return;
    const r = card.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    card.style.setProperty('--ry', `${x * 14}deg`);
    card.style.setProperty('--rx', `${-y * 14}deg`);
    card.style.setProperty('--gx', `${(x + 0.5) * 100}%`);
    card.style.setProperty('--gy', `${(y + 0.5) * 100}%`);
  });
  document.addEventListener('pointerout', (e) => {
    const card = e.target.closest?.('.tilt');
    if (card && !card.contains(e.relatedTarget)) {
      card.style.setProperty('--rx', '0deg');
      card.style.setProperty('--ry', '0deg');
    }
  });
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}
function safeGet(k) { try { return localStorage.getItem('cmpet:' + k); } catch { return null; } }
function safeSet(k, v) { try { localStorage.setItem('cmpet:' + k, v); } catch { /* private mode */ } }

initFinder();
initStages();
initTilt();
