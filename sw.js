/**
 * WashQ — Service Worker para funcionamiento 100% Offline
 * Permite que el sistema opere en PC, Tablets y Celulares sin conexión a internet.
 * Optimizado para PWA en Android (Samsung Galaxy S26 Ultra) y Chrome.
 */

const CACHE_NAME = 'washq-v5.0.0-prod';
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

// Instalación: Cachear recursos indispensables y tomar control inmediato
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
            console.log('🧹 [WashQ PWA] Eliminando caché obsoleta:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Estrategia de respuesta:
// - Para navegación (HTML): Network-First con fallback a Caché (garantiza ver cambios de inmediato en producción)
// - Para recursos estáticos (imágenes, scripts, fonts): Cache-First con actualización silenciosa en red
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Solo peticiones GET y NUNCA interceptar rutas API
  if (req.method !== 'GET' || req.url.includes('/api/')) return;

  // Navegación (HTML principal): Network-First
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

  // Recursos estáticos: Cache-First con revalidación en segundo plano
  event.respondWith(
    caches.match(req).then((cachedResponse) => {
      if (cachedResponse) {
        fetch(req).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(req, networkResponse));
          }
        }).catch(() => {/* Modo offline silencioso */});

        return cachedResponse;
      }

      // Si no está en caché, traer de la red y guardar copia
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
        return caches.match('/') || caches.match('/index.html');
      });
    })
  );
});
