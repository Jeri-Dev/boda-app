import type { Metadata } from 'next'

import { HostNav } from '@/components/host/host-nav'

/**
 * Back-office shell layout. The app is open — there is NO authentication gate.
 * Access control, if any, is handled at the deployment layer (private URL,
 * password-protected hosting, or local use), not in the app.
 *
 * `robots: noindex` keeps the back-office out of search engines even though it
 * is publicly reachable.
 */
export const metadata: Metadata = {
  title: { default: 'Panel', template: '%s · Panel' },
  robots: { index: false, follow: false },
}

export default function HostLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-dvh bg-[var(--color-background)]">
      <HostNav />
      {children}
    </div>
  )
}
