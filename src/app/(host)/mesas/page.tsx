import type { Metadata } from 'next'
import { asc } from 'drizzle-orm'

import { FloorPlan, type PlanTable } from '@/components/host/floor-plan'
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
      .select({
        id: tables.id,
        label: tables.label,
        capacity: tables.capacity,
        shape: tables.shape,
        posX: tables.posX,
        posY: tables.posY,
      })
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

  // Seats in use per table = assigned guests who will attend (declined excluded).
  const usedByTable = new Map<string, number>()
  for (const g of guestRows) {
    if (g.tableId && g.rsvpStatus !== 'declined') {
      usedByTable.set(g.tableId, (usedByTable.get(g.tableId) ?? 0) + 1)
    }
  }
  const planTables: PlanTable[] = tableRows.map((t) => ({
    id: t.id,
    label: t.label,
    capacity: t.capacity,
    shape: t.shape,
    posX: t.posX,
    posY: t.posY,
    used: usedByTable.get(t.id) ?? 0,
  }))

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6">
      <header className="mb-8">
        <h1 className="font-display text-3xl tracking-tight text-[var(--color-foreground)]">
          Mesas
        </h1>
        <p className="mt-2 max-w-prose text-sm text-[var(--color-muted-foreground)]">
          Crea mesas, colócalas en el plano y asigna invitados.
        </p>
      </header>

      {planTables.length > 0 ? (
        <section className="mb-10" aria-labelledby="plano-heading">
          <h2
            id="plano-heading"
            className="mb-3 font-display text-xl tracking-tight text-[var(--color-foreground)]"
          >
            Plano
          </h2>
          <p className="mb-3 text-sm text-[var(--color-muted-foreground)]">
            Arrastra cada mesa para colocarla como en el salón.
          </p>
          <FloorPlan tables={planTables} />
        </section>
      ) : null}

      <SeatingBoard tables={tableRows} guests={guestRows} />
    </main>
  )
}
