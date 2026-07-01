import 'server-only'

import { headers } from 'next/headers'

/**
 * Server-side enforcement of the deployment Basic-Auth credential for back-office
 * mutations.
 *
 * The Netlify edge gate (`netlify/edge-functions/basic-auth.ts`) authorizes by
 * URL path, but Next.js Server Actions are dispatched by an action-ID header, not
 * the route they're POSTed to — so a POST to a PUBLIC path (`/i/…`) can invoke a
 * back-office action, slipping past the path gate. Each back-office action calls
 * this FIRST so authorization is enforced where the action identity is known.
 *
 * How it stays credential-free for guests: after a host passes the edge Basic-Auth
 * challenge, the browser resends `Authorization: Basic …` on every same-origin
 * request — including Server Action `fetch` POSTs — so a real host's actions carry
 * it. An unauthenticated POST to `/i/x` does not, and is rejected here.
 *
 * Dev/test: when no credentials are configured (local `pnpm dev`, unit tests),
 * this allows — there's no edge gate locally either. In production the creds are
 * set, so a missing/invalid header is denied (fail closed).
 */
export class UnauthorizedError extends Error {
  constructor() {
    super('No autorizado')
    this.name = 'UnauthorizedError'
  }
}

/** Length-safe constant-time string compare (avoids a timing oracle). */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

export async function requireBackofficeAuth(): Promise<void> {
  const user = process.env.BASIC_AUTH_USER
  const pass = process.env.BASIC_AUTH_PASSWORD
  // Not configured → dev/test convenience: allow (no edge gate locally either).
  if (!user || !pass) return

  const header = (await headers()).get('authorization') ?? ''
  const [scheme, encoded] = header.split(' ')
  if (scheme === 'Basic' && encoded) {
    let decoded = ''
    try {
      decoded = Buffer.from(encoded, 'base64').toString('utf8')
    } catch {
      decoded = ''
    }
    const sep = decoded.indexOf(':')
    if (sep !== -1) {
      // Evaluate both so a wrong user can't short-circuit the password check.
      const okUser = safeEqual(decoded.slice(0, sep), user)
      const okPass = safeEqual(decoded.slice(sep + 1), pass)
      if (okUser && okPass) return
    }
  }
  throw new UnauthorizedError()
}
