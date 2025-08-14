
// sw.js — ListaCompras (forçar atualização e não interceptar Firebase)
const SW_VERSION = 'lc-v5';
const RUNTIME_CACHE = `runtime-${SW_VERSION}`;

// Faz o SW assumir controle imediatamente
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => {
      if (!k.includes(SW_VERSION)) return caches.delete(k);
    }));
    await self.clients.claim();
  })());
});

// Helper: não cachear chamadas do Firebase (auth, database, storage)
function isFirebase(url) {
  return /(firebaseio\.com|googleapis\.com|gstatic\.com|firebasestorage\.googleapis\.com|firebasestorage\.app)/.test(url);
}

// Estratégia:
// - Navegação (index.html e rotas): network-first (cai no cache só se offline)
// - Demais GETs: stale-while-revalidate
// - Nunca interceptar métodos não-GET ou URLs do Firebase
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Não mexe em POST/PUT/DELETE/etc. (ex.: upload de imagem)
  if (req.method !== 'GET') return;

  // Não cachear chamadas do Firebase (especialmente upload)
  if (isFirebase(req.url)) return;

  // Navegação (páginas)
  const isNavigate = req.mode === 'navigate' || (req.destination === '' && req.headers.get('accept')?.includes('text/html'));
  if (isNavigate) {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(req);
          const cache = await caches.open(RUNTIME_CACHE);
          cache.put(req, fresh.clone());
          return fresh;
        } catch (e) {
          const cache = await caches.open(RUNTIME_CACHE);
          const cached = await cache.match(req);
          return cached || caches.match('/index.html');
        }
      })()
    );
    return;
  }

  // Outros GETs (CSS/JS/PNG etc.): stale-while-revalidate
  event.respondWith(
    (async () => {
      const cache = await caches.open(RUNTIME_CACHE);
      const cached = await cache.match(req);
      const fetchPromise = fetch(req).then((networkResp) => {
        cache.put(req, networkResp.clone());
        return networkResp;
      }).catch(() => cached);
      return cached || fetchPromise;
    })()
  );
});
