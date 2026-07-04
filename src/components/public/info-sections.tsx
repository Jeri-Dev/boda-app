import type { Wedding } from '@/lib/db/schema'

import { PrivacyNotice } from './privacy-notice'

/**
 * Public info content (U2.5, merged with the invitation in U11). Renders only
 * the sections the host filled in (empty ones are hidden). All text is
 * React-escaped; the map is a LINK (not an embed) — simpler and avoids widening
 * the CSP frame-src. The gift section shows transfer details; every surface
 * that renders this stays `noindex` (phishing/IBAN hygiene).
 *
 * Only the pre-existing public fields are shown here — the host-only venue
 * contact fields (venue_phone / venue_coordinator, U9) are intentionally never
 * rendered on any public surface.
 */

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="border-t border-[var(--color-border)] pt-6">
      <h2 className="font-display text-xl tracking-tight text-[var(--color-foreground)]">
        {title}
      </h2>
      <div className="mt-2 whitespace-pre-line text-[0.9375rem] leading-relaxed text-[var(--color-foreground)]">
        {children}
      </div>
    </section>
  )
}

/** True when the host filled in at least one public info section. */
export function hasPublicInfo(wedding: Wedding | null): boolean {
  return Boolean(
    wedding?.venue?.trim() ||
      wedding?.mapUrl?.trim() ||
      wedding?.schedule?.trim() ||
      wedding?.dressCode?.trim() ||
      wedding?.accommodation?.trim() ||
      wedding?.transport?.trim() ||
      wedding?.giftMessage?.trim() ||
      wedding?.giftDetails?.trim(),
  )
}

/**
 * The info Section blocks as a composable fragment — no `<main>`, no couple
 * header, no `PrivacyNotice`. Lives standalone on `/info` OR below the RSVP on
 * the invitation, so the merged page never doubles those landmarks.
 */
export function InfoContent({ wedding }: { wedding: Wedding | null }) {
  const hasLocation = wedding?.venue?.trim() || wedding?.mapUrl?.trim()
  const hasGift = wedding?.giftMessage?.trim() || wedding?.giftDetails?.trim()

  return (
    <div className="flex flex-col gap-8">
      {hasLocation ? (
        <Section title="Ubicación">
          {wedding?.venue ? <p>{wedding.venue}</p> : null}
          {wedding?.mapUrl ? (
            <a
              href={wedding.mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-block text-[var(--color-accent)] underline-offset-4 hover:underline"
            >
              Ver en el mapa →
            </a>
          ) : null}
        </Section>
      ) : null}

      {wedding?.schedule?.trim() ? (
        <Section title="Horario">{wedding.schedule}</Section>
      ) : null}

      {wedding?.dressCode?.trim() ? (
        <Section title="Código de vestimenta">{wedding.dressCode}</Section>
      ) : null}

      {wedding?.accommodation?.trim() ? (
        <Section title="Alojamiento">{wedding.accommodation}</Section>
      ) : null}

      {wedding?.transport?.trim() ? (
        <Section title="Transporte">{wedding.transport}</Section>
      ) : null}

      {hasGift ? (
        <Section title="Mesa de regalos">
          {wedding?.giftMessage ? <p>{wedding.giftMessage}</p> : null}
          {wedding?.giftDetails ? (
            <p className="mt-3 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm">
              {wedding.giftDetails}
            </p>
          ) : null}
        </Section>
      ) : null}
    </div>
  )
}

/** Standalone `/info` page: its own `<main>` + header + privacy footer. */
export function InfoSections({ wedding }: { wedding: Wedding | null }) {
  const couple = wedding?.coupleNames?.trim() || 'Nuestra Boda'

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col gap-8 px-5 py-12 sm:px-8">
      <header className="text-center">
        <p className="text-[0.7rem] uppercase tracking-[0.3em] text-[var(--color-muted-foreground)]">
          Información
        </p>
        <h1 className="mt-3 font-display text-4xl tracking-tight text-[var(--color-foreground)]">
          {couple}
        </h1>
      </header>

      <InfoContent wedding={wedding} />

      <footer className="mt-auto border-t border-[var(--color-border)] pt-6">
        <PrivacyNotice contact={wedding?.privacyContact ?? null} />
      </footer>
    </main>
  )
}
