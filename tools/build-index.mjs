// پوشهٔ packs را می‌خواند و فهرست packs/index.json را می‌سازد.
// اجرا: node tools/build-index.mjs
// هر بستهٔ جدید فقط کافی است فایل JSON خودش را در packs بگذارد؛ این دستور فهرست را به‌روز می‌کند.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'packs');
const files = readdirSync(dir).filter(f => f.endsWith('.json') && f !== 'index.json');
const L = x => (x && typeof x === 'object') ? (x.fa ?? Object.values(x)[0] ?? '') : (x ?? '');
const packs = files.map(file => {
  const p = JSON.parse(readFileSync(join(dir, file), 'utf8'));
  if (!p.id || !Array.isArray(p.tracks)) throw new Error(`${file}: بسته باید id و tracks داشته باشد`);
  const events = p.tracks.reduce((n, t) => n + (t.events || []).length, 0);
  return { id: p.id, file, title: p.title ?? p.id, desc: p.desc ?? '', hue: p.hue ?? null,
           default: !!p.default, order: p.order ?? 999, tracks: p.tracks.length, events };
}).sort((a, b) => a.order - b.order || String(L(a.title)).localeCompare(String(L(b.title)), 'fa'));
const ids = new Set(); packs.forEach(p => { if (ids.has(p.id)) throw new Error('id تکراری: ' + p.id); ids.add(p.id); });
writeFileSync(join(dir, 'index.json'), JSON.stringify({ packs }, null, 2) + '\n');
console.log(`${packs.length} بسته در فهرست نوشته شد:`, packs.map(p => p.id + (p.default ? '*' : '')).join(' '));
