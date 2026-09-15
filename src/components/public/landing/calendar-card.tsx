'use client'

import { Heart } from './icons'
import { monthGrid, WEEKDAY_INITIALS } from './format'
import { useInView } from './reveal'

/**
 * El mes de la boda, impreso. El día señalado lleva un disco de champán y un
 * corazón; un anillo se dibuja alrededor cuando el calendario entra en
 * pantalla, como si alguien lo rodeara con la pluma. Sobre tinta.
 */
export function CalendarCard({ dateISO }: { dateISO: string }) {
  const { weeks, day, year, monthLabel } = monthGrid(dateISO)
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.4 })

  return (
    <div ref={ref} className={`mx-auto w-full max-w-sm ${inView ? 'is-shown' : ''}`}>
      <p className="text-center text-[0.68rem] uppercase tracking-[0.38em] text-[var(--color-gold)]">
        {monthLabel} {year}
      </p>

      <table className="mt-5 w-full border-separate border-spacing-y-1.5 text-center">
        <caption className="sr-only">
          Calendario de {monthLabel} de {year}; la boda es el día {day}.
        </caption>
        <thead>
          <tr>
            {WEEKDAY_INITIALS.map((initial, i) => (
              <th
                key={i}
                scope="col"
                className="pb-2 text-[0.62rem] font-normal uppercase tracking-[0.14em] text-[oklch(0.92_0.02_88)]/65"
              >
                {initial}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week, wi) => (
            <tr key={wi}>
              {week.map((cell, ci) => {
                if (cell === null) return <td key={ci} />
                if (cell === day) {
                  return (
                    <td key={ci}>
                      <span className="relative inline-flex h-9 w-9 items-center justify-center">
                        <svg
                          aria-hidden
                          viewBox="0 0 40 40"
                          className="landing-ring absolute -inset-1 h-[calc(100%+0.5rem)] w-[calc(100%+0.5rem)] text-[var(--color-gold)]"
                        >
                          <circle
                            cx="20"
                            cy="20"
                            r="18"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.1"
                            strokeLinecap="round"
                          />
                        </svg>
                        <span className="absolute inset-0.5 rounded-full bg-[var(--color-gold)]" />
                        <span className="relative text-sm font-medium tabular-nums text-[var(--color-ink)]">
                          {cell}
                        </span>
                        <Heart className="landing-pulse absolute -right-1.5 -top-1.5 h-3.5 w-3.5 fill-[var(--color-gold)] text-[var(--color-gold)]" />
                      </span>
                    </td>
                  )
                }
                return (
                  <td
                    key={ci}
                    className="h-9 text-sm tabular-nums text-[oklch(0.92_0.02_88)]/75"
                  >
                    {cell}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
