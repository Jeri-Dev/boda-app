import type { Metadata } from 'next'

import { LoginForm } from '@/components/host/login-form'

/**
 * Host login page.
 *
 * Lives in the `(host-public)` route group so it does NOT inherit the `(host)`
 * layout's `requireHost()` guard — otherwise the guard's redirect would loop
 * (no session → /login → guard → /login → …).
 *
 * `src/proxy.ts` deliberately does NOT redirect authenticated users away from
 * `/login`: the proxy only knows "has a session", not "is in host_allowlist".
 * An authenticated-but-not-host user just sees the form and can't act.
 */
export const metadata: Metadata = {
  title: 'Iniciar sesión',
  robots: { index: false, follow: false },
}

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-12">
      <LoginForm />
    </main>
  )
}
