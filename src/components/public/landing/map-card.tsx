'use client'

import { useState } from 'react'

import type { EventPlace } from '@/app/(public)/nuestra-boda/content'
import { cn } from '@/lib/utils/cn'

import { ArrowRight, MapPin } from './icons'

/**
 * Mapa «interactivo» auto-contenido. La CSP estricta del proyecto bloquea
 * iframes y tiles externos (`frame-src`/`img-src` = 'self'), así que en lugar de
 * un embed de Google Maps —que no cargaría— se dibuja un mapa estilizado en SVG
 * con un pin animado y pestañas para alternar entre lugares; el botón abre las
 * DIRECCIONES REALES en Google Maps / la app de mapas del dispositivo.
 *
 * ¿Quieres un embed real navegable dentro de la página? Requiere añadir
 * `frame-src https://www.google.com` a la CSP en `next.config.ts` (decisión de
 * seguridad — ver AGENTS.md). Puedo aplicarlo si lo confirmas.
 */
export function MapCard({
  ceremony,
  reception,
}: {
  ceremony: EventPlace
  reception: EventPlace
}) {
  const places = [ceremony, reception]
  const [active, setActive] = useState(0)
  const place = places[active]

  return (
    <div className="overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-card)] shadow-[var(--shadow-warm)]">
      {/* Pestañas */}
      <div
        role="tablist"
        aria-label="Lugares del evento"
        className="flex border-b border-[var(--color-border)]"
      >
        {places.map((p, i) => (
          <button
            key={p.label}
            role="tab"
            type="button"
            aria-selected={active === i}
            onClick={() => setActive(i)}
            className={cn(
              'flex-1 px-4 py-4 text-sm font-medium transition-colors',
              active === i
                ? 'bg-[var(--color-accent)]/6 text-[var(--color-accent)]'
                : 'text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]',
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-[1.4fr_1fr]">
        {/* Mapa estilizado (ilustración SVG) */}
        <div className="relative aspect-[16/11] w-full md:aspect-auto">
          <svg
            viewBox="0 0 400 260"
            className="h-full w-full"
            role="img"
            aria-label={`Mapa ilustrativo de ${place.place}`}
            preserveAspectRatio="xMidYMid slice"
          >
            <rect width="400" height="260" fill="var(--color-muted)" />
            {/* Zona verde / parque */}
            <path d="M0 180 Q90 150 150 185 T400 175 L400 260 L0 260 Z" fill="var(--color-sage)" opacity="0.18" />
            {/* Río / agua */}
            <path
              d="M-10 60 C80 90 120 30 210 70 S340 120 410 90"
              fill="none"
              stroke="var(--color-sage)"
              strokeOpacity="0.35"
              strokeWidth="14"
              strokeLinecap="round"
            />
            {/* Calles */}
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
            {/* Manzanas */}
            <g fill="var(--color-background)" opacity="0.55">
              <rect x="80" y="60" width="40" height="34" rx="3" />
              <rect x="215" y="55" width="46" height="38" rx="3" />
              <rect x="215" y="125" width="40" height="34" rx="3" />
              <rect x="90" y="128" width="36" height="30" rx="3" />
            </g>
          </svg>

          {/* Pin animado (centrado) */}
          <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full">
            <span className="absolute left-1/2 top-full h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--color-accent)]/25 motion-safe:animate-ping" />
            <MapPin className="relative h-11 w-11 fill-[var(--color-accent)] text-[var(--color-accent-foreground)] drop-shadow-[0_4px_6px_rgba(0,0,0,0.2)]" />
          </div>

          <span className="absolute bottom-2 right-3 rounded-full bg-[var(--color-background)]/80 px-2 py-0.5 text-[0.6rem] text-[var(--color-muted-foreground)] backdrop-blur-sm">
            Mapa ilustrativo
          </span>
        </div>

        {/* Datos + acción */}
        <div className="flex flex-col justify-center gap-4 p-6 sm:p-7">
          <div className="flex items-start gap-3">
            <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-accent)]" />
            <div>
              <p className="font-display text-lg text-[var(--color-foreground)]">
                {place.place}
              </p>
              <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
                {place.address}
              </p>
            </div>
          </div>
          <a
            href={place.mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[var(--color-accent)] px-5 text-sm font-medium text-[var(--color-accent-foreground)] shadow-[var(--shadow-soft)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-warm)]"
          >
            Abrir en Google Maps
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </a>
        </div>
      </div>
    </div>
  )
}
