// Gym Tracker service worker
//
// Strategy: runtime caching. The first visit to any URL goes to the network
// and the response is cached. Subsequent visits use the cache as fallback when
// the network fails (offline), so the app keeps working once you've visited
// each page at least once with connection.
//
// We deliberately do not pre-cache Next.js bundles: their hashes change every
// build, so a static precache list rots immediately. Runtime caching adapts.

const CACHE = "gym-app-v1";

// Bump CACHE name on breaking changes; activate handler cleans up old caches.

self.addEventListener("install", () => {
  // Activate the new SW as soon as it finishes installing.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Only handle GETs.
  if (req.method !== "GET") return;

  // Don't touch cross-origin requests (fonts, Supabase, analytics).
  if (new URL(req.url).origin !== self.location.origin) return;

  // Don't cache server-event streams or any non-http(s) requests.
  if (req.headers.get("accept")?.includes("text/event-stream")) return;

  event.respondWith(handle(req));
});

async function handle(req) {
  const cache = await caches.open(CACHE);
  try {
    const res = await fetch(req);
    if (res && res.ok && res.type === "basic") {
      cache.put(req, res.clone()).catch(() => {});
    }
    return res;
  } catch {
    const cached = await cache.match(req);
    if (cached) return cached;
    // Navigation fallback: serve cached root if available.
    if (req.mode === "navigate") {
      const root = await cache.match("/");
      if (root) return root;
    }
    return new Response("Offline and not cached", {
      status: 503,
      statusText: "Service Unavailable",
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }
}
