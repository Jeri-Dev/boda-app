'use client'

import { useState } from 'react'

import type { EventPlace } from '@/lib/wedding-content'
import { cn } from '@/lib/utils/cn'

import { ArrowRight, MapPin } from './icons'
import { useInView } from './reveal'

/**
 * Mapa «interactivo» auto-contenido. La CSP estricta bloquea iframes y tiles
 * externos, así que se dibuja un mapa estilizado en SVG con la ruta entre
 * ceremonia y recepción trazándose al entrar en pantalla, y pestañas para
 * alternar entre lugares; el botón abre las DIRECCIONES REALES en Google Maps.
 */
export function MapCard({ places }: { places: EventPlace[] }) {
  const [active, setActive] = useState(0)
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.3 })
  const place = places[Math.min(active, places.length - 1)]
  const two = places.length > 1

  // Pin positions in the 400×260 illustration.
  const pins = two
    ? [
        { x: 118, y: 96 },
        { x: 292, y: 176 },
      ]
    : [{ x: 200, y: 132 }]

  return (
    <div
      ref={ref}
      className={cn(
        'landing-card overflow-hidden shadow-[var(--shadow-warm)]',
        inView && 'is-shown',
      )}
    >
      {two ? (
        <div role="tablist" aria-label="Lugares del evento" className="flex border-b border-[var(--color-border)]">
          {places.map((p, i) => (
            <button
              key={p.label}
              role="tab"
              type="button"
              aria-selected={active === i}
              onClick={() => setActive(i)}
              className={cn(
                'flex-1 border-b-2 px-3 py-4 text-[0.68rem] uppercase tracking-[0.18em] indent-[0.18em] transition-colors sm:px-4 sm:tracking-[0.24em] sm:indent-[0.24em]',
                active === i
                  ? 'border-[var(--color-accent)] text-[var(--color-accent)]'
                  : 'border-transparent text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]',
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      ) : null}

      <div className="grid md:grid-cols-[1.4fr_1fr]">
        {/* La proporción de la caja es la del `viewBox` (400×260): con `slice`
            cualquier otra recortaría los lados y los pines —posicionados en %
            de la caja— dejarían de caer sobre su calle. */}
        <div className="relative aspect-[20/13] w-full md:aspect-auto">
          <svg
            viewBox="0 0 400 260"
            className="h-full w-full"
            role="img"
            aria-label={`Mapa ilustrativo de ${place.place}`}
            preserveAspectRatio="xMidYMid slice"
          >
            <rect width="400" height="260" fill="var(--color-muted)" />
            <path d="M0 180 Q90 150 150 185 T400 175 L400 260 L0 260 Z" fill="var(--color-sage)" opacity="0.20" />
            <path
              d="M-10 60 C80 90 120 30 210 70 S340 120 410 90"
              fill="none"
              stroke="var(--color-accent)"
              strokeOpacity="0.30"
              strokeWidth="14"
              strokeLinecap="round"
            />
            <g stroke="var(--color-border)" strokeWidth="6" opacity="0.9" strokeLinecap="round">
              <path d="M60 -10 L120 270" />
              <path d="M200 -10 L200 270" />
              <path d="M320 -10 L280 270" />
              <path d="M-10 120 L410 100" />
              <path d="M-10 210 L410 220" />
            </g>
            <g stroke="var(--color-border)" strokeWidth="2.5" opacity="0.6" strokeLinecap="round">
              <path d="M140 -10 L165 270" />
              <path d="M250 -10 L245 270" />
              <path d="M-10 60 L410 50" />
              <path d="M-10 165 L410 170" />
            </g>
            <g fill="var(--color-background)" opacity="0.55">
              <rect x="80" y="60" width="40" height="34" rx="3" />
              <rect x="215" y="55" width="46" height="38" rx="3" />
              <rect x="215" y="125" width="40" height="34" rx="3" />
              <rect x="90" y="128" width="36" height="30" rx="3" />
            </g>
            {two ? (
              <path
                className="landing-route"
                d="M118 96 C150 120 170 100 200 116 S250 160 292 176"
                fill="none"
                stroke="var(--color-accent)"
                strokeWidth="2.2"
                strokeDasharray="6 6"
                strokeLinecap="round"
              />
            ) : null}
          </svg>

          {pins.map((pin, i) => (
            <div
              key={i}
              className={cn(
                'pointer-events-none absolute -translate-x-1/2 -translate-y-full transition-transform duration-500',
                two && active === i ? 'scale-110' : 'scale-100',
              )}
              style={{ left: `${(pin.x / 400) * 100}%`, top: `${(pin.y / 260) * 100}%` }}
            >
              {(!two || active === i) && (
                <span className="absolute left-1/2 top-full h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--color-accent)]/25 motion-safe:animate-ping" />
              )}
              <MapPin
                className={cn(
                  'relative h-10 w-10 drop-shadow-[0_4px_6px_rgba(0,0,0,0.2)]',
                  !two || active === i
                    ? 'fill-[var(--color-accent)] text-[var(--color-accent-foreground)]'
                    : 'fill-[var(--color-gold-deep)] text-[var(--color-ink)]',
                )}
              />
            </div>
          ))}

          <span className="absolute bottom-2 right-3 bg-[var(--color-background)]/85 px-2 py-0.5 text-[0.6rem] uppercase tracking-[0.14em] indent-[0.14em] text-[var(--color-muted-foreground)] backdrop-blur-sm">
            Mapa ilustrativo
          </span>
        </div>

        <div className="flex flex-col justify-center gap-4 p-6 sm:p-7">
          <div className="flex items-start gap-3">
            <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-accent)]" />
            <div>
              <p className="font-display text-xl font-light text-[var(--color-foreground)]">
                {place.place}
              </p>
              {place.address ? (
                <p className="mt-1 text-sm leading-relaxed text-[var(--color-muted-foreground)]">
                  {place.address}
                </p>
              ) : null}
            </div>
          </div>
          {place.mapUrl ? (
            <a
              href={place.mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="landing-shine group inline-flex h-12 items-center justify-center gap-2 bg-[var(--color-accent)] px-5 text-[0.72rem] uppercase tracking-[0.18em] indent-[0.18em] text-[var(--color-accent-foreground)] shadow-[var(--shadow-soft)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-warm)]"
            >
              Abrir en Google Maps
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </a>
          ) : null}
        </div>
      </div>
    </div>
  )
}
