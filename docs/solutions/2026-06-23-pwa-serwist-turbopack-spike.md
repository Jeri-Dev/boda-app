---
title: "PWA service worker — Serwist vs Turbopack spike (U0.4)"
date: 2026-06-23
phase: 0
unit: U0.4
tags: [pwa, service-worker, serwist, turbopack, next16, offline]
---

# PWA service worker: Serwist vs. artisanal (spike result)

## Question

The roadmap proposed Serwist (`@serwist/next`) for the PWA layer but flagged a
risk: Next 16 builds default to **Turbopack**, and Serwist may require webpack.

## Finding

The Next.js 16.2.4 PWA guide bundled with this project states it outright:

> **Offline Support**: one option is Serwist with Next.js … **Note:** this
> plugin currently requires webpack configuration.
> — `node_modules/next/dist/docs/01-app/02-guides/progressive-web-apps.md` (§ Next Steps)

Our build is Turbopack (`pnpm build` reports "Next.js 16.2.4 (Turbopack)").
Adopting Serwist would force `next build --webpack` (or a webpack config),
giving up Turbopack across the project to gain a service worker.

## Decision

Ship a **hand-rolled `public/sw.js`** — the approach the same Next guide
documents and provides a headers recipe for. It covers the only offline
requirement (R19: read-only día-B) without coupling the bundler.

- `public/sw.js`: CacheFirst for content-hashed static assets, NetworkFirst for
  HTML navigations with a `/~offline` fallback. NEVER caches non-GET, RSC /
  prefetch / Server-Action requests (would serve stale state after
  `revalidatePath`), or cross-origin. No PII precached.
- `src/components/pwa-register.tsx`: registers the SW in **production only**
  (`NODE_ENV` is inlined, so dev compiles to a no-op).
- `next.config.ts` serves `/sw.js` with `Cache-Control: no-store` + a JS MIME.
- The **SW contract** (cache names, strategies, exclusions) is fixed in U0.4 so
  Fase 3 (U3.3 día-B offline) only ADDS a dedicated, expiring cache name +
  `PURGE_CACHES` on logout — it does not redesign the worker.

## Revisit if

We later need Background Sync, push delivery, or precaching of a large app
shell — at which point re-evaluate Serwist behind `--webpack`, or a richer
hand-rolled worker.
