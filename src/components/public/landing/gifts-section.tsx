'use client'

import { useState } from 'react'

import type { BankAccount, WeddingContent } from '@/app/(public)/nuestra-boda/content'
import { cn } from '@/lib/utils/cn'

import { BlossomSprig, RoseBloom } from './florals'
import { Check, ChevronDown, Copy, Gift, Heart } from './icons'
import { SectionHeading } from './ornament'
import { Parallax } from './parallax'
import { Reveal } from './reveal'

function AccountRow({ account }: { account: BankAccount }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(account.number)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      /* Portapapeles no disponible: el número queda visible para copiar a mano. */
    }
  }

  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-background)] p-5">
      <p className="text-[0.7rem] uppercase tracking-[0.25em] text-[var(--color-accent)]">
        {account.bank}
      </p>
      <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
        {account.holder} · {account.type}
      </p>
      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="font-display text-lg tabular-nums tracking-wide text-[var(--color-foreground)]">
          {account.number}
        </span>
        <button
          type="button"
          onClick={copy}
          aria-label={`Copiar el número de cuenta de ${account.bank}`}
          className={cn(
            'flex h-10 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors',
            copied
              ? 'border-[var(--color-success)] text-[var(--color-success)]'
              : 'border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]',
          )}
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? 'Copiado' : 'Copiar'}
        </button>
      </div>
      {account.reference ? (
        <p className="mt-2 text-xs text-[var(--color-muted-foreground)]">
          {account.reference}
        </p>
      ) : null}
    </div>
  )
}

/**
 * Mesa de regalos — deliberadamente sutil. El mensaje pone por delante la
 * presencia del invitado; los datos bancarios quedan ocultos tras un toggle
 * discreto («progressive disclosure»), nunca a la vista de entrada.
 */
export function GiftsSection({ data }: { data: WeddingContent }) {
  const [open, setOpen] = useState(false)
  const { gifts } = data

  return (
    <section id="regalos" className="relative isolate scroll-mt-20 overflow-hidden px-5 py-20 sm:px-8 sm:py-28">
      {/* Blush wash rising from the footer + faint botanicals */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(85%_55%_at_50%_100%,oklch(0.96_0.02_20/0.55),transparent)]"
      />
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <Parallax speed={0.12} className="absolute -left-8 bottom-10 w-24 text-[var(--color-accent)] opacity-25 sm:w-32">
          <div className="-rotate-6">
            <RoseBloom className="landing-sway-slow w-full" />
          </div>
        </Parallax>
        <Parallax speed={0.08} className="absolute -right-4 top-16 w-20 text-[var(--color-gold)] opacity-45 sm:w-24">
          <div className="rotate-[20deg]">
            <BlossomSprig className="landing-sway w-full" />
          </div>
        </Parallax>
      </div>

      <div className="mx-auto max-w-2xl text-center">
        <Reveal>
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-gold)]/15 text-[var(--color-gold)]">
            <Gift className="h-7 w-7" />
          </div>
        </Reveal>

        <Reveal delay={60}>
          <SectionHeading
            overline="Con cariño"
            title={gifts.intro}
            className="mt-6 text-center"
          />
        </Reveal>

        <Reveal delay={120}>
          <p className="mx-auto mt-6 max-w-xl text-[1.05rem] leading-relaxed text-[var(--color-foreground)]/85">
            {gifts.note}
          </p>
        </Reveal>

        <Reveal delay={160}>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="datos-transferencia"
            className="mt-8 inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-card)] px-5 py-2.5 text-sm text-[var(--color-foreground)] shadow-[var(--shadow-soft)] transition-colors hover:border-[var(--color-accent)]/50"
          >
            {open ? 'Ocultar datos' : 'Ver datos para transferencia'}
            <ChevronDown
              className={cn(
                'h-4 w-4 transition-transform duration-300',
                open && 'rotate-180',
              )}
            />
          </button>
        </Reveal>

        <div
          id="datos-transferencia"
          className={cn(
            'grid overflow-hidden text-left transition-[grid-template-rows,opacity] duration-500',
            open ? 'mt-8 grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
          )}
        >
          <div className="min-h-0">
            <div className="grid gap-4 sm:grid-cols-2">
              {gifts.accounts.map((acc, i) => (
                <AccountRow key={i} account={acc} />
              ))}
            </div>
            <p className="mt-5 flex items-center justify-center gap-1.5 text-center text-xs text-[var(--color-muted-foreground)]">
              <Heart className="h-3.5 w-3.5 text-[var(--color-accent)]/60" />
              Gracias por tu generosidad. Lo importante es tenerte con nosotros.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
