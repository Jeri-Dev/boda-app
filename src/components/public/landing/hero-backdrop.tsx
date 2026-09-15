'use client'

import { useEffect, useState } from 'react'

/**
 * La foto de la pareja como fondo del hero, velada en tinta turquesa. Solo se
 * pinta si la imagen existe (misma comprobación aislada que `CoupleImage`);
 * sin foto, el hero se queda con el degradado de tinta y no se nota la
 * ausencia. Entra con un fundido lento y un Ken Burns casi imperceptible.
 */
export function HeroBackdrop({ src }: { src: string }) {
  const [ok, setOk] = useState(false)

  useEffect(() => {
    let active = true
    const img = new Image()
    img.onload = () => active && setOk(true)
    img.onerror = () => active && setOk(false)
    img.src = src
    return () => {
      active = false
    }
  }, [src])

  if (!ok) return null

  return (
    <div aria-hidden className="landing-hero-photo">
      <div
        className="landing-hero-photo-img landing-kenburns-slow"
        style={{ backgroundImage: `url("${src}")` }}
      />
      <div className="landing-hero-photo-veil" />
    </div>
  )
}
