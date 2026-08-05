import type { TimelineIcon, WeddingContent } from '@/app/(public)/nuestra-boda/content'

import { CoupleImage } from './couple-image'
import { BlossomSprig, EucalyptusBranch, Leaf } from './florals'
import {
  Attire,
  Champagne,
  Church,
  Cutlery,
  Music,
} from './icons'
import { Ornament, SectionHeading } from './ornament'
import { Parallax } from './parallax'
import { Reveal } from './reveal'

/** Icono de line-art por hito del itinerario. */
const TIMELINE_ICONS: Record<TimelineIcon, typeof Church> = {
  ceremonia: Church,
  brindis: Champagne,
  cena: Cutlery,
  fiesta: Music,
}

/**
 * «Info»: la invitación propiamente dicha sobre papel champán — el texto de
 * bienvenida, los padres, la foto en arco, el versículo, el itinerario del día,
 * la etiqueta y los detalles prácticos. Todo se renderiza en el servidor; el
 * movimiento lo aportan `Reveal` y `Parallax`.
 */
export function InfoSection({ data }: { data: WeddingContent }) {
  const { couple } = data
  const alt = `${couple.first} y ${couple.second}`

  return (
    <section
      id="info"
      className="relative isolate scroll-mt-20 overflow-hidden px-5 py-20 sm:px-8 sm:py-28"
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <Parallax
          speed={0.12}
          className="absolute -right-14 top-6 w-32 text-[var(--color-sage)] opacity-35 sm:w-48"
        >
          <div className="-rotate-[130deg]">
            <EucalyptusBranch className="landing-sway-slow w-full" />
          </div>
        </Parallax>
        <Parallax
          speed={0.16}
          className="absolute -left-10 top-1/3 w-28 text-[var(--color-sage)] opacity-30 sm:w-40"
        >
          <div className="rotate-[150deg]">
            <EucalyptusBranch className="landing-sway w-full" />
          </div>
        </Parallax>
        <Parallax speed={0.2} className="absolute inset-0" innerClassName="relative h-full w-full">
          <Leaf className="landing-drift-a absolute left-[8%] top-[22%] w-3 rotate-45 text-[var(--color-sage)] opacity-40" />
          <Leaf className="landing-drift-c absolute bottom-[18%] right-[10%] w-3.5 -rotate-12 text-[var(--color-gold-deep)] opacity-40" />
        </Parallax>
      </div>

      <div className="mx-auto max-w-2xl">
        <Reveal>
          <SectionHeading overline="La invitación" title="Nos vas a hacer falta" />
        </Reveal>

        <Reveal delay={80}>
          <p className="mt-10 text-center font-display text-[1.3rem] font-light leading-[1.7] text-[var(--color-foreground)]/90 sm:text-[1.4rem]">
            {data.welcome}
          </p>
        </Reveal>

        {couple.parents?.length ? (
          <Reveal delay={140}>
            <div className="mt-10 grid gap-6 border-y border-[var(--color-border)] py-7 sm:grid-cols-2">
              {couple.parents.map((group) => (
                <div key={group.line} className="text-center">
                  <p className="text-[0.62rem] uppercase tracking-[0.3em] text-[var(--color-accent)]">
                    {group.line}
                  </p>
                  <ul className="mt-2 space-y-0.5">
                    {group.names.map((name, i) => (
                      <li
                        key={i}
                        className="font-display text-lg font-light italic text-[var(--color-foreground)]/85"
                      >
                        {name}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Reveal>
        ) : null}

        {/* Foto en arco con eco en champán */}
        <Reveal delay={160} className="mt-14 flex justify-center">
          <div className="relative w-[min(74vw,20rem)]">
            <div
              aria-hidden
              className="absolute -inset-2.5 -z-10 translate-x-3 -translate-y-3 rounded-t-[999px] border border-[var(--color-gold-deep)]/70"
            />
            <div className="overflow-hidden rounded-t-[999px] border border-[var(--color-border)] bg-[var(--color-muted)] shadow-[var(--shadow-warm)]">
              <CoupleImage
                alt={alt}
                monogram={couple.monogram}
                className="landing-kenburns aspect-[4/5] h-full w-full object-cover"
              />
            </div>
          </div>
        </Reveal>

        {/* Versículo */}
        <Reveal delay={120} className="mt-16 text-center">
          <div className="mx-auto w-24 text-[var(--color-gold-deep)]/70">
            <Ornament />
          </div>
          <blockquote className="mt-6">
            <p
              className="text-[clamp(1.6rem,5.4vw,2.4rem)] leading-[1.4] text-[var(--color-accent)]"
              style={{ fontFamily: 'var(--font-script)' }}
            >
              {data.quote.text}
            </p>
            <footer className="mt-5 text-[0.65rem] uppercase tracking-[0.36em] text-[var(--color-muted-foreground)]">
              {data.quote.attribution}
            </footer>
          </blockquote>
        </Reveal>
      </div>

      {/* Itinerario */}
      <div className="mx-auto mt-20 max-w-2xl sm:mt-24">
        <Reveal>
          <SectionHeading overline="Cómo será el día" title="Itinerario" />
        </Reveal>

        <Reveal delay={80} className="mt-12">
          <ol className="relative ml-5 border-l border-[var(--color-gold-deep)]/45 pl-9 sm:ml-10">
            {data.timeline.map((item, i) => {
              const Icon = TIMELINE_ICONS[item.icon]
              return (
                <li key={i} className="relative pb-10 last:pb-0">
                  <span
                    aria-hidden
                    className="absolute -left-[3.4rem] top-0 flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-gold-deep)]/60 bg-[var(--color-background)] text-[var(--color-accent)]"
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <p className="text-[0.7rem] uppercase tracking-[0.24em] tabular-nums text-[var(--color-accent)]">
                    {item.time}
                  </p>
                  <p className="mt-1 font-display text-xl font-light text-[var(--color-foreground)]">
                    {item.title}
                  </p>
                  {item.detail ? (
                    <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
                      {item.detail}
                    </p>
                  ) : null}
                </li>
              )
            })}
          </ol>
        </Reveal>

        {/* Etiqueta */}
        <Reveal delay={120} className="mt-14">
          <div className="relative flex flex-col items-center gap-3 border border-[var(--color-border)] bg-[var(--color-card)] px-6 py-9 text-center">
            <span
              aria-hidden
              className="absolute -right-4 -top-6 w-16 text-[var(--color-gold-deep)] opacity-40"
            >
              <BlossomSprig className="w-full" />
            </span>
            <Attire className="h-8 w-8 text-[var(--color-accent)]" />
            <p className="text-[0.65rem] uppercase tracking-[0.34em] text-[var(--color-accent)]">
              Código de vestimenta
            </p>
            <p className="font-display text-2xl font-light text-[var(--color-foreground)]">
              {data.dressCode.title}
            </p>
            <p className="mx-auto max-w-md text-sm leading-relaxed text-[var(--color-muted-foreground)]">
              {data.dressCode.note}
            </p>
          </div>
        </Reveal>

        {/* Detalles prácticos */}
        {data.notes.length ? (
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            {data.notes.map((note, i) => (
              <Reveal key={note.title} delay={i * 100}>
                <div className="h-full border-t border-[var(--color-gold-deep)]/50 pt-5">
                  <p className="text-[0.65rem] uppercase tracking-[0.3em] text-[var(--color-accent)]">
                    {note.title}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted-foreground)]">
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
