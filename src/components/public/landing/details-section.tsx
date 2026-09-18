import type { WeddingContent } from '@/lib/wedding-content'

import { BlossomSprig, PalmFrond } from './florals'
import { Attire } from './icons'
import { CornerAccents, SectionHeading } from './ornament'
import { Parallax } from './parallax'
import { Reveal } from './reveal'
import { Timeline } from './timeline'

/**
 * «Detalles»: el itinerario del día, la etiqueta y las notas prácticas
 * (puntualidad, niños, transporte, alojamiento…). Se omite entera cuando no
 * hay nada configurado.
 */
export function DetailsSection({ content }: { content: WeddingContent }) {
  const { timeline, dressCode, notes } = content
  if (!timeline.length && !dressCode && !notes.length) return null

  return (
    <section
      id="detalles"
      className="relative isolate  overflow-hidden px-5  sm:px-8 sm:py-8"
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <Parallax
          speed={0.1}
          className="absolute -right-24 top-10 w-40 text-[var(--color-sage)] opacity-25 sm:w-56"
        >
          <div className="-rotate-[26deg] -scale-x-100">
            <PalmFrond className="landing-sway-slow w-full" />
          </div>
        </Parallax>
      </div>

      <div className="mx-auto max-w-2xl">
        {timeline.length ? (
          <>
            <Reveal variant="line">
              <SectionHeading overline="Cómo será el día" title="Itinerario" />
            </Reveal>
            {/* En móvil el itinerario se centra como bloque: pegado al margen
                izquierdo bajo un título centrado, la sección se veía torcida. */}
            <div className="mt-12 text-center sm:text-left">
              <Timeline items={timeline} />
            </div>
          </>
        ) : null}

        {dressCode ? (
          <Reveal variant="scale" delay={120} className={timeline.length ? 'mt-16' : ''}>
            <div className="landing-card relative flex flex-col items-center gap-3 px-6 py-9 text-center">
              <CornerAccents />
              {/* La rama se queda dentro de la tarjeta en móvil: asomando por
                  la esquina se salía de la página y cortaba el filete. */}
              <span
                aria-hidden
                className="absolute right-1 top-1 w-12 text-[var(--color-gold-deep)] opacity-40 sm:-right-4 sm:-top-6 sm:w-16"
              >
                <BlossomSprig className="w-full" />
              </span>
              <Attire className="h-8 w-8 text-[var(--color-accent)]" />
              <p className="text-[0.65rem] uppercase tracking-[0.34em] indent-[0.34em] text-[var(--color-accent)]">
                Código de vestimenta
              </p>
              <p className="font-display text-2xl font-light text-[var(--color-foreground)]">
                {dressCode.title}
              </p>
              {dressCode.note ? (
                <p className="mx-auto max-w-md text-sm leading-relaxed text-red-500">
                  {dressCode.note}
                </p>
              ) : null}

              {/* Paleta sugerida */}
              <div className="mt-2 flex flex-col items-center gap-5">
                <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-muted-foreground)] sm:text-base">
                  Te invitamos a usar uno de estos tonos
                </p>

                <div
                  className="flex items-center justify-center gap-5 sm:gap-7"
                  aria-label="Paleta de colores sugerida"
                >
                  <span
                    className="h-11 w-11 rounded-full border border-black/10 shadow-md transition-transform duration-300 hover:scale-110 sm:h-14 sm:w-14"
                    style={{ backgroundColor: '#B8D8D8' }}
                    aria-label="Aqua suave"
                    title="Aqua suave"
                  />

                  <span
                    className="h-11 w-11 rounded-full border border-black/10 shadow-md transition-transform duration-300 hover:scale-110 sm:h-14 sm:w-14"
                    style={{ backgroundColor: '#9DD9D2' }}
                    aria-label="Turquesa pastel"
                    title="Turquesa pastel"
                  />

                  <span
                    className="h-11 w-11 rounded-full border border-black/10 shadow-md transition-transform duration-300 hover:scale-110 sm:h-14 sm:w-14"
                    style={{ backgroundColor: '#A8D5BA' }}
                    aria-label="Verde menta"
                    title="Verde menta"
                  />

                  <span
                    className="h-11 w-11 rounded-full border border-black/10 shadow-md transition-transform duration-300 hover:scale-110 sm:h-14 sm:w-14"
                    style={{ backgroundColor: '#BFD8BE' }}
                    aria-label="Verde salvia"
                    title="Verde salvia"
                  />

                  <span
                    className="h-11 w-11 rounded-full border border-black/10 shadow-md transition-transform duration-300 hover:scale-110 sm:h-14 sm:w-14"
                    style={{ backgroundColor: '#C5E1DC' }}
                    aria-label="Verde agua"
                    title="Verde agua"
                  />
                </div>
              </div>
            </div>
          </Reveal>
        ) : null}

        {notes.length ? (
          <div className={`grid gap-6 sm:grid-cols-2 ${dressCode || timeline.length ? 'mt-8' : ''}`}>
            {notes.map((note, i) => (
              <Reveal key={`${note.title}-${i}`} delay={i * 100}>
                <div className="h-full border-t border-[var(--color-gold-deep)]/50 pt-5">
                  <p className="text-[0.65rem] uppercase tracking-[0.3em] text-[var(--color-accent)]">
                    {note.title}
                  </p>
                  <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-[var(--color-muted-foreground)]">
                    {note.text}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  )
}
