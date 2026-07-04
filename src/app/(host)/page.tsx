import type { Metadata } from 'next'
import Link from 'next/link'
import { and, count, eq, isNull } from 'drizzle-orm'

import { Donut } from '@/components/ui/donut'
import { StatCard } from '@/components/ui/stat-card'
import { db } from '@/lib/db'
import { budgetCategories, guests, payments, tasks, wedding } from '@/lib/db/schema'
import { isoDateDR, plusDaysDR, formatDateEs } from '@/lib/utils/dates'
import { formatCents } from '@/lib/utils/money'

export const metadata: Metadata = {
  title: 'Panel',
}

// Aggregated read of live data + current date — always render per request.
export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const [
    guestCountRows,
    categoryRows,
    paymentRows,
    taskRows,
    unseatedRows,
    weddingRows,
  ] = await Promise.all([
    db
      .select({ status: guests.rsvpStatus, n: count() })
      .from(guests)
      .groupBy(guests.rsvpStatus),
    db.select({ planned: budgetCategories.plannedCents }).from(budgetCategories),
    db.select().from(payments),
    db.select().from(tasks),
    // Confirmed guests with no table → the actionable "sin sentar" count.
    db
      .select({ n: count() })
      .from(guests)
      .where(and(eq(guests.rsvpStatus, 'confirmed'), isNull(guests.tableId))),
    db
      .select({ totalBudgetCents: wedding.totalBudgetCents })
      .from(wedding)
      .where(eq(wedding.id, 1))
      .limit(1),
  ])
  const sinSentar = unseatedRows[0]?.n ?? 0
  const generalCents = weddingRows[0]?.totalBudgetCents ?? 0

  const today = isoDateDR()
  const soon = plusDaysDR(14)

  // Guests.
  const g = { total: 0, confirmed: 0, pending: 0, declined: 0 }
  for (const r of guestCountRows) {
    g[r.status] += r.n
    g.total += r.n
  }
  const confirmedPct = g.total ? Math.round((g.confirmed / g.total) * 100) : 0

  // Budget.
  const previsto = categoryRows.reduce((s, c) => s + c.planned, 0)
  let pagado = 0
  let pendienteCents = 0
  let pendientePagos = 0
  for (const p of paymentRows) {
    if (p.status === 'pagado') pagado += p.amountCents
    else {
      pendienteCents += p.amountCents
      pendientePagos += 1
    }
  }
  // Measure remaining budget against the general envelope when set, else previsto.
  const budgetBase = generalCents > 0 ? generalCents : previsto
  const restante = budgetBase - pagado

  // Tasks (status is the single source of truth; no `done` column).
  const pendingTasks = taskRows.filter((t) => t.status !== 'done')

  const byDate = (a: { dueDate: string | null }, b: { dueDate: string | null }) =>
    (a.dueDate ?? '') < (b.dueDate ?? '')
      ? -1
      : (a.dueDate ?? '') > (b.dueDate ?? '')
        ? 1
        : 0

  const upcomingPayments = paymentRows
    .filter((p) => p.status === 'pendiente' && p.dueDate)
    .sort(byDate)
    .slice(0, 5)
  const upcomingTasks = pendingTasks
    .filter((t) => t.dueDate)
    .sort(byDate)
    .slice(0, 5)

  function dueTag(dateStr: string): { color: string; tag: string | null } {
    if (dateStr < today) {
      return { color: 'text-[var(--color-destructive)]', tag: 'Vencido' }
    }
    if (dateStr <= soon) {
      return { color: 'text-[var(--color-gold)]', tag: 'Próximo' }
    }
    return { color: 'text-[var(--color-muted-foreground)]', tag: null }
  }

  const stats = [
    {
      href: '/invitados',
      label: 'Invitados confirmados',
      value: `${g.confirmed}/${g.total}`,
      sub: `${confirmedPct}% confirmados · ${g.pending} sin responder`,
    },
    {
      href: '/presupuesto',
      label: 'Presupuesto restante',
      value: formatCents(restante),
      sub: `${formatCents(pagado)} pagado de ${formatCents(budgetBase)}`,
    },
    {
      href: '/presupuesto',
      label: 'Pagos pendientes',
      value: formatCents(pendienteCents),
      sub: `${pendientePagos} ${pendientePagos === 1 ? 'pago' : 'pagos'} por saldar`,
    },
    {
      href: '/tareas',
      label: 'Tareas pendientes',
      value: String(pendingTasks.length),
      sub:
        upcomingTasks.length > 0
          ? `próxima: ${formatDateEs(upcomingTasks[0].dueDate as string)}`
          : 'sin fechas próximas',
    },
    {
      href: '/mesas',
      label: 'Sin sentar',
      value: String(sinSentar),
      sub:
        sinSentar === 0
          ? 'todos los confirmados tienen mesa'
          : 'confirmados sin mesa',
    },
  ]

  return (
    <main className="w-full px-6 py-8 sm:px-8 lg:px-10">
      <header className="mb-10">
        <p className="text-[0.7rem] uppercase tracking-[0.25em] text-[var(--color-muted-foreground)]">
          Nuestra Boda
        </p>
        <h1 className="mt-1 font-display text-3xl tracking-tight text-[var(--color-foreground)]">
          Panel de la boda
        </h1>
        <p className="mt-2 max-w-prose text-sm text-[var(--color-muted-foreground)]">
          Lo esencial de un vistazo. Toca una tarjeta para entrar al módulo.
        </p>
      </header>

      <section className="mb-8 flex flex-col items-center gap-6 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-[var(--shadow-soft)] sm:flex-row sm:gap-8">
        <Donut
          value={g.confirmed}
          max={g.total}
          label="Invitados confirmados"
          caption="confirmados"
        />
        <div>
          <p className="font-display text-xl tracking-tight text-[var(--color-foreground)]">
            {g.confirmed} de {g.total} invitados confirmados
          </p>
          <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
            {g.pending} sin responder · {g.declined} no asisten
          </p>
        </div>
      </section>

      <section className="mb-12 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </section>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <section aria-labelledby="pagos-heading">
          <h2
            id="pagos-heading"
            className="mb-4 font-display text-xl tracking-tight text-[var(--color-foreground)]"
          >
            Próximos pagos
          </h2>
          {upcomingPayments.length === 0 ? (
            <p className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border)] bg-[var(--color-card)] px-5 py-6 text-sm text-[var(--color-muted-foreground)]">
              Sin pagos pendientes con fecha.{' '}
              <Link
                href="/presupuesto"
                className="text-[var(--color-accent)] underline-offset-4 hover:underline"
              >
                Ir a presupuesto
              </Link>
            </p>
          ) : (
            <ul className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] shadow-[var(--shadow-soft)]">
              {upcomingPayments.map((p) => {
                const due = dueTag(p.dueDate as string)
                return (
                  <li
                    key={p.id}
                    className="flex items-center justify-between gap-3 border-b border-[var(--color-border)] px-4 py-3 last:border-b-0"
                  >
                    <div className="min-w-0">
                      <span className="block truncate text-[var(--color-foreground)]">
                        {p.concept}
                      </span>
                      <span className="mt-0.5 flex items-center gap-2 text-xs">
                        <span className={`tabular-nums ${due.color}`}>
                          {formatDateEs(p.dueDate as string)}
                        </span>
                        {due.tag ? (
                          <span
                            className={`rounded-full border border-current px-1.5 py-px text-[0.65rem] font-medium uppercase tracking-wide ${due.color}`}
                          >
                            {due.tag}
                          </span>
                        ) : null}
                      </span>
                    </div>
                    <span className="shrink-0 tabular-nums text-[var(--color-foreground)]">
                      {formatCents(p.amountCents)}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <section aria-labelledby="tareas-heading">
          <h2
            id="tareas-heading"
            className="mb-4 font-display text-xl tracking-tight text-[var(--color-foreground)]"
          >
            Próximas tareas
          </h2>
          {upcomingTasks.length === 0 ? (
            <p className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border)] bg-[var(--color-card)] px-5 py-6 text-sm text-[var(--color-muted-foreground)]">
              Sin tareas pendientes con fecha.{' '}
              <Link
                href="/tareas"
                className="text-[var(--color-accent)] underline-offset-4 hover:underline"
              >
                Ir a tareas
              </Link>
            </p>
          ) : (
            <ul className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] shadow-[var(--shadow-soft)]">
              {upcomingTasks.map((t) => {
                const due = dueTag(t.dueDate as string)
                return (
                  <li
                    key={t.id}
                    className="flex items-center justify-between gap-3 border-b border-[var(--color-border)] px-4 py-3 last:border-b-0"
                  >
                    <span className="min-w-0 truncate text-[var(--color-foreground)]">
                      {t.title}
                    </span>
                    <span className="flex shrink-0 items-center gap-2 text-xs">
                      <span className={`tabular-nums ${due.color}`}>
                        {formatDateEs(t.dueDate as string)}
                      </span>
                      {due.tag ? (
                        <span
                          className={`rounded-full border border-current px-1.5 py-px text-[0.65rem] font-medium uppercase tracking-wide ${due.color}`}
                        >
                          {due.tag}
                        </span>
                      ) : null}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </div>
    </main>
  )
}
