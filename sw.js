const CACHE_NAME = "aimlab-v2";
const ASSETS_TO_CACHE = [
  "index.html",
  "birthday.html",
  "download-speed.html",
  "password-checker.html",
  "gpa-calculator.html",
  "roaster.html",
  "wheel.html",
  "guess-number.html",
  "life-progress-tracker.html",
  "life-stats.html",
  "mind-reader.html",
  "websites.html",
  "qr-generator.html",
  "about.html",
  "styles.css",
  "script.js",
  "manifest.json",
  "assets/icons/icon-192.svg",
  "assets/icons/icon-512.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS_TO_CACHE.map((url) => new Request(url, { cache: "reload" }))))
      .then(() => self.skipWaiting())
      .catch((err) => console.warn("SW install cache warning:", err))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME) {
              return caches.delete(key);
            }
          })
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Bypass SW for third-party origins (GitHub API, Web3Forms, CDNs)
  if (url.origin !== self.location.origin) return;

  // Page Navigation requests -> Network First with Cache Fallback (fixes ERR_FAILED & Redirection errors)
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200 && response.type === "basic") {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return response;
        })
        .catch(() => {
          return caches.match(request).then((cached) => cached || caches.match("index.html"));
        })
    );
    return;
  }

  // Static Assets (CSS, JS, SVGs) -> Cache First with Network Refresh
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200 && networkResponse.type === "basic") {
              caches.open(CACHE_NAME).then((cache) => cache.put(request, networkResponse));
            }
          })
          .catch(() => {});
        return cachedResponse;
      }

      return fetch(request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === "basic") {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
        }
        return networkResponse;
      });
    })
  );
});
