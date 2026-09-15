import { PrivacyNotice } from '@/components/public/privacy-notice'
import type { CalendarEvent } from '@/lib/calendar'
import type { WeddingContent } from '@/lib/wedding-content'

import { AddToCalendar } from './add-to-calendar'
import { Edge } from './edges'
import { BlossomSprig, PalmFrond } from './florals'
import { formatLongDateEs } from './format'
import { Heart, Whatsapp } from './icons'
import { Ornament } from './ornament'
import { Reveal } from './reveal'
import { Seal } from './seal'

/**
 * Contraportada en tinta. Vuelve el sello y los nombres, ahora en champán,
 * con la fecha, el hashtag, «guardar la fecha» y el WhatsApp por si alguien
 * necesita preguntar algo que la invitación no responda.
 */
export function Footer({
  content,
  calendar,
}: {
  content: WeddingContent
  calendar: CalendarEvent | null
}) {
  const { couple, event, contact } = content

  return (
    <footer
      className="landing-ink relative overflow-hidden px-5 pb-16 pt-24 text-center sm:px-8 sm:pt-28"
      style={{
        background: 'linear-gradient(180deg, var(--color-ink), oklch(0.235 0.055 199))',
      }}
    >
      <Edge position="top" />
      <div aria-hidden className="pointer-events-none absolute inset-0 text-[var(--color-gold)]">
        <div className="absolute -left-16 -top-10 w-40 rotate-[152deg] opacity-[0.12] sm:w-56">
          <PalmFrond className="w-full" />
        </div>
        <div className="absolute -right-5 bottom-2 w-20 -rotate-[18deg] opacity-25 sm:w-24">
          <BlossomSprig className="w-full" />
        </div>
      </div>

      <div className="relative mx-auto max-w-xl">
        <Reveal variant="scale">
          <Seal
            monogram={couple.monogram}
            className="h-16 w-16 text-[var(--color-gold)]"
            monogramClassName="text-xl"
          />
        </Reveal>

        <Reveal variant="blur" delay={80}>
          <p
            className="mt-8 text-[2.6rem] leading-none text-[oklch(0.945_0.028_88)] sm:text-[3.5rem]"
            style={{ fontFamily: 'var(--font-script)' }}
          >
            {couple.second ? (
              <>
                {couple.first} <span className="landing-foil">&amp;</span> {couple.second}
              </>
            ) : (
              couple.names
            )}
          </p>
        </Reveal>

        <div className="mx-auto mt-7 w-32 text-[var(--color-gold)]/55">
          <Ornament />
        </div>

        {event.startISO ? (
          <p className="mt-7 text-[0.72rem] uppercase tracking-[0.3em] text-[oklch(0.93_0.02_88)]/85">
            {formatLongDateEs(event.startISO)}
            {event.timeLabel ? ` · ${event.timeLabel}` : ''}
          </p>
        ) : null}
        {event.city ? (
          <p className="mt-2 text-sm text-[oklch(0.93_0.02_88)]/72">{event.city}</p>
        ) : null}

        {couple.hashtag ? (
          <p
            className="mt-7 text-2xl text-[var(--color-gold)]"
            style={{ fontFamily: 'var(--font-script)' }}
          >
            {couple.hashtag}
          </p>
        ) : null}

        {calendar ? (
          <Reveal delay={100} className="mt-9">
            <p className="mb-4 text-[0.65rem] uppercase tracking-[0.34em] text-[var(--color-gold)]/80">
              Guarda la fecha
            </p>
            <AddToCalendar event={calendar} />
          </Reveal>
        ) : null}

        {contact ? (
          <a
            href={contact.href}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex items-center gap-2 border border-[var(--color-gold)]/40 px-5 py-2.5 text-[0.7rem] uppercase tracking-[0.2em] text-[var(--color-gold)] transition-colors hover:bg-[var(--color-gold)] hover:text-[var(--color-ink)]"
          >
            <Whatsapp className="h-4 w-4" />
            Escríbenos por WhatsApp
          </a>
        ) : null}

        <div className="mx-auto mt-12 max-w-md border-t border-[var(--color-gold)]/20 pt-6 text-[oklch(0.93_0.02_88)]/60 [&_p]:text-[oklch(0.93_0.02_88)]/60 [&_span]:text-[oklch(0.95_0.02_88)]/90">
          <PrivacyNotice contact={content.privacyContact} />
        </div>

        <p className="mt-8 flex items-center justify-center gap-1.5 text-xs text-[oklch(0.93_0.02_88)]/58">
          Hecho con
          <Heart className="h-3.5 w-3.5 fill-[var(--color-gold)]/70 text-[var(--color-gold)]/70" />
          para nuestra boda
        </p>
      </div>
    </footer>
  )
}
