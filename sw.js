// Service worker simples: cacheia os arquivos do jogo na instalação e serve
// do cache quando offline, com atualização em segundo plano (stale-while-revalidate).
const CACHE_NAME = 'zeco-ilha-das-gemas-v4-7-lina';
const ASSETS = [
  './',
  './index.html',
  './css/estilo.css',
  './js/jogo.js',
  './js/fases.js',
  './js/audio.js',
  './js/historia.js',
  './js/menu.js',
  './js/seletor-fases.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './assets/zeco/idle1.png',
  './assets/zeco/idle2.png',
  './assets/zeco/run1.png',
  './assets/zeco/run2.png',
  './assets/zeco/jump.png',
  './assets/zeco/attack.png',
  './assets/zeco/throw.png',
  './assets/zeco/crouch.png',
  './assets/zeco/hurt.png',
  './assets/zeco/dead.png',
  './assets/tupi/idle.png',
  './assets/tupi/talk.png',
  './assets/lina/idle.png',
  './assets/lina/talk.png',
  './assets/lina/map.png',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then(cached => {
      const fetchPromise = fetch(event.request).then(networkResp => {
        if (networkResp && networkResp.ok) {
          const clone = networkResp.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return networkResp;
      }).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
