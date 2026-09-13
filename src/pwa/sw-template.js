// myPhoto service worker.
//
// Skabelon: serviceWorker()-pluginet i vite.config.ts indsætter version og
// filliste i de to konstanter herunder ved build og udsender resultatet som
// dist/sw.js. Filen køres aldrig i udvikling.
//
// Service workeren henter kun appens egne filer og de Google Fonts, appen
// allerede bruger. Den sender intet — billeder behandles stadig kun i hukommelsen.

const VERSION = __VERSION__;
const PRECACHE = __PRECACHE__;

const APP_CACHE = `myphoto-app-${VERSION}`;
const FONT_CACHE = 'myphoto-fonts-v1';
const FONT_ORIGINS = ['https://fonts.googleapis.com', 'https://fonts.gstatic.com'];
const INDEX_URL = new URL('./', self.location).href;

self.addEventListener('install', (event) => {
  // Hele app-skallen lægges i cachen med det samme, så appen virker offline
  // allerede efter første besøg — ikke først efter anden sideindlæsning.
  event.waitUntil(
    caches
      .open(APP_CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  // Ryd caches fra tidligere builds. Font-cachen overlever på tværs af builds.
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith('myphoto-app-') && key !== APP_CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  if (FONT_ORIGINS.includes(url.origin)) {
    event.respondWith(staleWhileRevalidate(request, FONT_CACHE));
    return;
  }

  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  event.respondWith(cacheFirst(request));
});

/**
 * Sider: prøv netværket først, så en ny version slår igennem med det samme.
 * Offline falder vi tilbage til den index.html, der hører til dette build.
 * Svaret fra netværket gemmes ikke — den cachede index.html skal altid passe
 * til de cachede JS/CSS-filer.
 */
async function networkFirstNavigation(request) {
  try {
    return await fetch(request);
  } catch {
    const cache = await caches.open(APP_CACHE);
    const cached = await cache.match(INDEX_URL);
    return cached || Response.error();
  }
}

/** Egne filer: Vite giver dem indholdshash i navnet, så cachen er altid gyldig. */
async function cacheFirst(request) {
  const cache = await caches.open(APP_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response.ok && response.type === 'basic') {
    cache.put(request, response.clone());
  }
  return response;
}

/** Skrifttyper: svar straks fra cachen og opdatér i baggrunden. */
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const network = fetch(request)
    .then((response) => {
      // Opaque (status 0) er normalt for CSS hentet via @import uden CORS
      if (response.ok || response.type === 'opaque') {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cached);

  return cached || network;
}
