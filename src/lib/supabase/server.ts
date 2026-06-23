import 'server-only'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

import type { Database } from './types'

/**
 * Session-bound Supabase client for Server Components, Server Actions, and
 * Route Handlers. Reads/writes auth cookies via Next.js's async `cookies()`
 * API (Next 16: `cookies()` returns a Promise).
 *
 * RLS is the authorization boundary; every query made with this client runs as
 * the current session's user (or as `anon` when there's no session).
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            // `setAll` from a pure RSC throws because cookies() is read-only
            // outside a Server Action / Route Handler / proxy. The proxy path
            // refreshes cookies on every request; login/logout run from Server
            // Actions where `set` succeeds. Swallow safely.
          }
        },
      },
    },
  )
}
