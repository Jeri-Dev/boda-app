'use client'

import { useEffect, useState } from 'react'

import { Heart } from './icons'

/**
 * Foto de la pareja con reserva elegante. Comprueba en el cliente si `src`
 * (por defecto `/pareja.jpg`) existe cargándola de forma aislada; hasta que
 * exista muestra un marcador de posición cuidado con el monograma — nunca una
 * imagen rota ni el texto `alt` de un 404. Para publicar tu foto: coloca el
 * archivo en `public/pareja.jpg` (o pasa otro `src`).
 *
 * Se prueba con `new Image()` en `useEffect` (no con `<img onError>`) para
 * evitar la carrera de hidratación: el error de un 404 se dispararía antes de
 * que React adjunte el manejador y el swap se perdería.
 */
export function CoupleImage({
  src = '/pareja.jpg',
  alt,
  monogram,
  className,
  compact = false,
}: {
  src?: string
  alt: string
  monogram: string
  className?: string
  /** Smaller placeholder styling for thumbnail-sized frames. */
  compact?: boolean
}) {
  const [status, setStatus] = useState<'loading' | 'ok' | 'fail'>('loading')

  useEffect(() => {
    let active = true
    const img = new Image()
    img.onload = () => active && setStatus('ok')
    img.onerror = () => active && setStatus('fail')
    img.src = src
    return () => {
      active = false
    }
  }, [src])

  if (status === 'ok') {
    // eslint-disable-next-line @next/next/no-img-element -- fuente validada en cliente.
    return <img src={src} alt={alt} decoding="async" className={className} />
  }

  return (
    <div
      role="img"
      aria-label={alt}
      className={className}
      style={{
        background:
          'radial-gradient(125% 125% at 50% 0%, var(--color-background) 0%, var(--color-muted) 48%, oklch(0.925 0.030 192) 100%)',
      }}
    >
      <div className="flex h-full w-full flex-col items-center justify-center gap-3 px-4 text-center">
        <Heart className={compact ? 'h-5 w-5 text-[var(--color-accent)]/70' : 'h-8 w-8 text-[var(--color-accent)]/70'} />
        <span
          className={
            compact
              ? 'whitespace-nowrap text-2xl text-[var(--color-accent)]'
              : 'whitespace-nowrap text-4xl text-[var(--color-accent)] sm:text-5xl'
          }
          style={{ fontFamily: 'var(--font-script)' }}
        >
          {monogram}
        </span>
        {compact ? null : (
          <span className="text-[0.65rem] uppercase tracking-[0.25em] text-[var(--color-muted-foreground)]">
            Aquí va nuestra foto
          </span>
        )}
      </div>
    </div>
  )
}
