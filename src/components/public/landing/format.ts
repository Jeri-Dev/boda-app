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
