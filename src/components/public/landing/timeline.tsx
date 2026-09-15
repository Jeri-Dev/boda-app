'use client'

import type { TimelineIcon, TimelineItem } from '@/lib/wedding-content'
import { cn } from '@/lib/utils/cn'

import { Champagne, Church, Cutlery, Music, Sparkle } from './icons'
import { useInView } from './reveal'

const ICONS: Record<TimelineIcon, typeof Church> = {
  ceremonia: Church,
  brindis: Champagne,
  cena: Cutlery,
  fiesta: Music,
  momento: Sparkle,
}

/**
 * Itinerario del día. La línea vertical se DIBUJA (scaleY) al entrar en el
 * viewport y cada hito aparece escalonado detrás de ella, como si la pluma
 * fuese trazando el programa.
 */
export function Timeline({ items }: { items: TimelineItem[] }) {
  const { ref, inView } = useInView<HTMLOListElement>({ threshold: 0.2 })

  return (
    <ol
      ref={ref}
      className={cn('landing-timeline relative ml-5 pl-9 sm:ml-10', inView && 'is-shown')}
    >
      <span aria-hidden className="landing-timeline-line" />
      {items.map((item, i) => {
        const Icon = ICONS[item.icon]
        return (
          <li
            key={i}
            className="landing-timeline-item relative pb-10 last:pb-0"
            style={{ '--i': i } as React.CSSProperties}
          >
            <span
              aria-hidden
              className="landing-timeline-node absolute -left-[3.4rem] top-0 flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-gold-deep)]/60 bg-[var(--color-background)] text-[var(--color-accent)]"
            >
              <Icon className="h-5 w-5" />
            </span>
            {item.time ? (
              <p className="text-[0.7rem] uppercase tracking-[0.24em] tabular-nums text-[var(--color-accent)]">
                {item.time}
              </p>
            ) : null}
            <p className="mt-1 font-display text-xl font-light text-[var(--color-foreground)]">
              {item.title}
            </p>
            {item.detail ? (
              <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">{item.detail}</p>
            ) : null}
          </li>
        )
      })}
    </ol>
  )
}
