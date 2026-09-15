import { describe, expect, it } from 'vitest'

import { buildIcs, calendarEvent, googleCalendarUrl, toUtcStamp } from '@/lib/calendar'
import { buildWeddingContent } from '@/lib/wedding-content'

import { weddingRow } from './helpers/wedding-row'

describe('calendar', () => {
  it('formats UTC stamps', () => {
    expect(toUtcStamp('2026-11-07T16:30:00-04:00')).toBe('20261107T203000Z')
  })

  it('returns null without a date and builds the event otherwise', () => {
    expect(calendarEvent(buildWeddingContent(null), null)).toBeNull()

    const content = buildWeddingContent(
      weddingRow({
        coupleNames: 'Ana & Beto',
        eventDate: new Date('2026-11-07T00:00:00Z'),
        eventTime: '4:30 PM',
        venue: 'Salón',
        venueAddress: 'Calle 1',
      }),
    )
    const ev = calendarEvent(content, 'https://boda.example/nuestra-boda')!
    expect(ev.title).toBe('Boda de Ana & Beto')
    expect(ev.startISO).toBe('2026-11-07T20:30:00.000Z')
    expect(ev.location).toBe('Salón, Calle 1')

    const g = new URL(googleCalendarUrl(ev))
    expect(g.searchParams.get('dates')).toBe('20261107T203000Z/20261108T023000Z')

    const ics = buildIcs(ev, 'uid@test')
    expect(ics).toContain('BEGIN:VCALENDAR')
    expect(ics).toContain('DTSTART:20261107T203000Z')
    expect(ics).toContain('SUMMARY:Boda de Ana & Beto')
    expect(ics).toContain('LOCATION:Salón\\, Calle 1')
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true)
  })
})
