import type { Metadata } from 'next'

import { CountdownBand } from '@/components/public/landing/countdown-band'
import { DetailsSection } from '@/components/public/landing/details-section'
import { Grain } from '@/components/public/landing/florals'
import { Footer } from '@/components/public/landing/footer'
import { formatLongDateEs } from '@/components/public/landing/format'
import { GiftsSection } from '@/components/public/landing/gifts-section'
import { Hero } from '@/components/public/landing/hero'
import { QuoteBand } from '@/components/public/landing/quote-band'
import { RsvpSection } from '@/components/public/landing/rsvp-section'
import { SiteHeader } from '@/components/public/landing/site-header'
import { StorySection } from '@/components/public/landing/story-section'

import { wedding } from './content'
import { script } from './fonts'
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

export default function NuestraBodaPage() {
  return (
    <div className={`${script.variable} bg-[var(--color-background)]`}>
      <script
        type="application/ld+json"
        // JSON serializado por nosotros (sin datos de usuario) → seguro.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <SiteHeader monogram={wedding.couple.monogram} />

      <main>
        <Hero data={wedding} />
        <CountdownBand dateISO={wedding.dateISO} />
        <RsvpSection />
        <StorySection data={wedding} />
        <QuoteBand data={wedding} />
        <DetailsSection data={wedding} />
        <GiftsSection data={wedding} />
      </main>

      <Footer data={wedding} />
      <Grain />
    </div>
  )
}
