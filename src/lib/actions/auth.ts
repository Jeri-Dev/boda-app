'use server'

import { z } from 'zod'
import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'

/**
 * Login form schema. Validated server-side inside `loginAction` before any
 * call to Supabase, so empty / malformed input never reaches the auth provider.
 */
const LoginSchema = z.object({
  email: z.string().email('Correo inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
})

export type LoginState =
  | {
      /** Top-level error banner — used for credentials / unknown failures. */
      error?: string
      /** Field-level errors keyed by form field name. */
      fieldErrors?: {
        email?: string[]
        password?: string[]
      }
    }
  | undefined

/**
 * Sign in with email + password.
 *
 * Shape matches the `useActionState` contract: `(prevState, formData) => state`.
 * On success, `redirect()` throws a control-flow signal React handles — it MUST
 * be called outside any try/catch around Supabase. On failure we return a
 * generic message; never echo the Supabase error string, which can leak
 * whether an email exists in the auth table.
 */
export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const rawEmail = formData.get('email')
  const rawPassword = formData.get('password')

  // Defensive: ignore phantom empty submissions (browser autofill + autosubmit
  // can race the user's keystrokes, producing an "empty" POST before the
  // credentials land). Without this, the empty POST updates useActionState with
  // fieldErrors and the form re-renders showing them while the real
  // submission's redirect is in flight.
  const looksEmpty =
    (rawEmail == null || rawEmail === '') &&
    (rawPassword == null || rawPassword === '')
  if (looksEmpty) return undefined

  const parsed = LoginSchema.safeParse({
    email: rawEmail,
    password: rawPassword,
  })

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(parsed.data)

  if (error) {
    return { error: 'Credenciales inválidas' }
  }

  // redirect() throws — must run outside any try/catch wrapping Supabase.
  // The back-office dashboard is the app root.
  redirect('/')
}

/**
 * Sign out the current host and bounce them to the login page. Invoked from a
 * `<form action={logoutAction}>` button in the host nav. The redirect clears
 * the rendered tree so the cookie deletion is visible on the next request.
 *
 * DELIBERATELY EXEMPT from the "every host Server Action calls requireHost()
 * first" invariant: logout only clears the CALLER'S OWN session cookie and
 * redirects to /login. It exposes no data and must stay callable by any session
 * — including one already removed from the allowlist (who must still be able to
 * sign out). signOut() on an absent session is a harmless no-op.
 */
export async function logoutAction(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
