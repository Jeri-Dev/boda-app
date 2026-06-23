'use client'

import { useEffect } from 'react'

/**
 * Registers the service worker — PRODUCTION ONLY.
 *
 * `process.env.NODE_ENV` is inlined at build time, so in `next dev` this whole
 * effect compiles to a no-op: the SW never installs during development, which
 * keeps Turbopack HMR from fighting a caching layer. Registration waits for
 * `load` so it never competes with the first paint.
 */
export function PWARegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return

    const register = () => {
      navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {
        // Registration failures are non-fatal — the app works without the SW.
      })
    }

    if (document.readyState === 'complete') {
      register()
    } else {
      window.addEventListener('load', register, { once: true })
      return () => window.removeEventListener('load', register)
    }
  }, [])

  return null
}
