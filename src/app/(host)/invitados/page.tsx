import type { Metadata } from 'next'
import Link from 'next/link'
import { and, asc, count, eq, or, sql } from 'drizzle-orm'

import { GuestList } from '@/components/host/guest-list'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { db } from '@/lib/db'
import { guests, RSVP_STATUSES, type RsvpStatus } from '@/lib/db/schema'

export const metadata: Metadata = {
  title: 'Invitados',
}

const STATUS_LABELS: Record<RsvpStatus, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  declined: 'No asiste',
}

function isStatus(v: string | undefined): v is RsvpStatus {
  return v != null && (RSVP_STATUSES as readonly string[]).includes(v)
}

/** Build a `/invitados` href preserving the current query, overriding `status`. */
function filterHref(q: string, status: RsvpStatus | 'all') {
  const params = new URLSearchParams()
  if (q) params.set('q', q)
  if (status !== 'all') params.set('status', status)
  const qs = params.toString()
  return qs ? `/invitados?${qs}` : '/invitados'
}

export default async function InvitadosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>
}) {
  const sp = await searchParams
  const q = (sp.q ?? '').trim()
  const status = isStatus(sp.status) ? sp.status : undefined

  // Search across name/household/email. Escape LIKE wildcards (% and _) with a
  // backslash + ESCAPE clause so a literal underscore/percent typed by the host
  // matches literally instead of acting as a wildcard.
  const searchCondition = q
    ? (() => {
        const escaped = q.replace(/[\\%_]/g, (c) => `\\${c}`)
        const pattern = `%${escaped}%`
        return or(
          sql`${guests.name} like ${pattern} escape '\\'`,
          sql`${guests.household} like ${pattern} escape '\\'`,
          sql`${guests.email} like ${pattern} escape '\\'`,
        )
      })()
    : undefined

  const listWhere = and(
    searchCondition,
    status ? eq(guests.rsvpStatus, status) : undefined,
  )

  const [rows, countRows] = await Promise.all([
    db.select().from(guests).where(listWhere).orderBy(asc(guests.name)),
    // Counts honor the active search (across all statuses) so the chips and the
    // visible list never disagree.
    db
      .select({ status: guests.rsvpStatus, n: count() })
      .from(guests)
      .where(searchCondition)
      .groupBy(guests.rsvpStatus),
  ])

  const counts = { total: 0, pending: 0, confirmed: 0, declined: 0 }
  for (const r of countRows) {
    counts[r.status] += r.n
    counts.total += r.n
  }

  const chips = [
    { key: 'all' as const, label: 'Todos', n: counts.total },
    ...RSVP_STATUSES.map((s) => ({
      key: s,
      label: STATUS_LABELS[s],
      n: counts[s],
    })),
  ]
  const active = status ?? 'all'
  const filtering = Boolean(q || status)

  return (
    <>
      {/* Search (GET form) — `status` rides along as a hidden field. */}
      <form method="get" className="mb-4 flex flex-wrap items-center gap-2">
        {status ? <input type="hidden" name="status" value={status} /> : null}
        <Input
          name="q"
          defaultValue={q}
          placeholder="Buscar por nombre, hogar o email…"
          className="h-10 max-w-xs"
          aria-label="Buscar invitados"
        />
        <Button type="submit" size="sm" variant="outline">
          Buscar
        </Button>
        {filtering ? (
          <Link
            href="/invitados"
            className="text-sm text-[var(--color-muted-foreground)] underline-offset-4 hover:underline"
          >
            Limpiar
          </Link>
        ) : null}
      </form>

      {/* Status filter chips. */}
      <nav className="mb-6 flex flex-wrap gap-2" aria-label="Filtrar por estado">
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

      <GuestList guests={rows} />
    </>
  )
}
