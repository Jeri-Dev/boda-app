import type { Metadata } from 'next'
import { asc, eq, isNotNull } from 'drizzle-orm'

import { db } from '@/lib/db'
import { guests, tables, vendors, wedding } from '@/lib/db/schema'

/**
 * Day-of view (U3.3) — read-only, mobile-first: who sits where + key vendor
 * contacts, for quick reference during the event.
 *
 * Offline: the artisanal service worker (Fase 0) caches navigations
 * NetworkFirst, so once opened online this page is served from cache with no
 * network. It's a snapshot — the day-of view is exactly that use case.
 * (Cache Storage isn't encrypted; the residual PII risk is accepted, mitigated
 * by device lock + the SW's version-bump purge. No allergies are stored.)
 */
export const metadata: Metadata = {
  title: 'Día B',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default async function DiaBPage() {
  const [tableRows, guestRows, vendorRows, weddingRow] = await Promise.all([
    db
      .select({ id: tables.id, label: tables.label })
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
    db
      .select({ id: vendors.id, name: vendors.name, category: vendors.category, phone: vendors.phone })
      .from(vendors)
      .where(isNotNull(vendors.phone))
      .orderBy(asc(vendors.name)),
    db.select().from(wedding).where(eq(wedding.id, 1)).limit(1),
  ])

  // Attending guests only (declined don't occupy a seat).
  const attending = guestRows.filter((g) => g.rsvpStatus !== 'declined')
  const seatedByTable = new Map<string, string[]>()
  const unseated: string[] = []
  for (const g of attending) {
    if (g.tableId) {
      const arr = seatedByTable.get(g.tableId) ?? []
      arr.push(g.name)
      seatedByTable.set(g.tableId, arr)
    } else if (g.rsvpStatus === 'confirmed') {
      unseated.push(g.name)
    }
  }

  const couple = weddingRow[0]?.coupleNames?.trim() || 'Nuestra Boda'

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-10 sm:px-6">
      <header className="mb-8">
        <p className="text-[0.7rem] uppercase tracking-[0.25em] text-[var(--color-muted-foreground)]">
          Día B
        </p>
        <h1 className="mt-1 font-display text-3xl tracking-tight text-[var(--color-foreground)]">
          {couple}
        </h1>
        <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
          Vista rápida de solo lectura. Disponible sin conexión una vez abierta.
        </p>
      </header>

      <section className="mb-10" aria-labelledby="diab-mesas">
        <h2
          id="diab-mesas"
          className="mb-3 font-display text-xl tracking-tight text-[var(--color-foreground)]"
        >
          Mesas
        </h2>
        {tableRows.length === 0 ? (
          <p className="text-sm text-[var(--color-muted-foreground)]">
            No hay mesas configuradas.
          </p>
        ) : (
          <ul className="grid gap-3">
            {tableRows.map((t) => {
              const names = seatedByTable.get(t.id) ?? []
              return (
                <li
                  key={t.id}
                  className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] px-5 py-4 shadow-[var(--shadow-soft)]"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="font-display text-lg text-[var(--color-foreground)]">
                      {t.label}
                    </h3>
                    <span className="text-xs text-[var(--color-muted-foreground)]">
                      {names.length}{' '}
                      {names.length === 1 ? 'persona' : 'personas'}
                    </span>
                  </div>
                  {names.length > 0 ? (
                    <p className="mt-1 text-[0.9375rem] leading-relaxed text-[var(--color-foreground)]">
                      {names.join(' · ')}
                    </p>
                  ) : (
                    <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
                      Sin asignar.
                    </p>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {unseated.length > 0 ? (
        <section className="mb-10" aria-labelledby="diab-sinsentar">
          <h2
            id="diab-sinsentar"
            className="mb-2 font-display text-xl tracking-tight text-[var(--color-foreground)]"
          >
            Confirmados sin mesa ({unseated.length})
          </h2>
          <p className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] px-5 py-4 text-[0.9375rem] leading-relaxed text-[var(--color-foreground)] shadow-[var(--shadow-soft)]">
            {unseated.join(' · ')}
          </p>
        </section>
      ) : null}

      {vendorRows.length > 0 ? (
        <section aria-labelledby="diab-contactos">
          <h2
            id="diab-contactos"
            className="mb-3 font-display text-xl tracking-tight text-[var(--color-foreground)]"
          >
            Contactos
          </h2>
          <ul className="divide-y divide-[var(--color-border)] rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] shadow-[var(--shadow-soft)]">
            {vendorRows.map((v) => (
              <li
                key={v.id}
                className="flex items-center justify-between gap-3 px-5 py-3"
              >
                <span className="min-w-0">
                  <span className="block truncate text-[var(--color-foreground)]">
                    {v.name}
                  </span>
                  {v.category ? (
                    <span className="text-xs text-[var(--color-muted-foreground)]">
                      {v.category}
                    </span>
                  ) : null}
                </span>
                <a
                  href={`tel:${v.phone}`}
                  className="shrink-0 whitespace-nowrap text-[var(--color-accent)] underline-offset-4 hover:underline"
                >
                  {v.phone}
                </a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  )
}
