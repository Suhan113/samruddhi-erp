// public/sw.js
const CACHE_NAME = 'samruddhi-erp-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Let browser handle fetch requests normally
  event.respondWith(fetch(event.request));
});
