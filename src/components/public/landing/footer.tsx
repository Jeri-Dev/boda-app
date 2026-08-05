import type { WeddingContent } from '@/app/(public)/nuestra-boda/content'

import { BlossomSprig, PalmFrond } from './florals'
import { formatLongDateEs } from './format'
import { Heart } from './icons'
import { Ornament } from './ornament'
import { Seal } from './seal'

/**
 * Cierre en tinta: la contraportada del sobre. Vuelve el sello y los nombres,
 * ahora en champán, con la fecha, el hashtag y el WhatsApp por si alguien
 * necesita preguntar algo que la invitación no responda.
 */
export function Footer({ data }: { data: WeddingContent }) {
  const { couple } = data

  return (
    <footer
      className="relative overflow-hidden px-5 py-20 text-center sm:px-8"
      style={{
        background:
          'linear-gradient(180deg, var(--color-ink), oklch(0.235 0.055 199))',
      }}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 text-[var(--color-gold)]">
        <div className="absolute -left-16 -top-10 w-40 rotate-[152deg] opacity-[0.12] sm:w-56">
          <PalmFrond className="w-full" />
        </div>
        <div className="absolute -right-5 bottom-2 w-20 -rotate-[18deg] opacity-25 sm:w-24">
          <BlossomSprig className="w-full" />
        </div>
      </div>

      <div className="relative mx-auto max-w-xl">
        <Seal
          monogram={couple.monogram}
          className="h-16 w-16 text-[var(--color-gold)]"
          monogramClassName="text-xl"
        />

        <p
          className="mt-8 text-[3rem] leading-none text-[oklch(0.945_0.028_88)] sm:text-[3.75rem]"
          style={{ fontFamily: 'var(--font-script)' }}
        >
          {couple.first} &amp; {couple.second}
        </p>

        <div className="mx-auto mt-7 w-32 text-[var(--color-gold)]/55">
          <Ornament />
        </div>

        <p className="mt-7 text-[0.72rem] uppercase tracking-[0.3em] text-[oklch(0.93_0.02_88)]/85">
          {formatLongDateEs(data.dateISO)}
        </p>
        <p className="mt-2 text-sm text-[oklch(0.93_0.02_88)]/72">{data.city}</p>

        <p
          className="mt-7 text-2xl text-[var(--color-gold)]"
          style={{ fontFamily: 'var(--font-script)' }}
        >
          {couple.hashtag}
        </p>

        <a
          href={`https://wa.me/${data.contact.whatsapp}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-7 inline-block border border-[var(--color-gold)]/40 px-5 py-2.5 text-[0.7rem] uppercase tracking-[0.2em] text-[var(--color-gold)] transition-colors hover:bg-[var(--color-gold)] hover:text-[var(--color-ink)]"
        >
          {data.contact.label}
        </a>

        <p className="mt-14 flex items-center justify-center gap-1.5 text-xs text-[oklch(0.93_0.02_88)]/58">
          Hecho con
          <Heart className="h-3.5 w-3.5 fill-[var(--color-gold)]/70 text-[var(--color-gold)]/70" />
          para nuestra boda
        </p>
      </div>
    </footer>
  )
}
