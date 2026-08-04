import type { WeddingContent } from '@/app/(public)/nuestra-boda/content'

import { CoupleImage } from './couple-image'
import { EucalyptusBranch, Petal } from './florals'
import { Sparkle } from './icons'
import { SectionHeading } from './ornament'
import { Parallax } from './parallax'
import { Reveal } from './reveal'

/**
 * «Nuestra historia» — warm paragraphs plus two tilted polaroid snapshots
 * (graceful monogram placeholders until `public/pareja-2.jpg` / `pareja-3.jpg`
 * exist). Eucalyptus drifts along the right edge on parallax.
 */
export function StorySection({ data }: { data: WeddingContent }) {
  const alt = `${data.couple.first} y ${data.couple.second}`

  return (
    <section className="relative isolate overflow-hidden px-5 py-20 sm:px-8 sm:py-28">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-20 bg-[var(--color-muted)]/50" />

      {/* Botanical edges */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <Parallax speed={0.13} className="absolute -right-12 top-8 w-32 text-[var(--color-sage)] opacity-40 sm:w-48">
          <div className="-rotate-[130deg]">
            <EucalyptusBranch className="landing-sway-slow w-full" />
          </div>
        </Parallax>
        <Parallax speed={0.18} className="absolute inset-0" innerClassName="relative h-full w-full">
          <Petal className="landing-drift-a absolute left-[8%] top-[30%] w-3 rotate-45 text-[var(--color-accent)] opacity-25" />
          <Petal className="landing-drift-c absolute bottom-[18%] right-[12%] w-3.5 -rotate-12 text-[var(--color-gold)] opacity-35" />
        </Parallax>
      </div>

      <div className="mx-auto max-w-2xl">
        <Reveal>
          <SectionHeading overline="Cómo empezó" title="Nuestra historia" />
        </Reveal>

        <div className="mt-10 space-y-6">
          {data.story.map((para, i) => (
            <Reveal key={i} delay={i * 100}>
              <p className="text-center text-[1.05rem] leading-relaxed text-[var(--color-foreground)]/90">
                {para}
              </p>
            </Reveal>
          ))}
        </div>

        {/* Tilted snapshots */}
        <div className="mt-12 flex items-start justify-center gap-6 sm:gap-10">
          <Reveal delay={120}>
            <figure className="-rotate-6 rounded-sm bg-white p-2 pb-6 shadow-[var(--shadow-warm)] transition-transform duration-300 hover:-rotate-3 hover:scale-[1.03]">
              <CoupleImage
                src="/pareja-2.jpg"
                alt={`${alt} — recuerdo`}
                monogram={data.couple.monogram}
                compact
                className="aspect-square w-32 object-cover sm:w-40"
              />
            </figure>
          </Reveal>
          <Reveal delay={220}>
            <figure className="mt-6 rotate-3 rounded-sm bg-white p-2 pb-6 shadow-[var(--shadow-warm)] transition-transform duration-300 hover:rotate-1 hover:scale-[1.03]">
              <CoupleImage
                src="/pareja-3.jpg"
                alt={`${alt} — recuerdo`}
                monogram={data.couple.monogram}
                compact
                className="aspect-square w-32 object-cover sm:w-40"
              />
            </figure>
          </Reveal>
        </div>

        <Reveal delay={300} className="mt-12 flex justify-center">
          <Sparkle className="h-6 w-6 text-[var(--color-gold)]" />
        </Reveal>
      </div>
    </section>
  )
}
