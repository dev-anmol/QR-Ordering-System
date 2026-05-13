// Minimal Service Worker to satisfy PWA requirements
const CACHE_NAME = 'dinesphere-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
});

self.addEventListener('fetch', (event) => {
  // Pass through everything
  event.respondWith(fetch(event.request));
});
