'use client'

import { useEffect, useState } from 'react'

type Parts = { days: number; hours: number; minutes: number; seconds: number }

function diff(targetMs: number): Parts {
  const total = Math.max(0, targetMs - Date.now())
  const days = Math.floor(total / 86_400_000)
  const hours = Math.floor((total % 86_400_000) / 3_600_000)
  const minutes = Math.floor((total % 3_600_000) / 60_000)
  const seconds = Math.floor((total % 60_000) / 1000)
  return { days, hours, minutes, seconds }
}

const UNITS: { key: keyof Parts; label: string }[] = [
  { key: 'days', label: 'días' },
  { key: 'hours', label: 'horas' },
  { key: 'minutes', label: 'min' },
  { key: 'seconds', label: 'seg' },
]

/**
 * Cuenta atrás en vivo hacia la fecha del evento. Renderiza un estado estable
 * en el servidor/primer render (evita desajuste de hidratación) y arranca el
 * tick en `useEffect`.
 */
export function Countdown({ dateISO }: { dateISO: string }) {
  const targetMs = new Date(dateISO).getTime()
  const [parts, setParts] = useState<Parts | null>(null)

  useEffect(() => {
    setParts(diff(targetMs))
    const id = window.setInterval(() => setParts(diff(targetMs)), 1000)
    return () => window.clearInterval(id)
  }, [targetMs])

  const passed = parts && targetMs - Date.now() <= 0

  return (
    <div
      className="flex items-stretch justify-center gap-2 sm:gap-4"
      role="timer"
      aria-live="off"
      aria-label="Cuenta atrás para la boda"
    >
      {UNITS.map(({ key, label }, i) => (
        <div key={key} className="flex items-center gap-2 sm:gap-4">
          <div className="flex min-w-[3.75rem] flex-col items-center rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)]/70 px-3 py-3 shadow-[var(--shadow-soft)] backdrop-blur-sm sm:min-w-[4.75rem] sm:px-4 sm:py-4">
            <span className="font-display text-2xl tabular-nums leading-none tracking-tight text-[var(--color-foreground)] sm:text-4xl">
              {parts ? String(parts[key]).padStart(2, '0') : '––'}
            </span>
            <span className="mt-1.5 text-[0.6rem] uppercase tracking-[0.2em] text-[var(--color-muted-foreground)] sm:text-[0.65rem]">
              {label}
            </span>
          </div>
          {i < UNITS.length - 1 ? (
            <span
              aria-hidden
              className="font-display text-xl text-[var(--color-accent)]/40 sm:text-2xl"
            >
              :
            </span>
          ) : null}
        </div>
      ))}
      {passed ? (
        <span className="sr-only">¡Hoy es el gran día!</span>
      ) : null}
    </div>
  )
}
