import type { Metadata } from 'next'

import { HostNav } from '@/components/host/host-nav'
import { requireHost } from '@/lib/supabase/dal'

/**
 * Back-office shell layout — the gate for the entire host surface (root `/`
 * and every private module under it).
 *
 * First line is `await requireHost()`: the page-level authorization check. The
 * proxy also bounces unauthenticated traffic at the edge, but proxy gates are
 * NOT a substitute for in-tree checks:
 *   - Server Functions (Server Actions) are POSTs to whichever page they're
 *     invoked from; a matcher refactor that drops a path silently strips proxy
 *     coverage from those actions.
 *   - This layout does NOT wrap Server Action invocations — every host Server
 *     Action must still call `requireHost()` itself.
 *
 * The login route lives in the parallel `(host-public)` group so it is NOT
 * covered here — otherwise `requireHost()` would redirect the login page to
 * itself in an infinite loop.
 */
export const metadata: Metadata = {
  title: { default: 'Panel', template: '%s · Panel' },
  robots: { index: false, follow: false },
}

export default async function HostLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await requireHost()

  return (
    <div className="min-h-dvh bg-[var(--color-background)]">
      <HostNav email={session.email} />
      {children}
    </div>
  )
}
