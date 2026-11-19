/**
 * WashQ / KodiQuett — Service Worker para funcionamiento 100% Offline
 * Permite que el sistema opere en PC, Tablets y Celulares sin conexión a internet.
 * Optimizado para PWA en Android (Samsung Galaxy S26 Ultra) y Chrome.
 */

// ============================================================================
// BYPASS EN DESARROLLO LOCAL: NUNCA CACHEAR EN LOCALHOST NI 127.0.0.1
// ============================================================================
const isLocalhost = Boolean(
  self.location.hostname === 'localhost' ||
  self.location.hostname === '127.0.0.1' ||
  self.location.hostname === '[::1]' ||
  self.location.protocol === 'file:'
);

if (isLocalhost) {
  // En desarrollo local, omitir completamente el Service Worker para reflejar cambios al instante
  self.addEventListener('install', () => self.skipWaiting());
  self.addEventListener('activate', (event) => {
    event.waitUntil(
      caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
        .then(() => self.clients.claim())
    );
  });
  self.addEventListener('fetch', (event) => {
    // Pasar directo a la red sin interceptar
    event.respondWith(fetch(event.request));
  });
} else {
  // Configuración de Producción PWA Offline
  const CACHE_NAME = 'washq-v5.3.1-kodiquett';
  const CORE_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/css/main.css',
    '/js/config.js',
    '/js/utils.js',
    '/js/state.js',
    '/js/views/overview.js',
    '/js/views/patio.js',
    '/js/views/caja.js',
    '/js/views/comisiones.js',
    '/js/views/historial.js',
    '/js/views/settings.js',
    '/js/components/orders.js',
    '/js/components/pos-ticket.js',
    '/js/components/modals.js',
    '/js/app.js',
    '/assets/icon-192.png',
    '/assets/icon-512.png',
    '/assets/icon-maskable-192.png',
    '/assets/icon-maskable-512.png',
    '/assets/apple-touch-icon.png',
    '/assets/xlsx.full.min.js'
  ];

  self.addEventListener('install', (event) => {
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => {
        console.log('⚡ [WashQ PWA] Precargando núcleo modular ' + CACHE_NAME);
        return cache.addAll(CORE_ASSETS);
      }).then(() => self.skipWaiting())
    );
  });

  self.addEventListener('activate', (event) => {
    event.waitUntil(
      caches.keys().then((keys) => {
        return Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME) {
              console.log('🧹 [WashQ PWA] Eliminando caché obsoleta:', key);
              return caches.delete(key);
            }
          })
        );
      }).then(() => self.clients.claim())
    );
  });

  self.addEventListener('fetch', (event) => {
    const req = event.request;
    if (req.method !== 'GET' || req.url.includes('/api/')) return;

    if (req.mode === 'navigate' || req.destination === 'document') {
      event.respondWith(
        fetch(req)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const copy = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
            }
            return networkResponse;
          })
          .catch(() => caches.match(req).then((cached) => cached || caches.match('/index.html') || caches.match('/')))
      );
      return;
    }

    event.respondWith(
      caches.match(req).then((cachedResponse) => {
        if (cachedResponse) {
          fetch(req).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => cache.put(req, networkResponse));
            }
          }).catch(() => {});
          return cachedResponse;
        }

        return fetch(req).then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type === 'opaque') {
            return networkResponse;
          }
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            if (req.url.startsWith('http') || req.url.startsWith('https')) {
              cache.put(req, responseToCache);
            }
          });
          return networkResponse;
        }).catch(() => caches.match('/') || caches.match('/index.html'));
      })
    );
  });
}
