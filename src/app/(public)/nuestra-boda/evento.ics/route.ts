import { buildIcs, calendarEvent } from '@/lib/calendar'
import { getWeddingContent } from '@/lib/data/wedding'
import { site } from '@/lib/site'

/**
 * `GET /nuestra-boda/evento.ics` — el evento para Apple Calendar / Outlook.
 * Público (misma superficie que la landing); solo contiene datos ya visibles
 * en la invitación (nombres, fecha, lugar). Sin fecha configurada → 404.
 */
export async function GET() {
  const content = await getWeddingContent()
  const event = calendarEvent(content, `${site.url}/nuestra-boda`)
  if (!event) {
    return new Response('La fecha de la boda aún no está configurada.', {
      status: 404,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  }

  let host = 'boda'
  try {
    host = new URL(site.url).host
  } catch {
    /* keep default */
  }

  return new Response(buildIcs(event, `nuestra-boda@${host}`), {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'attachment; filename="boda.ics"',
      'Cache-Control': 'no-store',
    },
  })
}
