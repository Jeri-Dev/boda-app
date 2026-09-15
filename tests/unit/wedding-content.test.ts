import { describe, expect, it } from 'vitest'

import {
  buildWeddingContent,
  eventStartISO,
  landingSections,
  monogramFor,
  normalizeAccounts,
  normalizeWhatsapp,
  parseDressCode,
  parseNames,
  parseNotes,
  parseSchedule,
  parseTimeLabel,
  splitCoupleNames,
} from '@/lib/wedding-content'

import { weddingRow as row } from './helpers/wedding-row'

describe('names & monogram', () => {
  it('splits «Esther & Jeriel», «Ana y Beto», «A + B»', () => {
    expect(splitCoupleNames('Esther & Jeriel')).toEqual(['Esther', 'Jeriel'])
    expect(splitCoupleNames('Ana y Beto')).toEqual(['Ana', 'Beto'])
    expect(splitCoupleNames('Ana + Beto')).toEqual(['Ana', 'Beto'])
    expect(splitCoupleNames('Yamil')).toEqual(['Yamil', null])
  })

  it('derives the monogram from initials', () => {
    expect(monogramFor('Esther', 'Jeriel')).toBe('E & J')
    expect(monogramFor('Ana', null)).toBe('A')
  })
})

describe('time & date', () => {
  it('parses 12h and 24h time labels', () => {
    expect(parseTimeLabel('4:30 PM')).toEqual({ h: 16, m: 30 })
    expect(parseTimeLabel('4 pm')).toEqual({ h: 16, m: 0 })
    expect(parseTimeLabel('12:00 AM')).toEqual({ h: 0, m: 0 })
    expect(parseTimeLabel('12 PM')).toEqual({ h: 12, m: 0 })
    expect(parseTimeLabel('16:30')).toEqual({ h: 16, m: 30 })
    expect(parseTimeLabel('4:30 p. m.')).toEqual({ h: 16, m: 30 })
    expect(parseTimeLabel('por la tarde')).toBeNull()
    expect(parseTimeLabel(null)).toBeNull()
  })

  it('builds the event start with the DR offset (UTC-4)', () => {
    const date = new Date('2026-11-07T00:00:00Z') // as stored from <input type=date>
    expect(eventStartISO(date, '4:30 PM')).toBe('2026-11-07T16:30:00-04:00')
    expect(eventStartISO(date, null)).toBe('2026-11-07T00:00:00-04:00')
    expect(eventStartISO(null, '4:30 PM')).toBeNull()
    // Sanity: 16:30 in Santo Domingo is 20:30Z.
    expect(new Date(eventStartISO(date, '4:30 PM')!).toISOString()).toBe('2026-11-07T20:30:00.000Z')
  })
})

describe('parseSchedule', () => {
  it('parses «hora · título · detalle» lines with several separators', () => {
    const items = parseSchedule(
      '4:30 PM · Ceremonia religiosa · Recíbenos con tu mejor sonrisa\n6:00 PM | Cóctel de bienvenida\n7:00 PM - Cena\nFiesta — ¡A bailar!',
    )
    expect(items).toEqual([
      { time: '4:30 PM', title: 'Ceremonia religiosa', detail: 'Recíbenos con tu mejor sonrisa', icon: 'ceremonia' },
      { time: '6:00 PM', title: 'Cóctel de bienvenida', detail: null, icon: 'brindis' },
      { time: '7:00 PM', title: 'Cena', detail: null, icon: 'cena' },
      { time: null, title: 'Fiesta', detail: '¡A bailar!', icon: 'fiesta' },
    ])
  })

  it('accepts «4:00 PM Ceremonia» without a separator', () => {
    expect(parseSchedule('4:00 PM Ceremonia')).toEqual([
      { time: '4:00 PM', title: 'Ceremonia', detail: null, icon: 'ceremonia' },
    ])
  })

  it('falls back to a generic icon', () => {
    expect(parseSchedule('Fotos con la familia')[0].icon).toBe('momento')
  })
})

describe('text blocks', () => {
  it('splits a long dress code into title + note when no note is given', () => {
    expect(
      parseDressCode('Vestimenta Formal, favor dejar el color blanco solo a la novia', null),
    ).toEqual({ title: 'Vestimenta Formal', note: 'Favor dejar el color blanco solo a la novia' })
    expect(parseDressCode('Etiqueta', 'Reserva el blanco')).toEqual({
      title: 'Etiqueta',
      note: 'Reserva el blanco',
    })
    expect(parseDressCode('Formal', null)).toEqual({ title: 'Formal', note: null })
    expect(parseDressCode('  ', null)).toBeNull()
  })

  it('parses practical notes as title + text blocks', () => {
    expect(parseNotes('Puntualidad\nVen con tiempo.\n\nSolo adultos: los niños descansan.\n\nSin sombrero')).toEqual([
      { title: 'Puntualidad', text: 'Ven con tiempo.' },
      { title: 'Solo adultos', text: 'los niños descansan.' },
      { title: 'Ten en cuenta', text: 'Sin sombrero' },
    ])
  })

  it('parses parent names per line or comma/«y» separated', () => {
    expect(parseNames('Juan Pérez\nMaría Gómez')).toEqual(['Juan Pérez', 'María Gómez'])
    expect(parseNames('Juan Pérez y María Gómez')).toEqual(['Juan Pérez', 'María Gómez'])
    expect(parseNames('Juan, María')).toEqual(['Juan', 'María'])
    expect(parseNames(null)).toEqual([])
  })
})

describe('contact & accounts', () => {
  it('normalizes WhatsApp numbers to digits', () => {
    expect(normalizeWhatsapp('+1 (809) 555-0000')).toBe('18095550000')
    expect(normalizeWhatsapp('123')).toBeNull()
    expect(normalizeWhatsapp(null)).toBeNull()
  })

  it('drops incomplete accounts and upper-cases the currency', () => {
    expect(
      normalizeAccounts([
        { bank: ' Popular ', holder: 'Ana', type: '', number: '123', currency: 'dop', reference: '' },
        { bank: '', number: '999' },
        'garbage',
      ]),
    ).toEqual([{ bank: 'Popular', holder: 'Ana', type: '', number: '123', currency: 'DOP', reference: '' }])
    expect(normalizeAccounts(null)).toEqual([])
  })
})

describe('buildWeddingContent', () => {
  it('hides every optional block when the row is empty', () => {
    const c = buildWeddingContent(null)
    expect(c.couple.names).toBe('Nuestra boda')
    expect(c.event.startISO).toBeNull()
    expect(c.ceremony).toBeNull()
    expect(c.reception).toBeNull()
    expect(c.timeline).toEqual([])
    expect(c.gifts).toBeNull()
    expect(c.contact).toBeNull()
    expect(c.quote).toBeNull()
    expect(c.dressCode).toBeNull()
    expect(landingSections(c).map((s) => s.id)).toEqual(['invitacion', 'confirmar'])
  })

  it('maps the configured row into the public content', () => {
    const c = buildWeddingContent(
      row({
        coupleNames: 'Esther & Jeriel',
        eventDate: new Date('2026-11-07T00:00:00Z'),
        eventTime: '4:30 PM',
        venue: 'Centro Comunitario',
        venueAddress: 'Av. Principal 1',
        mapUrl: 'https://maps.app.goo.gl/x',
        ceremonyStart: null,
        receptionStart: '7:00 PM',
        hashtag: 'EstherYJeriel',
        giftMessage: 'Tu presencia es el regalo',
        giftAccounts: [{ bank: 'Popular', holder: 'J', type: 'Ahorros', number: '1', currency: 'DOP', reference: '' }],
        contactWhatsapp: '18095550000',
        transport: 'Habrá parqueo',
        // Host-only fields must never leak:
        venuePhone: '809-000',
        venueCoordinator: 'Coordinadora',
      }),
    )
    expect(c.couple.first).toBe('Esther')
    expect(c.couple.second).toBe('Jeriel')
    expect(c.couple.monogram).toBe('E & J')
    expect(c.couple.hashtag).toBe('#EstherYJeriel')
    expect(c.event.startISO).toBe('2026-11-07T16:30:00-04:00')
    expect(c.event.date).toBe('2026-11-07')
    expect(c.ceremony).toMatchObject({ place: 'Centro Comunitario', time: '4:30 PM', address: 'Av. Principal 1' })
    // Same venue → reception reuses the ceremony place.
    expect(c.reception).toMatchObject({ place: 'Centro Comunitario', time: '7:00 PM', sameAsCeremony: true })
    // No schedule → default timeline from the two times.
    expect(c.timeline.map((t) => [t.time, t.title])).toEqual([
      ['4:30 PM', 'Ceremonia'],
      ['7:00 PM', 'Recepción'],
    ])
    expect(c.notes).toEqual([{ title: 'Transporte', text: 'Habrá parqueo' }])
    expect(c.gifts?.accounts).toHaveLength(1)
    expect(c.contact).toEqual({ whatsapp: '18095550000', href: 'https://wa.me/18095550000' })
    expect(landingSections(c).map((s) => s.id)).toEqual(['invitacion', 'lugar', 'detalles', 'regalos', 'confirmar'])
    expect(JSON.stringify(c)).not.toContain('809-000')
    expect(JSON.stringify(c)).not.toContain('Coordinadora')
  })

  it('uses a separate reception venue when configured', () => {
    const c = buildWeddingContent(
      row({ venue: 'Iglesia', receptionPlace: 'Salón', receptionStart: '8 PM', receptionMapUrl: 'https://m/1' }),
    )
    expect(c.reception).toMatchObject({ place: 'Salón', time: '8 PM', mapUrl: 'https://m/1', sameAsCeremony: false })
  })
})
