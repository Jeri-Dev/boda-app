import type { Metadata, Viewport } from 'next'

import { InvitationInvalid } from '@/components/public/landing/invitation-invalid'
import { WeddingLanding } from '@/components/public/landing/wedding-landing'
import { getRsvpView } from '@/lib/data/rsvp'
import { getWeddingContent } from '@/lib/data/wedding'
import { landingMetadata } from '@/lib/landing-metadata'

/**
 * Invitación personal por token (U2.2 + landing unificada). Misma página que
 * /nuestra-boda con el RSVP real del grupo. Genuinamente pública (sin auth).
 * El token es un secreto en la URL → `noindex, nofollow` y la app envía
 * `Referrer-Policy: no-referrer` globalmente. Render por petición: el token
 * viene de la URL, así que siempre es dinámica.
 */
export const viewport: Viewport = { themeColor: '#184648' }

export async function generateMetadata(): Promise<Metadata> {
  const content = await getWeddingContent()
  return landingMetadata(content, `Invitación · ${content.couple.names}`)
}

export default async function InvitationPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const [view, content] = await Promise.all([getRsvpView(token), getWeddingContent()])

  if (view.state !== 'valid') {
    return <InvitationInvalid />
  }

  return <WeddingLanding content={content} rsvp={{ token, view }} />
}
