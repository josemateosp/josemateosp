// Guarda la app en el aparato para que funcione sin internet.
// Sirve siempre la copia guardada y, si hay conexión, la actualiza para la próxima vez.
const CACHE = 'salmo-v5';
const ARCHIVOS = [
  './',
  'index.html',
  'nube.js',
  'firebase.js',
  'manifest.webmanifest',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/maskable-512.png',
  'icons/apple-touch-icon.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(claves => Promise.all(claves.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(caches.open(CACHE).then(async cache => {
    const guardada = await cache.match(req, { ignoreSearch: true });
    const red = fetch(req).then(res => {
      if (res.ok) cache.put(req, res.clone());
      return res;
    }).catch(() => guardada);
    return guardada || red;
  }));
});
