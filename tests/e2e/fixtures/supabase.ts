import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Supabase clients for E2E / integration assertions (Node-side only — never
 * bundled into the app). The `src/lib/supabase/*` helpers can't be used here
 * because they import `server-only`, which throws outside a Next runtime.
 *
 * Three roles:
 *   - service: the secret key. Bypasses RLS — used to read/provision rows the
 *     anon/host roles can't. Never expose in client code.
 *   - anon: the publishable key, no session → the `anon` Postgres role. Used to
 *     PROVE the public/private isolation (private reads return zero rows).
 *   - host: anon client signed in as the test host → `authenticated` role with
 *     allowlist membership. Used to prove the host CAN reach private data.
 */

function envOr(key: string): string {
  const value = process.env[key]
  if (!value) {
    throw new Error(
      `Missing required env var: ${key}. Set it in .env.local before 'pnpm test:e2e'. See tests/e2e/README.md.`,
    )
  }
  return value
}

export const TEST_HOST_EMAIL = process.env.PLAYWRIGHT_HOST_EMAIL ?? 'host@test.local'
export const TEST_HOST_PASSWORD =
  process.env.PLAYWRIGHT_HOST_PASSWORD ?? 'test-host-password-123'

const noPersist = { auth: { persistSession: false, autoRefreshToken: false } }

let serviceCached: SupabaseClient | null = null

/** Service-role client (secret key) — bypasses RLS. */
export function getServiceClient(): SupabaseClient {
  if (serviceCached) return serviceCached
  serviceCached = createClient(
    envOr('NEXT_PUBLIC_SUPABASE_URL'),
    envOr('PLAYWRIGHT_SUPABASE_SERVICE_KEY'),
    noPersist,
  )
  return serviceCached
}

/** Anonymous client (publishable key, no session) — the `anon` role. */
export function getAnonClient(): SupabaseClient {
  return createClient(
    envOr('NEXT_PUBLIC_SUPABASE_URL'),
    envOr('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    noPersist,
  )
}

/**
 * A fresh client signed in as the test host (the `authenticated` role with
 * allowlist membership). Each call mints its own client + session so specs
 * don't share auth state.
 */
export async function getHostClient(): Promise<SupabaseClient> {
  const client = createClient(
    envOr('NEXT_PUBLIC_SUPABASE_URL'),
    envOr('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    noPersist,
  )
  const { error } = await client.auth.signInWithPassword({
    email: TEST_HOST_EMAIL,
    password: TEST_HOST_PASSWORD,
  })
  if (error) {
    throw new Error(
      `Could not sign in test host (${TEST_HOST_EMAIL}): ${error.message}. ` +
        `Has global-setup run? See tests/e2e/README.md.`,
    )
  }
  return client
}
