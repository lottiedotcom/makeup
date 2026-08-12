// Change this version number whenever you update files to force a cache clear!
const CACHE_NAME = 'makeup-cache-v2'; 

const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './script.js', // Match your JS file name here
  './manifest.json',
  './makeup.jpg'
];

// Install Service Worker and Cache New Files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
  // Force the waiting service worker to become the active service worker.
  self.skipWaiting(); 
});

// Activate Event: Clear the Old Cache
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // If the cache name doesn't match the current version, delete it
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Ensure the service worker takes control of the page immediately
  self.clients.claim(); 
});

// Serve Cached Files when Offline
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response; // Return cached file
        }
        return fetch(event.request); // Fetch from network
      })
  );
});
