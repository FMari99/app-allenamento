import { createHash } from 'node:crypto'
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

// Elenco chiuso dei soli file statici: nessun endpoint API o dato personale in cache.
export function localPwa() {
  return {
    name: 'allenamento-pwa',
    apply: 'build',
    writeBundle(options) {
      const directory = options.dir
      function list(folder, prefix = '') {
        return readdirSync(folder, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? list(join(folder, entry.name), prefix + entry.name + '/') : [prefix + entry.name])
      }
      const files = list(directory).filter(file => file !== 'sw.js')
      const hash = createHash('sha256').update(localPwa.toString())
      files.forEach(file => hash.update(file).update(readFileSync(join(directory, file))))
      const version = hash.digest('hex').slice(0, 16)
      writeFileSync(join(directory, 'sw.js'), `
const FILES = ${JSON.stringify(files)};
const ROOT = self.registration.scope;
const URLS = FILES.map(file => new URL(file, ROOT).href);
const PREFIX = 'allenamento-static-' + new URL(ROOT).pathname + '-';
const CACHE = PREFIX + '${version}';
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
`)
    },
  }
}
