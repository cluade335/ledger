// 离线缓存：装到手机后，没网也能打开记账本。
// 改了程序文件后把版本号 +1，手机下次打开时会自动更新。
const CACHE = 'ledger-v2';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-maskable-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// 先用手机里存的版本（秒开、没网也行），有网时顺便在后台更新。
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(caches.open(CACHE).then(async cache => {
    const key = req.mode === 'navigate' ? './index.html' : req;
    const cached = await cache.match(key, {ignoreSearch: true});
    const fresh = fetch(req).then(resp => {
      if (resp && resp.ok) cache.put(key, resp.clone());
      return resp;
    }).catch(() => null);
    if (cached) { e.waitUntil(fresh); return cached; }
    return (await fresh) || new Response('没有网络，且手机里还没有存好记账本。请联网后再打开一次。', {status: 503, headers: {'Content-Type': 'text/plain; charset=utf-8'}});
  }));
});
