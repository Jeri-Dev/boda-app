import type { WeddingContent } from '@/lib/wedding-content'

import { BlossomSprig, Leaf, PalmFrond } from './florals'
import { dateParts } from './format'
import { HeroBackdrop } from './hero-backdrop'
import { ChevronDown, MapPin } from './icons'
import { Parallax } from './parallax'
import { Petals } from './petals'
import { Seal } from './seal'

/**
 * La tarjeta.
 *
 * Tras abrir el sobre, la invitación en sí: una placa de tinta turquesa con un
 * marco doble en champán (como la lámina estampada de una tarjeta impresa),
 * el sello, los nombres en script, el sello de fecha y la ciudad. Todo entra
 * escalonado (`.landing-enter` con `--i`) cuando la raíz pasa a
 * `.landing-opened`; el resto de la página entra en silencio al hacer scroll.
 *
 * Componente de servidor: el movimiento vive en CSS.
 */
export function Hero({ content }: { content: WeddingContent }) {
  const { couple, event, tagline, media } = content
  const d = event.startISO ? dateParts(event.startISO) : null
  const placeLine = event.city ?? content.ceremony?.place ?? null

  return (
    // El ritmo vertical se comprime en móvil y `pb-28` reserva la franja donde
    // flotan el indicador de scroll y el reproductor: así el hero cabe en una
    // pantalla de 667 px sin dejar el botón principal bajo la línea de flotación.
    <section
      id="inicio"
      className="landing-hero  relative isolate flex min-h-dvh flex-col items-center justify-center overflow-hidden px-5 pb-28 pt-20 text-center sm:px-8 sm:pb-16 sm:pt-24"
    >
      {/* Tinta con la luz cayendo desde arriba */}
      <div
        aria-hidden
        className="absolute inset-0 -z-30"
        style={{
          background:
            'linear-gradient(168deg, var(--color-ink-2), var(--color-ink) 58%, oklch(0.245 0.058 198))',
        }}
      />
      <HeroBackdrop src={media.coupleImageUrl} />
      <div
        aria-hidden
        className="absolute inset-0 -z-20 bg-[radial-gradient(72%_48%_at_50%_26%,oklch(0.62_0.135_190/0.42),transparent_70%)]"
      />
      <div aria-hidden className="landing-rays absolute inset-0 -z-20" />

      {/* Marco doble estampado */}
      <div aria-hidden className="landing-hero-frame" />

      {/* Botánica en champán, cada capa a su propia velocidad */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <Parallax
          speed={0.13}
          className="absolute -left-14 bottom-[-6%] w-44 text-[var(--color-gold)] opacity-[0.16] sm:w-64"
        >
          <div className="rotate-[24deg]">
            <PalmFrond className="landing-sway w-full" />
          </div>
        </Parallax>
        <Parallax
          speed={0.09}
          className="absolute -right-16 bottom-[-10%] w-48 text-[var(--color-gold)] opacity-[0.14] sm:w-72"
        >
          <div className="-rotate-[28deg] -scale-x-100">
            <PalmFrond className="landing-sway-slow w-full" />
          </div>
        </Parallax>
        <Parallax
          speed={0.18}
          className="absolute -left-6 top-[42%] w-20 text-[var(--color-gold)] opacity-25 sm:w-24"
        >
          <div className="-rotate-[18deg]">
            <BlossomSprig className="landing-sway-slow w-full" />
          </div>
        </Parallax>
        <Parallax speed={0.24} className="absolute inset-0" innerClassName="relative h-full w-full">
          <Leaf className="landing-drift-a absolute left-[12%] top-[22%] w-3.5 rotate-12 text-[var(--color-gold)] opacity-30" />
          <Leaf className="landing-drift-b absolute right-[16%] top-[30%] w-3 -rotate-45 text-[var(--color-sage)] opacity-35" />
          <Leaf className="landing-drift-c absolute bottom-[24%] left-[22%] w-3 rotate-90 text-[var(--color-gold)] opacity-20" />
        </Parallax>
        <Petals count={14} />
      </div>

      <div className="landing-enter " style={{ '--i': 0 } as React.CSSProperties}>
        <Seal
          monogram={couple.monogram}
          className="landing-seal-float h-16 w-16 text-[var(--color-gold)] sm:h-20 sm:w-20"
          monogramClassName="text-[1.35rem] sm:text-2xl"
        />
      </div>

      <p
        className="landing-enter mt-6 text-[0.68rem] uppercase tracking-[0.42em] indent-[0.42em] text-[var(--color-gold)] sm:mt-7"
        style={{ '--i': 1 } as React.CSSProperties}
      >
        {tagline}
      </p>

      <h1
        className="landing-enter mt-4 leading-[0.9] text-[oklch(0.945_0.028_88)]  px-4 ml-4"
        style={{ '--i': 2 } as React.CSSProperties}
      >
        <span className="sr-only">{couple.names}</span>
        <span
          aria-hidden
          className="block text-[clamp(3.2rem,14vw,7.5rem)] leading-[0.95]"
          style={{ fontFamily: 'var(--font-script)' }}
        >
          {couple.first}
          {couple.second ? (
            <>
              <span className="landing-foil mx-2 inline-block">&amp;</span>
              {couple.second}
            </>
          ) : null}
        </span>
      </h1>

      {d ? (
        <DateStamp weekday={d.weekday} day={d.day} month={d.month} year={d.year} time={event.timeLabel} />
      ) : null}

      {placeLine ? (
        <p
          className="landing-enter mt-6 flex max-w-[22rem] items-center justify-center gap-1.5 text-balance px-2 text-sm text-[oklch(0.92_0.02_88)]/80 sm:mt-7 sm:max-w-none"
          style={{ '--i': 4 } as React.CSSProperties}
        >
          <MapPin className="h-4 w-4 shrink-0 text-[var(--color-gold)]" />
          {placeLine}
        </p>
      ) : null}

      {/* En móvil los dos botones comparten ancho (si no, quedan escalonados y
          el bloque se ve descentrado); en sm vuelven a ir en fila. */}
      <div
        className="landing-enter mt-7 flex w-full max-w-[18rem] flex-col items-stretch gap-2.5 sm:mt-10 sm:w-auto sm:max-w-none sm:flex-row sm:items-center sm:gap-4"
        style={{ '--i': 5 } as React.CSSProperties}
      >
        <a
          href="#confirmar"
          className="landing-shine inline-flex h-11 items-center justify-center bg-[var(--color-gold)] px-7 text-[0.72rem] uppercase tracking-[0.22em] indent-[0.22em] text-[var(--color-ink)] shadow-[0_10px_30px_oklch(0.2_0.05_195/0.35)] transition-transform duration-300 hover:-translate-y-0.5 sm:h-12"
        >
          Confirmar asistencia
        </a>
        <a
          href="#invitacion"
          className="inline-flex h-11 items-center justify-center border border-[var(--color-gold)]/45 px-7 text-[0.72rem] uppercase tracking-[0.22em] indent-[0.22em] text-[var(--color-gold)] transition-colors hover:bg-[var(--color-gold)]/10 sm:h-12"
        >
          Abrir la invitación
        </a>
      </div>

      <a
        href="#invitacion"
        aria-label="Bajar a la invitación"
        className="landing-enter group absolute bottom-6 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 text-[oklch(0.92_0.02_88)]/60 transition-colors hover:text-[var(--color-gold)] sm:bottom-7"
        style={{ '--i': 6 } as React.CSSProperties}
      >
        <span className="landing-scroll-line" aria-hidden />
        <ChevronDown className="h-4 w-4 animate-bounce motion-reduce:animate-none" />
      </a>
    </section>
  )
}

/**
 * Sello de fecha: mes arriba; día de la semana · número · año separados por
 * filetes; la hora debajo. Lo que se recuerda de una boda es el número del día.
 */
function DateStamp({
  weekday,
  day,
  month,
  year,
  time,
}: {
  weekday: string
  day: string
  month: string
  year: string
  time: string | null
}) {
  return (
    <div
      className="landing-enter mt-7 w-full max-w-[26rem] sm:mt-9 sm:max-w-none"
      style={{ '--i': 3 } as React.CSSProperties}
    >
      <p className="text-[0.68rem] uppercase tracking-[0.42em] indent-[0.42em] text-[var(--color-gold)]/85">
        {month}
      </p>
      {/* Los filetes son elásticos (`flex-1` con tope): así el grupo central
          queda centrado exacto y en pantallas estrechas se acortan en vez de
          empujar el día fuera de la caja. */}
      <div className="mt-2.5 flex items-center justify-center gap-3 sm:mt-3 sm:gap-7">
        <span className="landing-hairline h-px max-w-10 min-w-3 flex-1 sm:max-w-14" />
        <span className="shrink-0 text-[0.72rem] uppercase tracking-[0.18em] indent-[0.18em] text-[oklch(0.92_0.02_88)]/75 sm:tracking-[0.24em] sm:indent-[0.24em]">
          {weekday}
        </span>
        <span
          className="shrink-0 font-display text-[2.7rem] font-light leading-none text-[oklch(0.955_0.025_88)] sm:text-5xl"
          style={{ fontVariantNumeric: 'lining-nums' }}
        >
          {day}
        </span>
        <span className="shrink-0 text-[0.72rem] uppercase tracking-[0.18em] indent-[0.18em] text-[oklch(0.92_0.02_88)]/75 sm:tracking-[0.24em] sm:indent-[0.24em]">
          {year}
        </span>
        <span className="landing-hairline h-px max-w-10 min-w-3 flex-1 sm:max-w-14" />
      </div>
      {time ? (
        <p className="mt-2.5 text-[0.72rem] uppercase tracking-[0.3em] indent-[0.3em] text-[var(--color-gold)]/85 sm:mt-3">
          {time}
        </p>
      ) : null}
    </div>
  )
}
