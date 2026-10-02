/* Keeps the app itself, so it opens on a bad connection, and nothing else.
 *
 * Only this origin's GET requests are ever cached. Everything that goes to
 * sign-digital.de passes straight through: their terms allow watching and do
 * not allow keeping the files, and this is the line that holds it.
 *
 * Pages are fetched network-first, so a new version shows up on the next open;
 * the hashed scripts and styles are cache-first, because their names change
 * when their contents do. */
const CACHE = "app-v1";

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((c) => c.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request).then((hit) => hit ?? caches.match(self.registration.scope))),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(
      (hit) =>
        hit ??
        fetch(request).then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then((c) => c.put(request, copy));
          }
          return response;
        }),
    ),
  );
});
