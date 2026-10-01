import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve, join, relative } from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const dist = resolve(root, 'dist');
for (const file of ['index.html', 'crm/index.html', 'dash/index.html', 'dash/design.css', 'dash/design.js', 'loja/index.html', 'loja/blog/index.html', 'loja/assets/blog-editorial.css', 'loja/assets/article-editorial.css', 'loja/blog/images/islandia-aurora.jpg', 'loja/blog/images/islandia-cascata.jpg', 'loja/blog/images/noruega-geiranger.jpg', 'loja/blog/images/noruega-lofoten.jpg', 'loja/blog/images/finlandia-oulanka.jpg', 'loja/blog/images/laponia-inverno.jpg']) {
  assert(existsSync(join(dist, file)), `Arquivo ausente no build: ${file}`);
}
function inspect(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const file = join(directory, entry.name);
    assert(!/^(?:\.env(?:\..*)?|\.dev\.vars(?:\..*)?|\.git|node_modules|functions|migrations|config|wrangler\..*)$/.test(entry.name), `Arquivo privado no build: ${relative(dist, file)}`);
    if (entry.isDirectory()) inspect(file);
  }
}
inspect(dist);
const html = readFileSync(join(dist, 'index.html'), 'utf8');
assert(!html.includes('/src/main.tsx'), 'A landing não foi compilada.');
for (const [, asset] of html.matchAll(/(?:src|href)="(\/assets\/[^"?#]+)"/g)) {
  assert(existsSync(join(dist, asset.slice(1))), `Asset ausente: ${asset}`);
}
for (const file of ['crm/index.html', 'dash/index.html', 'dash/design.css', 'dash/design.js']) {
  assert(readFileSync(join(dist, file)).equals(readFileSync(join(root, 'public', file))), `Cópia divergente: ${file}`);
}
console.log('Build validado: landing, CRM, dashboard, loja e blog; sem arquivos privados.');

assert(!existsSync(join(dist, "lp")), "public/lp não faz parte desta Matrix.");
