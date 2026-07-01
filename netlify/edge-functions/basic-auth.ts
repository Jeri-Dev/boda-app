import type { Config, Context } from '@netlify/edge-functions'

/**
 * Basic-Auth gate for the OPEN app's back-office (U8 — required deliverable).
 *
 * The app has no in-application auth, so this edge function is the ONLY thing
 * standing between the public internet and the host's PII (guests, budget,
 * vendors). It runs at the CDN edge BEFORE the Next Node function — so a gated
 * route never even renders. The Drizzle/postgres-js client is NEVER used here.
 *
 * PUBLIC (no credentials) — the guest surface + the assets it needs:
 *   /i/…              guest invitation + RSVP (server action posts back to /i/…)
 *   /info             public info page
 *   /~offline         PWA offline fallback
 *   /_next/…          static JS/CSS/chunks (app code, not data)
 *   /manifest.webmanifest, /sw.js, /favicon.ico
 * EVERYTHING ELSE (/, /invitados, /proveedores, …) requires Basic Auth.
 *
 * Fails CLOSED: if BASIC_AUTH_USER/PASSWORD aren't set, every gated route is
 * denied rather than left open.
 */

const PUBLIC_EXACT = new Set([
  '/info',
  '/~offline',
  '/manifest.webmanifest',
  '/sw.js',
  '/favicon.ico',
  '/robots.txt',
])

function isPublic(rawPathname: string): boolean {
  // `new URL().pathname` collapses LITERAL `..` but leaves percent-encoded
  // traversal (`%2e%2e`, `%2f`) intact — so `/i/..%2finvitados` would otherwise
  // pass `startsWith('/i/')` yet the origin may decode+route it to the gated
  // `/invitados`. Decide on the SAME canonical path the origin will route on:
  // decode once, and refuse to classify anything with traversal or an encoded
  // slash as public (fail safe → the gate challenges it).
  let path: string
  try {
    path = decodeURIComponent(rawPathname)
  } catch {
    return false // malformed encoding → require auth
  }
  if (path.includes('..') || /%2f/i.test(rawPathname) || /%2f/i.test(path)) {
    return false
  }

  if (PUBLIC_EXACT.has(path)) return true
  return (
    path.startsWith('/i/') ||
    path.startsWith('/info/') ||
    path.startsWith('/_next/')
  )
}

/** Length-safe, constant-time-ish string comparison (avoids a timing oracle). */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

const CHALLENGE = {
  status: 401,
  headers: {
    'WWW-Authenticate': 'Basic realm="boda-app", charset="UTF-8"',
    'Cache-Control': 'no-store',
  },
}

export default async function basicAuth(request: Request, context: Context) {
  const { pathname } = new URL(request.url)

  if (isPublic(pathname)) return context.next()

  const user = Netlify.env.get('BASIC_AUTH_USER')
  const pass = Netlify.env.get('BASIC_AUTH_PASSWORD')
  // Not configured → deny (fail closed): never expose the back-office by default.
  if (!user || !pass) {
    return new Response('Back-office protection is not configured.', CHALLENGE)
  }

  const header = request.headers.get('authorization') ?? ''
  const [scheme, encoded] = header.split(' ')
  if (scheme === 'Basic' && encoded) {
    let decoded = ''
    try {
      decoded = atob(encoded)
    } catch {
      decoded = ''
    }
    const sep = decoded.indexOf(':')
    if (sep !== -1) {
      const u = decoded.slice(0, sep)
      const p = decoded.slice(sep + 1)
      // Evaluate both comparisons so a wrong username can't short-circuit.
      const ok = safeEqual(u, user) && safeEqual(p, pass)
      if (ok) return context.next()
    }
  }

  return new Response('Authentication required.', CHALLENGE)
}

export const config: Config = {
  // Run on every request; the function itself lets public paths through. Using
  // a broad path keeps the exclusion logic in ONE place (above) rather than
  // split between here and a matcher.
  path: '/*',
}
