/*
 * boda-app service worker (artisanal, prod-only).
 *
 * WHY HAND-ROLLED, NOT SERWIST: the Next.js 16.2.4 PWA guide
 * (node_modules/next/dist/docs/01-app/02-guides/progressive-web-apps.md, "Note:
 * this plugin currently requires webpack configuration") and our Turbopack-
 * default build make Serwist a poor fit for Fase 0. This minimal SW covers the
 * only offline requirement (R19: read-only día-B) without coupling the bundler.
 * See docs/solutions/2026-06-23-pwa-serwist-turbopack-spike.md.
 *
 * ── SW CONTRACT (fixed here in U0.4) ───────────────────────────────────────
 *   Caches:
 *     static-<v>  CacheFirst   content-hashed build assets (safe forever)
 *     pages-<v>   NetworkFirst HTML navigations, fallback to /~offline
 *   U3.3 NOTE: the día-B read-only view (/dia-b) needs no dedicated cache — it's
 *   a plain navigation, already served NetworkFirst from `pages-<v>` (fresh when
 *   online, last snapshot when offline). PII hygiene relies on device lock + the
 *   CACHE_VERSION bump purge; no allergies are stored anywhere.
 *   NEVER cached:
 *     - non-GET (Server Actions are POSTs)
 *     - RSC / prefetch / Server-Action navigations (headers RSC,
 *       Next-Router-Prefetch, Next-Action, or `?_rsc=`) → caching them would
 *       serve stale state after revalidatePath (cross-invariant with U1.5)
 *     - cross-origin requests
 *   No PII is ever precached.
 */

const CACHE_VERSION = 'v2'
const STATIC_CACHE = `static-${CACHE_VERSION}`
const PAGES_CACHE = `pages-${CACHE_VERSION}`
const OFFLINE_URL = '/~offline'
const PRECACHE = [OFFLINE_URL]

// Caches this SW version owns. Anything else is purged on activate.
const OWNED_CACHES = new Set([STATIC_CACHE, PAGES_CACHE])

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(PAGES_CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => !OWNED_CACHES.has(k)).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  )
})

// Allow the app to purge caches on logout (día-B PII hygiene — used by U3.3).
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'PURGE_CACHES') {
    event.waitUntil(caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k)))))
  }
})

function isRscRequest(request, url) {
  return (
    request.headers.get('RSC') === '1' ||
    request.headers.has('Next-Router-Prefetch') ||
    request.headers.has('Next-Action') ||
    url.searchParams.has('_rsc')
  )
}

function isStaticAsset(url) {
  return (
    url.pathname.startsWith('/_next/static/') ||
    /\.(?:js|css|woff2?|png|jpg|jpeg|gif|svg|webp|ico)$/.test(url.pathname)
  )
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Only handle same-origin GETs. Everything else (Server Actions, RSC,
  // cross-origin) goes straight to the network, uncached.
  if (request.method !== 'GET') return
  if (url.origin !== self.location.origin) return
  if (isRscRequest(request, url)) return

  // CacheFirst for content-hashed static assets.
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const hit = await cache.match(request)
        if (hit) return hit
        const res = await fetch(request)
        if (res.ok) cache.put(request, res.clone())
        return res
      }),
    )
    return
  }

  // NetworkFirst for HTML navigations: fresh when online, last-known copy when
  // offline, and the offline fallback when there's nothing cached.
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const res = await fetch(request)
          // Only cache successful, non-redirected documents. A 4xx/5xx body
          // would poison the offline fallback (served instead of /~offline),
          // and an opaqueredirect makes cache.put reject. Fire-and-forget with
          // a catch so a put failure can never reject the navigation itself.
          if (res.ok && !res.redirected) {
            const cache = await caches.open(PAGES_CACHE)
            cache.put(request, res.clone()).catch(() => {})
          }
          return res
        } catch {
          const cache = await caches.open(PAGES_CACHE)
          const cached = await cache.match(request)
          return cached || (await cache.match(OFFLINE_URL)) || Response.error()
        }
      })(),
    )
  }
})
