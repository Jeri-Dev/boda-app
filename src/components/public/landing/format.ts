/**
 * Formateo de fecha para la landing. La fecha del evento se guarda como ISO
 * local en `content.ts`; aquí la mostramos en español (es-DO), fijando la zona
 * de RD para que un servidor en UTC no desplace el día.
 */
const DR_TZ = 'America/Santo_Domingo'

/** «viernes, 5 de diciembre de 2026» (con la primera letra en mayúscula). */
export function formatLongDateEs(iso: string): string {
  const s = new Intl.DateTimeFormat('es-DO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: DR_TZ,
  }).format(new Date(iso))
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/** Partes compactas para el sello del hero: { weekday, day, month, year }. */
export function dateParts(iso: string) {
  const date = new Date(iso)
  const f = (opts: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat('es-DO', { timeZone: DR_TZ, ...opts }).format(date)
  return {
    weekday: f({ weekday: 'long' }),
    day: f({ day: 'numeric' }),
    month: f({ month: 'long' }),
    year: f({ year: 'numeric' }),
  }
}

/** Cabeceras del calendario, semana empezando en lunes (como en RD). */
export const WEEKDAY_INITIALS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'] as const

/**
 * Rejilla del mes de la boda para el calendario impreso: semanas de siete
 * celdas (`null` fuera del mes) y el día señalado.
 *
 * La fecha se descompone primero en año/mes/día **en la zona de RD** y a partir
 * de ahí todo el cálculo es aritmética en UTC, de modo que un servidor en otra
 * zona nunca desplaza el mes ni el día marcado.
 */
export function monthGrid(iso: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: DR_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(iso))
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value)

  const year = part('year')
  const month = part('month') // 1-12
  const day = part('day')

  // getUTCDay(): 0 = domingo → desplazamos para que el lunes sea la columna 0.
  const lead = (new Date(Date.UTC(year, month - 1, 1)).getUTCDay() + 6) % 7
  const total = new Date(Date.UTC(year, month, 0)).getUTCDate()

  const cells: (number | null)[] = [
    ...Array.from({ length: lead }, () => null),
    ...Array.from({ length: total }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  const weeks: (number | null)[][] = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))

  const monthLabel = new Intl.DateTimeFormat('es-DO', {
    month: 'long',
    timeZone: DR_TZ,
  }).format(new Date(iso))

  return { weeks, day, year, monthLabel }
}
