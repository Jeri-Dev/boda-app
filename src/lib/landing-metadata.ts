import type { Metadata } from 'next'

import { LANDING_ASSETS, type WeddingContent } from '@/lib/wedding-content'

/** «viernes, 5 de diciembre de 2026» sin zona ambigua (RD). */
function longDate(iso: string): string {
  return new Intl.DateTimeFormat('es-DO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'America/Santo_Domingo',
  }).format(new Date(iso))
}

/**
 * SEO/compartir para la invitación: tarjetas OpenGraph/Twitter ricas
 * (previsualización en WhatsApp) sin indexar — la página incluye datos de
 * transferencia (higiene anti-phishing) y, en /i/[token], un secreto en la
 * URL. La imagen es la foto de la pareja si es un enlace https, o bien
 * `public/og-boda.jpg` (1200×630).
 */
export function landingMetadata(content: WeddingContent, title: string): Metadata {
  const { couple, event, tagline } = content
  const when = event.startISO ? ` el ${longDate(event.startISO)}` : ''
  const where = event.city ? ` en ${event.city}` : ''
  const description = `${tagline}. Acompáñanos${when}${where}. Confirma tu asistencia.`
  const image = content.media.coupleImageUrl.startsWith('https://')
    ? content.media.coupleImageUrl
    : LANDING_ASSETS.ogImage
  const ogTitle = `${couple.names} · ¡${tagline}!`

  return {
    title: { absolute: title },
    description,
    robots: { index: false, follow: false },
    openGraph: {
      title: ogTitle,
      description,
      type: 'website',
      locale: 'es_DO',
      siteName: couple.names,
      images: [{ url: image, width: 1200, height: 630, alt: `${couple.names} — invitación de boda` }],
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description,
      images: [image],
    },
  }
}
