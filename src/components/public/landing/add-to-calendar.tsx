import type { CalendarEvent } from '@/lib/calendar'
import { googleCalendarUrl } from '@/lib/calendar'

import { CalendarIcon, Download } from './icons'

/**
 * «Guardar la fecha»: Google Calendar (enlace) y un archivo .ics para Apple /
 * Outlook, servido por `/nuestra-boda/evento.ics`. Va sobre tinta.
 */
export function AddToCalendar({ event }: { event: CalendarEvent }) {
  // En móvil los dos botones comparten ancho y se apilan; sueltos y con textos
  // de largo distinto el bloque quedaba escalonado.
  const base =
    'inline-flex h-11 w-full items-center justify-center gap-2 border border-[var(--color-gold)]/40 px-4 text-[0.68rem] uppercase tracking-[0.18em] indent-[0.18em] text-[var(--color-gold)] transition-colors hover:bg-[var(--color-gold)] hover:text-[var(--color-ink)] sm:w-auto'
  return (
    <div className="mx-auto grid w-full max-w-[19rem] gap-3 sm:flex sm:max-w-none sm:flex-wrap sm:items-center sm:justify-center">
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
