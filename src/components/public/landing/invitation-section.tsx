import type { WeddingContent } from '@/lib/wedding-content'

import { CoupleImage } from './couple-image'
import { EucalyptusBranch, Leaf } from './florals'
import { Tilt } from './motion'
import { Ornament, SectionHeading } from './ornament'
import { Parallax } from './parallax'
import { Reveal } from './reveal'

/**
 * «La invitación» sobre papel champán: el texto de bienvenida, los padres, la
 * foto en arco, la historia y el versículo. Cada bloque se oculta si el dato
 * no está configurado; la foto siempre está (con reserva elegante hasta que
 * exista el archivo).
 */
export function InvitationSection({ content }: { content: WeddingContent }) {
  const { couple, welcome, story, quote, media } = content
  const alt = couple.second ? `${couple.first} y ${couple.second}` : couple.names

  return (
    <section
      id="invitacion"
      className="relative isolate scroll-mt-20 overflow-hidden px-5 pb-20 pt-24 sm:px-8 sm:pb-28 sm:pt-32"
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
        <Reveal variant="line">
          <SectionHeading overline="La invitación" title="Nos vas a hacer falta" />
        </Reveal>

        {welcome ? (
          <Reveal variant="blur" delay={120}>
            <p className="mt-10 whitespace-pre-line text-center font-display text-[1.3rem] font-light leading-[1.7] text-[var(--color-foreground)]/90 sm:text-[1.45rem]">
              {welcome}
            </p>
          </Reveal>
        ) : null}

        {couple.parents.length ? (
          <Reveal delay={160}>
            <div className="landing-parents mt-10 grid gap-6 border-y border-[var(--color-border)] py-7 sm:grid-cols-2">
              {couple.parents.map((group) => (
                <div key={group.line} className="text-center">
                  <p className="text-[0.62rem] uppercase tracking-[0.3em] indent-[0.3em] text-[var(--color-accent)]">
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
        {/* Los dos arcos de eco salen hacia arriba y hacia la derecha: el
            `pr-*` del contenedor devuelve el conjunto al centro óptico, y en
            móvil el desplazamiento se reduce para que no se salgan de página. */}
        <Reveal variant="scale" delay={120} className="mt-14 flex justify-center pr-3 sm:pr-6">
          <Tilt max={4} className="relative w-[min(70vw,20rem)]">
            <div
              aria-hidden
              className="absolute -inset-2 -z-10 translate-x-1.5 -translate-y-1.5 rounded-t-[999px] border border-[var(--color-gold-deep)]/70 sm:-inset-2.5 sm:translate-x-3 sm:-translate-y-3"
            />
            <div
              aria-hidden
              className="absolute -inset-4 -z-20 translate-x-3 -translate-y-3 rounded-t-[999px] border border-[var(--color-gold-deep)]/30 sm:-inset-5 sm:translate-x-6 sm:-translate-y-6"
            />
            <div className="landing-arch overflow-hidden rounded-t-[999px] border border-[var(--color-border)] bg-[var(--color-muted)] shadow-[var(--shadow-warm)]">
              <CoupleImage
                src={media.coupleImageUrl}
                alt={alt}
                monogram={couple.monogram}
                className="landing-kenburns aspect-[4/5] h-full w-full object-cover"
              />
            </div>
          </Tilt>
        </Reveal>

        {story.length ? (
          <div className="mx-auto mt-14 max-w-xl">
            <Reveal variant="line">
              <p className="text-center text-[0.65rem] uppercase tracking-[0.36em] indent-[0.36em] text-[var(--color-accent)]">
                Nuestra historia
              </p>
            </Reveal>
            {story.map((p, i) => (
              <Reveal key={i} variant="blur" delay={100 + i * 80}>
                <p className="mt-5 text-center font-display text-[1.15rem] font-light leading-[1.8] text-[var(--color-foreground)]/85 sm:text-[1.2rem]">
                  {p}
                </p>
              </Reveal>
            ))}
          </div>
        ) : null}

        {quote ? (
          <Reveal variant="blur" delay={120} className="mt-16 text-center">
            <div className="mx-auto w-24 text-[var(--color-gold-deep)]/70">
              <Ornament />
            </div>
            <blockquote className="mt-6">
              <p
                className="text-[clamp(1.6rem,5.4vw,2.4rem)] leading-[1.4] text-[var(--color-accent)]"
                style={{ fontFamily: 'var(--font-script)' }}
              >
                {quote.text}
              </p>
              {quote.attribution ? (
                <footer className="mt-5 text-[0.65rem] uppercase tracking-[0.36em] indent-[0.36em] text-[var(--color-muted-foreground)]">
                  {quote.attribution}
                </footer>
              ) : null}
            </blockquote>
          </Reveal>
        ) : null}
      </div>
    </section>
  )
}
