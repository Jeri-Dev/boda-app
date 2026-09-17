import { CalendarCard } from './calendar-card'
import { Countdown } from './countdown'
import { Edge } from './edges'
import { BlossomSprig, PalmFrond } from './florals'
import { Spotlight } from './motion'
import { Ornament } from './ornament'
import { Parallax } from './parallax'
import { Petals } from './petals'
import { Reveal } from './reveal'

/**
 * Placa de tinta con las dos maneras de mirar la misma fecha: cuánto falta y
 * en qué casilla del mes cae. A partir de `md` van hombro con hombro,
 * separadas por un filete de champán. Bordes rasgados arriba y abajo.
 */
export function CountdownBand({ dateISO }: { dateISO: string }) {
  return (
    <section
      aria-label="Cuenta atrás para la boda"
      className="landing-ink relative isolate overflow-hidden px-5 py-24 sm:px-8 sm:py-32"
    >
      <Edge position="top" />
      <Edge position="bottom" />
      <div
        aria-hidden
        className="absolute inset-0 -z-20"
        style={{
          background:
            'linear-gradient(160deg, var(--color-ink-2), var(--color-ink) 62%, oklch(0.255 0.060 198))',
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(60%_60%_at_50%_0%,oklch(0.64_0.135_190/0.28),transparent_72%)]"
      />
      <Spotlight />

      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <Parallax
          speed={0.12}
          className="absolute -left-20 top-1/2 w-40 -translate-y-1/2 text-[var(--color-gold)] opacity-[0.13] sm:w-56"
        >
          <div className="rotate-[18deg]">
            <PalmFrond className="landing-sway-slow w-full" />
          </div>
        </Parallax>
        <Parallax
          speed={0.08}
          className="absolute -right-8 top-10 w-20 text-[var(--color-gold)] opacity-30 sm:w-24"
        >
          <div className="rotate-[22deg] -scale-x-100">
            <BlossomSprig className="landing-sway w-full" />
          </div>
        </Parallax>
        <Petals count={8} />
      </div>

      {/* `min-w-0` en las columnas: sin él, un hijo ancho (la cuenta atrás)
          estira la columna y el resto del bloque se recorta en móvil. */}
      <div className="mx-auto grid max-w-4xl items-center gap-14 md:grid-cols-2 md:gap-0">
        <Reveal variant="blur" className="min-w-0 text-center md:pr-12">
          <p className="text-[0.68rem] uppercase tracking-[0.38em] indent-[0.38em] text-[var(--color-gold)]">
            El gran día se acerca
          </p>
          <p
            className="mt-2 text-[3.25rem] leading-none text-[oklch(0.945_0.028_88)] sm:text-6xl"
            style={{ fontFamily: 'var(--font-script)' }}
          >
            Faltan
          </p>
          <div className="mt-7">
            <Countdown dateISO={dateISO} />
          </div>
          <p className="mt-7 text-sm text-[oklch(0.92_0.02_88)]/80">
            para el «sí, acepto» —{' '}
            <a
              href="#confirmar"
              className="text-[var(--color-gold)] underline-offset-4 hover:underline"
            >
              confirma tu asistencia
            </a>
          </p>
        </Reveal>

        <div aria-hidden className="mx-auto w-32 text-[var(--color-gold)]/40 md:hidden">
          <Ornament />
        </div>

        <Reveal variant="scale" delay={140} className="relative min-w-0 md:pl-12">
          <span
            aria-hidden
            className="absolute inset-y-2 left-0 hidden w-px bg-gradient-to-b from-transparent via-[var(--color-gold)]/35 to-transparent md:block"
          />
          <CalendarCard dateISO={dateISO} />
        </Reveal>
      </div>
    </section>
  )
}
