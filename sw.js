const CACHE = 'solvo-v3'; // подняли версию
const ASSETS = [
  './',
  './index.html',
  './app.html',
  './tasks.html',
  './focus.html',
  './calendar.html',
  './projects.html',
  './habits.html',
  './mood.html',
  './stoic.html',
  './someday.html',
  './stories.html',
  './settings.html',
  './css/styles.css',
  './manifest.webmanifest',
  './assets/icon.svg'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
  );
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(resp => resp || fetch(e.request))
  );
});
