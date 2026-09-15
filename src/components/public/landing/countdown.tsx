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
 * Un dígito que «rueda»: al cambiar, el nuevo valor entra desde abajo y el
 * anterior sale por arriba (solo transform/opacity). El `key` fuerza el
 * remount y con él la animación de entrada.
 */
function Digit({ value }: { value: string }) {
  return (
    <span className="landing-roll" aria-hidden>
      <span key={value} className="landing-roll-in">
        {value}
      </span>
    </span>
  )
}

/**
 * Cuenta atrás en vivo. Renderiza un estado estable en el servidor (evita
 * desajuste de hidratación) y arranca el tick en `useEffect`. Sobre tinta.
 */
export function Countdown({ dateISO }: { dateISO: string }) {
  const targetMs = new Date(dateISO).getTime()
  const [parts, setParts] = useState<Parts | null>(null)

  useEffect(() => {
    setParts(diff(targetMs))
    const id = window.setInterval(() => setParts(diff(targetMs)), 1000)
    return () => window.clearInterval(id)
  }, [targetMs])

  const passed = parts !== null && targetMs - Date.now() <= 0

  if (passed) {
    return (
      <p
        className="text-[2.6rem] leading-tight text-[var(--color-gold)] sm:text-5xl"
        style={{ fontFamily: 'var(--font-script)' }}
      >
        ¡Hoy es el gran día!
      </p>
    )
  }

  return (
    <div
      className="flex items-stretch justify-center gap-2 sm:gap-3"
      role="timer"
      aria-live="off"
      aria-label="Cuenta atrás para la boda"
    >
      {UNITS.map(({ key, label }, i) => {
        const raw = parts ? String(parts[key]).padStart(2, '0') : '––'
        return (
          <div key={key} className="flex items-center gap-2 sm:gap-3">
            <div className="landing-count-cell flex min-w-[3.9rem] flex-col items-center px-3 py-3.5 sm:min-w-[5rem] sm:px-4">
              <span className="sr-only">
                {raw} {label}
              </span>
              <span className="flex font-display text-3xl font-light tabular-nums leading-none text-[oklch(0.955_0.025_88)] sm:text-[2.75rem]">
                {raw.split('').map((ch, j) => (
                  <Digit key={j} value={ch} />
                ))}
              </span>
              <span
                aria-hidden
                className="mt-2 text-[0.58rem] uppercase tracking-[0.22em] text-[oklch(0.92_0.02_88)]/75 sm:text-[0.62rem]"
              >
                {label}
              </span>
            </div>
            {i < UNITS.length - 1 ? (
              <span aria-hidden className="landing-colon font-display text-xl text-[var(--color-gold)]/50">
                :
              </span>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}
