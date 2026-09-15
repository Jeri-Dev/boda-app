'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { cn } from '@/lib/utils/cn'

import { useLandingAudio } from './audio-context'
import { Seal } from './seal'

const OPENED_KEY = 'nb-opened'

/**
 * El sobre cerrado.
 *
 * La invitación llega sellada: un sobre de tinta con el lacre en champán que
 * cubre toda la pantalla. El invitado toca el sello → el lacre salta, la solapa
 * gira sobre su borde superior, la tarjeta sale del bolsillo y el sobre se
 * retira. Ese mismo toque es el gesto de usuario que permite arrancar la
 * música (política de autoplay), así que la canción empieza justo al abrir.
 *
 * Estados en la raíz de la landing:
 *   .landing-pending  antes de abrir (el hero espera, oculto)
 *   .landing-opened   al abrir (el hero entra escalonado)
 * Un `<noscript>` deshace el bloqueo si JS no llega. En la misma sesión (tab)
 * el sobre no vuelve a pedir el toque.
 */
export function EnvelopeIntro({
  names,
  monogram,
  dateLabel,
}: {
  names: string
  monogram: string
  dateLabel: string | null
}) {
  const audio = useLandingAudio()
  const rootRef = useRef<HTMLDivElement | null>(null)
  const sealRef = useRef<HTMLButtonElement | null>(null)
  const [phase, setPhase] = useState<'sealed' | 'opening' | 'done'>('sealed')

  const markOpened = useCallback(() => {
    const root = rootRef.current?.closest('.landing-root')
    root?.classList.remove('landing-pending')
    root?.classList.add('landing-opened')
    document.documentElement.classList.remove('landing-lock')
  }, [])

  // Already opened in this tab → skip the envelope (no gesture, no music).
  useEffect(() => {
    let skip = false
    try {
      skip = sessionStorage.getItem(OPENED_KEY) === '1'
    } catch {
      /* ignore */
    }
    if (skip) {
      markOpened()
      setPhase('done')
      return
    }
    document.documentElement.classList.add('landing-lock')
    sealRef.current?.focus({ preventScroll: true })
    return () => document.documentElement.classList.remove('landing-lock')
  }, [markOpened])

  function open() {
    if (phase !== 'sealed') return
    // Inside the tap: allowed to start audio.
    audio.start()
    try {
      sessionStorage.setItem(OPENED_KEY, '1')
    } catch {
      /* ignore */
    }
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    setPhase('opening')
    window.setTimeout(markOpened, reduce ? 50 : 1500)
    window.setTimeout(() => setPhase('done'), reduce ? 350 : 2700)
  }

  if (phase === 'done') return null

  return (
    <div
      ref={rootRef}
      className={cn('landing-intro', phase === 'opening' && 'is-opening')}
      role="dialog"
      aria-modal="true"
      aria-label="Invitación sellada"
    >
      <noscript>
        <style>{`.landing-intro{display:none!important}.landing-pending .landing-enter{opacity:1!important}`}</style>
      </noscript>

      <div aria-hidden className="landing-intro-bg" />
      <div aria-hidden className="landing-rays landing-intro-rays" />

      <div className="landing-env">
        {/* Parte trasera del sobre */}
        <div aria-hidden className="landing-env-back" />

        {/* La tarjeta que asoma al abrir */}
        <div className="landing-env-card" aria-hidden>
          <p className="landing-env-card-mono" style={{ fontFamily: 'var(--font-script)' }}>
            {monogram}
          </p>
          <p className="landing-env-card-names" style={{ fontFamily: 'var(--font-script)' }}>
            {names}
          </p>
          {dateLabel ? <p className="landing-env-card-date">{dateLabel}</p> : null}
        </div>

        {/* Bolsillo frontal (dos solapas laterales + la de abajo) */}
        <div aria-hidden className="landing-env-pocket" />

        {/* Solapa superior con dos caras */}
        <div aria-hidden className="landing-env-flap" />

        {/* Sello de lacre = botón */}
        <button
          ref={sealRef}
          type="button"
          onClick={open}
          className="landing-env-seal"
          aria-label="Abrir la invitación"
        >
          <Seal
            monogram={monogram}
            className="h-[5.25rem] w-[5.25rem] text-[var(--color-gold)] sm:h-24 sm:w-24"
            monogramClassName="text-2xl sm:text-[1.7rem]"
          />
        </button>
      </div>

      <p className="landing-intro-hint">
        <span className="landing-intro-hint-line" />
        Toca el sello para abrir
        <span className="landing-intro-hint-line" />
      </p>
    </div>
  )
}
