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

function header() {
  return `<header class="site-header">
  <div class="wrap site-header__in">
    <a class="logo" href="${url()}" aria-label="${esc(SITE.name)} home">
      <svg class="logo__mark" viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="22" r="15" fill="#f3c38b"/><circle cx="9" cy="10" r="5" fill="#f3c38b"/><circle cx="31" cy="10" r="5" fill="#f3c38b"/><circle cx="9" cy="10" r="2.6" fill="#f2a3ad"/><circle cx="31" cy="10" r="2.6" fill="#f2a3ad"/><ellipse cx="20" cy="27" rx="9" ry="7" fill="#fff4e4"/><circle cx="14.5" cy="20" r="2.2" fill="#1d1612"/><circle cx="25.5" cy="20" r="2.2" fill="#1d1612"/><circle cx="20" cy="24.5" r="1.7" fill="#e88a95"/></svg>
      <span class="logo__text"><span class="logo__name">Can My Pet Eat This?</span><span class="logo__by">by ${BRAND.name}</span></span>
    </a>
    <nav class="nav" aria-label="Main">
      <a href="${url('can-hamsters-eat/')}">Hamsters</a>
      <a href="${url('can-budgies-eat/')}">Budgies</a>
      <a href="${url('can-cockatiels-eat/')}">Cockatiels</a>
      <a href="${url('feeding-scale/')}">How we rate</a>
      <a href="${url('data/')}">Open data</a>
    </nav>
  </div>
</header>`;
}

function footer() {
  return `<footer class="site-footer">
  <div class="wrap site-footer__grid">
    <div>
      <p class="site-footer__brand"><strong>${SITE.name}</strong> is made with love by <a href="${BRAND.url}" rel="noopener">${BRAND.name}</a>.</p>
      <p>${esc(BRAND.about)} This site has no ads and no affiliate links, and our products never change a verdict. <a href="${url('about/')}">About us</a>.</p>
      <p class="muted">Not veterinary advice. If your pet is unwell or has eaten something toxic, contact an exotic-animal vet straight away. <a href="${url('emergency/')}">What to do in an emergency</a>.</p>
    </div>
    <div>
      <p class="site-footer__h">Guides</p>
      <ul>
        <li><a href="${url('can-hamsters-eat/')}">What can hamsters eat?</a></li>
        <li><a href="${url('can-budgies-eat/')}">What can budgies eat?</a></li>
        <li><a href="${url('can-cockatiels-eat/')}">What can cockatiels eat?</a></li>
        <li><a href="${url('feeding-scale/')}">The JOMIZOO Feeding Scale</a></li>
      </ul>
    </div>
    <div>
      <p class="site-footer__h">Open source</p>
      <ul>
        <li><a href="${url('data/')}">Download the dataset (CC BY 4.0)</a></li>
        <li><a href="${SITE.repo}">Code on GitHub (MIT)</a></li>
        <li><a href="${SITE.repo}/issues/new?labels=correction&amp;title=Correction%3A%20">Report a mistake</a></li>
        <li><a href="${url('llms.txt')}">llms.txt</a></li>
      </ul>
    </div>
  </div>
  <div class="wrap site-footer__legal">© ${new Date().getFullYear()} ${BRAND.name}. Content &amp; data: <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a> · Code: MIT.</div>
</footer>`;
}

// ── small components ────────────────────────────────────────────────
export function pill(status, text) {
  return `<span class="pill pill--${status}"><span class="pill__dot" aria-hidden="true"></span>${esc(text ?? VERDICTS[status].label)}</span>`;
}

function crumbs(items) {
  const html = items
    .map((it, i) => (i < items.length - 1 ? `<a href="${url(it.path)}">${esc(it.name)}</a>` : `<span aria-current="page">${esc(it.name)}</span>`))
    .join('<span class="crumbs__sep" aria-hidden="true">›</span>');
  const ld = {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: abs(it.path) })),
  };
  return { html: `<nav class="crumbs wrap" aria-label="Breadcrumb">${html}</nav>`, ld };
}

function foodCard(food, sp, v, { level = 'h3' } = {}) {
  return `<a class="card tilt" href="${url(foodPath(sp, food))}" data-food="${food.id}">
  <span class="card__img"><img src="${thumb(food)}" alt="" width="160" height="160" loading="lazy" decoding="async"></span>
  <${level} class="card__name">${esc(food.name)}</${level}>
  ${pill(v.status)}
</a>`;
}

function stage({ species, food, verdict, poster, label }) {
  return `<figure class="stage" data-stage data-species="${species}"${food ? ` data-food="${food}"` : ''}${verdict ? ` data-verdict="${verdict}"` : ''}>
  ${poster ? `<img class="stage__poster" src="${poster}" alt="${esc(label)}" width="320" height="320">` : ''}
  <figcaption class="stage__hint">Drag to turn the 3D scene</figcaption>
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
  ['ca_p_ratio', 'Calcium : phosphorus ratio', ''],
  ['sodium_mg', 'Sodium', 'mg'],
  ['vitaminA_ug_rae', 'Vitamin A (RAE)', 'µg'],
  ['vitaminC_mg', 'Vitamin C', 'mg'],
  ['caffeine_mg', 'Caffeine', 'mg'],
  ['theobromine_mg', 'Theobromine', 'mg'],
  ['alcohol_g', 'Alcohol', 'g'],
];
const HIDE_IF_ZERO = new Set(['caffeine_mg', 'theobromine_mg', 'alcohol_g']);

export const fmt = (n) => (n == null ? '—' : n >= 100 ? Math.round(n).toLocaleString('en') : String(Math.round(n * 10) / 10));

function nutritionTable(food, nut) {
  if (!nut) return '';
  const rows = NUTRIENT_ROWS.filter(([k]) => nut.per100g[k] != null && !(HIDE_IF_ZERO.has(k) && !nut.per100g[k]))
    .map(([k, label, unit]) => `<tr><th scope="row">${label}</th><td>${k === 'ca_p_ratio' ? `${nut.per100g[k]} : 1` : `${fmt(nut.per100g[k])} ${unit}`}</td></tr>`)
    .join('');
  return `<section class="block" id="nutrition">
  <h2>${esc(cap(foodQ(food)))}: nutrition per 100 g</h2>
  <table class="nutri"><tbody>${rows}</tbody></table>
  <p class="note">Values for “${esc(nut.usdaDescription)}” from <a href="https://fdc.nal.usda.gov/food-details/${nut.fdcId}/nutrients" rel="noopener">USDA FoodData Central</a> (SR Legacy, FDC ID ${nut.fdcId}). Public domain.</p>
</section>`;
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
    ['Verdict', VERDICTS[v.status].long],
    v.portion && ['Portion', v.portion],
    v.frequency && ['How often', v.frequency],
    v.dwarf && ['Dwarf hamsters', v.dwarf],
    nut?.per100g.sugar_g != null && ['Sugar', `${fmt(nut.per100g.sugar_g)} g per 100 g (USDA)`],
    nut?.per100g.fat_g != null && nut.per100g.fat_g >= 5 && ['Fat', `${fmt(nut.per100g.fat_g)} g per 100 g (USDA)`],
  ].filter(Boolean);

  const others = data.species.filter((s) => s.id !== sp.id);
  const related = data.foods.filter((f) => f.category === food.category && f.id !== food.id).slice(0, 8);
  const faq = [{ q: `Can ${sp.plural} eat ${q}?`, a: v.short }, ...(v.faq ?? [])];
  const evidence =
    v.evidence === 'direct'
      ? `The sources below discuss ${esc(q)} for ${sp.plural} (or for pet ${sp.group === 'bird' ? 'birds' : 'rodents'} generally).`
      : `No source we found addresses ${esc(q)} for ${sp.plural} specifically, so this verdict is reasoned from the general feeding guidance and nutrition data below.`;

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
    image: abs(`img/foods/${food.id}.webp`),
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
  <header class="food-hero">
    <div class="food-hero__text">
      <p class="eyebrow">${esc(cap(sp.name))} food guide · ${esc(cat.name)}</p>
      <h1>Can ${esc(sp.plural)} eat ${esc(q)}?</h1>
      <div class="answer answer--${v.status}">
        ${pill(v.status)}
        <p class="answer__text">${esc(v.short)}</p>
      </div>
      <dl class="facts">${facts.map(([k, val]) => `<div><dt>${k}</dt><dd>${esc(val)}</dd></div>`).join('')}</dl>
    </div>
    ${stage({ species: sp.id, food: food.id, verdict: v.status, poster: thumb(food), label: `3D illustration: a ${sp.name} next to a dish of ${q}` })}
  </header>

  <div class="food-body">
    ${v.prep?.length ? `<section class="block"><h2>How to serve ${esc(q)} to your ${esc(sp.name)}</h2><ol class="steps">${v.prep.map((s) => `<li>${esc(s)}</li>`).join('')}</ol></section>` : ''}
    ${v.ifEaten ? `<section class="block callout callout--${v.status}"><h2>If your ${esc(sp.name)} already ate some</h2><p>${esc(v.ifEaten)}</p>${v.status === 'no' ? `<p><a href="${url('emergency/')}">What to do if your pet ate something toxic →</a></p>` : ''}</section>` : ''}
    <section class="block two">
      ${v.benefits ? `<div><h2>Benefits</h2><p>${esc(v.benefits)}</p></div>` : ''}
      <div><h2>Risks</h2><p>${esc(v.risks)}</p></div>
    </section>
    ${nutritionTable(food, nut)}
    <section class="block" id="faq">
      <h2>Questions owners ask</h2>
      ${faq.slice(1).map((f) => `<details class="faq"><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join('') || '<p class="muted">No follow-up questions yet.</p>'}
    </section>
    <section class="block">
      <h2>Can other pets eat ${esc(q)}?</h2>
      <div class="others">${others
        .map((o) => {
          const ov = food.verdicts[o.id];
          return `<a class="other" href="${url(foodPath(o, food))}"><span class="other__q">Can ${esc(o.plural)} eat ${esc(q)}?</span>${pill(ov.status)}<span class="other__a">${esc(ov.short)}</span></a>`;
        })
        .join('')}</div>
    </section>
    <section class="block">
      <h2>More ${esc(cat.name.toLowerCase())} for ${esc(sp.plural)}</h2>
      <div class="cards cards--small">${related.map((f) => foodCard(f, sp, f.verdicts[sp.id], { level: 'h3' })).join('')}</div>
      <p><a href="${url(speciesPath(sp))}">See all ${data.foods.length} foods rated for ${esc(sp.plural)} →</a></p>
    </section>
    <section class="block" id="sources">
      <h2>Sources &amp; method</h2>
      <p>${evidence} Confidence: <strong>${esc(v.confidence)}</strong>. Verdicts follow the <a href="${url('feeding-scale/')}">JOMIZOO Feeding Scale</a>; when reputable sources disagree we use the more cautious rating.</p>
      ${sourceList(v.sources ?? [], sources)}
    </section>
    <section class="block cite">
      <h2>Cite this page</h2>
      <p class="cite__text"><span>JOMIZOO (${data.updated.slice(0, 4)}). <em>Can ${esc(sp.plural)} eat ${esc(q)}?</em> ${esc(SITE.name)}. ${abs(path)}</span></p>
      <p class="muted">Last updated ${data.updated}. Written by the JOMIZOO team from the sources above; not yet reviewed by a veterinarian. Not veterinary advice — if in doubt, ask an exotic-animal vet. Spotted a mistake? <a href="${SITE.repo}/issues/new?labels=correction&amp;title=${encodeURIComponent(`Correction: ${sp.plural} + ${q}`)}">Tell us on GitHub</a>.</p>
    </section>
  </div>
</article>`;

  return layout({
    title,
    description: v.short,
    path,
    body,
    jsonld: [pageLd, faqLd],
    ogImage: `img/og/${food.id}.jpg`,
    assets,
    bodyClass: 'page-food',
  });
}

export function speciesPage(ctx, sp) {
  const { data, sources, assets } = ctx;
  const path = speciesPath(sp);
  const counts = Object.fromEntries(VERDICT_ORDER.map((s) => [s, data.foods.filter((f) => f.verdicts[sp.id].status === s).length]));
  const bc = crumbs([{ name: 'Home', path: '' }, { name: `${cap(sp.name)} foods`, path }]);
  const never = data.foods.filter((f) => f.verdicts[sp.id].status === 'no');
  const table = data.categories
    .map((cat) => {
      const foods = data.foods.filter((f) => f.category === cat.id);
      return `<section class="block" id="${cat.id}">
  <h2>${esc(cat.name)}</h2>
  <div class="table-wrap"><table class="list">
    <thead><tr><th scope="col">Food</th><th scope="col">Verdict</th><th scope="col">Portion</th><th scope="col">How often</th></tr></thead>
    <tbody>${foods
      .map((f) => {
        const v = f.verdicts[sp.id];
        return `<tr data-verdict="${v.status}"><th scope="row"><a href="${url(foodPath(sp, f))}"><img src="${thumb(f)}" alt="" width="40" height="40" loading="lazy">${esc(f.name)}</a></th><td>${pill(v.status)}</td><td>${esc(v.portion ?? '—')}</td><td>${esc(v.frequency ?? '—')}</td></tr>`;
      })
      .join('')}</tbody>
  </table></div>
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
  <header class="hub-hero">
    <div>
      <p class="eyebrow">${esc(cap(sp.name))} food guide</p>
      <h1>What can ${esc(sp.plural)} eat?</h1>
      <p class="lead">${esc(sp.intro)}</p>
      <ul class="tally">${VERDICT_ORDER.map((s) => `<li>${pill(s)}<strong>${counts[s]}</strong> <span>foods</span></li>`).join('')}</ul>
    </div>
    ${stage({ species: sp.id, food: sp.heroFood, verdict: data.foods.find((f) => f.id === sp.heroFood)?.verdicts[sp.id].status, poster: url(`img/stage-${sp.id}.webp`), label: `3D illustration of a ${sp.name}` })}
  </header>

  <section class="block basics">
    <h2>The basics of a healthy ${esc(sp.name)} diet</h2>
    <ul>${sp.basics.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>
    ${sourceList(sp.sources, sources)}
  </section>

  <section class="block never">
    <h2>Never feed your ${esc(sp.name)}</h2>
    <div class="cards cards--small">${never.map((f) => foodCard(f, sp, f.verdicts[sp.id])).join('')}</div>
  </section>

  <nav class="jump" aria-label="Categories">${data.categories.map((c) => `<a href="#${c.id}">${esc(c.name)}</a>`).join('')}</nav>
  ${table}
</div>`;

  return layout({ title, description, path, body, jsonld: [listLd, bc.ld], ogImage: `img/og/${sp.id}.jpg`, assets, bodyClass: 'page-hub' });
}

export function homePage(ctx) {
  const { data, assets } = ctx;
  const sp0 = data.species[0];
  const heroFood = data.foods.find((f) => f.id === 'apple') ?? data.foods[0];
  const index = data.foods.map((f) => ({
    id: f.id,
    n: f.name,
    s: f.slug,
    c: f.category,
    a: f.aliases ?? [],
    v: Object.fromEntries(data.species.map((sp) => [sp.id, [f.verdicts[sp.id].status, f.verdicts[sp.id].short, f.verdicts[sp.id].portion ?? '', f.verdicts[sp.id].frequency ?? '']])),
  }));
  const species = data.species.map((s) => ({ id: s.id, name: s.name, plural: s.plural, path: url(speciesPath(s)) }));
  const quick = ['apple', 'banana', 'grape', 'avocado', 'cheese', 'chocolate', 'broccoli', 'sunflower-seeds'];

  const body = `<section class="hero wrap">
  <div class="hero__text">
    <p class="eyebrow">Free · Sourced · Open data</p>
    <h1>Can my pet eat this?</h1>
    <p class="lead">Clear, sourced answers for <strong>hamsters</strong>, <strong>budgies</strong> and <strong>cockatiels</strong> — ${data.foods.length} foods, ${data.foods.length * data.species.length} verdicts, with portions, prep and what to do if something goes wrong.</p>
    <form class="finder" role="search" action="${url()}" onsubmit="return false">
      <fieldset class="seg" data-species-picker>
        <legend class="sr-only">Your pet</legend>
        ${data.species.map((s, i) => `<label><input type="radio" name="pet" value="${s.id}"${i === 0 ? ' checked' : ''}><span>${esc(cap(s.name))}</span></label>`).join('')}
      </fieldset>
      <div class="combo">
        <label for="q" class="sr-only">Food</label>
        <input id="q" name="food" type="search" autocomplete="off" spellcheck="false" placeholder="Type a food — e.g. grapes, cheese, avocado" role="combobox" aria-expanded="false" aria-controls="q-list" aria-autocomplete="list">
        <ul id="q-list" class="combo__list" role="listbox" hidden></ul>
      </div>
      <p class="quick">Try: ${quick
        .map((id) => data.foods.find((f) => f.id === id))
        .filter(Boolean)
        .map((f) => `<button type="button" class="chip" data-pick="${f.id}">${esc(f.name.replace(/ \(.*\)/, ''))}</button>`)
        .join('')}</p>
    </form>
    <div class="result" aria-live="polite" data-result>
      <div class="answer answer--${heroFood.verdicts[sp0.id].status}">
        ${pill(heroFood.verdicts[sp0.id].status)}
        <p class="answer__text"><strong>Can ${sp0.plural} eat ${foodQ(heroFood)}?</strong> ${esc(heroFood.verdicts[sp0.id].short)}</p>
      </div>
      <a class="result__more" href="${url(foodPath(sp0, heroFood))}">Portion, prep &amp; sources →</a>
    </div>
  </div>
  ${stage({ species: sp0.id, food: heroFood.id, verdict: heroFood.verdicts[sp0.id].status, poster: url(`img/stage-${sp0.id}.webp`), label: 'A 3D hamster on paper bedding next to a food dish' })}
</section>

<section class="wrap block scale-strip" aria-labelledby="scale-h">
  <h2 id="scale-h">How to read a verdict</h2>
  <ol class="scale">${VERDICT_ORDER.map((s) => `<li class="scale__item scale__item--${s}">${pill(s)}<p>${esc(VERDICTS[s].scale)}</p></li>`).join('')}</ol>
  <p class="muted">This is the <a href="${url('feeding-scale/')}">JOMIZOO Feeding Scale</a>. Where reputable sources disagree, we pick the more cautious level.</p>
</section>

<section class="wrap block" aria-labelledby="all-h">
  <div class="grid-head">
    <h2 id="all-h">All ${data.foods.length} foods for <span data-species-name>${esc(sp0.plural)}</span></h2>
    <div class="filters" role="group" aria-label="Filter by category">
      <button type="button" class="chip is-on" data-cat="all">All</button>
      ${data.categories.map((c) => `<button type="button" class="chip" data-cat="${c.id}">${esc(c.name)}</button>`).join('')}
    </div>
  </div>
  <div class="cards" data-grid>
    ${data.foods.map((f) => foodCard(f, sp0, f.verdicts[sp0.id])).join('\n    ')}
  </div>
</section>

<section class="wrap block trust" aria-labelledby="trust-h">
  <h2 id="trust-h">Why you can trust these answers</h2>
  <div class="trust__grid">
    <div><h3>Every verdict is sourced</h3><p>Each answer links to the veterinary and animal-welfare sources it is based on, and says openly when a verdict is reasoned from general principles instead.</p></div>
    <div><h3>Cautious by design</h3><p>When good sources disagree, we choose the safer rating. Portions are given for the smallest common body size of each species.</p></div>
    <div><h3>Open and correctable</h3><p>The full dataset is free to reuse under CC BY 4.0, and anyone can <a href="${SITE.repo}/issues">report a mistake on GitHub</a>.</p></div>
    <div><h3>Made by pet people</h3><p>${esc(BRAND.about)} <a href="${url('about/')}">Why we built this</a>.</p></div>
  </div>
</section>
<script type="application/json" id="food-index">${JSON.stringify({ base: BASE, species, foods: index }).replace(/</g, '\\u003c')}</script>`;

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
