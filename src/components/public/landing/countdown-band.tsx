import { Countdown } from './countdown'
import { BlossomSprig, Petal } from './florals'
import { Parallax } from './parallax'
import { Reveal } from './reveal'

/**
 * Full-width countdown band right under the hero — blush wash, gold sprigs on
 * parallax, and the live countdown. Ends with a soft nudge to the RSVP form.
 */
export function CountdownBand({ dateISO }: { dateISO: string }) {
  return (
    <section
      aria-label="Cuenta atrás para la boda"
      className="relative isolate overflow-hidden border-y border-[var(--color-border)]/60 py-16 sm:py-20"
    >
      {/* Blush wash */}
      <div
        aria-hidden
        className="absolute inset-0 -z-20"
        style={{
          background:
            'linear-gradient(180deg, oklch(0.975 0.012 30), oklch(0.95 0.022 15) 55%, oklch(0.975 0.012 30))',
        }}
      />

      {/* Gold sprigs + petals on parallax */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <Parallax speed={0.16} className="absolute -left-5 top-1/2 w-24 -translate-y-1/2 text-[var(--color-gold)] opacity-60 sm:left-[6%] sm:w-28">
          <div className="-rotate-[20deg]">
            <BlossomSprig className="landing-sway-slow w-full" />
          </div>
        </Parallax>
        <Parallax speed={0.1} className="absolute -right-5 top-1/2 w-24 -translate-y-1/2 text-[var(--color-gold)] opacity-60 sm:right-[6%] sm:w-28">
          <div className="rotate-[24deg] -scale-x-100">
            <BlossomSprig className="landing-sway w-full" />
          </div>
        </Parallax>
        <Parallax speed={0.22} className="absolute inset-0" innerClassName="relative h-full w-full">
          <Petal className="landing-drift-b absolute left-[22%] top-[14%] w-3 rotate-45 text-[var(--color-accent)] opacity-30" />
          <Petal className="landing-drift-c absolute bottom-[16%] right-[24%] w-3.5 -rotate-12 text-[var(--color-accent)] opacity-25" />
        </Parallax>
      </div>

      <div className="mx-auto max-w-3xl px-5 text-center sm:px-8">
        <Reveal>
          <p className="text-[0.7rem] uppercase tracking-[0.35em] text-[var(--color-accent)]">
            El gran día se acerca
          </p>
          <p
            className="mt-3 text-5xl text-[var(--color-foreground)] sm:text-6xl"
            style={{ fontFamily: 'var(--font-script)' }}
          >
            Faltan
          </p>
        </Reveal>

        <Reveal delay={100} className="mt-8">
          <Countdown dateISO={dateISO} />
        </Reveal>

        <Reveal delay={160}>
          <p className="mt-8 text-sm text-[var(--color-muted-foreground)]">
            para el «¡Sí, acepto!» —{' '}
            <a
              href="#confirmar"
              className="font-medium text-[var(--color-accent)] underline-offset-4 hover:underline"
            >
              confirma tu asistencia
            </a>
          </p>
        </Reveal>
      </div>
    </section>
  )
}
