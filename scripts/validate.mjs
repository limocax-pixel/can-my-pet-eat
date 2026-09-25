// Data checks. Run on every build and in CI (npm run check).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const STATUSES = new Set(['yes', 'limit', 'avoid', 'no']);
const EVIDENCE = new Set(['direct', 'inferred']);
const CONFIDENCE = new Set(['high', 'medium', 'low']);

export function validate(data, sources) {
  const errors = [];
  const err = (m) => errors.push('✗ ' + m);
  const ids = new Set(), slugs = new Set();
  const cats = new Set(data.categories.map((c) => c.id));
  for (const f of data.foods) {
    if (ids.has(f.id)) err(`duplicate food id ${f.id}`);
    if (slugs.has(f.slug)) err(`duplicate slug ${f.slug}`);
    ids.add(f.id); slugs.add(f.slug);
    if (!cats.has(f.category)) err(`${f.id}: unknown category ${f.category}`);
    for (const sp of data.species) {
      const v = f.verdicts?.[sp.id];
      const at = `${f.id}/${sp.id}`;
      if (!v) { err(`${at}: missing verdict`); continue; }
      if (!STATUSES.has(v.status)) err(`${at}: bad status ${v.status}`);
      if (!v.short || v.short.length > 260) err(`${at}: short answer missing or too long (${v.short?.length})`);
      if (!v.risks) err(`${at}: missing risks`);
      if ((v.status === 'yes' || v.status === 'limit') && (!v.portion || !v.frequency)) err(`${at}: portion/frequency required for yes/limit`);
      if (v.status === 'no' && !v.ifEaten) err(`${at}: "no" verdicts need ifEaten`);
      if (!EVIDENCE.has(v.evidence)) err(`${at}: bad evidence ${v.evidence}`);
      if (!CONFIDENCE.has(v.confidence)) err(`${at}: bad confidence ${v.confidence}`);
      if (!v.sources?.length) err(`${at}: no sources`);
      for (const s of v.sources ?? []) if (!sources[s]) err(`${at}: unknown source ${s}`);
      for (const q of v.faq ?? []) if (!q.q || !q.a) err(`${at}: incomplete faq item`);
    }
  }
  for (const s of Object.values(sources)) {
    if (!/^https:\/\//.test(s.url)) err(`source ${s.id}: url must be https`);
  }
  return errors;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const root = new URL('..', import.meta.url);
  const data = JSON.parse(readFileSync(new URL('data/foods.json', root)));
  const sources = Object.fromEntries(JSON.parse(readFileSync(new URL('data/sources.json', root))).map((s) => [s.id, s]));
  const errors = validate(data, sources);
  const n = data.foods.length * data.species.length;
  if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
  const tally = {};
  for (const f of data.foods) for (const sp of data.species) tally[f.verdicts[sp.id].status] = (tally[f.verdicts[sp.id].status] ?? 0) + 1;
  console.log(`✓ ${data.foods.length} foods × ${data.species.length} species = ${n} verdicts OK`, tally);
}
