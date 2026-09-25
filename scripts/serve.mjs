// Tiny static server for dist/, mounted at the same base path as GitHub Pages.
import { createServer } from 'node:http';
import { readFileSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { BASE } from './site.config.mjs';

const dist = new URL('../dist', import.meta.url).pathname;
const port = Number(process.env.PORT) || 4173;
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.csv': 'text/csv; charset=utf-8', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml', '.svg': 'image/svg+xml',
  '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png',
};

createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (p === '/' && BASE !== '/') { res.writeHead(302, { location: BASE }); return res.end(); }
  if (!p.startsWith(BASE)) { res.writeHead(404); return res.end('not found'); }
  let file = join(dist, p.slice(BASE.length));
  try { if (statSync(file).isDirectory()) file = join(file, 'index.html'); } catch {}
  try {
    res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
    res.end(readFileSync(file));
  } catch {
    res.writeHead(404, { 'content-type': TYPES['.html'] });
    res.end(readFileSync(join(dist, '404.html')));
  }
}).listen(port, () => console.log(`http://localhost:${port}${BASE}`));
