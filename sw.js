/**
 * WashQ — Service Worker para funcionamiento 100% Offline
 * Permite que el sistema opere en PC, Tablets y Celulares sin conexión a internet.
 * Optimizado para PWA en Android (Samsung Galaxy S26 Ultra) y Chrome.
 */

const CACHE_NAME = 'washq-v4.3.0-s26';
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/dashboard.html',
  '/manifest.json',
  '/assets/icon-192.png',
  '/assets/icon-512.png',
  '/assets/icon-maskable-192.png',
  '/assets/icon-maskable-512.png',
  '/assets/apple-touch-icon.png',
  '/assets/xlsx.full.min.js'
];

// Instalación: Cachear recursos indispensables
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('⚡ [WashQ PWA] Precargando núcleo offline ' + CACHE_NAME);
      return cache.addAll(CORE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activación: Limpieza inmediata de versiones viejas de caché
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('🧹 [WashQ PWA] Eliminando caché anterior:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Estrategia de respuesta:
// - Para navegación (HTML): Network-First con fallback a Caché (garantiza ver cambios online sin perder soporte offline)
// - Para recursos estáticos (imágenes, scripts, fonts): Cache-First con Network Fallback
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Solo peticiones GET
  if (req.method !== 'GET') return;

  // Navegación (HTML principal)
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
        .catch(() => {
          return caches.match(req).then((cached) => {
            return cached || caches.match('/index.html') || caches.match('/');
          });
        })
    );
    return;
  }

  // Recursos estáticos: Cache-First con actualización silenciosa en segundo plano
  event.respondWith(
    caches.match(req).then((cachedResponse) => {
      if (cachedResponse) {
        // En segundo plano revalida si hay red
        fetch(req).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(req, networkResponse));
          }
        }).catch(() => {/* Silencioso si no hay red */});

        return cachedResponse;
      }

      // Si no está en caché, buscar en red y guardar copia
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
      }).catch(() => {
        // Fallback offline universal para navegación
        return caches.match('/') || caches.match('/index.html');
      });
    })
  );
});
