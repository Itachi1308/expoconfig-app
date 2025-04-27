const CACHE_NAME = 'expoconfig-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/login.html',
  '/dashboard.html',
  '/exposiciones.html',
  '/proyectos.html',
  '/estudiantes.html',
  '/reportes.html',
  '/css/style.css',
  '/js/app.js',
  '/js/db.js',
  '/js/auth.js',
  '/js/exposiciones.js',
  '/lib/sql.js',
  '/lib/sql-wasm.wasm',
  '/expoconfig.db',
  '/partials/header.html',
  '/partials/footer.html',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .catch((error) => {
        console.error('Cache installation failed:', error);
      })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/api/')) {
    // API requests: network first, then cache
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Clone the response to cache it
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });
          return response;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
  } else {
    // Static assets: cache first, then network
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          return response || fetch(event.request);
        })
    );
  }
});