'use client'

import { useActionState, useState } from 'react'

import { PrivacyNotice } from '@/components/public/privacy-notice'
import { submitRsvp, type RsvpActionState } from '@/lib/actions/rsvp'
import type { RsvpMember } from '@/lib/data/rsvp'
import { cn } from '@/lib/utils/cn'

import { BlossomSprig, EucalyptusBranch } from './florals'
import { Check, Heart, Whatsapp } from './icons'
import { CornerAccents, SectionHeading } from './ornament'
import { Parallax } from './parallax'
import { Petals } from './petals'
import { Reveal } from './reveal'
import { Seal } from './seal'

export type RsvpProps = {
  token: string
  members: RsvpMember[]
  initialMessage: string | null
  partySize: number
}

type MemberState = {
  guestId: string
  name: string
  plusOne: boolean
  rsvpStatus: 'pending' | 'confirmed' | 'declined'
  plusOneName: string
}

function initState(members: RsvpMember[]): MemberState[] {
  return members.map((m) => ({
    guestId: m.id,
    name: m.name,
    plusOne: m.plusOne,
    rsvpStatus: m.rsvpStatus,
    plusOneName: m.plusOneName ?? '',
  }))
}

/**
 * La tarjeta de respuesta (RSVP), integrada en la invitación.
 *
 * Con enlace personal (`/i/[token]`): el formulario real — un renglón por
 * persona del grupo con «Sí, asistiré» / «No podré ir», el nombre del
 * acompañante cuando el anfitrión lo permitió y un mensaje para los novios.
 * Solo se envían los miembros tocados y solo los campos que el invitado puede
 * escribir; el servidor vuelve a aplicar la misma lista blanca (`submitRsvp`).
 * Al confirmar, el sello de lacre «estampa» la respuesta.
 *
 * Sin enlace (`/nuestra-boda`): explica cómo confirmar y ofrece WhatsApp.
 */
export function RsvpSection({
  rsvp,
  contact,
  privacyContact,
}: {
  rsvp: RsvpProps | null
  contact: { href: string } | null
  privacyContact: string | null
}) {
  return (
    <section
      id="confirmar"
      className="relative isolate scroll-mt-24 overflow-hidden px-16 pb-16 sm:px-8 "
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <Parallax speed={0.12} className="absolute -left-12 top-10 w-28 text-[var(--color-sage)] opacity-30 sm:w-40">
          <div className="rotate-[155deg]">
            <EucalyptusBranch className="landing-sway-slow w-full" />
          </div>
        </Parallax>
        <Parallax speed={0.08} className="absolute -right-6 bottom-16 w-20 text-[var(--color-gold-deep)] opacity-40 sm:w-24">
          <div className="rotate-[15deg]">
            <BlossomSprig className="landing-sway w-full" />
          </div>
        </Parallax>
      </div>

      <div className="mx-auto max-w-3xl">
        <Reveal variant="line">
          <SectionHeading overline="Reserva la fecha" title="¿Nos acompañas?" />
        </Reveal>

        <Reveal variant="scale" delay={120} className="mt-12">
          <div className="landing-card relative p-6 shadow-[var(--shadow-warm)] sm:p-9">
            <CornerAccents />
            {rsvp ? (
              <RsvpForm rsvp={rsvp} privacyContact={privacyContact} />
            ) : (
              <NoTokenCard contact={contact} />
            )}
          </div>
        </Reveal>
      </div>
    </section>
  )
}

function NoTokenCard({ contact }: { contact: { href: string } | null }) {
  return (
    <div className="flex flex-col items-center py-4 text-center">
      <Heart className="h-7 w-7 text-[var(--color-accent)]" />
      <h3 className="mt-5 font-display text-2xl font-light text-[var(--color-foreground)] sm:text-3xl">
        Confirma desde tu enlace personal
      </h3>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-[var(--color-muted-foreground)]">
        Cada invitación lleva un enlace propio con los nombres de tu grupo. Ábrelo
        para decirnos si vienes; podrás cambiar tu respuesta cuando quieras.
      </p>
      {contact ? (
        <a
          href={contact.href}
          target="_blank"
          rel="noopener noreferrer"
          className="landing-shine mt-7 inline-flex h-12 items-center justify-center gap-2 bg-[var(--color-accent)] px-6 text-[0.72rem] uppercase tracking-[0.18em] indent-[0.18em] text-[var(--color-accent-foreground)] shadow-[var(--shadow-soft)] transition-all duration-200 hover:-translate-y-0.5"
        >
          <Whatsapp className="h-4 w-4" />
          ¿No tienes tu enlace? Escríbenos
        </a>
      ) : null}
    </div>
  )
}

function RsvpForm({
  rsvp,
  privacyContact,
}: {
  rsvp: RsvpProps
  privacyContact: string | null
}) {
  const [state, formAction, pending] = useActionState<RsvpActionState, FormData>(
    submitRsvp.bind(null, rsvp.token),
    undefined,
  )
  const [people, setPeople] = useState<MemberState[]>(() => initState(rsvp.members))
  const [touched, setTouched] = useState<Set<string>>(new Set())
  const [editing, setEditing] = useState(false)

  function update(guestId: string, patch: Partial<MemberState>) {
    setPeople((prev) =>
      prev.map((p) => (p.guestId === guestId ? { ...p, ...patch } : p)),
    )
    setTouched((prev) => (prev.has(guestId) ? prev : new Set(prev).add(guestId)))
  }

  const payload = people
    .filter((p) => touched.has(p.guestId))
    .map((p) => ({
      guestId: p.guestId,
      rsvpStatus: p.rsvpStatus,
      plusOneName: p.rsvpStatus === 'confirmed' && p.plusOne ? p.plusOneName : '',
    }))

  const anyConfirmed = people.some((p) => p.rsvpStatus === 'confirmed')
  const answered = people.some((p) => p.rsvpStatus !== 'pending')

  if (state?.ok && !editing) {
    return (
      <div className="relative flex flex-col items-center overflow-hidden py-6 text-center">
        <Petals count={10} />
        <div className="landing-stamp">
          <Seal
            monogram={anyConfirmed ? '♥' : '—'}
            className="h-24 w-24 text-[var(--color-accent)]"
            monogramClassName="text-3xl text-[var(--color-accent-foreground)]"
          />
        </div>
        <h3 className="mt-6 font-display text-3xl font-light text-[var(--color-foreground)]">
          {anyConfirmed ? '¡Gracias por confirmar!' : 'Te echaremos de menos'}
        </h3>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-[var(--color-muted-foreground)]">
          ¡Gracias! Recibimos tu confirmación. Puedes editarla cuando quieras
          desde este mismo enlace.
        </p>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="mt-6 text-sm text-[var(--color-accent)] underline-offset-4 hover:underline"
        >
          Editar mi respuesta
        </button>
      </div>
    )
  }

  return (
    <form action={formAction} onSubmit={() => setEditing(false)}>
      <h3 className="font-display text-2xl font-light tracking-tight text-[var(--color-foreground)] sm:text-3xl">
        {rsvp.members.length === 1
          ? 'Confirma tu asistencia'
          : `Confirmación para ${rsvp.partySize} ${rsvp.partySize === 1 ? 'persona' : 'personas'}`}
      </h3>
      <p className="mt-1.5 mb-7 text-sm text-[var(--color-muted-foreground)]">
        {answered
          ? 'Ya tenemos tu respuesta. Puedes cambiarla aquí cuando quieras.'
          : 'Puedes editar tu respuesta más adelante con este mismo enlace.'}
      </p>

      <input type="hidden" name="members" value={JSON.stringify(payload)} />
      {/* Honeypot — hidden from people, tempting to bots. */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute left-[-9999px] h-0 w-0 opacity-0"
      />

      <ul className="grid gap-6">
        {people.map((p) => (
          <li
            key={p.guestId}
            className="border-b border-[var(--color-border)] pb-6 last:border-b-0 last:pb-0"
          >
            <p className="font-display text-xl font-light text-[var(--color-foreground)]">{p.name}</p>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                aria-pressed={p.rsvpStatus === 'confirmed'}
                onClick={() => update(p.guestId, { rsvpStatus: 'confirmed' })}
                className={cn(
                  'landing-choice flex h-12 items-center justify-center gap-2 border px-4 text-[0.95rem] transition-all duration-200',
                  p.rsvpStatus === 'confirmed'
                    ? 'is-active border-[var(--color-accent)] bg-[var(--color-accent)] text-[var(--color-accent-foreground)]'
                    : 'border-[var(--color-input)] bg-[var(--color-background)] text-[var(--color-foreground)] hover:border-[var(--color-accent)]/60',
                )}
              >
                <Heart className="h-4 w-4" />
                Sí, asistiré
              </button>
              <button
                type="button"
                aria-pressed={p.rsvpStatus === 'declined'}
                onClick={() => update(p.guestId, { rsvpStatus: 'declined' })}
                className={cn(
                  'landing-choice flex h-12 items-center justify-center gap-2 border px-4 text-[0.95rem] transition-all duration-200',
                  p.rsvpStatus === 'declined'
                    ? 'is-active border-[var(--color-foreground)] bg-[var(--color-foreground)] text-[var(--color-background)]'
                    : 'border-[var(--color-input)] bg-[var(--color-background)] text-[var(--color-foreground)] hover:border-[var(--color-foreground)]/50',
                )}
              >
                No podré ir
              </button>
            </div>

            <div
              className={cn(
                'grid overflow-hidden transition-[grid-template-rows,opacity] duration-500',
                p.rsvpStatus === 'confirmed' && p.plusOne
                  ? 'grid-rows-[1fr] opacity-100'
                  : 'grid-rows-[0fr] opacity-0',
              )}
            >
              <div className="min-h-0">
                <label className="mt-4 grid gap-1.5">
                  <span className="text-sm text-[var(--color-muted-foreground)]">
                    Nombre de tu acompañante
                  </span>
                  <input
                    value={p.plusOneName}
                    onChange={(e) => update(p.guestId, { plusOneName: e.target.value })}
                    placeholder="Opcional"
                    tabIndex={p.rsvpStatus === 'confirmed' && p.plusOne ? 0 : -1}
                    className="landing-input"
                  />
                </label>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <label className="mt-7 grid gap-1.5">
        <span className="text-sm text-[var(--color-muted-foreground)]">
          Un mensaje para los novios (opcional)
        </span>
        <textarea
          name="message"
          rows={3}
          defaultValue={rsvp.initialMessage ?? ''}
          placeholder="¡Felicidades! Allí estaremos…"
          className="landing-input resize-none py-3"
        />
      </label>

      <div className="mt-7 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
        <button
          type="submit"
          disabled={pending}
          aria-busy={pending}
          className="landing-shine inline-flex h-12 w-full items-center justify-center gap-2 bg-[var(--color-accent)] px-7 text-[0.75rem] uppercase tracking-[0.2em] indent-[0.2em] text-[var(--color-accent-foreground)] shadow-[var(--shadow-soft)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-warm)] disabled:cursor-progress disabled:opacity-60 sm:w-auto"
        >
          {pending ? 'Enviando…' : 'Enviar confirmación'}
          {!pending ? <Check className="h-4 w-4" /> : null}
        </button>
        {state?.error ? (
          <span role="alert" className="text-sm text-[var(--color-destructive)]">
            {state.error}
          </span>
        ) : null}
      </div>

      <div className="mt-6 border-t border-[var(--color-border)] pt-4">
        <PrivacyNotice contact={privacyContact} />
      </div>
    </form>
  )
}
