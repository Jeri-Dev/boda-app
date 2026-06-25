import type { Metadata } from 'next'
import { eq } from 'drizzle-orm'

import { Invitation, InvitationInvalid } from '@/components/public/invitation'
import { getRsvpView } from '@/lib/data/rsvp'
import { db } from '@/lib/db'
import { wedding } from '@/lib/db/schema'

/**
 * Public invitation by token (U2.2). Genuinely public (no auth). The token is a
 * bearer secret in the path → `noindex, nofollow` (root layout already sets it;
 * reasserted here) and the app sends `Referrer-Policy: no-referrer` globally.
 *
 * Per-request render: the token comes from the URL, so this is always dynamic.
 */
export const metadata: Metadata = {
  title: 'Invitación',
  robots: { index: false, follow: false },
}

export default async function InvitationPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const view = await getRsvpView(token)

  if (view.state !== 'valid') {
    return <InvitationInvalid />
  }

  const weddingRow =
    (await db.select().from(wedding).where(eq(wedding.id, 1)).limit(1))[0] ?? null

  return <Invitation view={view} wedding={weddingRow} />
}
