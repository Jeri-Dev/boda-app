import type { EventPlace, WeddingContent } from '@/app/(public)/nuestra-boda/content'

import { PalmFrond } from './florals'
import { ArrowRight, ClockIcon, MapPin } from './icons'
import { MapCard } from './map-card'
import { CornerAccents, SectionHeading } from './ornament'
import { Parallax } from './parallax'
import { Reveal } from './reveal'

function PlaceCard({ place, index }: { place: EventPlace; index: number }) {
  return (
    <Reveal delay={index * 120}>
      <div className="relative flex h-full flex-col border border-[var(--color-border)] bg-[var(--color-card)] p-8 shadow-[var(--shadow-soft)]">
        <CornerAccents />
        <p className="text-[0.65rem] uppercase tracking-[0.34em] text-[var(--color-accent)]">
          {place.label}
        </p>
        <h3 className="mt-3 font-display text-[1.75rem] font-light leading-tight text-[var(--color-foreground)]">
          {place.place}
        </h3>

        <dl className="mt-5 space-y-3 text-sm text-[var(--color-foreground)]/85">
          <div className="flex items-start gap-3">
            <dt className="sr-only">Hora</dt>
            <ClockIcon className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-accent)]" />
            <dd className="tracking-wide">{place.time}</dd>
          </div>
          <div className="flex items-start gap-3">
            <dt className="sr-only">Dirección</dt>
            <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-accent)]" />
            <dd className="leading-relaxed">{place.address}</dd>
          </div>
        </dl>

        <a
          href={place.mapUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="group mt-7 inline-flex h-11 items-center justify-center gap-2 self-start border border-[var(--color-accent)]/45 px-5 text-sm text-[var(--color-accent)] transition-colors hover:bg-[var(--color-accent)] hover:text-[var(--color-accent-foreground)]"
        >
          Cómo llegar
          <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
        </a>
      </div>
    </Reveal>
  )
}

/**
 * «El lugar»: ceremonia y recepción con sus horas y direcciones, más el mapa
 * con la ruta real. Dos tarjetas idénticas en estructura para que el ojo
 * compare hora con hora y dirección con dirección sin releer.
 */
export function VenueSection({ data }: { data: WeddingContent }) {
  return (
    <section
      id="lugar"
      className="relative isolate scroll-mt-20 overflow-hidden px-5 py-20 sm:px-8 sm:py-28"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(85%_45%_at_50%_0%,oklch(0.94_0.042_192/0.6),transparent)]"
      />
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <Parallax
          speed={0.1}
          className="absolute -left-24 bottom-0 w-40 text-[var(--color-sage)] opacity-25 sm:w-56"
        >
          <div className="rotate-[26deg]">
            <PalmFrond className="landing-sway-slow w-full" />
          </div>
        </Parallax>
      </div>

      <div className="mx-auto max-w-5xl">
        <Reveal>
          <SectionHeading overline="Dónde nos vemos" title="El lugar de la boda" />
        </Reveal>

        <div className="mt-14 grid gap-6 sm:grid-cols-2">
          <PlaceCard place={data.ceremony} index={0} />
          <PlaceCard place={data.reception} index={1} />
        </div>

        <Reveal delay={100} className="mt-8">
          <MapCard ceremony={data.ceremony} reception={data.reception} />
        </Reveal>
      </div>
    </section>
  )
}
