import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

/**
 * boda-app edge proxy.
 *
 * Replaces `middleware.ts` per the Next.js 16 file convention (read
 * `node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md`).
 *
 * Responsibilities:
 *   1. Refresh the Supabase session cookie on every navigation. `@supabase/ssr`
 *      documents this as the only reliable place to keep access-token rotation
 *      in sync; pages and Server Actions read the refreshed cookie but cannot
 *      mint a new one mid-render.
 *   2. Optimistically gate the back-office. boda-app is private-first: the host
 *      surface lives at the app root, so this proxy is DENY-BY-DEFAULT — any
 *      path not in the public allowlist requires a session. Unauthenticated
 *      visitors are bounced to `/login` before they touch a Server Component.
 *   3. Forward the inbound client IP (`x-client-ip`) so the public RSVP action
 *      (Fase 2) can rate-limit per source without re-parsing `x-forwarded-for`.
 *
 * The proxy is NOT the security boundary — that's `requireHost()` in the DAL
 * plus RLS on the database. Server Functions are POSTs to the route where
 * they're used, so a matcher refactor can silently strip proxy coverage from
 * an action. Every host Server Action calls `requireHost()` as its first line.
 */

/**
 * Public paths reachable without a session: the login page, the guest surfaces
 * (`/i/[token]` invitation+RSVP, `/info`), and the offline fallback. Matched on
 * exact path or a `<base>/...` sub-path — NOT a bare prefix, so `/i` never
 * accidentally opens `/invitados` (a gated host route) to the public.
 */
const PUBLIC_PATHS = ['/login', '/i', '/info', '/~offline'] as const

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (base) => pathname === base || pathname.startsWith(`${base}/`),
  )
}

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value)
          })
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    },
  )

  // Forward the client IP for downstream rate-limiting. `x-forwarded-for` can
  // be a comma list (the closest proxy appends); the leftmost entry is the
  // original client.
  const fwd = request.headers.get('x-forwarded-for') ?? ''
  const clientIp =
    fwd.split(',')[0]?.trim() || request.headers.get('x-real-ip') || ''
  response.headers.set('x-client-ip', clientIp)
  request.headers.set('x-client-ip', clientIp)

  const { pathname } = request.nextUrl
  const isPublic = isPublicPath(pathname)
  const hasAuthCookie = request.cookies
    .getAll()
    .some((c) => c.name.startsWith('sb-'))

  // Fast path: an anonymous request (no Supabase auth cookie) to a public route
  // has no session to refresh and is allowed by the gate regardless — skip the
  // blocking `getUser()` Auth round-trip. This keeps the highest-traffic,
  // fully-anonymous surface (guest invitations /i/[token], /info) off the
  // Supabase Auth API. Cookie-bearing requests still refresh below.
  if (isPublic && !hasAuthCookie) {
    return response
  }

  // Validate the session against Supabase. `getUser()` re-checks the JWT
  // signature server-side — this is what triggers the cookie refresh wired up
  // via `cookies.setAll` above.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Deny-by-default: no session + a non-public path = bounce to login.
  if (!user && !isPublic) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    // Carry any cookies `setAll` staged on `response` (e.g. a clearing write
    // for a stale session) onto the redirect — a fresh redirect would drop
    // them. Canonical @supabase/ssr pattern. No-op when nothing was staged.
    const redirectResponse = NextResponse.redirect(url)
    for (const cookie of response.cookies.getAll()) {
      redirectResponse.cookies.set(cookie)
    }
    return redirectResponse
  }

  // We deliberately do NOT bounce authenticated users away from /login: the
  // proxy only knows "has a session", not "is in host_allowlist". An
  // authenticated-but-not-host user is redirected by requireHost() in the
  // (host) layout; bouncing here would loop. The login page is in the
  // (host-public) group so it is never gated.

  return response
}

/**
 * Run on every route except Next.js internals and static asset shapes. The PWA
 * service worker (`/sw.js`), manifest (`/manifest.webmanifest`) and icons are
 * excluded by the extension blocklist so the proxy never redirects them.
 */
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|json|txt|woff|woff2|webmanifest)$).*)',
  ],
}
