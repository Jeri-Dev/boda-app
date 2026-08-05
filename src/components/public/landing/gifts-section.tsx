'use client'

import { useState } from 'react'

import type { BankAccount, WeddingContent } from '@/app/(public)/nuestra-boda/content'
import { cn } from '@/lib/utils/cn'

import { BlossomSprig, PalmFrond } from './florals'
import { Bank, Check, Copy, Envelope } from './icons'
import { SectionHeading } from './ornament'
import { Parallax } from './parallax'
import { Reveal } from './reveal'

function AccountCard({ account }: { account: BankAccount }) {
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
    <div className="flex flex-col border border-[var(--color-gold)]/30 bg-[oklch(0.98_0.02_88/0.05)] p-6 text-left">
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

      <p className="mt-2 text-sm text-[oklch(0.92_0.02_88)]/80">
        {account.holder} · {account.type}
      </p>

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
            ? 'border-[var(--color-gold)] text-[var(--color-gold)]'
            : 'border-[var(--color-gold)]/40 text-[oklch(0.94_0.02_88)] hover:bg-[var(--color-gold)] hover:text-[var(--color-ink)]',
        )}
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        {copied ? 'Número copiado' : 'Copiar número'}
      </button>
    </div>
  )
}

/**
 * Mesa de regalos sobre placa de tinta.
 *
 * Los novios prefieren el regalo monetario, así que las cuentas están a la
 * vista: esconderlas tras un desplegable obliga a buscar justo lo que se ha
 * venido a hacer. El orden del texto mantiene la cortesía —primero la
 * presencia, después la transferencia— pero no juega al despiste.
 */
export function GiftsSection({ data }: { data: WeddingContent }) {
  const { gifts } = data

  return (
    <section
      id="regalos"
      className="relative isolate scroll-mt-20 overflow-hidden px-5 py-20 sm:px-8 sm:py-28"
    >
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
        <Reveal>
          <Bank className="mx-auto h-8 w-8 text-[var(--color-gold)]" />
        </Reveal>

        <Reveal delay={60}>
          <SectionHeading overline="Con cariño" title={gifts.intro} tone="ink" className="mt-6" />
        </Reveal>

        <Reveal delay={120}>
          <p className="mx-auto mt-8 max-w-xl font-display text-[1.25rem] font-light leading-[1.7] text-[oklch(0.94_0.022_88)]/90">
            {gifts.note}
          </p>
        </Reveal>

        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          {gifts.accounts.map((account, i) => (
            <Reveal key={`${account.bank}-${i}`} delay={i * 100}>
              <AccountCard account={account} />
            </Reveal>
          ))}
        </div>

        <Reveal delay={160}>
          <p className="mx-auto mt-10 flex max-w-md items-center justify-center gap-2.5 text-sm text-[oklch(0.92_0.02_88)]/80">
            <Envelope className="h-5 w-5 shrink-0 text-[var(--color-gold)]" />
            {gifts.envelopeNote}
          </p>
        </Reveal>
      </div>
    </section>
  )
}
