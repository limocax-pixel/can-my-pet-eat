// Renders public/img/foods/*.webp, public/img/stage-*.webp and public/img/og/*.jpg
// with headless Chrome (needs Google Chrome installed). Run after changing
// models or verdicts:  npm run thumbs
import { createServer } from 'node:http';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { join, extname } from 'node:path';
import { tmpdir } from 'node:os';
import * as esbuild from 'esbuild';
import { chromium } from 'playwright-core';

const root = new URL('..', import.meta.url).pathname;
const pub = join(root, 'public/img');
const data = JSON.parse(readFileSync(join(root, 'data/foods.json')));
const only = process.argv.slice(2);
const want = (k) => !only.length || only.includes(k);

const tmp = mkdtempSync(join(tmpdir(), 'cmpet-'));
await esbuild.build({ entryPoints: [join(root, 'tools/render-entry.js')], bundle: true, format: 'esm', outfile: join(tmp, 'render.js'), logLevel: 'error' });
writeFileSync(join(tmp, 'render.html'), readFileSync(join(root, 'tools/render.html')));
const types = { '.html': 'text/html', '.js': 'text/javascript', '.webp': 'image/webp' };
const server = createServer((req, res) => {
  const p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  const file = p.startsWith('/img/') ? join(pub, p.slice(5)) : join(tmp, p);
  let body;
  try { body = readFileSync(file); } catch { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': types[extname(file)] ?? 'application/octet-stream' });
  res.end(body);
}).listen(0);
const origin = `http://localhost:${server.address().port}`;

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ deviceScaleFactor: 1 });
page.on('pageerror', (e) => console.error('pageerror', e.message));
const save = (file, dataUrl) => writeFileSync(file, Buffer.from(dataUrl.split(',')[1], 'base64'));

if (want('foods')) {
  mkdirSync(join(pub, 'foods'), { recursive: true });
  await page.goto(`${origin}/render.html?mode=thumbs`);
  await page.waitForSelector('body[data-ready]');
  for (const f of data.foods) save(join(pub, 'foods', f.id + '.webp'), await page.evaluate((id) => window.renderThumb(id), f.id));
  console.log(`foods: ${data.foods.length} thumbnails`);
}

const heroFood = { hamster: 'apple', budgie: 'broccoli', cockatiel: 'broccoli' };
if (want('stage')) {
  for (const sp of data.species) {
    const food = data.foods.find((f) => f.id === heroFood[sp.id]);
    await page.goto(`${origin}/render.html?mode=stage&species=${sp.id}&food=${food.id}&v=${food.verdicts[sp.id].status}&w=880&h=600`);
    await page.waitForSelector('body[data-ready]');
    await page.waitForTimeout(2600);
    save(join(pub, `stage-${sp.id}.webp`), await page.evaluate(() => window.snapshot()));
  }
  console.log('stage posters: done');
}

if (want('og')) {
  mkdirSync(join(pub, 'og'), { recursive: true });
  await page.setViewportSize({ width: 1200, height: 630 });
  const LABEL = { yes: 'Yes', limit: 'Small amounts', avoid: 'Better not', no: 'Never' };
  const esc = (s) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);
  const card = (title, rows, img) => `<div class="og-card"><div><h1>${esc(title)}</h1><ul>${rows}</ul></div><img src="${img}"></div><div class="brand"><b>Can My Pet Eat This?</b> · free &amp; sourced · by JOMIZOO</div>`;
  await page.goto(`${origin}/render.html`);
  for (const f of data.foods) {
    const rows = data.species.map((sp) => { const s = f.verdicts[sp.id].status; return `<li><b>${sp.name}</b><span class="pill ${s}"><i></i>${LABEL[s]}</span></li>`; }).join('');
    const q = f.slug.replace(/-/g, ' ');
    await page.evaluate((html) => { document.body.className = 'og'; document.body.innerHTML = html; }, card(`Can my pet eat ${q}?`, rows, `/img/foods/${f.id}.webp`));
    await page.waitForFunction(() => [...document.images].every((i) => i.complete));
    await page.screenshot({ path: join(pub, 'og', f.id + '.jpg'), type: 'jpeg', quality: 82 });
  }
  const counts = (sp) => ['yes', 'limit', 'avoid', 'no'].map((s) => `<li><span class="pill ${s}"><i></i>${LABEL[s]}</span> ${data.foods.filter((f) => f.verdicts[sp.id].status === s).length} foods</li>`).join('');
  for (const sp of data.species) {
    await page.evaluate((html) => { document.body.className = 'og'; document.body.innerHTML = html; }, card(`What can ${sp.plural} eat?`, counts(sp), `/img/stage-${sp.id}.webp`));
    await page.waitForFunction(() => [...document.images].every((i) => i.complete));
    await page.screenshot({ path: join(pub, 'og', sp.id + '.jpg'), type: 'jpeg', quality: 82 });
  }
  const rows = `<li>🐹&nbsp;Hamsters</li><li>🦜&nbsp;Budgies &amp; cockatiels</li><li>${data.foods.length} foods · ${data.foods.length * data.species.length} verdicts</li>`;
  await page.evaluate((html) => { document.body.className = 'og'; document.body.innerHTML = html; }, card('Can my pet eat this?', rows, '/img/stage-hamster.webp'));
  await page.waitForFunction(() => [...document.images].every((i) => i.complete));
  await page.screenshot({ path: join(pub, 'og', 'default.jpg'), type: 'jpeg', quality: 82 });
  console.log(`og: ${data.foods.length + data.species.length + 1} images`);
}

await browser.close();
server.close();
rmSync(tmp, { recursive: true, force: true });
