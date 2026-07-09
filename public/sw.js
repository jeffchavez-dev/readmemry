// Minimal service worker: exists solely to satisfy PWA installability
// criteria (Chrome requires a registered SW with a fetch handler). No
// offline caching or push handling in the MVP.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", () => {
  // Pass-through — no caching strategy yet.
});
