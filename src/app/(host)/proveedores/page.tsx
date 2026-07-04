import type { Metadata } from 'next'
import Link from 'next/link'
import { and, asc, count, eq, or, sql } from 'drizzle-orm'

import { VendorList } from '@/components/host/vendor-list'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { db } from '@/lib/db'
import { vendors, VENDOR_STATUSES, type VendorStatus } from '@/lib/db/schema'
import { formatCents } from '@/lib/utils/money'

export const metadata: Metadata = {
  title: 'Proveedores',
}

const STATUS_LABELS: Record<VendorStatus, string> = {
  contactado: 'Contactado',
  presupuestado: 'Presupuestado',
  contratado: 'Contratado',
}

function isStatus(v: string | undefined): v is VendorStatus {
  return v != null && (VENDOR_STATUSES as readonly string[]).includes(v)
}

function filterHref(q: string, status: VendorStatus | 'all') {
  const params = new URLSearchParams()
  if (q) params.set('q', q)
  if (status !== 'all') params.set('status', status)
  const qs = params.toString()
  return qs ? `/proveedores?${qs}` : '/proveedores'
}

export default async function ProveedoresPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>
}) {
  const sp = await searchParams
  const q = (sp.q ?? '').trim()
  const status = isStatus(sp.status) ? sp.status : undefined

  // Search across name/category/email, escaping LIKE wildcards.
  const searchCondition = q
    ? (() => {
        const escaped = q.replace(/[\\%_]/g, (c) => `\\${c}`)
        const pattern = `%${escaped}%`
        return or(
          sql`${vendors.name} like ${pattern} escape '\\'`,
          sql`${vendors.category} like ${pattern} escape '\\'`,
          sql`${vendors.email} like ${pattern} escape '\\'`,
        )
      })()
    : undefined

  const listWhere = and(
    searchCondition,
    status ? eq(vendors.status, status) : undefined,
  )

  const [rows, countRows] = await Promise.all([
    db.select().from(vendors).where(listWhere).orderBy(asc(vendors.name)),
    db
      .select({ status: vendors.status, n: count() })
      .from(vendors)
      .where(searchCondition)
      .groupBy(vendors.status),
  ])

  const counts = { total: 0, contactado: 0, presupuestado: 0, contratado: 0 }
  for (const r of countRows) {
    counts[r.status] += r.n
    counts.total += r.n
  }

  const totalCents = rows.reduce((sum, v) => sum + (v.amountCents ?? 0), 0)

  const chips = [
    { key: 'all' as const, label: 'Todos', n: counts.total },
    ...VENDOR_STATUSES.map((s) => ({
      key: s,
      label: STATUS_LABELS[s],
      n: counts[s],
    })),
  ]
  const active = status ?? 'all'
  const filtering = Boolean(q || status)

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6">
      <header className="mb-8">
        <h1 className="font-display text-3xl tracking-tight text-[var(--color-foreground)]">
          Proveedores
        </h1>
        <p className="mt-2 max-w-prose text-sm text-[var(--color-muted-foreground)]">
          Directorio con el estado del trato, el importe y el contrato.
        </p>
      </header>

      <form method="get" className="mb-4 flex flex-wrap items-center gap-2">
        {status ? <input type="hidden" name="status" value={status} /> : null}
        <Input
          name="q"
          defaultValue={q}
          placeholder="Buscar por nombre, categoría o email…"
          className="h-10 max-w-xs"
          aria-label="Buscar proveedores"
        />
        <Button type="submit" size="sm" variant="outline">
          Buscar
        </Button>
        {filtering ? (
          <Link
            href="/proveedores"
            className="text-sm text-[var(--color-muted-foreground)] underline-offset-4 hover:underline"
          >
            Limpiar
          </Link>
        ) : null}
      </form>

      <nav className="mb-3 flex flex-wrap gap-2" aria-label="Filtrar por estado">
        {chips.map((c) => {
          const isActive = c.key === active
          return (
            <Link
              key={c.key}
              href={filterHref(q, c.key)}
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

      {rows.length > 0 ? (
        <p className="mb-6 text-sm text-[var(--color-muted-foreground)]">
          Importe total de la vista:{' '}
          <span className="font-medium text-[var(--color-foreground)] tabular-nums">
            {formatCents(totalCents)}
          </span>
        </p>
      ) : null}

      <VendorList vendors={rows} />
    </main>
  )
}
