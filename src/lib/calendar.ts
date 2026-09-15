import type { WeddingContent } from '@/lib/wedding-content'

/**
 * «Guardar en el calendario»: enlace a Google Calendar y archivo .ics
 * (Apple/Outlook). Módulo puro; el .ics se sirve desde
 * `/nuestra-boda/evento.ics` (route handler) para no depender de `data:` URIs
 * bajo la CSP estricta.
 */

/** Duración por defecto del evento cuando no se conoce la hora de fin. */
const DEFAULT_DURATION_MS = 6 * 60 * 60 * 1000

/** 2026-11-07T16:30:00-04:00 → 20261107T203000Z */
export function toUtcStamp(iso: string): string {
  return new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')
}

export type CalendarEvent = {
  title: string
  startISO: string
  endISO: string
  location: string | null
  description: string
  url: string | null
}

export function calendarEvent(c: WeddingContent, siteUrl: string | null): CalendarEvent | null {
  if (!c.event.startISO) return null
  const start = new Date(c.event.startISO)
  const end = new Date(start.getTime() + DEFAULT_DURATION_MS)
  const place = c.ceremony ?? c.reception
  const location = place ? [place.place, place.address].filter(Boolean).join(', ') : c.event.city
  const details = [
    `Boda de ${c.couple.names}.`,
    c.dressCode ? `Vestimenta: ${c.dressCode.title}.` : null,
    siteUrl ? `Invitación: ${siteUrl}` : null,
  ]
    .filter(Boolean)
    .join(' ')
  return {
    title: `Boda de ${c.couple.names}`,
    startISO: start.toISOString(),
    endISO: end.toISOString(),
    location: location ?? null,
    description: details,
    url: siteUrl,
  }
}

export function googleCalendarUrl(e: CalendarEvent): string {
  const p = new URLSearchParams({
    action: 'TEMPLATE',
    text: e.title,
    dates: `${toUtcStamp(e.startISO)}/${toUtcStamp(e.endISO)}`,
    details: e.description,
  })
  if (e.location) p.set('location', e.location)
  return `https://calendar.google.com/calendar/render?${p.toString()}`
}

/** Escapa comas, punto y coma y saltos de línea según RFC 5545. */
function icsText(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n')
}

export function buildIcs(e: CalendarEvent, uid: string): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//boda-app//Nuestra boda//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${toUtcStamp(new Date().toISOString())}`,
    `DTSTART:${toUtcStamp(e.startISO)}`,
    `DTEND:${toUtcStamp(e.endISO)}`,
    `SUMMARY:${icsText(e.title)}`,
    `DESCRIPTION:${icsText(e.description)}`,
    e.location ? `LOCATION:${icsText(e.location)}` : null,
    e.url ? `URL:${e.url}` : null,
    'BEGIN:VALARM',
    'TRIGGER:-P1D',
    'ACTION:DISPLAY',
    `DESCRIPTION:${icsText(`Mañana: ${e.title}`)}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter((l): l is string => l !== null)
  return `${lines.join('\r\n')}\r\n`
}
