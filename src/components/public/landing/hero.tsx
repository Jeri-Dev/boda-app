import type { WeddingContent } from '@/app/(public)/nuestra-boda/content'

import { CoupleImage } from './couple-image'
import { EucalyptusBranch, Petal, RoseBloom } from './florals'
import { dateParts } from './format'
import { ChevronDown, MapPin } from './icons'
import { Ornament } from './ornament'
import { Parallax } from './parallax'

/**
 * Invitation hero: script names, date stamp, and the couple photo in an arch
 * frame — now layered over parallax botanicals, drifting petals and a staged
 * CSS entrance. Server component; motion lives in CSS + the Parallax wrappers.
 */
export function Hero({ data }: { data: WeddingContent }) {
  const { couple, city } = data
  const d = dateParts(data.dateISO)

  return (
    <section
      id="inicio"
      className="relative isolate flex min-h-dvh flex-col items-center justify-center overflow-hidden px-5 pb-16 pt-24 sm:px-8 sm:pt-28"
    >
      {/* Soft color washes (deepest background layer). */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-20">
        <div className="absolute inset-0 bg-[radial-gradient(130%_90%_at_50%_-10%,transparent_40%,oklch(0.55_0.125_10/0.07)_100%)]" />
        <div className="absolute -left-24 top-1/4 h-72 w-72 rounded-full bg-[var(--color-accent)]/10 blur-3xl" />
        <div className="absolute -right-20 top-1/3 h-64 w-64 rounded-full bg-[var(--color-gold)]/15 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-56 w-[36rem] -translate-x-1/2 rounded-full bg-[var(--color-sage)]/10 blur-3xl" />
      </div>

      {/* Parallax botanicals — each layer scrolls at its own speed. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <Parallax speed={0.14} className="absolute -left-10 -top-8 w-36 text-[var(--color-sage)] opacity-45 sm:w-56">
          <div className="rotate-[150deg]">
            <EucalyptusBranch className="landing-sway w-full" />
          </div>
        </Parallax>
        <Parallax speed={0.09} className="absolute -right-9 top-16 w-28 text-[var(--color-accent)] opacity-30 sm:top-24 sm:w-40">
          <div className="rotate-[18deg]">
            <RoseBloom className="landing-sway-slow w-full" />
          </div>
        </Parallax>
        <Parallax speed={0.18} className="absolute -bottom-12 -left-8 w-32 text-[var(--color-accent)] opacity-30 sm:w-44">
          <div className="-rotate-12">
            <RoseBloom className="landing-sway-slow w-full" />
          </div>
        </Parallax>
        <Parallax speed={0.11} className="absolute -bottom-10 -right-12 w-40 text-[var(--color-sage)] opacity-40 sm:w-60">
          <div className="-rotate-[35deg]">
            <EucalyptusBranch className="landing-sway w-full" />
          </div>
        </Parallax>
        {/* Drifting petals */}
        <Parallax speed={0.24} className="absolute inset-0" innerClassName="relative h-full w-full">
          <Petal className="landing-drift-a absolute left-[10%] top-[16%] w-4 rotate-12 text-[var(--color-accent)] opacity-35" />
          <Petal className="landing-drift-b absolute right-[14%] top-[24%] w-3 -rotate-45 text-[var(--color-gold)] opacity-45" />
          <Petal className="landing-drift-c absolute bottom-[26%] left-[18%] w-4 rotate-90 text-[var(--color-accent)] opacity-25" />
          <Petal className="landing-drift-b absolute bottom-[30%] right-[20%] w-3 rotate-45 text-[var(--color-sage)] opacity-40" />
          <Petal className="landing-drift-a absolute right-[38%] top-[10%] w-2.5 -rotate-12 text-[var(--color-accent)] opacity-30" />
        </Parallax>
      </div>

      {/* Overline */}
      <p className="landing-enter-1 flex items-center gap-3 text-[0.7rem] uppercase tracking-[0.4em] text-[var(--color-muted-foreground)]">
        <span className="h-px w-8 bg-[var(--color-border)]" />
        {data.tagline}
        <span className="h-px w-8 bg-[var(--color-border)]" />
      </p>

      {/* Names */}
      <h1 className="landing-enter-2 mt-6 text-center leading-[0.85] text-[var(--color-foreground)]">
        <span className="sr-only">
          {couple.first} y {couple.second}
        </span>
        <span
          aria-hidden
          className="block text-[clamp(3.25rem,13vw,7rem)] leading-[0.9]"
          style={{ fontFamily: 'var(--font-script)' }}
        >
          {couple.first}
          <span className="landing-shimmer mx-1 inline-block">&amp;</span>
          {couple.second}
        </span>
      </h1>

      {/* Date stamp */}
      <div className="landing-enter-3 mt-8 flex items-center gap-4 text-[var(--color-foreground)]">
        <span className="hidden h-px w-10 bg-[var(--color-border)] sm:block" />
        <div className="text-center">
          <p className="font-display text-sm capitalize tracking-[0.15em] sm:text-base">
            {d.weekday}
          </p>
          <p className="mt-1 font-display text-lg tracking-[0.1em] sm:text-xl">
            {d.day} de {d.month}, {d.year}
          </p>
        </div>
        <span className="hidden h-px w-10 bg-[var(--color-border)] sm:block" />
      </div>

      {/* Arch-framed photo with a gold echo outline + Ken Burns */}
      <div className="landing-enter-4 relative mt-9">
        <div className="relative w-[min(72vw,17.5rem)]">
          <div
            aria-hidden
            className="absolute -inset-2 -z-10 translate-x-3.5 -translate-y-2.5 rounded-b-[var(--radius-xl)] rounded-t-[999px] border border-[var(--color-gold)]/60"
          />
          <div className="overflow-hidden rounded-b-[var(--radius-xl)] rounded-t-[999px] border border-[var(--color-border)] bg-[var(--color-muted)] shadow-[var(--shadow-warm)]">
            <CoupleImage
              alt={`${couple.first} y ${couple.second}`}
              monogram={couple.monogram}
              className="landing-kenburns aspect-[4/5] h-full w-full object-cover"
            />
          </div>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-1.5 rounded-b-[calc(var(--radius-xl)-4px)] rounded-t-[999px] ring-1 ring-inset ring-white/25"
          />
          {/* Monogram seal */}
          <div className="absolute -bottom-6 left-1/2 flex h-16 w-16 -translate-x-1/2 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-background)] shadow-[var(--shadow-soft)]">
            <span
              className="whitespace-nowrap text-xl leading-none text-[var(--color-accent)]"
              style={{ fontFamily: 'var(--font-script)' }}
            >
              {couple.monogram}
            </span>
          </div>
        </div>
      </div>

      {/* City */}
      <p className="landing-enter-5 mt-9 flex items-center gap-1.5 text-sm text-[var(--color-muted-foreground)]">
        <MapPin className="h-4 w-4 text-[var(--color-accent)]" />
        {city}
      </p>

      <div className="landing-enter-5 mt-6 w-40 text-[var(--color-accent)]/50">
        <Ornament />
      </div>

      {/* Scroll cue */}
      <a
        href="#confirmar"
        aria-label="Desplázate para confirmar tu asistencia"
        className="landing-enter-6 group mt-8 flex flex-col items-center gap-1.5 text-[var(--color-muted-foreground)] transition-colors hover:text-[var(--color-accent)]"
      >
        <span className="text-[0.65rem] uppercase tracking-[0.25em]">Desliza</span>
        <ChevronDown className="h-5 w-5 animate-bounce motion-reduce:animate-none" />
      </a>
    </section>
  )
}
