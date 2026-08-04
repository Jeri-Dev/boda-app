import type {
  EventPlace,
  TimelineIcon,
  WeddingContent,
} from '@/app/(public)/nuestra-boda/content'

import { PeonyBloom, RoseBloom } from './florals'
import {
  CalendarIcon,
  Champagne,
  Church,
  ClockIcon,
  Cutlery,
  MapPin,
  Music,
} from './icons'
import { MapCard } from './map-card'
import { CornerAccents, SectionHeading } from './ornament'
import { Parallax } from './parallax'
import { Reveal } from './reveal'

/** Line-art icon per timeline milestone. */
const TIMELINE_ICONS: Record<TimelineIcon, typeof Church> = {
  ceremonia: Church,
  brindis: Champagne,
  cena: Cutlery,
  fiesta: Music,
}

function PlaceCard({ place, index }: { place: EventPlace; index: number }) {
  return (
    <Reveal delay={index * 120}>
      <div className="relative flex h-full flex-col rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-card)] p-7 shadow-[var(--shadow-soft)] transition-shadow duration-300 hover:shadow-[var(--shadow-warm)]">
        <CornerAccents />
        <p className="text-[0.7rem] uppercase tracking-[0.3em] text-[var(--color-accent)]">
          {place.label}
        </p>
        <h3 className="mt-3 font-display text-2xl tracking-tight text-[var(--color-foreground)]">
          {place.place}
        </h3>

        <dl className="mt-5 space-y-3 text-sm text-[var(--color-foreground)]/85">
          <div className="flex items-start gap-3">
            <ClockIcon className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-accent)]" />
            <dd>{place.time}</dd>
          </div>
          <div className="flex items-start gap-3">
            <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-accent)]" />
            <dd>{place.address}</dd>
          </div>
        </dl>

        <a
          href={place.mapUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex items-center gap-1.5 self-start text-sm font-medium text-[var(--color-accent)] underline-offset-4 hover:underline"
        >
          Cómo llegar
          <span aria-hidden>→</span>
        </a>
      </div>
    </Reveal>
  )
}

/**
 * Detalles del evento: cronograma del día + tarjetas de Ceremonia y Recepción +
 * el mapa interactivo. Todo server-rendered salvo el mapa (interacción).
 */
export function DetailsSection({ data }: { data: WeddingContent }) {
  return (
    <section id="detalles" className="relative isolate scroll-mt-20 overflow-hidden px-5 py-20 sm:px-8 sm:py-28">
      {/* Sage wash + faint blooms */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(90%_45%_at_50%_0%,oklch(0.96_0.02_150/0.45),transparent)]"
      />
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <Parallax speed={0.1} className="absolute -right-10 top-10 w-32 text-[var(--color-gold)] opacity-30 sm:w-44">
          <PeonyBloom className="landing-sway-slow w-full" />
        </Parallax>
        <Parallax speed={0.14} className="absolute -left-10 bottom-24 w-28 text-[var(--color-accent)] opacity-20 sm:w-36">
          <div className="rotate-12">
            <RoseBloom className="w-full" />
          </div>
        </Parallax>
      </div>

      <div className="mx-auto max-w-5xl">
        <Reveal>
          <SectionHeading overline="El gran día" title="Detalles del evento" />
        </Reveal>

        {/* Timeline with milestone icons */}
        <Reveal delay={80} className="mx-auto mt-14 max-w-xl">
          <ol className="relative border-l border-[var(--color-border)] pl-10">
            {data.timeline.map((item, i) => {
              const Icon = TIMELINE_ICONS[item.icon]
              return (
                <li key={i} className="relative pb-10 last:pb-0">
                  <span
                    aria-hidden
                    className="absolute -left-[3.75rem] top-0 flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-accent)] shadow-[var(--shadow-soft)]"
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="pt-1">
                    <p className="font-display text-sm font-medium tracking-wide text-[var(--color-accent)]">
                      {item.time}
                    </p>
                    <p className="mt-0.5 text-[1.05rem] text-[var(--color-foreground)]">
                      {item.title}
                    </p>
                    {item.detail ? (
                      <p className="mt-0.5 text-sm text-[var(--color-muted-foreground)]">
                        {item.detail}
                      </p>
                    ) : null}
                  </div>
                </li>
              )
            })}
          </ol>
        </Reveal>

        {/* Ceremonia + Recepción */}
        <div className="mt-14 grid gap-6 sm:grid-cols-2">
          <PlaceCard place={data.ceremony} index={0} />
          <PlaceCard place={data.reception} index={1} />
        </div>

        {/* Código de vestimenta */}
        <Reveal delay={120} className="mt-6">
          <div className="flex flex-col items-center gap-3 rounded-[var(--radius-xl)] border border-dashed border-[var(--color-border)] bg-[var(--color-muted)]/40 px-6 py-7 text-center">
            <CalendarIcon className="h-6 w-6 text-[var(--color-accent)]" />
            <div>
              <p className="text-[0.7rem] uppercase tracking-[0.3em] text-[var(--color-accent)]">
                Vestimenta
              </p>
              <p className="mt-1 font-display text-xl text-[var(--color-foreground)]">
                {data.dressCode.title}
              </p>
              <p className="mx-auto mt-1.5 max-w-md text-sm text-[var(--color-muted-foreground)]">
                {data.dressCode.note}
              </p>
            </div>
          </div>
        </Reveal>

        {/* Mapa */}
        <div id="lugar" className="mt-16 scroll-mt-20">
          <Reveal>
            <MapCard ceremony={data.ceremony} reception={data.reception} />
          </Reveal>
        </div>
      </div>
    </section>
  )
}
