'use client'

import { type FormEvent, useId, useState } from 'react'

import { cn } from '@/lib/utils/cn'

import { BlossomSprig, EucalyptusBranch } from './florals'
import { Check, Heart } from './icons'
import { CornerAccents, SectionHeading } from './ornament'
import { Parallax } from './parallax'
import { Reveal } from './reveal'

type Attendance = 'yes' | 'no' | null

/**
 * Sección de confirmación (RSVP). ⚠️ MARCADOR DE POSICIÓN: la UI está completa y
 * accesible, pero el envío NO está conectado — muestra un estado de éxito local.
 *
 * Para integrarlo con tu sistema real: reemplaza `handleSubmit` por una llamada
 * a tu Server Action (p. ej. `submitRsvp` de `@/lib/actions/rsvp`) y pasa el
 * `token` del invitado. La estructura de campos ya coincide con tu modelo.
 */
export function RsvpSection() {
  const [attendance, setAttendance] = useState<Attendance>(null)
  const [sent, setSent] = useState(false)
  const nameId = useId()
  const guestsId = useId()
  const msgId = useId()

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    // TODO(integración): enviar a la Server Action de RSVP en lugar del estado local.
    setSent(true)
  }

  return (
    <section id="confirmar" className="relative isolate scroll-mt-24 overflow-hidden px-5 py-20 sm:px-8 sm:py-28">
      {/* Botánica tenue enmarcando el formulario */}
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
        <Reveal>
          <SectionHeading overline="Reserva la fecha" title="¿Nos acompañas?" />
        </Reveal>

        <Reveal delay={120} className="mt-12">
          <div className="relative border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-[var(--shadow-warm)] sm:p-9">
            <CornerAccents />
            {sent ? (
              <div className="flex flex-col items-center py-6 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-success)]/12 text-[var(--color-success)]">
                  <Check className="h-7 w-7" />
                </div>
                <h3 className="mt-5 font-display text-3xl font-light text-[var(--color-foreground)]">
                  {attendance === 'no' ? 'Te echaremos de menos' : '¡Gracias por confirmar!'}
                </h3>
                <p className="mt-2 max-w-sm text-sm leading-relaxed text-[var(--color-muted-foreground)]">
                  {attendance === 'no'
                    ? 'Lamentamos que no puedas acompañarnos. Gracias por avisarnos con cariño.'
                    : 'Hemos recibido tu respuesta. ¡No podemos esperar a celebrar contigo!'}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSent(false)
                    setAttendance(null)
                  }}
                  className="mt-6 text-sm text-[var(--color-accent)] underline-offset-4 hover:underline"
                >
                  Editar mi respuesta
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                <div>
                  <label
                    htmlFor={nameId}
                    className="mb-1.5 block text-sm font-medium text-[var(--color-foreground)]"
                  >
                    Nombre y apellido
                  </label>
                  <input
                    id={nameId}
                    name="name"
                    type="text"
                    autoComplete="name"
                    required
                    placeholder="Tu nombre completo"
                    className="h-12 w-full rounded-[var(--radius)] border border-[var(--color-input)] bg-[var(--color-background)] px-4 text-[0.95rem] text-[var(--color-foreground)] shadow-[var(--shadow-press)] transition-colors placeholder:text-[var(--color-muted-foreground)] focus:border-[var(--color-accent)]"
                  />
                </div>

                <fieldset>
                  <legend className="mb-2 block text-sm font-medium text-[var(--color-foreground)]">
                    ¿Podrás acompañarnos?
                  </legend>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {(
                      [
                        { value: 'yes', label: 'Sí, allí estaré' },
                        { value: 'no', label: 'No podré asistir' },
                      ] as const
                    ).map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        aria-pressed={attendance === opt.value}
                        onClick={() => setAttendance(opt.value)}
                        className={cn(
                          'flex h-12 items-center justify-center gap-2 rounded-[var(--radius)] border px-4 text-[0.95rem] transition-all duration-200',
                          attendance === opt.value
                            ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/8 font-medium text-[var(--color-accent)]'
                            : 'border-[var(--color-input)] bg-[var(--color-background)] text-[var(--color-foreground)] hover:border-[var(--color-accent)]/50',
                        )}
                      >
                        {opt.value === 'yes' ? (
                          <Heart
                            className={cn(
                              'h-4 w-4',
                              attendance === 'yes'
                                ? 'text-[var(--color-accent)]'
                                : 'text-[var(--color-muted-foreground)]',
                            )}
                          />
                        ) : null}
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </fieldset>

                {/* Campos condicionales cuando asiste */}
                <div
                  className={cn(
                    'grid gap-6 overflow-hidden transition-[max-height,opacity] duration-500',
                    attendance === 'yes'
                      ? 'max-h-96 opacity-100'
                      : 'max-h-0 opacity-0',
                  )}
                >
                  <div>
                    <label
                      htmlFor={guestsId}
                      className="mb-1.5 block text-sm font-medium text-[var(--color-foreground)]"
                    >
                      Número de acompañantes
                    </label>
                    <select
                      id={guestsId}
                      name="guests"
                      defaultValue="0"
                      className="h-12 w-full rounded-[var(--radius)] border border-[var(--color-input)] bg-[var(--color-background)] px-4 text-[0.95rem] text-[var(--color-foreground)] shadow-[var(--shadow-press)] transition-colors focus:border-[var(--color-accent)]"
                    >
                      {['0', '1', '2', '3', '4'].map((n) => (
                        <option key={n} value={n}>
                          {n === '0' ? 'Solo yo' : `${n} ${n === '1' ? 'persona' : 'personas'}`}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor={msgId}
                    className="mb-1.5 block text-sm font-medium text-[var(--color-foreground)]"
                  >
                    Un mensaje para los novios{' '}
                    <span className="font-normal text-[var(--color-muted-foreground)]">
                      (opcional)
                    </span>
                  </label>
                  <textarea
                    id={msgId}
                    name="message"
                    rows={3}
                    placeholder="Escríbenos unas palabras…"
                    className="w-full resize-none rounded-[var(--radius)] border border-[var(--color-input)] bg-[var(--color-background)] px-4 py-3 text-[0.95rem] text-[var(--color-foreground)] shadow-[var(--shadow-press)] transition-colors placeholder:text-[var(--color-muted-foreground)] focus:border-[var(--color-accent)]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={attendance === null}
                  className="flex h-12 w-full items-center justify-center bg-[var(--color-accent)] px-6 text-[0.95rem] font-medium tracking-wide text-[var(--color-accent-foreground)] shadow-[var(--shadow-soft)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-warm)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0"
                >
                  Enviar confirmación
                </button>

                <p className="text-center text-xs text-[var(--color-muted-foreground)]">
                  Podrás editar tu respuesta más adelante con este mismo enlace.
                </p>
              </form>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  )
}
