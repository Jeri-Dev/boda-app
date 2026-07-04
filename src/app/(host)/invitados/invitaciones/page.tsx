import type { Metadata } from 'next'
import { asc } from 'drizzle-orm'

import { InvitationManager } from '@/components/host/invitation-manager'
import { listInvitations } from '@/lib/data/invitations'
import { db } from '@/lib/db'
import { guests } from '@/lib/db/schema'
import { site } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Invitaciones',
}

export const dynamic = 'force-dynamic'

export default async function InvitacionesPage() {
  const [invitations, guestOptions] = await Promise.all([
    listInvitations(),
    db
      .select({ id: guests.id, name: guests.name, household: guests.household })
      .from(guests)
      .orderBy(asc(guests.name)),
  ])

  return (
    <>
      <p className="mb-6 max-w-prose text-sm text-[var(--color-muted-foreground)]">
        Genera un enlace por hogar o persona y compártelo. Cada enlace abre la
        invitación digital y el formulario de confirmación.
      </p>

      <InvitationManager
        invitations={invitations}
        guests={guestOptions}
        baseUrl={site.url}
      />
    </>
  )
}
