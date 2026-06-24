/**
 * Date helpers. Calendar dates are timezone-free `YYYY-MM-DD` strings; "today"
 * is computed in the wedding's local zone (RD is UTC-4, no DST) so a UTC server
 * doesn't roll the date over in the evening and flag things a day early.
 */

const DR_TZ = 'America/Santo_Domingo'

const drDateFmt = new Intl.DateTimeFormat('en-CA', {
  timeZone: DR_TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

/** Calendar date (`YYYY-MM-DD`) in the wedding's local zone. */
export function isoDateDR(d: Date = new Date()): string {
  return drDateFmt.format(d)
}

/** Today + `days`, as a DR-local `YYYY-MM-DD` (no DST → fixed offset). */
export function plusDaysDR(days: number, from: Date = new Date()): string {
  return isoDateDR(new Date(from.getTime() + days * 86_400_000))
}

/** Format a `YYYY-MM-DD` calendar date as `DD/MM/YYYY` (no timezone math). */
export function formatDateEs(iso: string): string {
  // Defensive: a shared util shouldn't render "undefined/undefined/" if a
  // caller passes something unvalidated — echo unexpected input back instead.
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}
