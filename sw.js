// Service worker : rend Tipote installable comme une appli.
// Chaque fichier du jeu est redemandé au serveur (cache: 'no-cache'), pour qu'une mise à jour
// arrive dès la prochaine ouverture au lieu de rester bloquée dans le cache du téléphone.
// La dernière version reçue est gardée pour jouer hors ligne.
const CACHE = 'tipote';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    fetch(e.request, { cache: 'no-cache' })
      .then(r => {
        if (r.ok) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
        return r;
      })
      .catch(() => caches.match(e.request))
  );
});
