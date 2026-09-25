// Static site build: data/*.json + src/ → dist/
import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, existsSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { createHash } from 'node:crypto';
import * as esbuild from 'esbuild';
import { SITE, SITE_URL, BASE, BRAND, VERDICTS } from './site.config.mjs';
import * as T from './templates.mjs';
import { validate } from './validate.mjs';

const root = new URL('..', import.meta.url).pathname;
const dist = join(root, 'dist');
const read = (p) => JSON.parse(readFileSync(join(root, p), 'utf8'));
const write = (p, content) => {
  const f = join(dist, p);
  mkdirSync(dirname(f), { recursive: true });
  writeFileSync(f, content);
};

const data = read('data/foods.json');
const sourcesArr = read('data/sources.json');
const sources = Object.fromEntries(sourcesArr.map((s) => [s.id, s]));
const nutrition = read('data/nutrition.json').foods;
const speciesMeta = read('data/species.json');
const emergency = existsSync(join(root, 'data/emergency.json')) ? read('data/emergency.json') : [];
data.species = data.species.map((s) => ({ ...s, ...speciesMeta[s.id] }));

const errors = validate(data, sources);
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });

// ── bundle JS + CSS with content hashes ──
const result = await esbuild.build({
  entryPoints: { app: join(root, 'src/main.js'), styles: join(root, 'src/styles.css') },
  bundle: true,
  splitting: true,
  format: 'esm',
  minify: true,
  target: ['es2020', 'safari15'],
  outdir: join(dist, 'assets'),
  entryNames: '[name]-[hash]',
  chunkNames: 'chunk-[hash]',
  metafile: true,
  legalComments: 'none',
});
const outputs = Object.entries(result.metafile.outputs);
const findOut = (entry) => outputs.find(([, o]) => o.entryPoint?.endsWith(entry))[0].replace(/^.*?dist\//, '');
const assets = { js: findOut('src/main.js'), css: findOut('src/styles.css') };

// ── static files ──
cpSync(join(root, 'public'), dist, { recursive: true });
writeFileSync(join(dist, '.nojekyll'), '');

// ── pages ──
const ctx = { data, sources, nutrition, assets, emergency, stats: {} };
const pages = [];
const page = (path, html, priority = 0.6) => {
  write(path.endsWith('.html') ? path : path + 'index.html', html);
  if (!path.endsWith('404.html')) pages.push({ path, priority });
};

// data downloads first (so the data page can show sizes)
const dataOut = {
  name: 'Can My Pet Eat This? — small-pet food safety dataset',
  publisher: BRAND.name,
  url: SITE_URL + '/',
  license: 'CC-BY-4.0',
  attribution: `JOMIZOO, "Can My Pet Eat This?" (${SITE_URL}/), CC BY 4.0`,
  version: data.version,
  published: data.published,
  updated: data.updated,
  scale: Object.fromEntries(Object.entries(VERDICTS).map(([k, v]) => [k, v.scale])),
  species: data.species.map(({ id, name, plural, aka }) => ({ id, name, plural, aka })),
  categories: data.categories,
  foods: data.foods.map((f) => ({
    ...f,
    usdaFdcId: nutrition[f.id]?.fdcId ?? null,
    urls: Object.fromEntries(data.species.map((sp) => [sp.id, T.abs(T.foodPath(sp, f))])),
  })),
};
const json = JSON.stringify(dataOut, null, 2);
write('data/foods.json', json);
write('data/sources.json', JSON.stringify(sourcesArr, null, 2));
write('data/nutrition.json', readFileSync(join(root, 'data/nutrition.json')));
const csvCols = ['food_id', 'food', 'category', 'species', 'status', 'short', 'portion', 'frequency', 'prep', 'benefits', 'risks', 'dwarf', 'if_eaten', 'evidence', 'confidence', 'source_urls', 'url'];
const csvEsc = (v) => {
  const s = Array.isArray(v) ? v.join(' | ') : v == null ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const csvRows = [csvCols.join(',')];
for (const f of data.foods) for (const sp of data.species) {
  const v = f.verdicts[sp.id];
  csvRows.push([f.id, f.name, f.category, sp.id, v.status, v.short, v.portion, v.frequency, v.prep, v.benefits, v.risks, v.dwarf, v.ifEaten, v.evidence, v.confidence, (v.sources ?? []).map((id) => sources[id]?.url), T.abs(T.foodPath(sp, f))].map(csvEsc).join(','));
}
const csv = csvRows.join('\n') + '\n';
write('data/verdicts.csv', csv);
ctx.stats = {
  verdicts: data.foods.length * data.species.length,
  sources: sourcesArr.length,
  kbJson: Math.round(Buffer.byteLength(json) / 1024),
  kbCsv: Math.round(Buffer.byteLength(csv) / 1024),
};

page('', T.homePage(ctx), 1.0);
for (const sp of data.species) {
  page(T.speciesPath(sp), T.speciesPage(ctx, sp), 0.9);
  for (const f of data.foods) page(T.foodPath(sp, f), T.foodPage(ctx, f, sp), 0.7);
}
page('feeding-scale/', T.scalePage(ctx), 0.6);
page('data/', T.dataPage(ctx), 0.6);
page('about/', T.aboutPage(ctx), 0.4);
page('emergency/', T.emergencyPage(ctx), 0.6);
page('404.html', T.notFoundPage(ctx));

// ── sitemap, robots, llms.txt ──
write(
  'sitemap.xml',
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map((p) => `  <url><loc>${T.abs(p.path)}</loc><lastmod>${data.updated}</lastmod><priority>${p.priority}</priority></url>`).join('\n')}
</urlset>
`
);
write(
  'robots.txt',
  `# Everyone is welcome, including AI crawlers. The data is CC BY 4.0.
User-agent: *
Allow: /

User-agent: GPTBot
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: Claude-SearchBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml
`
);

const sp = data.species;
const q = (f) => T.foodQ(f);
write(
  'llms.txt',
  `# ${SITE.name}

> Free, sourced food-safety answers for pet hamsters, budgies (budgerigars/parakeets) and cockatiels: ${data.foods.length} foods × ${sp.length} species = ${ctx.stats.verdicts} verdicts on the four-level JOMIZOO Feeding Scale (yes / small amounts / better not / never), each with portion, frequency, preparation, risks, sources, evidence type and confidence. Made by ${BRAND.name} (${BRAND.url}), a small-pet brand. Data licensed CC BY 4.0.

Key facts:
- The JOMIZOO Feeding Scale: "yes" = ${VERDICTS.yes.scale} "limit" (small amounts) = ${VERDICTS.limit.scale} "avoid" (better not) = ${VERDICTS.avoid.scale} "no" (never) = ${VERDICTS.no.scale}
- When reputable sources disagree, the more cautious rating is used.
- Nutrient values per 100 g come from USDA FoodData Central (SR Legacy).

## Guides
${sp.map((s) => `- [What can ${s.plural} eat?](${T.abs(T.speciesPath(s))}): all ${data.foods.length} foods rated for ${s.plural}`).join('\n')}
- [The JOMIZOO Feeding Scale](${T.abs('feeding-scale/')}): how verdicts are made
- [Emergency: my pet ate something toxic](${T.abs('emergency/')})

## Data
- [foods.json](${T.abs('data/foods.json')}): full dataset
- [verdicts.csv](${T.abs('data/verdicts.csv')}): one row per food × species
- [Full text of every verdict](${T.abs('llms-full.txt')})

## Never feed (toxic or dangerous)
${sp.map((s) => `- ${s.plural}: ${data.foods.filter((f) => f.verdicts[s.id].status === 'no').map((f) => f.name).join(', ')}`).join('\n')}

## Optional
- [About JOMIZOO](${T.abs('about/')})
- [Source code (MIT)](${SITE.repo})
`
);
write(
  'llms-full.txt',
  `# ${SITE.name} — all verdicts
Source: JOMIZOO, "${SITE.name}" (${SITE_URL}/). License: CC BY 4.0. Updated ${data.updated}.
Scale: yes = safe in normal portions; limit = small amounts only; avoid = better not (unsuitable, not acutely toxic); no = never (toxic or dangerous).

${data.foods
  .map((f) =>
    sp
      .map((s) => {
        const v = f.verdicts[s.id];
        return `## Can ${s.plural} eat ${q(f)}? — ${v.status}
${v.short}
${v.portion ? `Portion: ${v.portion}\n` : ''}${v.frequency ? `How often: ${v.frequency}\n` : ''}${v.dwarf ? `Dwarf hamsters: ${v.dwarf}\n` : ''}${v.prep?.length ? `Preparation: ${v.prep.join('; ')}\n` : ''}Risks: ${v.risks}
${v.ifEaten ? `If eaten: ${v.ifEaten}\n` : ''}Sources: ${(v.sources ?? []).map((id) => sources[id]?.url).filter(Boolean).join(' ; ')}
URL: ${T.abs(T.foodPath(s, f))}
`;
      })
      .join('\n')
  )
  .join('\n')}`
);

const size = (p) => (statSync(join(dist, p)).size / 1024).toFixed(0) + ' KB';
console.log(`Built ${pages.length} pages → dist/  (base ${BASE})`);
console.log(`  app ${size(assets.js)}, css ${size(assets.css)}, chunks: ${outputs.filter(([k]) => k.includes('chunk-')).map(([k]) => size(k.replace(/^.*?dist\//, ''))).join(', ')}`);
