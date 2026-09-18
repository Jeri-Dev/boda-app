import type { RsvpView } from '@/lib/data/rsvp'
import { calendarEvent } from '@/lib/calendar'
import { site } from '@/lib/site'
import { landingSections, type WeddingContent } from '@/lib/wedding-content'

import { AudioProvider } from './audio-context'
import { CountdownBand } from './countdown-band'
import { DetailsSection } from './details-section'
import { EnvelopeIntro } from './envelope-intro'
import { Grain } from './florals'
import { Footer } from './footer'
import { script, serif } from './fonts'
import { formatLongDateEs } from './format'
import { GiftsSection } from './gifts-section'
import { Hero } from './hero'
import { InvitationSection } from './invitation-section'
import { MusicPlayer } from './music-player'
import { RsvpSection } from './rsvp-section'
import { SiteHeader } from './site-header'
import { VenueSection } from './venue-section'

import './landing.css'

/**
 * La invitación completa, en una sola página.
 *
 * Se lee como la papelería que imita: el sobre cerrado (intro), la tarjeta
 * (hero, tinta), la invitación (papel), la placa con la fecha (tinta), el
 * lugar y los detalles (papel), la mesa de regalos (tinta), la confirmación
 * (papel) y la contraportada (tinta). Esa alternancia es toda la estructura.
 *
 * Sirve tanto a `/nuestra-boda` (sin RSVP personal) como a `/i/[token]` (con
 * el formulario real del grupo). Todo el contenido llega de `wedding` vía
 * `buildWeddingContent`; cada bloque desaparece si su dato está vacío.
 */
export function WeddingLanding({
  content,
  rsvp,
}: {
  content: WeddingContent
  rsvp: { token: string; view: Extract<RsvpView, { state: 'valid' }> } | null
}) {
  const sections = landingSections(content)
  const calendar = calendarEvent(content, `${site.url}/nuestra-boda`)
  const dateLabel = content.event.startISO ? formatLongDateEs(content.event.startISO) : null

  const jsonLd = content.event.startISO
    ? {
      '@context': 'https://schema.org',
      '@type': 'Event',
      name: `Boda de ${content.couple.names}`,
      startDate: content.event.startISO,
      eventStatus: 'https://schema.org/EventScheduled',
      eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
      ...(content.ceremony
        ? {
          location: {
            '@type': 'Place',
            name: content.ceremony.place,
            ...(content.ceremony.address ? { address: content.ceremony.address } : {}),
          },
        }
        : {}),
    }
    : null

  return (
    <div
      className={`landing-root landing-pending ${script.variable} ${serif.variable} bg-(--color-background)`}
    >
      {jsonLd ? (
        <script
          type="application/ld+json"
          // JSON serializado por nosotros a partir de texto React-escapado del host.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
        />
      ) : null}

      <AudioProvider src={content.media.musicUrl} title={content.media.musicTitle}>
        <EnvelopeIntro
          names={content.couple.names}
          monogram={content.couple.monogram}
          dateLabel={dateLabel}
        />

        <SiteHeader monogram={content.couple.monogram} sections={sections} />

        <Hero content={content} />
        <InvitationSection content={content} />
        {content.event.startISO ? <CountdownBand dateISO={content.event.startISO} /> : null}
        <VenueSection content={content} />
        <DetailsSection content={content} />
        <GiftsSection content={content} />
        <RsvpSection
          rsvp={
            rsvp
              ? {
                token: rsvp.token,
                members: rsvp.view.members,
                initialMessage: rsvp.view.message,
                partySize: rsvp.view.partySize,
              }
              : null
          }
          contact={content.contact}
          privacyContact={content.privacyContact}
        />

        <Footer content={content} calendar={calendar} />
        <MusicPlayer />
      </AudioProvider>
      <Grain />
    </div>
  )
}
