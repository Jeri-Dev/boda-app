import type { Metadata } from 'next'
import { asc } from 'drizzle-orm'

import { SeatingBoard } from '@/components/host/seating-board'
import { db } from '@/lib/db'
import { guests, tables } from '@/lib/db/schema'

export const metadata: Metadata = {
  title: 'Mesas',
}

export const dynamic = 'force-dynamic'

export default async function MesasPage() {
  const [tableRows, guestRows] = await Promise.all([
    db
      .select({ id: tables.id, label: tables.label, capacity: tables.capacity })
      .from(tables)
      .orderBy(asc(tables.label)),
    db
      .select({
        id: guests.id,
        name: guests.name,
        rsvpStatus: guests.rsvpStatus,
        tableId: guests.tableId,
      })
      .from(guests)
      .orderBy(asc(guests.name)),
  ])

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6">
      <header className="mb-8">
        <p className="text-[0.7rem] uppercase tracking-[0.25em] text-[var(--color-muted-foreground)]">
          Fase 3
        </p>
        <h1 className="mt-1 font-display text-3xl tracking-tight text-[var(--color-foreground)]">
          Mesas
        </h1>
        <p className="mt-2 max-w-prose text-sm text-[var(--color-muted-foreground)]">
          Crea mesas y asigna invitados. El plano visual llega después; aquí ya
          puedes sentar a todos.
        </p>
      </header>

      <SeatingBoard tables={tableRows} guests={guestRows} />
    </main>
  )
}
