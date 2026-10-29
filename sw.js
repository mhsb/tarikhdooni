/* تاریخ‌دونی: کار بدون اینترنت. شمارهٔ نسخه هنگام ساخت عوض می‌شود. */
const VERSION = 'e203b988';
const CACHE = 'tarikhdooni-' + VERSION;
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png', 'packs/index.json'];

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await c.addAll(SHELL);
    try {                                   // همهٔ بسته‌ها را هم نگه می‌داریم تا نصب بسته‌ها بدون اینترنت هم کار کند
      const idx = await (await fetch('packs/index.json', { cache: 'no-cache' })).json();
      await Promise.all(idx.packs.map(p => c.add('packs/' + p.file).catch(() => {})));
    } catch (_) {}
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k.startsWith('tarikhdooni-') && k !== CACHE) await caches.delete(k);
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const same = url.origin === self.location.origin;
  const font = /(^|\.)fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  if (!same && !font) return;
  e.respondWith((async () => {
    const c = await caches.open(CACHE);
    const hit = await c.match(req, { ignoreSearch: true });
    const net = fetch(req).then(r => { if (r && (r.ok || r.type === 'opaque')) c.put(req, r.clone()); return r; }).catch(() => null);
    if (hit) { e.waitUntil(net); return hit; }      // اول حافظه، پشت‌صحنه تازه می‌شود
    const r = await net;
    if (r) return r;
    if (req.mode === 'navigate') return (await c.match('index.html')) || (await c.match('./'));
    return new Response('', { status: 504 });
  })());
});
