
// sw.js — kill switch (desativa SW antigo e não cacheia)
self.addEventListener('install', (e) => {
  self.skipWaiting();
});
self.addEventListener('activate', async (e) => {
  try {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => caches.delete(k)));
    const regs = await self.registration.unregister();
    await self.clients.claim();
  } catch (err) {}
});
self.addEventListener('fetch', (e) => {
  // passa tudo direto para a rede; sem cache
});
