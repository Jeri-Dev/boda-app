'use client'

import { useState } from 'react'

import type { GiftAccount, WeddingContent } from '@/lib/wedding-content'
import { cn } from '@/lib/utils/cn'

import { Edge } from './edges'
import { BlossomSprig, PalmFrond } from './florals'
import { Bank, Check, Copy, Envelope } from './icons'
import { Spotlight } from './motion'
import { SectionHeading } from './ornament'
import { Parallax } from './parallax'
import { Reveal } from './reveal'

function AccountCard({ account }: { account: GiftAccount }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(account.number)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      /* Sin portapapeles: el número queda a la vista para copiarlo a mano. */
    }
  }

  return (
    <div className="landing-ink-card flex flex-col p-6 text-left">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[0.65rem] uppercase tracking-[0.28em] text-[var(--color-gold)]">
          {account.bank}
        </p>
        {account.currency ? (
          <span className="shrink-0 border border-[var(--color-gold)]/35 px-2 py-0.5 text-[0.6rem] uppercase tracking-[0.16em] text-[oklch(0.92_0.02_88)]/80">
            {account.currency}
          </span>
        ) : null}
      </div>

      {account.holder || account.type ? (
        <p className="mt-2 text-sm text-[oklch(0.92_0.02_88)]/80">
          {[account.holder, account.type].filter(Boolean).join(' · ')}
        </p>
      ) : null}

      <p className="mt-5 font-display text-[1.6rem] font-light tabular-nums tracking-wide text-[oklch(0.955_0.025_88)]">
        {account.number}
      </p>

      {account.reference ? (
        <p className="mt-1.5 text-xs text-[oklch(0.92_0.02_88)]/72">{account.reference}</p>
      ) : null}

      <button
        type="button"
        onClick={copy}
        aria-label={`Copiar el número de cuenta de ${account.bank}`}
        className={cn(
          'mt-6 inline-flex h-11 items-center justify-center gap-2 border px-4 text-sm transition-colors',
          copied
            ? 'border-[var(--color-gold)] bg-[var(--color-gold)] text-[var(--color-ink)]'
            : 'border-[var(--color-gold)]/40 text-[oklch(0.94_0.02_88)] hover:bg-[var(--color-gold)] hover:text-[var(--color-ink)]',
        )}
      >
        {copied ? <Check className="landing-pop h-4 w-4" /> : <Copy className="h-4 w-4" />}
        {copied ? 'Número copiado' : 'Copiar número'}
      </button>
    </div>
  )
}

/**
 * Mesa de regalos sobre placa de tinta. Las cuentas están a la vista —
 * esconderlas tras un desplegable obliga a buscar justo lo que se ha venido a
 * hacer. El texto mantiene la cortesía: primero la presencia, después la
 * transferencia.
 */
export function GiftsSection({ content }: { content: WeddingContent }) {
  const gifts = content.gifts
  if (!gifts) return null

  return (
    <section
      id="regalos"
      className="landing-ink relative isolate scroll-mt-20 overflow-hidden px-5 py-24 sm:px-8 sm:py-32"
    >
      <Edge position="top" />
      <Edge position="bottom" />
      <div
        aria-hidden
        className="absolute inset-0 -z-20"
        style={{
          background:
            'linear-gradient(200deg, var(--color-ink-2), var(--color-ink) 60%, oklch(0.255 0.060 198))',
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(58%_55%_at_50%_10%,oklch(0.64_0.135_190/0.26),transparent_72%)]"
      />
      <Spotlight />

      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <Parallax
          speed={0.11}
          className="absolute -right-20 bottom-[-8%] w-44 text-[var(--color-gold)] opacity-[0.13] sm:w-60"
        >
          <div className="-rotate-[24deg] -scale-x-100">
            <PalmFrond className="landing-sway-slow w-full" />
          </div>
        </Parallax>
        <Parallax
          speed={0.08}
          className="absolute -left-6 top-12 w-20 text-[var(--color-gold)] opacity-30 sm:w-24"
        >
          <div className="-rotate-[16deg]">
            <BlossomSprig className="landing-sway w-full" />
          </div>
        </Parallax>
      </div>

      <div className="mx-auto max-w-3xl text-center">
        <Reveal variant="scale">
          <Bank className="mx-auto h-8 w-8 text-[var(--color-gold)]" />
        </Reveal>

        <Reveal variant="line" delay={60}>
          <SectionHeading overline="Con cariño" title="Mesa de regalos" tone="ink" className="mt-6" />
        </Reveal>

        {gifts.message ? (
          <Reveal variant="blur" delay={120}>
            <p className="mx-auto mt-8 max-w-xl whitespace-pre-line font-display text-[1.25rem] font-light leading-[1.7] text-[oklch(0.94_0.022_88)]/90">
              {gifts.message}
            </p>
          </Reveal>
        ) : null}

        {gifts.accounts.length ? (
          <div
            className={cn(
              'mt-12 grid gap-5',
              gifts.accounts.length > 1 ? 'sm:grid-cols-2' : 'mx-auto max-w-md',
            )}
          >
            {gifts.accounts.map((account, i) => (
              <Reveal key={`${account.bank}-${i}`} variant="scale" delay={i * 100}>
                <AccountCard account={account} />
              </Reveal>
            ))}
          </div>
        ) : null}

        {gifts.details ? (
          <Reveal delay={140}>
            <p className="mx-auto mt-8 max-w-md whitespace-pre-line border border-[var(--color-gold)]/25 px-5 py-4 text-sm leading-relaxed text-[oklch(0.94_0.02_88)]/85">
              {gifts.details}
            </p>
          </Reveal>
        ) : null}

        {gifts.envelopeNote ? (
          <Reveal delay={160}>
            <p className="mx-auto mt-10 flex max-w-md items-center justify-center gap-2.5 text-sm text-[oklch(0.92_0.02_88)]/80">
              <Envelope className="h-5 w-5 shrink-0 text-[var(--color-gold)]" />
              {gifts.envelopeNote}
            </p>
          </Reveal>
        ) : null}
      </div>
    </section>
  )
}
