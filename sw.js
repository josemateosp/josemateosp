// Guarda la app en el aparato para que funcione sin internet.
// Con conexión, pide siempre la última versión (así los cambios llegan al abrir la app);
// sin conexión, o si la red tarda demasiado, usa la copia guardada.
const CACHE = 'salmo-v11';
const ARCHIVOS = [
  './',
  'index.html',
  'nube.js',
  'firebase.js',
  'jspdf.js',
  'manifest.webmanifest',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/maskable-512.png',
  'icons/apple-touch-icon.png'
];
const ESPERA_MAXIMA = 4000; // ms antes de recurrir a la copia guardada

self.addEventListener('install', e => {
  // cache: 'reload' evita que se guarde una versión antigua que el navegador tuviera en su caché HTTP.
  e.waitUntil(caches.open(CACHE)
    .then(c => c.addAll(ARCHIVOS.map(u => new Request(u, { cache: 'reload' }))))
    .then(() => self.skipWaiting()));
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
    // 'no-cache' pregunta al servidor si hay versión nueva (si no la hay, la respuesta es mínima).
    const red = fetch(req, { cache: 'no-cache' }).then(res => {
      if (res.ok) cache.put(req, res.clone());
      return res;
    });
    if (!guardada) return red;
    const limite = new Promise(r => setTimeout(() => r(guardada), ESPERA_MAXIMA));
    return Promise.race([red.catch(() => guardada), limite]);
  }));
});
