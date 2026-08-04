import type { WeddingContent } from '@/app/(public)/nuestra-boda/content'

import { EucalyptusBranch, PeonyBloom } from './florals'
import { Sparkle } from './icons'
import { Parallax } from './parallax'
import { Reveal } from './reveal'

/**
 * The page's one dark, dramatic moment: a full-bleed deep-plum band with the
 * couple's verse in script, ivory botanicals drifting on parallax behind it.
 * Creates the light→dark→light rhythm the ivory sections need.
 */
export function QuoteBand({ data }: { data: WeddingContent }) {
  const { quote } = data

  return (
    <section aria-label="Versículo" className="relative isolate overflow-hidden py-24 text-center sm:py-32">
      {/* Deep plum → wine gradient + center glow */}
      <div
        aria-hidden
        className="absolute inset-0 -z-20"
        style={{
          background:
            'linear-gradient(140deg, oklch(0.27 0.035 340), oklch(0.33 0.07 355) 55%, oklch(0.3 0.055 20))',
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(65%_65%_at_50%_38%,oklch(1_0_0/0.08),transparent_70%)]"
      />

      {/* Ivory botanicals, slow parallax */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 text-[oklch(0.96_0.01_70)]">
        <Parallax speed={0.15} className="absolute -left-14 -top-10 w-44 opacity-15 sm:w-64">
          <div className="rotate-[145deg]">
            <EucalyptusBranch className="w-full" />
          </div>
        </Parallax>
        <Parallax speed={0.09} className="absolute -bottom-14 -right-10 w-40 opacity-15 sm:w-56">
          <div className="-rotate-[25deg]">
            <EucalyptusBranch className="w-full" />
          </div>
        </Parallax>
        <Parallax speed={0.2} className="absolute -right-8 -top-8 w-32 text-[var(--color-gold)] opacity-25 sm:w-40">
          <PeonyBloom className="w-full" />
        </Parallax>
      </div>

      <Reveal className="mx-auto max-w-3xl px-6 sm:px-8">
        <Sparkle className="mx-auto h-6 w-6 text-[var(--color-gold)]" />
        <blockquote className="mt-7">
          <p
            className="text-[clamp(1.8rem,5vw,3rem)] leading-[1.35] text-[oklch(0.965_0.008_70)]"
            style={{ fontFamily: 'var(--font-script)' }}
          >
            “{quote.text}”
          </p>
          <footer className="mt-7 text-[0.7rem] uppercase tracking-[0.4em] text-[var(--color-gold)]">
            {quote.attribution}
          </footer>
        </blockquote>
      </Reveal>
    </section>
  )
}
