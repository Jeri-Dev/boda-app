import type { Metadata } from 'next'
import { asc, desc, eq } from 'drizzle-orm'

import { BudgetCategories } from '@/components/host/budget-categories'
import { GeneralBudget } from '@/components/host/general-budget'
import { PaymentList } from '@/components/host/payment-list'
import { db } from '@/lib/db'
import { budgetCategories, payments, vendors, wedding } from '@/lib/db/schema'
import { isoDateDR, plusDaysDR } from '@/lib/utils/dates'
import { formatCents } from '@/lib/utils/money'

export const metadata: Metadata = {
  title: 'Presupuesto',
}

// Reads live DB data and uses the current date (overdue/soon highlighting), and
// has no dynamic API (no searchParams) to opt into it automatically — so force
// per-request rendering instead of a build-time static snapshot.
export const dynamic = 'force-dynamic'

export default async function PresupuestoPage() {
  const [categories, paymentRows, vendorRows, weddingRow] = await Promise.all([
    db.select().from(budgetCategories).orderBy(asc(budgetCategories.name)),
    db
      .select({
        payment: payments,
        vendorName: vendors.name,
        categoryName: budgetCategories.name,
      })
      .from(payments)
      .leftJoin(vendors, eq(payments.vendorId, vendors.id))
      .leftJoin(budgetCategories, eq(payments.categoryId, budgetCategories.id))
      .orderBy(desc(payments.createdAt)),
    db
      .select({ id: vendors.id, name: vendors.name })
      .from(vendors)
      .orderBy(asc(vendors.name)),
    db
      .select({ totalBudgetCents: wedding.totalBudgetCents })
      .from(wedding)
      .where(eq(wedding.id, 1))
      .limit(1),
  ])

  // General/overall budget envelope (0 = not set). When set, "Restante" is
  // measured against it; otherwise it falls back to the planned (previsto) total.
  const generalCents = weddingRow[0]?.totalBudgetCents ?? 0

  // "Real" = sum of paid payments (globally + per category).
  const paidByCategory = new Map<string, number>()
  let pagadoTotal = 0
  let pendienteTotal = 0
  for (const { payment: p } of paymentRows) {
    if (p.status === 'pagado') {
      pagadoTotal += p.amountCents
      if (p.categoryId) {
        paidByCategory.set(
          p.categoryId,
          (paidByCategory.get(p.categoryId) ?? 0) + p.amountCents,
        )
      }
    } else {
      pendienteTotal += p.amountCents
    }
  }

  const previstoTotal = categories.reduce((s, c) => s + c.plannedCents, 0)
  // When a general budget is set, "Restante" is measured against it; otherwise
  // it falls back to the planned (previsto) total.
  const restante = (generalCents > 0 ? generalCents : previstoTotal) - pagadoTotal

  const categoryRows = categories.map((c) => ({
    id: c.id,
    name: c.name,
    plannedCents: c.plannedCents,
    pagadoCents: paidByCategory.get(c.id) ?? 0,
  }))
  const categoryOptions = categories.map((c) => ({ id: c.id, name: c.name }))

  const today = isoDateDR()
  const soon = plusDaysDR(14)

  const stats = [
    { label: 'Previsto', value: previstoTotal },
    { label: 'Pagado', value: pagadoTotal },
    { label: 'Pendiente', value: pendienteTotal },
    { label: 'Restante', value: restante, danger: restante < 0 },
  ]

  return (
    <main className="w-full px-6 py-8 sm:px-8 lg:px-10">
      <header className="mb-8">
        <h1 className="font-display text-3xl tracking-tight text-[var(--color-foreground)]">
          Presupuesto
        </h1>
        <p className="mt-2 max-w-prose text-sm text-[var(--color-muted-foreground)]">
          Previsto por categoría frente a lo realmente pagado.
        </p>
      </header>

      <div className="mb-6 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] px-5 py-4 shadow-[var(--shadow-soft)]">
        <GeneralBudget currentCents={generalCents} />
      </div>

      <section className="mb-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] px-5 py-4 shadow-[var(--shadow-soft)]"
          >
            <span className="text-[0.7rem] uppercase tracking-wide text-[var(--color-muted-foreground)]">
              {s.label}
            </span>
            <span
              className={`mt-1 block font-display text-xl tabular-nums ${
                s.danger
                  ? 'text-[var(--color-destructive)]'
                  : 'text-[var(--color-foreground)]'
              }`}
            >
              {formatCents(s.value)}
            </span>
          </div>
        ))}
      </section>

      <section className="mb-12" aria-labelledby="cat-heading">
        <h2
          id="cat-heading"
          className="mb-4 font-display text-xl tracking-tight text-[var(--color-foreground)]"
        >
          Categorías
        </h2>
        <BudgetCategories categories={categoryRows} />
      </section>

      <section aria-labelledby="pay-heading">
        <h2
          id="pay-heading"
          className="mb-4 font-display text-xl tracking-tight text-[var(--color-foreground)]"
        >
          Pagos
        </h2>
        <PaymentList
          rows={paymentRows}
          vendorOptions={vendorRows}
          categoryOptions={categoryOptions}
          today={today}
          soon={soon}
        />
      </section>
    </main>
  )
}
