// لعبة ناصر — offline cache
const CACHE = 'nasser-v2';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png',
  './Reference/back.png',
  './Reference/front.png',
  './Reference/side.png',
  './songs/ya-marhaba.m4a',
  './songs/ya-marhaba.ogg',
  'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// the page itself is network-first (updates land immediately, cache is the offline fallback);
// heavy static assets are cache-first with background fill
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const wantsHTML = e.request.mode === 'navigate' ||
    (e.request.headers.get('accept') || '').includes('text/html');
  if (wantsHTML){
    e.respondWith(
      fetch(e.request).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
        return res;
      }).catch(() =>
        caches.match(e.request, {ignoreSearch: true}).then(h => h || caches.match('./index.html'))
      )
    );
    return;
  }
  e.respondWith(
    caches.match(e.request, {ignoreSearch: true}).then(hit => hit || fetch(e.request).then(res => {
      if (res.ok && (e.request.url.startsWith(self.location.origin) || e.request.url.includes('jsdelivr'))){
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
      }
      return res;
    }))
  );
});
