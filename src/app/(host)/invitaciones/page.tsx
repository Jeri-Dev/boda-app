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
    <main className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6">
      <header className="mb-8">
        <p className="text-[0.7rem] uppercase tracking-[0.25em] text-[var(--color-muted-foreground)]">
          Fase 2
        </p>
        <h1 className="mt-1 font-display text-3xl tracking-tight text-[var(--color-foreground)]">
          Invitaciones
        </h1>
        <p className="mt-2 max-w-prose text-sm text-[var(--color-muted-foreground)]">
          Genera un enlace por hogar o persona y compártelo. Cada enlace abre la
          invitación digital y, pronto, el formulario de confirmación.
        </p>
      </header>

      <InvitationManager
        invitations={invitations}
        guests={guestOptions}
        baseUrl={site.url}
      />
    </main>
  )
}
