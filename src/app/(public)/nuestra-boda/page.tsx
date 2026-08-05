import type { Metadata } from 'next'

import { CountdownBand } from '@/components/public/landing/countdown-band'
import { Grain } from '@/components/public/landing/florals'
import { Footer } from '@/components/public/landing/footer'
import { formatLongDateEs } from '@/components/public/landing/format'
import { GiftsSection } from '@/components/public/landing/gifts-section'
import { Hero } from '@/components/public/landing/hero'
import { InfoSection } from '@/components/public/landing/info-section'
import { RsvpSection } from '@/components/public/landing/rsvp-section'
import { SiteHeader } from '@/components/public/landing/site-header'
import { VenueSection } from '@/components/public/landing/venue-section'

import { wedding } from './content'
import { script, serif } from './fonts'
import './landing.css'

const couple = `${wedding.couple.first} & ${wedding.couple.second}`
const dateLabel = formatLongDateEs(wedding.dateISO)
const description = `Nos casamos. Acompáñanos el ${dateLabel} en ${wedding.city}. Confirma tu asistencia.`

/**
 * SEO/compartir: para una invitación, «SEO» = tarjetas OpenGraph/Twitter ricas
 * (previsualización en WhatsApp) + HTML semántico + JSON-LD. Se mantiene
 * `noindex` porque la página incluye datos de transferencia (higiene
 * anti-phishing, igual que `/info`); compartir por enlace no requiere indexar.
 */
export const metadata: Metadata = {
  title: `${couple} · Nuestra boda`,
  description,
  robots: { index: false, follow: false },
  openGraph: {
    title: `${couple} · ¡Nos casamos!`,
    description,
    type: 'website',
    locale: 'es_DO',
    siteName: `${couple}`,
    images: [
      {
        // Coloca una imagen 1200×630 en `public/og-boda.jpg` para la previsualización.
        url: '/og-boda.jpg',
        width: 1200,
        height: 630,
        alt: `${couple} — invitación de boda`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${couple} · ¡Nos casamos!`,
    description,
    images: ['/og-boda.jpg'],
  },
}

/** Datos estructurados schema.org/Event para previsualizaciones ricas. */
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Event',
  name: `Boda de ${couple}`,
  startDate: wedding.dateISO,
  eventStatus: 'https://schema.org/EventScheduled',
  eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
  location: {
    '@type': 'Place',
    name: wedding.ceremony.place,
    address: wedding.ceremony.address,
  },
  description,
}

/**
 * La invitación se lee como la papelería que imita: el sobre (tinta), la
 * tarjeta (papel), la placa con la fecha (tinta), el lugar (papel), la mesa de
 * regalos (tinta), la confirmación (papel) y la contraportada (tinta). Esa
 * alternancia es toda la estructura — no hace falta más decoración para saber
 * dónde empieza cada cosa.
 */
export default function NuestraBodaPage() {
  return (
    <div
      className={`landing-root ${script.variable} ${serif.variable} bg-[var(--color-background)]`}
    >
      <script
        type="application/ld+json"
        // JSON serializado por nosotros (sin datos de usuario) → seguro.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <SiteHeader monogram={wedding.couple.monogram} />

      <main>
        <Hero data={wedding} />
        <InfoSection data={wedding} />
        <CountdownBand dateISO={wedding.dateISO} />
        <VenueSection data={wedding} />
        <GiftsSection data={wedding} />
        <RsvpSection />
      </main>

      <Footer data={wedding} />
      <Grain />
    </div>
  )
}
