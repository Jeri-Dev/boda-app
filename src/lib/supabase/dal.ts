import 'server-only'

import { cache } from 'react'
import { redirect } from 'next/navigation'

import { createClient } from './server'

/**
 * Data Access Layer — auth helpers (Fase 0).
 *
 * Read helpers for the private modules (invitados, presupuesto, …) land in
 * their own units. This file owns only the auth gate that every host page and
 * Server Action depends on.
 */

export type Session = {
  userId: string
  email: string
}

/**
 * Resolve the current session by asking Supabase to validate the JWT
 * server-side (`auth.getUser()` re-checks signature + revocation; the cached
 * client-side `getSession()` does not). Returns `null` when there is no
 * signed-in user. Cached per request so multiple components can call it
 * cheaply during a single render.
 */
export const verifySession = cache(async (): Promise<Session | null> => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  return { userId: user.id, email: user.email ?? '' }
})

/**
 * Require an authenticated user who is also in `public.host_allowlist`.
 * Redirects to `/login` if either check fails. Use this as the FIRST line of
 * every host page and every host Server Action.
 *
 * RLS also enforces host-only access at the database, but redirecting early
 * gives a better UX than letting the request reach the DB and fail. Being
 * authenticated is NOT sufficient — membership in the allowlist is the gate.
 */
export const requireHost = cache(async (): Promise<Session> => {
  const session = await verifySession()
  if (!session) redirect('/login')

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('host_allowlist')
    .select('user_id')
    .eq('user_id', session.userId)
    .maybeSingle()

  if (error || !data) redirect('/login')
  return session
})
