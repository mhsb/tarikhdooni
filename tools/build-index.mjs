// پوشهٔ packs را می‌خواند و فهرست packs/index.json را می‌سازد.
// اجرا: node tools/build-index.mjs
// هر بستهٔ جدید فقط کافی است فایل JSON خودش را در packs بگذارد؛ این دستور فهرست را به‌روز می‌کند.
// پروفایل‌ها در packs/profiles.json تعریف می‌شوند و هر بسته با فیلد "profiles":[...] به آن‌ها می‌پیوندد.
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'packs');
const files = readdirSync(dir).filter(f => f.endsWith('.json') && f !== 'index.json' && f !== 'profiles.json');
const L = x => (x && typeof x === 'object') ? (x.fa ?? Object.values(x)[0] ?? '') : (x ?? '');
const packs = [], members = {};
for (const file of files) {
  let p;
  try { p = JSON.parse(readFileSync(join(dir, file), 'utf8')); }
  catch (e) { console.log(`::warning file=packs/${file}::JSON معتبر نیست و نادیده گرفته شد: ${e.message}`); continue; }
  if (!p.id || !Array.isArray(p.tracks)) { console.log(`::warning file=packs/${file}::بسته باید id و tracks داشته باشد و نادیده گرفته شد`); continue; }
  const events = p.tracks.reduce((n, t) => n + (t.events || []).length, 0);
  packs.push({ id: p.id, file, title: p.title ?? p.id, desc: p.desc ?? '', hue: p.hue ?? null, calendar: p.calendar ?? null,
    review: p.review ? { status: p.review.status ?? 'draft', by: p.review.by ?? null } : null,
    default: !!p.default, order: p.order ?? 999, tracks: p.tracks.length, events,
    replaces: Array.isArray(p.replaces) ? p.replaces : undefined,
    profiles: Array.isArray(p.profiles) ? p.profiles : undefined });
}
packs.sort((a, b) => a.order - b.order || String(L(a.title)).localeCompare(String(L(b.title)), 'fa'));
const ids = new Set(); packs.forEach(p => { if (ids.has(p.id)) throw new Error('id تکراری: ' + p.id); ids.add(p.id); });
packs.forEach(p => (p.profiles || []).forEach(k => (members[k] ||= []).push(p.id)));
const pf = join(dir, 'profiles.json');
const defs = existsSync(pf) ? JSON.parse(readFileSync(pf, 'utf8')) : [];
const profiles = defs.filter(d => d.id && (members[d.id] || []).length).map(d => ({ id: d.id, title: d.title ?? d.id, icon: d.icon ?? '', desc: d.desc ?? '', packs: members[d.id] }));
const known = new Set(defs.map(d => d.id));
Object.keys(members).filter(k => !known.has(k)).forEach(k => console.log(`::warning::پروفایل «${k}» در packs/profiles.json تعریف نشده و نادیده گرفته شد`));
writeFileSync(join(dir, 'index.json'), JSON.stringify({ packs, profiles }, null, 2) + '\n');
console.log(`${packs.length} بسته و ${profiles.length} پروفایل در فهرست نوشته شد:`, packs.map(p => p.id + (p.default ? '*' : '')).join(' '));
