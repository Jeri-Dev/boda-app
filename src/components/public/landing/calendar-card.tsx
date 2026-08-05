import { Heart } from './icons'
import { monthGrid, WEEKDAY_INITIALS } from './format'

/**
 * El mes de la boda, impreso. Un calendario dice la fecha mejor que cualquier
 * frase: se ve en qué semana cae, cuánto queda de mes y qué día hay que pedir
 * libre. El día señalado lleva un disco de champán y un corazón.
 *
 * Pensado para ir sobre los paneles de tinta (fondo oscuro).
 */
export function CalendarCard({ dateISO }: { dateISO: string }) {
  const { weeks, day, year, monthLabel } = monthGrid(dateISO)

  return (
    <div className="mx-auto w-full max-w-sm">
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
                      <span className="relative inline-flex h-8 w-8 items-center justify-center">
                        <span className="absolute inset-0 rounded-full bg-[var(--color-gold)]" />
                        <span className="relative text-sm font-medium tabular-nums text-[var(--color-ink)]">
                          {cell}
                        </span>
                        <Heart className="landing-pulse absolute -right-1.5 -top-1.5 h-3.5 w-3.5 fill-[var(--color-gold)] text-[var(--color-gold)]" />
                        <span className="sr-only"> — el gran día</span>
                      </span>
                    </td>
                  )
                }
                return (
                  <td
                    key={ci}
                    className="text-sm tabular-nums text-[oklch(0.92_0.02_88)]/78"
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
