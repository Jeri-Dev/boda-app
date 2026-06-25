'use client'

import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export type PendingInvitation = {
  id: string
  token: string
  label: string | null
  allNames: string[]
  pendingNames: string[]
}

function ReminderCard({
  invitation,
  baseUrl,
}: {
  invitation: PendingInvitation
  baseUrl: string
}) {
  const [copied, setCopied] = useState(false)
  const url = `${baseUrl}/i/${invitation.token}`
  const title =
    invitation.label || invitation.allNames.join(', ') || 'Invitación'

  async function copy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard blocked — the readonly input lets the user copy manually */
    }
  }

  const waText = encodeURIComponent(
    `¡Hola! Te recordamos confirmar tu asistencia a nuestra boda: ${url}`,
  )

  return (
    <li className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] px-5 py-4 shadow-[var(--shadow-soft)]">
      <div className="min-w-0">
        <span className="font-medium text-[var(--color-foreground)]">
          {title}
        </span>
        <p className="mt-0.5 text-xs text-[var(--color-muted-foreground)]">
          Sin responder: {invitation.pendingNames.join(', ')}
        </p>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Input
          readOnly
          value={url}
          aria-label={`Enlace para ${title}`}
          className="h-9 min-w-0 flex-1 text-sm"
          onFocus={(e) => e.currentTarget.select()}
        />
        <Button size="sm" variant="outline" onClick={copy}>
          {copied ? 'Copiado ✓' : 'Copiar'}
        </Button>
        <a
          href={`https://wa.me/?text=${waText}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Recordar por WhatsApp a ${title}`}
          className="inline-flex h-9 items-center rounded-[var(--radius)] border border-[var(--color-border)] px-3.5 text-sm text-[var(--color-foreground)] transition-colors hover:bg-[var(--color-muted)]"
        >
          WhatsApp
        </a>
      </div>
    </li>
  )
}

export function RsvpReminders({
  invitations,
  baseUrl,
}: {
  invitations: PendingInvitation[]
  baseUrl: string
}) {
  if (invitations.length === 0) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border)] bg-[var(--color-card)] px-6 py-12 text-center">
        <p className="text-[var(--color-foreground)]">
          ¡Todos los invitados con invitación han respondido! 🎉
        </p>
      </div>
    )
  }
  return (
    <ul className="grid gap-3">
      {invitations.map((inv) => (
        <ReminderCard key={inv.id} invitation={inv} baseUrl={baseUrl} />
      ))}
    </ul>
  )
}
