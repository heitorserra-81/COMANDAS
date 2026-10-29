// Service worker: deixa o app abrir sem internet. Rede primeiro (sempre pega a versão mais nova); sem rede, usa o cache.
const CACHE = 'comandas-v1';   // troque para v2, v3... quando publicar uma atualização
const ARQUIVOS = ['./', 'index.html', 'css/style.css', 'js/app.js', 'js/pwa.js', 'js/firebase.js', 'js/firebase-config.js',
  'assets/comanda.webp', 'assets/icons/icon-192.png', 'assets/icons/icon-512.png', 'manifest.webmanifest'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARQUIVOS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;   // Firebase e outros sites passam direto
  e.respondWith(fetch(r).then(res => {
    if (res.ok) { const copia = res.clone(); caches.open(CACHE).then(c => c.put(r, copia)); }
    return res;
  }).catch(() => caches.match(r).then(m => m || (r.mode === 'navigate' ? caches.match('index.html') : undefined))));
});
