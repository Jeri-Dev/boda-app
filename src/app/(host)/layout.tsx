import type { Metadata } from 'next'
import { eq } from 'drizzle-orm'

import { Shell } from '@/components/host/shell'
import { db } from '@/lib/db'
import { wedding } from '@/lib/db/schema'
import { site } from '@/lib/site'

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

async function coupleName(): Promise<string> {
  try {
    const row = (
      await db
        .select({ coupleNames: wedding.coupleNames })
        .from(wedding)
        .where(eq(wedding.id, 1))
        .limit(1)
    )[0]
    return row?.coupleNames?.trim() || site.name
  } catch {
    // A failed read (e.g. no DB at build time) must not break the shell.
    return site.name
  }
}

export default async function HostLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <Shell coupleName={await coupleName()}>{children}</Shell>
}
