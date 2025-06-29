// Define a cache name for current assets
const CACHE_NAME = 'mood-muzigo-v2'; // Increment cache version to force update

// List of URLs to cache (your app's core assets)
// These should ideally be static assets within your public folder or directly managed by your build tool.
const urlsToCache = [
  '/', // The root of your application
  '/index.html', // Your main HTML file
  '/src/main.jsx', // Your main JS entry point (though bundled in production)
  // Your custom icons - assuming they are directly in public/ or public/icons
  '/mudu.jpg',
  '/mudu.png',
  '/mudu (1).png',
  '/icons/icon-72x72.png',
  '/icons/icon-96x96.png',
  '/icons/icon-128x128.png',
  '/icons/icon-144x144.png',
  '/icons/icon-152x152.png',
  '/icons/icon-192x192.png',
  '/icons/icon-384x384.png',
  '/icons/icon-512x512.png'
];

// URLs for external resources (CDNs) that we want to cache dynamically
const externalUrlsToCache = [
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap'
];

// Install event: caches initial assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching core app shell assets.');
        // Cache your internal app files
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting()) // Activates the new service worker immediately
      .catch((error) => console.error('Service Worker: Failed to cache core assets during install:', error))
  );
});

// Activate event: cleans up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
          return null;
        })
      );
    }).then(() => self.clients.claim()) // Takes control of any clients not controlled yet
  );
});

// Fetch event: serves cached assets or fetches from network, with dynamic caching for external resources
self.addEventListener('fetch', (event) => {
  // Check if the request is for an external resource that we specifically want to cache
  const isExternalResource = externalUrlsToCache.some(url => event.request.url.startsWith(url));

  if (isExternalResource) {
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          // If resource is in cache, return it
          if (response) {
            console.log('Service Worker: Serving external resource from cache:', event.request.url);
            return response;
          }
          // If not in cache, fetch from network
          console.log('Service Worker: Fetching and caching external resource:', event.request.url);
          return fetch(event.request)
            .then(networkResponse => {
              // Check if we received a valid response before caching
              if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                return networkResponse;
              }
              // Clone the response because it's a stream and can only be consumed once
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, responseToCache);
              });
              return networkResponse;
            })
            .catch(error => {
              console.error('Service Worker: Fetch failed for external resource:', event.request.url, error);
              // Fallback for failed network requests for external resources
              return new Response('<h1>Offline</h1><p>The app is offline and could not load some resources (e.g., styles).</p>', {
                  headers: { 'Content-Type': 'text/html' }
              });
            });
        })
    );
  } else {
    // For all other (internal) requests, try cache first, then network
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          if (response) {
            return response;
          }
          return fetch(event.request).catch(error => {
            console.error('Service Worker: Fetch failed for internal resource:', event.request.url, error);
            // Fallback for failed network requests if no offline.html
            return new Response('<h1>Offline</h1><p>The app is offline and could not load the requested resource.</p>', {
              headers: { 'Content-Type': 'text/html' }
            });
          });
        })
    );
  }
});
