import type { Metadata, Viewport } from 'next'

import { WeddingLanding } from '@/components/public/landing/wedding-landing'
import { getWeddingContent } from '@/lib/data/wedding'
import { landingMetadata } from '@/lib/landing-metadata'

/**
 * «Nuestra boda» — la invitación completa sin enlace personal: toda la
 * información (fecha, lugar, itinerario, regalos…) y, en lugar del RSVP, la
 * indicación de confirmar desde el enlace propio. Es la vista que los novios
 * revisan desde Configuración y la que se comparte públicamente.
 */
export const dynamic = 'force-dynamic'

/** Barra de estado a juego con el sobre de tinta. */
export const viewport: Viewport = { themeColor: '#184648' }

export async function generateMetadata(): Promise<Metadata> {
  const content = await getWeddingContent()
  return landingMetadata(content, `${content.couple.names} · Nuestra boda`)
}

export default async function NuestraBodaPage() {
  const content = await getWeddingContent()
  return <WeddingLanding content={content} rsvp={null} />
}
