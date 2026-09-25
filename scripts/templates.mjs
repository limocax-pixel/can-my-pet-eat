// HTML templates. Every page is fully rendered at build time so search engines
// and AI crawlers (which mostly don't run JavaScript) see the complete answer.
import { SITE, SITE_URL, BASE, BRAND, VERDICTS, VERDICT_ORDER } from './site.config.mjs';

export const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
export const url = (p = '') => BASE + p.replace(/^\//, '');
export const abs = (p = '') => SITE_URL + '/' + p.replace(/^\//, '');
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export const speciesPath = (sp) => `can-${sp.plural}-eat/`;
export const foodPath = (sp, food) => `can-${sp.plural}-eat/${food.slug}/`;
export const thumb = (food) => url(`img/foods/${food.id}.webp`);

/** "apples" -> "Apples"; used in questions like "Can hamsters eat apples?" */
export const foodQ = (food) => food.q ?? food.slug.replace(/-/g, ' ');

const ORG = {
  '@type': 'Organization',
  '@id': BRAND.url + '#org',
  name: BRAND.name,
  url: BRAND.url,
  slogan: BRAND.motto,
  description: BRAND.about,
  sameAs: BRAND.sameAs,
};

// ── layout ───────────────────────────────────────────────────────────
export function layout({ title, description, path, body, jsonld = [], ogImage, assets, bodyClass = '', noindex = false }) {
  const canonical = abs(path);
  const og = ogImage ? abs(ogImage) : abs('img/og/default.jpg');
  const ld = [{ '@context': 'https://schema.org', '@graph': [ORG, ...jsonld] }];
  return `<!doctype html>
<html lang="${SITE.lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${canonical}">
${noindex ? '<meta name="robots" content="noindex">\n' : ''}<meta name="author" content="${BRAND.name}">
<meta name="theme-color" content="#fbf6ef" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#1c1815" media="(prefers-color-scheme: dark)">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(SITE.name)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${og}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:site" content="@JOMIZOO_PET">
<link rel="icon" href="${url('favicon.svg')}" type="image/svg+xml">
<link rel="alternate" type="text/plain" title="LLM-friendly summary" href="${url('llms.txt')}">
<link rel="stylesheet" href="${url(assets.css)}">
<script type="module" src="${url(assets.js)}"></script>
<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>
</head>
<body class="${bodyClass}">
<a class="skip" href="#main">Skip to content</a>
${header()}
<main id="main">
${body}
</main>
${footer()}
</body>
</html>
`;
}


const ICONS = `<svg width="0" height="0" style="position:absolute" aria-hidden="true">
<symbol id="i-yes" viewBox="0 0 24 24"><path d="M6 12.5l4 4 8-9" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></symbol>
<symbol id="i-limit" viewBox="0 0 24 24"><ellipse cx="14.5" cy="8.5" rx="4" ry="5" transform="rotate(35 14.5 8.5)" fill="currentColor"/><path d="M11.5 12.5L6 19" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></symbol>
<symbol id="i-avoid" viewBox="0 0 24 24"><path d="M12 5.5v8" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"/><circle cx="12" cy="18.5" r="2" fill="currentColor"/></symbol>
<symbol id="i-no" viewBox="0 0 24 24"><path d="M7 7l10 10M17 7L7 17" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></symbol>
</svg>`;

function header() {
  return `${ICONS}<header class="site-header">
  <div class="wrap site-header__in">
    <a class="logo" href="${url()}" aria-label="${esc(SITE.name)} home">
      <img class="logo__mark" src="${url('favicon.svg')}" alt="" width="34" height="34">
      <span class="logo__text"><span class="logo__name">Can My Pet Eat This?</span><span class="logo__by">by ${BRAND.name}</span></span>
    </a>
    <nav class="nav" aria-label="Main">
      <a href="${url('can-hamsters-eat/')}">Hamsters</a>
      <a href="${url('can-budgies-eat/')}">Budgies</a>
      <a href="${url('can-cockatiels-eat/')}">Cockatiels</a>
    </nav>
  </div>
</header>`;
}

function footer() {
  return `<footer class="site-footer">
  <div class="wrap">
    <nav class="site-footer__nav" aria-label="Footer">
      <a href="${url('can-hamsters-eat/')}">Hamster foods</a>
      <a href="${url('can-budgies-eat/')}">Budgie foods</a>
      <a href="${url('can-cockatiels-eat/')}">Cockatiel foods</a>
      <a href="${url('feeding-scale/')}">How we rate</a>
      <a href="${url('emergency/')}">Emergency</a>
      <a href="${url('data/')}">Open data</a>
      <a href="${url('about/')}">About</a>
      <a href="${SITE.repo}">GitHub</a>
    </nav>
    <p>Made with love by <a href="${BRAND.url}" rel="noopener">${BRAND.name}</a>, maker of paper bedding and carriers for small pets. No ads, no affiliate links; our products never change a verdict.</p>
    <p class="muted">Not veterinary advice. If your pet is unwell or ate something toxic, call an exotic-animal vet. © ${new Date().getFullYear()} ${BRAND.name} · Content &amp; data <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a> · Code MIT</p>
  </div>
</footer>`;
}

// ── small components ────────────────────────────────────────────────
export function pill(status, text) {
  return `<span class="pill pill--${status}"><svg class="pill__i" aria-hidden="true"><use href="#i-${status}"/></svg>${esc(text ?? VERDICTS[status].label)}</span>`;
}

function crumbs(items) {
  const html = items
    .map((it, i) => (i < items.length - 1 ? `<a href="${url(it.path)}">${esc(it.name)}</a>` : `<span aria-current="page">${esc(it.name)}</span>`))
    .join('<span class="crumbs__sep" aria-hidden="true">/</span>');
  const ld = {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: abs(it.path) })),
  };
  return { html: `<nav class="crumbs wrap" aria-label="Breadcrumb">${html}</nav>`, ld };
}

/** Compact food tile: 3D thumbnail, name, verdict badge. */
function tile(food, sp, v) {
  return `<a class="tile tilt" href="${url(foodPath(sp, food))}" data-food="${food.id}" data-v="${v.status}">
  <span class="tile__img"><img src="${thumb(food)}" alt="" width="160" height="160" loading="lazy" decoding="async"></span>
  <span class="tile__badge" title="${VERDICTS[v.status].label}"><svg aria-hidden="true"><use href="#i-${v.status}"/></svg><span class="sr-only">${VERDICTS[v.status].label}</span></span>
  <span class="tile__name">${esc(food.name.replace(/ \(.*\)/, ''))}</span>
</a>`;
}

function legend() {
  return `<ul class="legend" aria-label="Verdict key">${VERDICT_ORDER.map((s) => `<li class="legend__${s}"><svg aria-hidden="true"><use href="#i-${s}"/></svg>${VERDICTS[s].label}</li>`).join('')}</ul>`;
}

function stage({ species, food, verdict, poster, posterClass = '', label }) {
  return `<figure class="stage" data-stage data-species="${species}"${food ? ` data-food="${food}"` : ''}${verdict ? ` data-verdict="${verdict}"` : ''}>
  ${poster ? `<img class="stage__poster ${posterClass}" src="${poster}" alt="${esc(label)}" width="880" height="600">` : ''}
  <figcaption class="stage__hint">Drag to turn · tap your pet</figcaption>
</figure>`;
}

function sourceList(ids, sources) {
  const items = ids.map((id) => sources[id]).filter(Boolean);
  if (!items.length) return '';
  return `<ol class="sources">${items
    .map((s) => `<li><a href="${esc(s.url)}" rel="noopener">${esc(s.title)}</a> — ${esc(s.publisher)}</li>`)
    .join('')}</ol>`;
}

const NUTRIENT_ROWS = [
  ['water_g', 'Water', 'g'],
  ['energy_kcal', 'Energy', 'kcal'],
  ['sugar_g', 'Sugars', 'g'],
  ['fat_g', 'Fat', 'g'],
  ['protein_g', 'Protein', 'g'],
  ['fiber_g', 'Fibre', 'g'],
  ['calcium_mg', 'Calcium', 'mg'],
  ['phosphorus_mg', 'Phosphorus', 'mg'],
  ['ca_p_ratio', 'Calcium : phosphorus', ''],
  ['sodium_mg', 'Sodium', 'mg'],
  ['vitaminA_ug_rae', 'Vitamin A (RAE)', 'µg'],
  ['vitaminC_mg', 'Vitamin C', 'mg'],
  ['caffeine_mg', 'Caffeine', 'mg'],
  ['theobromine_mg', 'Theobromine', 'mg'],
  ['alcohol_g', 'Alcohol', 'g'],
];
const HIDE_IF_ZERO = new Set(['caffeine_mg', 'theobromine_mg', 'alcohol_g']);

export const fmt = (n) => (n == null ? '—' : n >= 100 ? Math.round(n).toLocaleString('en') : String(Math.round(n * 10) / 10));

function nutritionFold(food, nut) {
  if (!nut) return '';
  const rows = NUTRIENT_ROWS.filter(([k]) => nut.per100g[k] != null && !(HIDE_IF_ZERO.has(k) && !nut.per100g[k]))
    .map(([k, label, unit]) => `<tr><th scope="row">${label}</th><td>${k === 'ca_p_ratio' ? `${nut.per100g[k]} : 1` : `${fmt(nut.per100g[k])} ${unit}`}</td></tr>`)
    .join('');
  return `<details class="fold" id="nutrition">
  <summary><h2>${esc(cap(foodQ(food)))}: nutrition per 100 g</h2></summary>
  <table class="nutri"><tbody>${rows}</tbody></table>
  <p class="note">“${esc(nut.usdaDescription)}”, <a href="https://fdc.nal.usda.gov/food-details/${nut.fdcId}/nutrients" rel="noopener">USDA FoodData Central</a> (SR Legacy, FDC ${nut.fdcId}). Public domain.</p>
</details>`;
}

// ── pages ────────────────────────────────────────────────────────────
export function foodPage(ctx, food, sp) {
  const { data, sources, nutrition, assets } = ctx;
  const v = food.verdicts[sp.id];
  const q = foodQ(food);
  const Sp = cap(sp.plural);
  const nut = nutrition[food.id];
  const path = foodPath(sp, food);
  const cat = data.categories.find((c) => c.id === food.category);
  const bc = crumbs([
    { name: 'Home', path: '' },
    { name: `${cap(sp.name)} foods`, path: speciesPath(sp) },
    { name: cap(q), path },
  ]);
  const title = `Can ${Sp} Eat ${titleCase(q)}? ${VERDICTS[v.status].label} – Portion & Safety Guide`;
  const facts = [
    v.portion && ['Portion', v.portion],
    v.frequency && ['How often', v.frequency],
    v.dwarf && ['Dwarf hamsters', v.dwarf],
    nut?.per100g.sugar_g != null && ['Sugar', `${fmt(nut.per100g.sugar_g)} g / 100 g`],
    nut?.per100g.fat_g != null && nut.per100g.fat_g >= 5 && ['Fat', `${fmt(nut.per100g.fat_g)} g / 100 g`],
  ].filter(Boolean);

  const others = data.species.filter((s) => s.id !== sp.id);
  const related = data.foods.filter((f) => f.category === food.category && f.id !== food.id);
  const faq = [{ q: `Can ${sp.plural} eat ${q}?`, a: v.short }, ...(v.faq ?? [])];
  const evidence =
    v.evidence === 'direct'
      ? `The sources below discuss ${esc(q)} for ${sp.plural} (or for pet ${sp.group === 'bird' ? 'birds' : 'rodents'} generally).`
      : `No source we found covers ${esc(q)} for ${sp.plural} specifically, so this verdict is reasoned from general feeding guidance and nutrition data.`;

  const pageLd = {
    '@type': 'WebPage',
    '@id': abs(path) + '#page',
    url: abs(path),
    name: `Can ${sp.plural} eat ${q}?`,
    headline: `Can ${sp.plural} eat ${q}?`,
    description: v.short,
    inLanguage: 'en',
    isPartOf: { '@id': abs('') + '#site' },
    about: [{ '@type': 'Thing', name: food.name }, { '@type': 'Thing', name: cap(sp.name) }],
    author: { '@id': BRAND.url + '#org' },
    publisher: { '@id': BRAND.url + '#org' },
    datePublished: data.published,
    dateModified: data.updated,
    image: abs(`img/og/${food.id}.jpg`),
    citation: (v.sources ?? []).map((id) => sources[id]?.url).filter(Boolean),
    breadcrumb: bc.ld,
  };
  const faqLd = {
    '@type': 'FAQPage',
    '@id': abs(path) + '#faq',
    mainEntity: faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  };

  const body = `${bc.html}
<article class="food wrap" data-verdict="${v.status}">
  <header class="top">
    ${stage({ species: sp.id, food: food.id, verdict: v.status, poster: thumb(food), posterClass: 'stage__poster--food', label: `3D illustration: a ${sp.name} next to a dish of ${q}` })}
    <div class="sheet">
      <p class="eyebrow">${esc(cap(sp.name))} · ${esc(cat.name)}</p>
      <h1>Can ${esc(sp.plural)} eat ${esc(q)}?</h1>
      <div class="answer answer--${v.status}">
        ${pill(v.status, VERDICTS[v.status].long)}
        <p class="answer__text">${esc(v.short)}</p>
      </div>
      ${facts.length ? `<dl class="facts">${facts.map(([k, val]) => `<div${k === 'Dwarf hamsters' ? ' class="facts__wide"' : ''}><dt>${k}</dt><dd>${esc(val)}</dd></div>`).join('')}</dl>` : ''}
    </div>
  </header>

  <div class="body">
    ${v.ifEaten ? `<section class="callout callout--${v.status}"><h2>If your ${esc(sp.name)} already ate some</h2><p>${esc(v.ifEaten)}</p>${v.status === 'no' ? `<p><a href="${url('emergency/')}">Emergency steps →</a></p>` : ''}</section>` : ''}
    ${v.prep?.length ? `<section class="block"><h2>How to serve it</h2><ol class="steps">${v.prep.map((s) => `<li>${esc(s)}</li>`).join('')}</ol></section>` : ''}
    <section class="block why">
      <h2>Why</h2>
      <p><strong>Risks.</strong> ${esc(v.risks)}</p>
      ${v.benefits ? `<p><strong>Benefits.</strong> ${esc(v.benefits)}</p>` : ''}
    </section>
    ${faq.length > 1 ? `<details class="fold" id="faq"><summary><h2>Questions owners ask <span class="count">${faq.length - 1}</span></h2></summary>${faq
      .slice(1)
      .map((f) => `<div class="qa"><h3>${esc(f.q)}</h3><p>${esc(f.a)}</p></div>`)
      .join('')}</details>` : ''}
    ${nutritionFold(food, nut)}
    <details class="fold" id="sources">
      <summary><h2>Sources &amp; method <span class="count">${(v.sources ?? []).length}</span></h2></summary>
      <p>${evidence} Confidence: <strong>${esc(v.confidence)}</strong>. Rated on the <a href="${url('feeding-scale/')}">JOMIZOO Feeding Scale</a>; when good sources disagree we choose the more cautious level.</p>
      ${sourceList(v.sources ?? [], sources)}
    </details>
    <section class="block">
      <h2>Other pets</h2>
      <div class="others">${others
        .map((o) => {
          const ov = food.verdicts[o.id];
          return `<a class="other" href="${url(foodPath(o, food))}"><span>Can ${esc(o.plural)} eat ${esc(q)}?</span>${pill(ov.status)}</a>`;
        })
        .join('')}</div>
    </section>
    <section class="block">
      <h2>More ${esc(cat.name.toLowerCase())}</h2>
      <div class="rail">${related.map((f) => tile(f, sp, f.verdicts[sp.id])).join('')}</div>
      <p class="more"><a href="${url(speciesPath(sp))}">All ${data.foods.length} foods for ${esc(sp.plural)} →</a></p>
    </section>
    <footer class="fineprint">
      <p>Updated ${data.updated}. Written by the JOMIZOO team from the sources above; not yet reviewed by a veterinarian. <a href="${SITE.repo}/issues/new?labels=correction&amp;title=${encodeURIComponent(`Correction: ${sp.plural} + ${q}`)}">Report a mistake</a>.</p>
      <p class="cite">Cite: JOMIZOO (${data.updated.slice(0, 4)}). <em>Can ${esc(sp.plural)} eat ${esc(q)}?</em> ${esc(SITE.name)}. ${abs(path)}</p>
    </footer>
  </div>
</article>`;

  return layout({ title, description: v.short, path, body, jsonld: [pageLd, faqLd], ogImage: `img/og/${food.id}.jpg`, assets, bodyClass: 'page-food' });
}

export function speciesPage(ctx, sp) {
  const { data, sources, assets } = ctx;
  const path = speciesPath(sp);
  const counts = Object.fromEntries(VERDICT_ORDER.map((s) => [s, data.foods.filter((f) => f.verdicts[sp.id].status === s).length]));
  const bc = crumbs([{ name: 'Home', path: '' }, { name: `${cap(sp.name)} foods`, path }]);
  const never = data.foods.filter((f) => f.verdicts[sp.id].status === 'no');
  const hero = data.foods.find((f) => f.id === sp.heroFood);
  const lists = data.categories
    .map((cat) => {
      const foods = data.foods.filter((f) => f.category === cat.id);
      return `<section class="block" id="${cat.id}">
  <h2>${esc(cat.name)}</h2>
  <ul class="rows">${foods
    .map((f) => {
      const v = f.verdicts[sp.id];
      return `<li><a href="${url(foodPath(sp, f))}"><img src="${thumb(f)}" alt="" width="48" height="48" loading="lazy"><span class="rows__t"><span class="rows__n">${esc(f.name)}</span>${v.portion ? `<span class="rows__p">${esc(v.portion)}${v.frequency ? ` · ${esc(v.frequency)}` : ''}</span>` : ''}</span>${pill(v.status)}</a></li>`;
    })
    .join('')}</ul>
</section>`;
    })
    .join('\n');

  const title = `What Can ${cap(sp.plural)} Eat? ${data.foods.length} Foods Rated (Safe, Treat, Never)`;
  const description = `${cap(sp.plural)}: ${counts.yes} foods are safe in normal portions, ${counts.limit} only in small amounts, ${counts.avoid} are best avoided and ${counts.no} must never be fed. Sourced portions and prep for each.`;
  const listLd = {
    '@type': 'ItemList',
    '@id': abs(path) + '#list',
    name: `Foods rated for ${sp.plural}`,
    numberOfItems: data.foods.length,
    itemListElement: data.foods.map((f, i) => ({ '@type': 'ListItem', position: i + 1, url: abs(foodPath(sp, f)), name: `Can ${sp.plural} eat ${foodQ(f)}?` })),
  };

  const body = `${bc.html}
<div class="wrap">
  <header class="top top--hub">
    ${stage({ species: sp.id, food: hero?.id, verdict: hero?.verdicts[sp.id].status, poster: url(`img/stage-${sp.id}.webp`), label: `3D illustration of a ${sp.name}` })}
    <div class="sheet">
      <p class="eyebrow">${esc(cap(sp.name))} food guide</p>
      <h1>What can ${esc(sp.plural)} eat?</h1>
      <p class="lead">${esc(sp.intro)}</p>
      <ul class="tally">${VERDICT_ORDER.map((s) => `<li class="tally__${s}"><strong>${counts[s]}</strong>${pill(s)}</li>`).join('')}</ul>
    </div>
  </header>

  <section class="block">
    <h2>Never feed your ${esc(sp.name)}</h2>
    <div class="rail">${never.map((f) => tile(f, sp, f.verdicts[sp.id])).join('')}</div>
  </section>

  <details class="fold" open>
    <summary><h2>Diet basics</h2></summary>
    <ul class="basics">${sp.basics.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>
    ${sourceList(sp.sources, sources)}
  </details>

  <nav class="jump" aria-label="Categories">${data.categories.map((c) => `<a href="#${c.id}">${esc(c.name)}</a>`).join('')}</nav>
  ${lists}
</div>`;

  return layout({ title, description, path, body, jsonld: [listLd, bc.ld], ogImage: `img/og/${sp.id}.jpg`, assets, bodyClass: 'page-hub' });
}

export function homePage(ctx) {
  const { data, assets } = ctx;
  const sp0 = data.species[0];
  const heroFood = data.foods.find((f) => f.id === 'apple') ?? data.foods[0];
  const v0 = heroFood.verdicts[sp0.id];
  const index = data.foods.map((f) => ({
    id: f.id,
    n: f.name,
    s: f.slug,
    c: f.category,
    a: f.aliases ?? [],
    v: Object.fromEntries(data.species.map((sp) => [sp.id, [f.verdicts[sp.id].status, f.verdicts[sp.id].short, f.verdicts[sp.id].portion ?? '', f.verdicts[sp.id].frequency ?? '']])),
  }));
  const species = data.species.map((s) => ({ id: s.id, name: s.name, plural: s.plural, path: url(speciesPath(s)) }));
  const labels = Object.fromEntries(VERDICT_ORDER.map((s) => [s, [VERDICTS[s].label, VERDICTS[s].long]]));
  const quick = ['apple', 'grape', 'banana', 'avocado', 'cheese', 'chocolate', 'broccoli', 'sunflower-seeds'];

  const body = `<section class="hero wrap">
  <div class="hero__panel">
    <h1>Can my pet eat this?</h1>
    <p class="lead">Sourced answers for hamsters, budgies &amp; cockatiels. ${data.foods.length} foods, free &amp; open.</p>
    <form class="finder" role="search" action="${url()}" onsubmit="return false">
      <fieldset class="seg" data-species-picker>
        <legend class="sr-only">Your pet</legend>
        ${data.species.map((s, i) => `<label><input type="radio" name="pet" value="${s.id}"${i === 0 ? ' checked' : ''}><span>${esc(cap(s.name))}</span></label>`).join('')}
      </fieldset>
      <div class="combo">
        <label for="q" class="sr-only">Food</label>
        <input id="q" name="food" type="search" enterkeyhint="search" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Type a food…" role="combobox" aria-expanded="false" aria-controls="q-list" aria-autocomplete="list">
        <ul id="q-list" class="combo__list" role="listbox" hidden></ul>
      </div>
      <div class="quick" aria-label="Popular">${quick
        .map((id) => data.foods.find((f) => f.id === id))
        .filter(Boolean)
        .map((f) => `<button type="button" class="chip" data-pick="${f.id}">${esc(f.name.replace(/ \(.*\)/, ''))}</button>`)
        .join('')}</div>
    </form>
  </div>
  <div class="hero__show">
    ${stage({ species: sp0.id, food: heroFood.id, verdict: v0.status, poster: url(`img/stage-${sp0.id}.webp`), label: 'A 3D hamster on paper bedding next to a dish of apples' })}
    <div class="answer answer--${v0.status} answer--sheet" aria-live="polite" data-result>
      ${pill(v0.status, VERDICTS[v0.status].long)}
      <p class="answer__text"><strong>Can ${sp0.plural} eat ${foodQ(heroFood)}?</strong> ${esc(v0.short)}</p>
      <a class="answer__more" href="${url(foodPath(sp0, heroFood))}">Portion, prep &amp; sources →</a>
    </div>
  </div>
</section>

<section class="wrap block" aria-labelledby="all-h">
  <div class="grid-head">
    <h2 id="all-h">All foods for <span data-species-name>${esc(sp0.plural)}</span></h2>
    ${legend()}
  </div>
  <div class="filters" role="group" aria-label="Filter by category">
    <button type="button" class="chip is-on" data-cat="all">All</button>
    ${data.categories.map((c) => `<button type="button" class="chip" data-cat="${c.id}">${esc(c.name)}</button>`).join('')}
  </div>
  <div class="tiles" data-grid>
    ${data.foods.map((f) => tile(f, sp0, f.verdicts[sp0.id])).join('\n    ')}
  </div>
</section>

<section class="wrap block trust">
  <p><strong>Every verdict is sourced</strong> from veterinary and animal-welfare guidance, and <strong>cautious by design</strong>: when sources disagree, we pick the safer rating. <a href="${url('feeding-scale/')}">How we rate</a> · <a href="${url('data/')}">Open data</a> · <a href="${SITE.repo}">GitHub</a></p>
</section>
<script type="application/json" id="food-index">${JSON.stringify({ base: BASE, species, labels, foods: index }).replace(/</g, '\\u003c')}</script>`;

  const appLd = {
    '@type': 'WebApplication',
    '@id': abs('') + '#app',
    name: SITE.name,
    url: abs(''),
    applicationCategory: 'LifestyleApplication',
    operatingSystem: 'Any (web browser)',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    description: `Free food-safety checker for hamsters, budgies and cockatiels covering ${data.foods.length} foods, with sourced portions and preparation advice.`,
    creator: { '@id': BRAND.url + '#org' },
    isAccessibleForFree: true,
  };
  const siteLd = { '@type': 'WebSite', '@id': abs('') + '#site', url: abs(''), name: SITE.name, publisher: { '@id': BRAND.url + '#org' }, inLanguage: 'en' };

  return layout({
    title: 'Can My Pet Eat This? Food Safety for Hamsters, Budgies & Cockatiels',
    description: `Can hamsters, budgies and cockatiels eat it? Sourced yes / small amounts / never answers for ${data.foods.length} foods, with portions and prep. Free, open data by JOMIZOO.`,
    path: '',
    body,
    jsonld: [siteLd, appLd],
    assets,
    bodyClass: 'page-home',
  });
}

export function scalePage(ctx) {
  const { data, sources, assets } = ctx;
  const path = 'feeding-scale/';
  const bc = crumbs([{ name: 'Home', path: '' }, { name: 'How we rate', path }]);
  const srcIds = Object.keys(sources);
  const body = `${bc.html}
<article class="wrap prose">
  <p class="eyebrow">Method</p>
  <h1>The JOMIZOO Feeding Scale</h1>
  <p class="lead">Every food on this site gets one of four ratings for each species. The scale is deliberately simple, so an owner can decide in seconds, and deliberately cautious, because small bodies have small margins.</p>
  <ol class="scale scale--big">${VERDICT_ORDER.map((s) => `<li class="scale__item scale__item--${s}">${pill(s)}<h2>${esc(VERDICTS[s].long)}</h2><p>${esc(VERDICTS[s].scale)}</p></li>`).join('')}</ol>

  <h2>How a verdict is made</h2>
  <ol>
    <li><strong>Sources first.</strong> We look for guidance from veterinary sources (for example VCA Animal Hospitals, the Merck Veterinary Manual and avian-vet publications), then from animal-welfare charities such as the RSPCA, PDSA and Blue Cross, then peer-reviewed research. We don’t use content farms, forums or shop blogs.</li>
    <li><strong>The cautious rule.</strong> When reputable sources disagree, we use the more cautious level and say so in the risks.</li>
    <li><strong>Evidence labels.</strong> Each verdict is marked as either <em>direct</em> (a source discusses this food for this species or group) or <em>inferred</em> (reasoned from general feeding guidance and nutrient data). Each also carries a confidence level.</li>
    <li><strong>Portions for small bodies.</strong> Portions are written for the smaller end of each species. For hamsters, we add a stricter note for dwarf species (Campbell’s, Winter White and their hybrids), which are prone to diabetes.</li>
    <li><strong>Numbers you can check.</strong> Nutrient values come from USDA FoodData Central and are shown per 100 g on every food page.</li>
  </ol>

  <h2>What this site is not</h2>
  <p>It is not veterinary advice and it cannot diagnose anything. Individual animals, especially older pets or those with diabetes, kidney disease or obesity, may need a different diet. If your pet is unwell, or has eaten something rated <em>Never</em>, call an exotic-animal vet. See <a href="${url('emergency/')}">what to do in an emergency</a>.</p>

  <h2>Review status and corrections</h2>
  <p>Pages are written by the JOMIZOO team from the listed sources. They have not yet been reviewed by a veterinarian. If you are a vet or researcher and disagree with a rating, please <a href="${SITE.repo}/issues/new?labels=correction">open an issue on GitHub</a> with your source. Every change is public in the repository history.</p>

  <h2>All sources used (${srcIds.length})</h2>
  ${sourceList(srcIds, sources)}
</article>`;
  return layout({
    title: 'The JOMIZOO Feeding Scale: How We Rate Pet Food Safety',
    description: 'Yes, Small amounts, Better not, Never: the four-level scale behind every verdict on Can My Pet Eat This?, how sources are chosen and how disagreements are resolved.',
    path,
    body,
    jsonld: [bc.ld, { '@type': 'WebPage', '@id': abs(path) + '#page', name: 'The JOMIZOO Feeding Scale', author: { '@id': BRAND.url + '#org' }, dateModified: data.updated }],
    assets,
    bodyClass: 'page-prose',
  });
}

export function dataPage(ctx) {
  const { data, assets, stats } = ctx;
  const path = 'data/';
  const bc = crumbs([{ name: 'Home', path: '' }, { name: 'Open data', path }]);
  const datasetLd = {
    '@type': 'Dataset',
    '@id': abs(path) + '#dataset',
    name: 'Small-pet food safety verdicts (hamsters, budgies, cockatiels)',
    alternateName: 'JOMIZOO Can My Pet Eat This? dataset',
    description: `Food-safety verdicts on the four-level JOMIZOO Feeding Scale for ${data.foods.length} foods × ${data.species.length} species (${stats.verdicts} verdicts), with portion, frequency, preparation, risks, source citations, evidence type and confidence, plus USDA nutrient values per 100 g.`,
    url: abs(path),
    sameAs: SITE.repo,
    license: 'https://creativecommons.org/licenses/by/4.0/',
    isAccessibleForFree: true,
    creator: { '@id': BRAND.url + '#org' },
    publisher: { '@id': BRAND.url + '#org' },
    version: data.version,
    dateModified: data.updated,
    keywords: ['hamster', 'budgie', 'budgerigar', 'parakeet', 'cockatiel', 'pet food safety', 'toxic foods', 'animal nutrition'],
    variableMeasured: ['status', 'portion', 'frequency', 'prep', 'risks', 'sources', 'evidence', 'confidence'],
    distribution: [
      { '@type': 'DataDownload', encodingFormat: 'application/json', contentUrl: abs('data/foods.json') },
      { '@type': 'DataDownload', encodingFormat: 'text/csv', contentUrl: abs('data/verdicts.csv') },
      { '@type': 'DataDownload', encodingFormat: 'application/json', contentUrl: abs('data/sources.json') },
      { '@type': 'DataDownload', encodingFormat: 'application/json', contentUrl: abs('data/nutrition.json') },
    ],
  };
  const body = `${bc.html}
<article class="wrap prose">
  <p class="eyebrow">Open data · CC BY 4.0</p>
  <h1>Download the dataset</h1>
  <p class="lead">Everything on this site comes from one open dataset: ${data.foods.length} foods × ${data.species.length} species = <strong>${stats.verdicts} verdicts</strong>, each with portion, frequency, preparation steps, risks, sources, an evidence label and a confidence level.</p>
  <ul class="downloads">
    <li><a class="btn" href="${url('data/foods.json')}" download>foods.json</a> The complete dataset (${stats.kbJson} KB).</li>
    <li><a class="btn" href="${url('data/verdicts.csv')}" download>verdicts.csv</a> One row per food × species (${stats.kbCsv} KB), for spreadsheets.</li>
    <li><a class="btn" href="${url('data/sources.json')}" download>sources.json</a> The ${stats.sources} sources cited.</li>
    <li><a class="btn" href="${url('data/nutrition.json')}" download>nutrition.json</a> USDA nutrient values per 100 g.</li>
  </ul>
  <h2>License and attribution</h2>
  <p>The verdicts and text are licensed under <a href="https://creativecommons.org/licenses/by/4.0/">Creative Commons Attribution 4.0</a>. You can use them in apps, research, articles or datasets, commercially or not. Please credit:</p>
  <pre class="cite__text">Source: JOMIZOO, “Can My Pet Eat This?” (${abs('')}), CC BY 4.0</pre>
  <p>Nutrient values are from USDA FoodData Central and are in the public domain. The site’s code is MIT-licensed on <a href="${SITE.repo}">GitHub</a>.</p>
  <h2>Fields</h2>
  <div class="table-wrap"><table class="list">
    <thead><tr><th>Field</th><th>Meaning</th></tr></thead>
    <tbody>
      <tr><td><code>status</code></td><td><code>yes</code> · <code>limit</code> · <code>avoid</code> · <code>no</code> (see <a href="${url('feeding-scale/')}">the scale</a>)</td></tr>
      <tr><td><code>short</code></td><td>One-sentence answer, conclusion first</td></tr>
      <tr><td><code>portion</code>, <code>frequency</code></td><td>How much and how often (empty for <code>no</code>)</td></tr>
      <tr><td><code>prep</code></td><td>Preparation steps</td></tr>
      <tr><td><code>benefits</code>, <code>risks</code></td><td>Why, in plain language</td></tr>
      <tr><td><code>dwarf</code></td><td>Stricter note for dwarf hamsters (hamster only)</td></tr>
      <tr><td><code>ifEaten</code></td><td>What to do if the pet already ate it</td></tr>
      <tr><td><code>faq</code></td><td>Common follow-up questions</td></tr>
      <tr><td><code>sources</code></td><td>IDs into <code>sources.json</code></td></tr>
      <tr><td><code>evidence</code></td><td><code>direct</code> or <code>inferred</code></td></tr>
      <tr><td><code>confidence</code></td><td><code>high</code> · <code>medium</code> · <code>low</code></td></tr>
    </tbody>
  </table></div>
</article>`;
  return layout({
    title: 'Open Data: Small-Pet Food Safety Dataset (JSON, CSV, CC BY 4.0)',
    description: `Download ${stats.verdicts} food-safety verdicts for hamsters, budgies and cockatiels as JSON or CSV, with sources and USDA nutrition values. Free under CC BY 4.0.`,
    path,
    body,
    jsonld: [bc.ld, datasetLd],
    assets,
    bodyClass: 'page-prose',
  });
}

export function aboutPage(ctx) {
  const { data, assets } = ctx;
  const path = 'about/';
  const bc = crumbs([{ name: 'Home', path: '' }, { name: 'About', path }]);
  const body = `${bc.html}
<article class="wrap prose">
  <p class="eyebrow">About</p>
  <h1>Made with love, for their health</h1>
  <p class="lead">${esc(SITE.name)} is a free tool from <a href="${BRAND.url}">${BRAND.name}</a>. Our motto is <strong>${esc(BRAND.motto.toLowerCase())}</strong>, and a lot of small-pet health comes down to what goes in the food dish.</p>
  <p>${esc(BRAND.about)} Every day we hear the same questions from owners: can my hamster have a grape, is it fine to share toast with my budgie, what do I do because the cockatiel just stole some chocolate? The answers online are scattered and often contradict each other, and many are written to sell something.</p>
  <p>So we built the reference we wanted ourselves: one clear rating per food and species, sourced and cautious, with the portion and preparation spelled out, and free for anyone to use and improve.</p>
  <h2>Our promises</h2>
  <ul>
    <li><strong>No ads, no affiliate links.</strong> Nothing on this site is for sale, and our products never change a verdict.</li>
    <li><strong>Open.</strong> The code (MIT) and the data (CC BY 4.0) are public on <a href="${SITE.repo}">GitHub</a>, including every correction.</li>
    <li><strong>Honest about limits.</strong> We show where each verdict comes from, how confident we are, and when no source addresses a food directly.</li>
  </ul>
  <h2>Disclosure</h2>
  <p>This site is operated by ${BRAND.name}, a company that sells small-pet products (paper bedding and pet carriers). We say so openly on every page so you can judge the content for yourself.</p>
  <p>Find us at <a href="${BRAND.url}">jomizoo.com</a>, on <a href="https://x.com/JOMIZOO_PET">X</a> and on <a href="https://www.instagram.com/jomizoo_pet/">Instagram</a>.</p>
</article>`;
  return layout({
    title: 'About Can My Pet Eat This? — a free tool by JOMIZOO',
    description: 'Why JOMIZOO, a small-pet brand, built a free, sourced and open food-safety reference for hamsters, budgies and cockatiels. No ads, no affiliate links.',
    path,
    body,
    jsonld: [bc.ld, { '@type': 'AboutPage', '@id': abs(path) + '#page', name: 'About', about: { '@id': BRAND.url + '#org' }, dateModified: data.updated }],
    assets,
    bodyClass: 'page-prose',
  });
}

export function emergencyPage(ctx) {
  const { data, assets, emergency } = ctx;
  const path = 'emergency/';
  const bc = crumbs([{ name: 'Home', path: '' }, { name: 'Emergency', path }]);
  const body = `${bc.html}
<article class="wrap prose">
  <p class="eyebrow">Emergency</p>
  <h1>My pet ate something toxic — what now?</h1>
  <div class="callout callout--no"><p><strong>Call a vet now.</strong> Small animals can go downhill within hours, and some poisons (avocado in birds, chocolate, xylitol) act fast. Don’t wait for symptoms.</p></div>
  <ol class="steps">
    <li><strong>Remove the food</strong> and anything else your pet could reach. Keep the packaging or a sample.</li>
    <li><strong>Note what, how much and when.</strong> A rough amount (“half a grape”, “a crumb of dark chocolate”) and the time help the vet a lot.</li>
    <li><strong>Call your vet</strong>, ideally one who treats exotic pets, or the nearest emergency clinic. Say the species and weight if you know it.</li>
    <li><strong>Don’t try home remedies.</strong> Don’t try to make your pet vomit or give salt, oil or milk unless a vet tells you to.</li>
    <li><strong>Travel safely.</strong> Keep your pet warm, quiet and secure in a well-ventilated carrier on the way. Cover part of the carrier so a bird feels safer, and avoid heat and draughts.</li>
  </ol>
  ${emergency?.length ? `<h2>Animal poison helplines</h2><ul>${emergency.map((e) => `<li><strong>${esc(e.name)}</strong> (${esc(e.region)}): ${esc(e.phone)} — ${esc(e.note)} <a href="${esc(e.url)}" rel="noopener">Website</a></li>`).join('')}</ul><p class="muted">Helplines may charge a consultation fee. Check the website for current details.</p>` : ''}
  <h2>Foods that are never safe</h2>
  ${data.species
    .map((sp) => {
      const never = data.foods.filter((f) => f.verdicts[sp.id].status === 'no');
      return `<h3>For ${esc(sp.plural)}</h3><p>${never.map((f) => `<a href="${url(foodPath(sp, f))}">${esc(f.name)}</a>`).join(', ')}</p>`;
    })
    .join('')}
</article>`;
  return layout({
    title: 'My Pet Ate Something Toxic: What to Do (Hamsters, Budgies, Cockatiels)',
    description: 'First steps if your hamster, budgie or cockatiel ate chocolate, avocado, onion or another toxic food: what to note, who to call, and what not to do.',
    path,
    body,
    jsonld: [bc.ld],
    assets,
    bodyClass: 'page-prose',
  });
}

export function notFoundPage(ctx) {
  return layout({
    title: 'Page not found — Can My Pet Eat This?',
    description: 'This page does not exist.',
    path: '404.html',
    body: `<div class="wrap prose"><h1>We couldn’t find that page</h1><p>Try the <a href="${url()}">food checker</a> or browse foods for <a href="${url('can-hamsters-eat/')}">hamsters</a>, <a href="${url('can-budgies-eat/')}">budgies</a> or <a href="${url('can-cockatiels-eat/')}">cockatiels</a>.</p></div>`,
    assets: ctx.assets,
    noindex: true,
  });
}

function titleCase(s) {
  return s.replace(/\b([a-z])/g, (m) => m.toUpperCase());
}
