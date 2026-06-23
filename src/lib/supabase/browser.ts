'use client'

import { createBrowserClient } from '@supabase/ssr'

import type { Database } from './types'

/**
 * Client-component Supabase client. Used only inside `'use client'` modules
 * where the user already has a server-issued session cookie; the browser
 * client picks the cookie up automatically via `@supabase/ssr`.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}
