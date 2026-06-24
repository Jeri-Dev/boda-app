import { describe, expect, it } from 'vitest'

import { formatCents, parseMoneyToCents } from '@/lib/utils/money'

describe('parseMoneyToCents', () => {
  it('parses plain and thousands-separated amounts to cents', () => {
    expect(parseMoneyToCents('85000')).toBe(8_500_000)
    expect(parseMoneyToCents('85,000.50')).toBe(8_500_050)
    expect(parseMoneyToCents('1,234')).toBe(123_400)
    expect(parseMoneyToCents('RD$85000')).toBe(8_500_000)
    expect(parseMoneyToCents('19.99')).toBe(1_999)
  })

  it('returns null for empty input', () => {
    expect(parseMoneyToCents('')).toBeNull()
    expect(parseMoneyToCents('   ')).toBeNull()
  })

  it('rejects ambiguous / malformed input as NaN', () => {
    // `85.000` is ambiguous (thousands-dot) → rejected, never silently 1000x off.
    expect(parseMoneyToCents('85.000')).toBeNaN()
    // Scientific notation must not be coerced (1e3 → "13" historically).
    expect(parseMoneyToCents('1e3')).toBeNaN()
    expect(parseMoneyToCents('no-es-dinero')).toBeNaN()
    expect(parseMoneyToCents('1.2.3')).toBeNaN()
    expect(parseMoneyToCents('--5')).toBeNaN()
  })

  it('collapses -0 to 0', () => {
    expect(Object.is(parseMoneyToCents('-0'), 0)).toBe(true)
  })
})

describe('formatCents', () => {
  it('formats integer cents as RD$ with two decimals', () => {
    expect(formatCents(8_500_000)).toContain('85,000.00')
    expect(formatCents(0)).toContain('0.00')
  })
})
