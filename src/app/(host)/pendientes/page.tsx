import type { Metadata } from 'next'
import Link from 'next/link'
import { asc, eq } from 'drizzle-orm'

import {
  RsvpReminders,
  type PendingInvitation,
} from '@/components/host/rsvp-reminders'
import { listInvitations } from '@/lib/data/invitations'
import { db } from '@/lib/db'
import { guests } from '@/lib/db/schema'
import { site } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Pendientes',
}

export const dynamic = 'force-dynamic'

export default async function PendientesPage() {
  const [invitations, pendingGuests] = await Promise.all([
    listInvitations(),
    db
      .select({ id: guests.id, name: guests.name, household: guests.household })
      .from(guests)
      .where(eq(guests.rsvpStatus, 'pending'))
      .orderBy(asc(guests.name)),
  ])

  // Valid invitations that still have unanswered members → resend the link.
  const reminders: PendingInvitation[] = invitations
    .filter((inv) => inv.status === 'valido')
    .map((inv) => ({
      id: inv.id,
      token: inv.token,
      label: inv.label,
      allNames: inv.members.map((m) => m.name),
      pendingNames: inv.members
        .filter((m) => m.rsvpStatus === 'pending')
        .map((m) => m.name),
    }))
    .filter((inv) => inv.pendingNames.length > 0)

  // Pending guests reachable through a valid invitation are handled above; the
  // rest can't be reminded yet — they need an invitation.
  const reachable = new Set(
    invitations
      .filter((inv) => inv.status === 'valido')
      .flatMap((inv) => inv.members.map((m) => m.id)),
  )
  const unreachable = pendingGuests.filter((g) => !reachable.has(g.id))

  const totalPending = pendingGuests.length

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6">
      <header className="mb-8">
        <p className="text-[0.7rem] uppercase tracking-[0.25em] text-[var(--color-muted-foreground)]">
          Fase 2
        </p>
        <h1 className="mt-1 font-display text-3xl tracking-tight text-[var(--color-foreground)]">
          Pendientes de confirmar
        </h1>
        <p className="mt-2 max-w-prose text-sm text-[var(--color-muted-foreground)]">
          {totalPending === 0
            ? 'Nadie está pendiente de responder.'
            : `${totalPending} ${totalPending === 1 ? 'invitado' : 'invitados'} sin responder. Reenvía su enlace para recordarles.`}
        </p>
      </header>

      <section className="mb-10">
        <h2 className="mb-4 font-display text-xl tracking-tight text-[var(--color-foreground)]">
          Reenviar invitación
        </h2>
        <RsvpReminders invitations={reminders} baseUrl={site.url} />
      </section>

      {unreachable.length > 0 ? (
        <section>
          <h2 className="mb-2 font-display text-xl tracking-tight text-[var(--color-foreground)]">
            Sin invitación
          </h2>
          <p className="mb-4 max-w-prose text-sm text-[var(--color-muted-foreground)]">
            Estos invitados aún no tienen un enlace.{' '}
            <Link
              href="/invitaciones"
              className="text-[var(--color-accent)] underline-offset-4 hover:underline"
            >
              Crea una invitación
            </Link>{' '}
            para poder enviárselo.
          </p>
          <ul className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] shadow-[var(--shadow-soft)]">
            {unreachable.map((g) => (
              <li
                key={g.id}
                className="flex items-center justify-between gap-3 border-b border-[var(--color-border)] px-4 py-3 last:border-b-0"
              >
                <span className="text-[var(--color-foreground)]">{g.name}</span>
                {g.household ? (
                  <span className="text-xs text-[var(--color-muted-foreground)]">
                    {g.household}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  )
}
