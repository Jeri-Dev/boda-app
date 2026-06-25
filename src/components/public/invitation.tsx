import type { RsvpMember, RsvpView } from '@/lib/data/rsvp'
import type { Wedding } from '@/lib/db/schema'
import type { RsvpStatus } from '@/lib/db/schema'

/**
 * Public invitation (U2.2) — read-only display rendered from the wedding config
 * + the token's projected view. The interactive RSVP form lands in U2.3 inside
 * the `#confirmar` section. All guest/host text is rendered as plain children,
 * so React escapes it (the project's primary XSS defense for the public
 * surface — see docs/solutions).
 */

const STATUS_LABEL: Record<RsvpStatus, { label: string; dot: string }> = {
  pending: { label: 'Sin responder', dot: 'var(--color-gold)' },
  confirmed: { label: 'Confirmado', dot: 'var(--color-success)' },
  declined: { label: 'No asiste', dot: 'var(--color-destructive)' },
}

function formatLongDate(date: Date): string {
  // Format the stored calendar date in UTC so it matches what the host entered
  // (the value is midnight UTC), no timezone drift.
  return new Intl.DateTimeFormat('es-DO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date)
}

function MemberRow({ member }: { member: RsvpMember }) {
  const meta = STATUS_LABEL[member.rsvpStatus]
  return (
    <li className="flex items-center justify-between gap-3 border-b border-[var(--color-border)] py-3 last:border-b-0">
      <div className="min-w-0">
        <span className="block truncate text-[var(--color-foreground)]">
          {member.name}
        </span>
        {member.plusOne ? (
          <span className="text-xs text-[var(--color-muted-foreground)]">
            {member.plusOneName
              ? `+1: ${member.plusOneName}`
              : 'Puede traer acompañante'}
          </span>
        ) : null}
      </div>
      <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap text-sm text-[var(--color-muted-foreground)]">
        <span
          aria-hidden
          className="h-2 w-2 rounded-full"
          style={{ background: meta.dot }}
        />
        {meta.label}
      </span>
    </li>
  )
}

export function Invitation({
  view,
  wedding,
}: {
  view: Extract<RsvpView, { state: 'valid' }>
  wedding: Wedding | null
}) {
  const couple = wedding?.coupleNames?.trim() || 'Nuestra Boda'

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col px-5 py-12 sm:px-8">
      {/* Hero */}
      <section className="text-center">
        <p className="text-[0.7rem] uppercase tracking-[0.3em] text-[var(--color-muted-foreground)]">
          Nos casamos
        </p>
        <h1 className="mt-4 font-display text-4xl leading-tight tracking-tight text-[var(--color-foreground)] sm:text-5xl">
          {couple}
        </h1>

        <div className="mt-6 flex flex-col items-center gap-1 text-[var(--color-foreground)]">
          {wedding?.eventDate ? (
            <p className="font-display text-lg capitalize">
              {formatLongDate(new Date(wedding.eventDate))}
            </p>
          ) : null}
          {wedding?.eventTime ? (
            <p className="text-sm text-[var(--color-muted-foreground)]">
              {wedding.eventTime}
            </p>
          ) : null}
          {wedding?.venue ? (
            <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
              {wedding.venue}
            </p>
          ) : null}
        </div>
      </section>

      {wedding?.message?.trim() ? (
        <section className="mt-10">
          <p className="mx-auto max-w-prose whitespace-pre-line text-center text-[0.9375rem] leading-relaxed text-[var(--color-foreground)]">
            {wedding.message}
          </p>
        </section>
      ) : null}

      {/* Group + status (read-only; the editable form arrives in U2.3) */}
      <section id="confirmar" className="mt-12">
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] px-6 py-5 shadow-[var(--shadow-soft)]">
          <h2 className="font-display text-xl tracking-tight text-[var(--color-foreground)]">
            {view.members.length === 1
              ? 'Tu invitación'
              : `Invitación para ${view.partySize} ${view.partySize === 1 ? 'persona' : 'personas'}`}
          </h2>
          <ul className="mt-3">
            {view.members.map((m) => (
              <MemberRow key={m.id} member={m} />
            ))}
          </ul>
          <p className="mt-4 text-sm text-[var(--color-muted-foreground)]">
            Pronto podrás confirmar tu asistencia desde aquí.
          </p>
        </div>
      </section>

      <footer className="mt-auto pt-12 text-center text-xs text-[var(--color-muted-foreground)]">
        Con cariño, {couple}.
      </footer>
    </main>
  )
}

/** Neutral page for a missing / revoked / expired token (no oracle, no 500). */
export function InvitationInvalid() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <h1 className="font-display text-3xl text-[var(--color-foreground)]">
        Invitación no disponible
      </h1>
      <p className="mt-3 max-w-sm text-sm text-[var(--color-muted-foreground)]">
        Este enlace no es válido o ha caducado. Si crees que es un error,
        contacta con los novios para que te envíen uno nuevo.
      </p>
    </main>
  )
}
