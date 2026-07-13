// Offline browsing: cache pages and static assets as you visit them, so
// anything you've already opened (library, a saved link, a reader view)
// is still viewable with no connection. Saving new links still needs a
// connection — this is read-only offline access, not a write queue.
const CACHE_VERSION = "v1";
const PAGE_CACHE = `readmemry-pages-${CACHE_VERSION}`;
const ASSET_CACHE = `readmemry-assets-${CACHE_VERSION}`;
const CURRENT_CACHES = [PAGE_CACHE, ASSET_CACHE];

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((keys) =>
        Promise.all(
          keys.filter((key) => !CURRENT_CACHES.includes(key)).map((key) => caches.delete(key)),
        ),
      ),
    ]),
  );
});

function isCacheableRequest(request, url) {
  if (request.method !== "GET") return false;
  if (url.origin !== self.location.origin) return false;
  // API routes and auth callbacks need fresh data/state every time — never
  // serve these from cache, even as an offline fallback.
  if (url.pathname.startsWith("/api/")) return false;
  if (url.pathname.startsWith("/auth/")) return false;
  return true;
}

function isStaticAsset(url) {
  // Next.js content-hashes these filenames, so a cached copy is never
  // stale — a new deploy produces new filenames rather than changing
  // what an old one points to. Safe to cache-first.
  return url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/");
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (!isCacheableRequest(request, url)) return;

  if (isStaticAsset(url)) {
    event.respondWith(
      caches.open(ASSET_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        const response = await fetch(request);
        if (response.ok) cache.put(request, response.clone());
        return response;
      }),
    );
    return;
  }

  // Pages and RSC payload fetches: always prefer a fresh network response
  // (so signed-in state and your latest saves show up normally), falling
  // back to the last cached version only when the network request fails.
  event.respondWith(
    (async () => {
      const cache = await caches.open(PAGE_CACHE);
      try {
        const response = await fetch(request);
        if (response.ok) cache.put(request, response.clone());
        return response;
      } catch {
        const cached = await cache.match(request);
        if (cached) return cached;
        throw new Error("Offline and this page hasn't been visited yet");
      }
    })(),
  );
});
