
const CACHE = 'vocabulary-rain-v12';

const CORE = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './config.js',
  './data/vocabulary.json',
  './manifest.webmanifest'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(CORE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key.startsWith('vocabulary-rain-') && key !== CACHE)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== 'GET' || url.origin !== self.location.origin) {
    return;
  }

  event.respondWith((async () => {
    const cached = await caches.match(request);

    if (cached) return cached;

    try {
      const response = await fetch(request);

      if (response.ok && CORE.some(path =>
        url.pathname.endsWith(path.replace('./', ''))
      )) {
        const copy = response.clone();

        event.waitUntil(
          caches.open(CACHE)
            .then(cache => cache.put(request, copy))
            .catch(() => {})
        );
      }

      return response;
    } catch (error) {
      const fallback = await caches.match('./index.html');

      if (fallback) return fallback;

      return new Response('Bạn đang offline và nội dung chưa được lưu cache.', {
        status: 503,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
      });
    }
  })());
});
