// Service worker minimal : rend Tipote installable comme une appli.
// Il laisse passer toutes les requêtes (pas de cache hors ligne pour l'instant).
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {});
