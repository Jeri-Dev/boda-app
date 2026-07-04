import type { RsvpView } from '@/lib/data/rsvp'
import type { Wedding } from '@/lib/db/schema'

import { InfoContent, hasPublicInfo } from './info-sections'
import { PrivacyNotice } from './privacy-notice'
import { RsvpForm } from './rsvp-form'

/**
 * Public invitation (U2.2/U2.3) — display rendered from the wedding config + the
 * token's projected view, with the interactive RSVP form in the `#confirmar`
 * section. All guest/host text is rendered as plain children, so React escapes
 * it (the project's primary XSS defense for the public surface — see
 * docs/solutions).
 */

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

export function Invitation({
  view,
  wedding,
  token,
}: {
  view: Extract<RsvpView, { state: 'valid' }>
  wedding: Wedding | null
  token: string
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

      {/* RSVP form (U2.3) */}
      <section id="confirmar" className="mt-12">
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] px-6 py-5 shadow-[var(--shadow-soft)]">
          <h2 className="font-display text-xl tracking-tight text-[var(--color-foreground)]">
            {view.members.length === 1
              ? 'Confirma tu asistencia'
              : `Confirmación para ${view.partySize} ${view.partySize === 1 ? 'persona' : 'personas'}`}
          </h2>
          <p className="mt-1 mb-5 text-sm text-[var(--color-muted-foreground)]">
            Puedes editar tu respuesta más adelante con este mismo enlace.
          </p>
          <RsvpForm
            token={token}
            members={view.members}
            initialMessage={view.message}
          />
          <div className="mt-5 border-t border-[var(--color-border)] pt-4">
            <PrivacyNotice contact={wedding?.privacyContact ?? null} />
          </div>
        </div>
      </section>

      {/* Info below the invitation (U11) — same page, no duplicate landmarks. */}
      {hasPublicInfo(wedding) ? (
        <section id="info" className="mt-14">
          <h2 className="mb-6 text-center font-display text-2xl tracking-tight text-[var(--color-foreground)]">
            Información
          </h2>
          <InfoContent wedding={wedding} />
        </section>
      ) : null}

      <footer className="mt-auto pt-12 text-center text-xs text-[var(--color-muted-foreground)]">
        {hasPublicInfo(wedding) ? (
          <a
            href="#info"
            className="text-[var(--color-accent)] underline-offset-4 hover:underline"
          >
            Más información sobre la boda →
          </a>
        ) : null}
        <p className="mt-3">Con cariño, {couple}.</p>
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
