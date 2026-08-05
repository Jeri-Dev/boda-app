import type { WeddingContent } from '@/app/(public)/nuestra-boda/content'

import { BlossomSprig, Leaf, PalmFrond } from './florals'
import { dateParts } from './format'
import { ChevronDown, MapPin } from './icons'
import { Parallax } from './parallax'
import { Seal } from './seal'

/**
 * El sobre.
 *
 * La página abre con la invitación todavía cerrada: un panel de tinta turquesa
 * con la solapa bajada. Al cargar, la solapa gira sobre su borde superior y
 * descubre el sello de lacre, los nombres y la fecha. Es el único momento
 * coreografiado de la página — el resto entra en silencio al hacer scroll.
 *
 * Componente de servidor: todo el movimiento vive en CSS (`landing.css`), así
 * que el hero no depende de JavaScript. Si la animación no llega a ejecutarse o
 * el visitante pide menos movimiento, el sobre ya está abierto.
 */
export function Hero({ data }: { data: WeddingContent }) {
  const { couple, city } = data
  const d = dateParts(data.dateISO)

  return (
    <section
      id="inicio"
      className="relative isolate flex min-h-dvh flex-col items-center justify-center overflow-hidden px-5 pb-14 pt-24 text-center sm:px-8"
      style={{ perspective: '1600px' }}
    >
      {/* Tinta: turquesa profundo con la luz cayendo desde arriba. */}
      <div
        aria-hidden
        className="absolute inset-0 -z-30"
        style={{
          background:
            'linear-gradient(168deg, var(--color-ink-2), var(--color-ink) 58%, oklch(0.245 0.058 198))',
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-20 bg-[radial-gradient(72%_48%_at_50%_26%,oklch(0.62_0.135_190/0.42),transparent_70%)]"
      />

      {/* Interior del sobre: la cuña que deja ver la solapa al abrirse. */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 -z-10 h-[34vh] min-h-[180px]"
        style={{
          clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
          background:
            'linear-gradient(180deg, oklch(0.435 0.090 190 / 0.75), oklch(0.295 0.068 194 / 0))',
        }}
      />
      <svg
        aria-hidden
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-x-0 top-0 -z-10 h-[34vh] min-h-[180px] w-full"
      >
        <path
          d="M0 0 L50 100 L100 0"
          fill="none"
          stroke="var(--color-gold)"
          strokeOpacity="0.32"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      {/* Botánica en champán, cada capa a su propia velocidad. */}
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
      </div>

      {/* Sello de lacre — cae cuando la solapa ya ha subido. */}
      <Seal
        monogram={couple.monogram}
        className="landing-seal h-[4.5rem] w-[4.5rem] text-[var(--color-gold)] sm:h-20 sm:w-20"
        monogramClassName="text-[1.35rem] sm:text-2xl"
      />

      <p className="landing-enter-1 mt-7 text-[0.68rem] uppercase tracking-[0.42em] text-[var(--color-gold)]">
        {data.tagline}
      </p>

      <h1 className="landing-enter-2 mt-4 leading-[0.9] text-[oklch(0.945_0.028_88)]">
        <span className="sr-only">
          {couple.first} y {couple.second}
        </span>
        <span
          aria-hidden
          className="block text-[clamp(3.4rem,15vw,7.5rem)] leading-[0.95]"
          style={{ fontFamily: 'var(--font-script)' }}
        >
          {couple.first}
          <span className="landing-foil mx-1.5 inline-block">&amp;</span>
          {couple.second}
        </span>
      </h1>

      <DateStamp weekday={d.weekday} day={d.day} month={d.month} year={d.year} />

      <p className="landing-enter-4 mt-7 flex items-center gap-1.5 text-sm text-[oklch(0.92_0.02_88)]/80">
        <MapPin className="h-4 w-4 text-[var(--color-gold)]" />
        {city}
      </p>

      <a
        href="#info"
        className="landing-enter-5 group mt-10 flex flex-col items-center gap-2 text-[oklch(0.92_0.02_88)]/75 transition-colors hover:text-[var(--color-gold)]"
      >
        <span className="text-[0.62rem] uppercase tracking-[0.3em]">Abre la invitación</span>
        <ChevronDown className="h-5 w-5 animate-bounce motion-reduce:animate-none" />
      </a>

      {/* La solapa. Empieza cerrada y se abre; después ya no vuelve. */}
      <div
        aria-hidden
        className="landing-flap absolute inset-x-0 top-0 z-40 h-[34vh] min-h-[180px]"
        style={{
          clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
          background:
            'linear-gradient(180deg, oklch(0.415 0.088 191), oklch(0.305 0.070 195))',
        }}
      />
    </section>
  )
}

/**
 * Sello de fecha: mes arriba, y debajo día de la semana · día · año separados
 * por filetes. La jerarquía es la información — lo que se recuerda de una boda
 * es el número del día.
 */
function DateStamp({
  weekday,
  day,
  month,
  year,
}: {
  weekday: string
  day: string
  month: string
  year: string
}) {
  return (
    <div className="landing-enter-3 mt-9">
      <p className="text-[0.68rem] uppercase tracking-[0.42em] text-[var(--color-gold)]/85">
        {month}
      </p>
      <div className="mt-3 flex items-center justify-center gap-5 sm:gap-7">
        <span className="h-px w-10 bg-[var(--color-gold)]/40 sm:w-14" />
        <span className="text-[0.72rem] uppercase tracking-[0.24em] text-[oklch(0.92_0.02_88)]/75">
          {weekday}
        </span>
        <span
          className="font-display text-[2.6rem] font-light leading-none text-[oklch(0.955_0.025_88)] sm:text-5xl"
          style={{ fontVariantNumeric: 'lining-nums' }}
        >
          {day}
        </span>
        <span className="text-[0.72rem] uppercase tracking-[0.24em] text-[oklch(0.92_0.02_88)]/75">
          {year}
        </span>
        <span className="h-px w-10 bg-[var(--color-gold)]/40 sm:w-14" />
      </div>
    </div>
  )
}
