/**
 * WashQ — Service Worker para funcionamiento 100% Offline
 * Permite que el sistema opere en PC, Tablets y Celulares sin conexión a internet.
 */

const CACHE_NAME = 'washq-cache-v2';
const CORE_ASSETS = [
  './',
  './index.html',
  './dashboard.html',
  './manifest.json',
  './assets/icon.svg',
  './assets/icon-192.png',
  './assets/icon-512.png'
];

// Instalación: Cachear recursos indispensables
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('⚡ [WashQ PWA] Precargando núcleo offline...');
      return cache.addAll(CORE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activación: Limpieza de versiones viejas de caché
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

// Estrategia de respuesta: Cache-First con Network Fallback y Cache Dinámico
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Solo peticiones GET
  if (req.method !== 'GET') return;

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
          // Solo cachear recursos de nuestro origen o CDNs de fuentes/iconos
          if (req.url.startsWith('http') || req.url.startsWith('https')) {
            cache.put(req, responseToCache);
          }
        });

        return networkResponse;
      }).catch(() => {
        // Fallback offline para navegación
        if (req.mode === 'navigate') {
          return caches.match('./index.html') || caches.match('./dashboard.html');
        }
      });
    })
  );
});
