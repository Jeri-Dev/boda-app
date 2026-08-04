import type { WeddingContent } from '@/app/(public)/nuestra-boda/content'

import { BlossomSprig, EucalyptusBranch } from './florals'
import { formatLongDateEs } from './format'
import { Heart } from './icons'
import { Ornament } from './ornament'

/**
 * Deep-plum closing panel — bookends the ivory page with the same dark note as
 * the quote band. Gold botanicals, script names, hashtag and WhatsApp contact.
 */
export function Footer({ data }: { data: WeddingContent }) {
  const { couple } = data

  return (
    <footer
      className="relative overflow-hidden px-5 py-20 text-center sm:px-8"
      style={{
        background:
          'linear-gradient(180deg, oklch(0.27 0.03 340), oklch(0.22 0.028 345))',
      }}
    >
      {/* Gold botanicals in the corners */}
      <div aria-hidden className="pointer-events-none absolute inset-0 text-[var(--color-gold)]">
        <div className="absolute -left-12 -top-8 w-40 rotate-[150deg] opacity-20 sm:w-52">
          <EucalyptusBranch className="w-full" />
        </div>
        <div className="absolute -right-6 bottom-0 w-24 -rotate-[20deg] opacity-25 sm:w-28">
          <BlossomSprig className="w-full" />
        </div>
      </div>

      <div className="relative mx-auto max-w-xl">
        <p
          className="text-5xl text-[var(--color-gold)] sm:text-6xl"
          style={{ fontFamily: 'var(--font-script)' }}
        >
          {couple.first} &amp; {couple.second}
        </p>

        <div className="mx-auto mt-6 w-40 text-[var(--color-gold)]/50">
          <Ornament />
        </div>

        <p className="mt-6 font-display tracking-[0.1em] text-[oklch(0.94_0.01_70)]">
          {formatLongDateEs(data.dateISO)}
        </p>
        <p className="mt-1 text-sm text-[oklch(0.94_0.01_70)]/60">{data.city}</p>

        <p
          className="mt-6 text-lg text-[oklch(0.78_0.09_10)]"
          style={{ fontFamily: 'var(--font-script)' }}
        >
          {couple.hashtag}
        </p>

        <a
          href={`https://wa.me/${data.contact.whatsapp}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-block text-sm text-[var(--color-gold)] underline-offset-4 hover:underline"
        >
          {data.contact.label}
        </a>

        <p className="mt-12 flex items-center justify-center gap-1.5 text-xs text-[oklch(0.94_0.01_70)]/45">
          Hecho con
          <Heart className="h-3.5 w-3.5 fill-[oklch(0.72_0.12_10)] text-[oklch(0.72_0.12_10)]" />
          para nuestra boda
        </p>
      </div>
    </footer>
  )
}
