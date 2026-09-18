import type { EventPlace, WeddingContent } from '@/lib/wedding-content'

import { PalmFrond } from './florals'
import { ArrowRight, ClockIcon, MapPin } from './icons'
import { MapCard } from './map-card'
import { Tilt } from './motion'
import { CornerAccents, SectionHeading } from './ornament'
import { Parallax } from './parallax'
import { Reveal } from './reveal'

function PlaceCard({
  place,
  index,
  extraTimes,
}: {
  place: EventPlace
  index: number
  /** Extra «Momento · hora» rows for a single-venue wedding. */
  extraTimes?: { label: string; time: string | null }[]
}) {
  const times = extraTimes ?? [{ label: place.label, time: place.time }]
  const label = extraTimes ? 'Ceremonia y recepción' : place.label

  return (
    <Reveal variant="scale" delay={index * 120}>
      <Tilt max={4} className="h-full">
        <div className="landing-card relative flex h-full flex-col p-6 sm:p-8">
          <CornerAccents />
          <p className="text-[0.65rem] uppercase tracking-[0.3em] text-[var(--color-accent)] sm:tracking-[0.34em]">
            {label}
          </p>
          <h3 className="mt-3 font-display text-[1.75rem] font-light leading-tight text-[var(--color-foreground)]">
            {place.place}
          </h3>

          <dl className="mt-5 space-y-3 text-sm text-[var(--color-foreground)]/85">
            {times
              .filter((t) => t.time)
              .map((t) => (
                <div key={t.label} className="flex items-start gap-3">
                  <dt className="sr-only">Hora · {t.label}</dt>
                  <ClockIcon className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-accent)]" />
                  <dd className="tracking-wide">
                    {extraTimes ? (
                      <>
                        <span className="text-[var(--color-muted-foreground)]">{t.label} · </span>
                        {t.time}
                      </>
                    ) : (
                      t.time
                    )}
                  </dd>
                </div>
              ))}
            {place.address ? (
              <div className="flex items-start gap-3">
                <dt className="sr-only">Dirección</dt>
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-accent)]" />
                <dd className="leading-relaxed">{place.address}</dd>
              </div>
            ) : null}
          </dl>

          {place.mapUrl ? (
            <a
              href={place.mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group mt-7 inline-flex h-11 items-center justify-center gap-2 self-stretch border border-[var(--color-accent)]/45 px-5 text-sm text-[var(--color-accent)] transition-colors hover:bg-[var(--color-accent)] hover:text-[var(--color-accent-foreground)] sm:self-start"
            >
              Cómo llegar
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </a>
          ) : null}
        </div>
      </Tilt>
    </Reveal>
  )
}

/**
 * «El lugar»: ceremonia y recepción con sus horas y direcciones, más el mapa
 * ilustrado. Si la recepción es en el mismo sitio, una sola tarjeta con las dos
 * horas — nada de repetir la misma dirección dos veces.
 */
export function VenueSection({ content }: { content: WeddingContent }) {
  const { ceremony, reception } = content
  if (!ceremony && !reception) return null

  const single = !reception || reception.sameAsCeremony || !ceremony
  const places = [ceremony, reception].filter((p): p is EventPlace => Boolean(p))
  const mapPlaces = single ? places.slice(0, 1) : places
  const showMap = mapPlaces.some((p) => p.mapUrl)

  return (
    <section
      id="lugar"
      className="relative isolate  overflow-hidden px-5  sm:px-8 py-16"
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
        <Reveal variant="line">
          <SectionHeading overline="Dónde nos vemos" title="El lugar de la boda" />
        </Reveal>

        {single ? (
          <div className="mx-auto mt-14 max-w-xl">
            <PlaceCard
              place={places[0]}
              index={0}
              extraTimes={
                reception
                  ? [
                    { label: 'Ceremonia', time: ceremony?.time ?? null },
                    { label: 'Recepción', time: reception.time },
                  ]
                  : undefined
              }
            />
          </div>
        ) : (
          <div className="mt-14 grid gap-6 sm:grid-cols-2">
            {places.map((p, i) => (
              <PlaceCard key={p.label} place={p} index={i} />
            ))}
          </div>
        )}

        {showMap ? (
          <Reveal variant="scale" delay={100} className="mt-8">
            <MapCard places={mapPlaces} />
          </Reveal>
        ) : null}
      </div>
    </section>
  )
}
