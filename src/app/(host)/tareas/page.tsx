import type { Metadata } from 'next'
import Link from 'next/link'
import { asc, count, eq, sql } from 'drizzle-orm'

import { TaskList } from '@/components/host/task-list'
import { db } from '@/lib/db'
import { tasks } from '@/lib/db/schema'
import { isoDateDR, plusDaysDR } from '@/lib/utils/dates'

export const metadata: Metadata = {
  title: 'Tareas',
}

const FILTERS = ['pendientes', 'hechas', 'todas'] as const
type Filter = (typeof FILTERS)[number]

function isFilter(v: string | undefined): v is Filter {
  return v != null && (FILTERS as readonly string[]).includes(v)
}

export default async function TareasPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>
}) {
  const sp = await searchParams
  const filter: Filter = isFilter(sp.filter) ? sp.filter : 'pendientes'

  const where =
    filter === 'pendientes'
      ? eq(tasks.done, false)
      : filter === 'hechas'
        ? eq(tasks.done, true)
        : undefined

  const [rows, countRows] = await Promise.all([
    // Urgency order: pending first, then by due date (undated last), then age.
    db
      .select()
      .from(tasks)
      .where(where)
      .orderBy(
        asc(tasks.done),
        sql`${tasks.dueDate} is null`,
        asc(tasks.dueDate),
        asc(tasks.createdAt),
      ),
    db
      .select({ done: tasks.done, n: count() })
      .from(tasks)
      .groupBy(tasks.done),
  ])

  let pendientes = 0
  let hechas = 0
  for (const r of countRows) {
    if (r.done) hechas += r.n
    else pendientes += r.n
  }
  const counts = { pendientes, hechas, total: pendientes + hechas }

  const today = isoDateDR()
  const soon = plusDaysDR(14)

  const chips: { key: Filter; label: string; n: number }[] = [
    { key: 'pendientes', label: 'Pendientes', n: counts.pendientes },
    { key: 'hechas', label: 'Hechas', n: counts.hechas },
    { key: 'todas', label: 'Todas', n: counts.total },
  ]

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6">
      <header className="mb-8">
        <p className="text-[0.7rem] uppercase tracking-[0.25em] text-[var(--color-muted-foreground)]">
          Fase 1
        </p>
        <h1 className="mt-1 font-display text-3xl tracking-tight text-[var(--color-foreground)]">
          Tareas
        </h1>
        <p className="mt-2 max-w-prose text-sm text-[var(--color-muted-foreground)]">
          El checklist de la boda, ordenado por urgencia.
        </p>
      </header>

      <nav className="mb-6 flex flex-wrap gap-2" aria-label="Filtrar tareas">
        {chips.map((c) => {
          const isActive = c.key === filter
          return (
            <Link
              key={c.key}
              href={c.key === 'pendientes' ? '/tareas' : `/tareas?filter=${c.key}`}
              aria-current={isActive ? 'page' : undefined}
              className={[
                'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors',
                isActive
                  ? 'border-[var(--color-foreground)] bg-[var(--color-foreground)] text-[var(--color-background)]'
                  : 'border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-foreground)] hover:bg-[var(--color-muted)]',
              ].join(' ')}
            >
              {c.label}
              <span
                className={
                  isActive
                    ? 'text-[var(--color-background)]/70'
                    : 'text-[var(--color-muted-foreground)]'
                }
              >
                {c.n}
              </span>
            </Link>
          )
        })}
      </nav>

      <TaskList tasks={rows} today={today} soon={soon} />
    </main>
  )
}
