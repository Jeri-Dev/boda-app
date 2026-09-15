import type { CalendarEvent } from '@/lib/calendar'
import { googleCalendarUrl } from '@/lib/calendar'

import { CalendarIcon, Download } from './icons'

/**
 * «Guardar la fecha»: Google Calendar (enlace) y un archivo .ics para Apple /
 * Outlook, servido por `/nuestra-boda/evento.ics`. Va sobre tinta.
 */
export function AddToCalendar({ event }: { event: CalendarEvent }) {
  const base =
    'inline-flex h-11 items-center justify-center gap-2 border border-[var(--color-gold)]/40 px-4 text-[0.68rem] uppercase tracking-[0.18em] text-[var(--color-gold)] transition-colors hover:bg-[var(--color-gold)] hover:text-[var(--color-ink)]'
  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <a href={googleCalendarUrl(event)} target="_blank" rel="noopener noreferrer" className={base}>
        <CalendarIcon className="h-4 w-4" />
        Google Calendar
      </a>
      <a href="/nuestra-boda/evento.ics" className={base}>
        <Download className="h-4 w-4" />
        Apple / Outlook (.ics)
      </a>
    </div>
  )
}
