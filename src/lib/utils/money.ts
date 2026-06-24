/**
 * Money helpers. Amounts are stored as **integer cents** (DOP) to avoid binary
 * float drift; the UI parses/formats at the edges.
 */

const currency = new Intl.NumberFormat('es-DO', {
  style: 'currency',
  currency: 'DOP',
  minimumFractionDigits: 2,
})

/** Format integer cents as `RD$1,234.56`. */
export function formatCents(cents: number): string {
  return currency.format(cents / 100)
}

/**
 * Parse a user-typed amount into integer cents.
 *   - empty / whitespace → `null` (no amount)
 *   - ambiguous or malformed → `NaN` (caller surfaces a validation error)
 *   - otherwise → integer cents
 *
 * Convention (matches Intl es-DO output `RD$85,000.00`): the comma is the
 * thousands separator and the dot is the decimal point with at MOST two
 * digits. Ambiguous inputs are rejected rather than guessed: `85.000` (three
 * decimals — likely "85 mil" typed with a thousands dot), scientific notation
 * (`1e3`), and anything with stray characters all return NaN. Accepts e.g.
 * `85000`, `85,000`, `85,000.50`, `RD$85000.50`.
 */
export function parseMoneyToCents(input: string): number | null {
  const trimmed = input.trim()
  if (trimmed === '') return null
  // Drop a leading currency symbol and thousands separators (commas/spaces).
  const normalized = trimmed.replace(/^RD\$?/i, '').replace(/[\s,]/g, '')
  // Strict shape: optional minus, digits, optional 1–2 decimals. This rejects
  // `85.000`, `1e3`, `1.2.3`, `5x5`, `--5`, etc. (no silent coercion).
  if (!/^-?\d+(\.\d{1,2})?$/.test(normalized)) return NaN
  const n = Number(normalized)
  if (!Number.isFinite(n)) return NaN
  const cents = Math.round(n * 100)
  // Collapse -0 to 0 so the sign never leaks past the non-negative guard.
  return cents === 0 ? 0 : cents
}
