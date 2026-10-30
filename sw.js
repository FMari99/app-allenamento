
const FILES = ["assets/index-DMyO-khD.css","assets/index-IQu5zZLU.js","icon-192.png","icon-512.png","index.html","manifest.webmanifest"];
const ROOT = self.registration.scope;
const URLS = FILES.map(file => new URL(file, ROOT).href);
const PREFIX = 'allenamento-static-' + new URL(ROOT).pathname + '-';
const CACHE = PREFIX + '35a44db000d38c3e';
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(URLS))));
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith(PREFIX) && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim())));
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || !request.url.startsWith(ROOT)) return;
  if (request.mode === 'navigate') {
    event.respondWith(caches.open(CACHE).then(cache => cache.match(new URL('index.html', ROOT).href, { ignoreVary: true })).then(cached => cached || fetch(request))); 
  } else if (URLS.includes(request.url)) {
    // Ignore Vary only for this closed list of public same-origin static files.
    event.respondWith(caches.open(CACHE).then(cache => cache.match(request, { ignoreVary: true })).then(cached => cached || fetch(request)));
  }
});
