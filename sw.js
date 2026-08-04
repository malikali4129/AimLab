const CACHE_NAME = "aimlab-v1";
const ASSETS_TO_CACHE = [
  "./",
  "./index.html",
  "./birthday.html",
  "./download-speed.html",
  "./password-checker.html",
  "./gpa-calculator.html",
  "./roaster.html",
  "./wheel.html",
  "./guess-number.html",
  "./life-progress-tracker.html",
  "./life-stats.html",
  "./mind-reader.html",
  "./websites.html",
  "./qr-generator.html",
  "./about.html",
  "./styles.css",
  "./script.js",
  "./manifest.json",
  "./assets/icons/icon-192.svg",
  "./assets/icons/icon-512.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch background updates dynamically
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse);
            });
          }
        }).catch(() => {/* Offline fallback active */});
        return cachedResponse;
      }
      return fetch(event.request);
    })
  );
});
