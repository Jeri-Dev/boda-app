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
 * tick en `useEffect`. Va sobre los paneles de tinta.
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
      className="flex items-stretch justify-center gap-2 sm:gap-3"
      role="timer"
      aria-live="off"
      aria-label="Cuenta atrás para la boda"
    >
      {UNITS.map(({ key, label }, i) => (
        <div key={key} className="flex items-center gap-2 sm:gap-3">
          <div className="flex min-w-[3.9rem] flex-col items-center border border-[var(--color-gold)]/30 bg-[oklch(0.98_0.02_88/0.05)] px-3 py-3.5 sm:min-w-[5rem] sm:px-4">
            <span className="font-display text-3xl font-light tabular-nums leading-none text-[oklch(0.955_0.025_88)] sm:text-[2.75rem]">
              {parts ? String(parts[key]).padStart(2, '0') : '––'}
            </span>
            <span className="mt-2 text-[0.58rem] uppercase tracking-[0.22em] text-[oklch(0.92_0.02_88)]/75 sm:text-[0.62rem]">
              {label}
            </span>
          </div>
          {i < UNITS.length - 1 ? (
            <span aria-hidden className="font-display text-xl text-[var(--color-gold)]/50">
              :
            </span>
          ) : null}
        </div>
      ))}
      {passed ? <span className="sr-only">¡Hoy es el gran día!</span> : null}
    </div>
  )
}
