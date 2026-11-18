/* Dialed-verse service worker: precache the app shell + all game chunks, network-first for navigations. */
self.__PRECACHE__ = [];
const CACHE = 'dv-__VERSION__';

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(self.__PRECACHE__)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).catch(() => caches.match('/', { ignoreSearch: true })));
    return;
  }
  if (url.origin === location.origin || url.host.includes('fonts.g')) {
    e.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => {
        if (res.ok && (url.origin === location.origin || res.type === 'cors' || res.type === 'opaque')) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      })),
    );
  }
});
