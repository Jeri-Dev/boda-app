import { describe, expect, it } from 'vitest'

import { formatDateEs, isoDateDR, plusDaysDR } from '@/lib/utils/dates'

describe('isoDateDR / plusDaysDR', () => {
  it('returns a YYYY-MM-DD calendar date', () => {
    expect(isoDateDR()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(isoDateDR(new Date('2026-06-24T12:00:00Z'))).toBe('2026-06-24')
  })

  it('plusDaysDR adds days and stays ahead of today', () => {
    expect(plusDaysDR(0, new Date('2026-06-24T12:00:00Z'))).toBe('2026-06-24')
    expect(plusDaysDR(14, new Date('2026-06-24T12:00:00Z'))).toBe('2026-07-08')
    expect(plusDaysDR(14) > isoDateDR()).toBe(true)
  })
})

describe('formatDateEs', () => {
  it('reorders YYYY-MM-DD to DD/MM/YYYY', () => {
    expect(formatDateEs('2026-06-24')).toBe('24/06/2026')
    expect(formatDateEs('2026-12-01')).toBe('01/12/2026')
  })

  it('echoes malformed input back instead of "undefined/undefined/"', () => {
    expect(formatDateEs('')).toBe('')
    expect(formatDateEs('2026-06')).toBe('2026-06')
  })
})
