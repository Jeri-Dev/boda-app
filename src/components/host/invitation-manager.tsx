'use client'

import { useState, useTransition } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogBody,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  createInvitation,
  regenerateInvitation,
  revokeInvitation,
} from '@/lib/actions/tokens'
import type { InvitationRow } from '@/lib/data/invitations'

type GuestOption = { id: string; name: string; household: string | null }

function inviteUrl(baseUrl: string, token: string) {
  return `${baseUrl}/i/${token}`
}

function InvitationCard({
  invitation,
  baseUrl,
}: {
  invitation: InvitationRow
  baseUrl: string
}) {
  const [, startTransition] = useTransition()
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const url = inviteUrl(baseUrl, invitation.token)
  const revoked = invitation.status === 'revocado'

  async function copy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard blocked — the readonly input lets the user copy manually */
    }
  }

  function act(fn: () => Promise<{ ok: boolean; error?: string }>) {
    setBusy(true)
    startTransition(async () => {
      const res = await fn()
      setBusy(false)
      if (!res.ok && 'error' in res) window.alert(res.error)
    })
  }

  const waText = encodeURIComponent(
    `¡Estás invitado a nuestra boda! Confirma tu asistencia aquí: ${url}`,
  )

  return (
    <li className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] px-5 py-4 shadow-[var(--shadow-soft)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-[var(--color-foreground)]">
              {invitation.label || invitation.members.map((m) => m.name).join(', ') || 'Invitación'}
            </span>
            {revoked ? (
              <span className="rounded-full border border-[var(--color-destructive)] px-2 py-0.5 text-[0.65rem] font-medium uppercase tracking-wide text-[var(--color-destructive)]">
                Revocada
              </span>
            ) : null}
          </div>
          <p className="mt-0.5 text-xs text-[var(--color-muted-foreground)]">
            Para {invitation.partySize}{' '}
            {invitation.partySize === 1 ? 'persona' : 'personas'} ·{' '}
            {invitation.members.map((m) => m.name).join(', ') || 'sin invitados'}
          </p>
        </div>
      </div>

      {!revoked ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Input
            readOnly
            value={url}
            aria-label="Enlace de la invitación"
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
            className="inline-flex h-9 items-center rounded-[var(--radius)] border border-[var(--color-border)] px-3.5 text-sm text-[var(--color-foreground)] transition-colors hover:bg-[var(--color-muted)]"
          >
            WhatsApp
          </a>
        </div>
      ) : null}

      <div className="mt-3 flex gap-1">
        <Button
          size="sm"
          variant="ghost"
          disabled={busy}
          onClick={() => act(() => regenerateInvitation(invitation.id))}
        >
          Regenerar enlace
        </Button>
        {!revoked ? (
          <Button
            size="sm"
            variant="ghost"
            disabled={busy}
            onClick={() => {
              if (window.confirm('¿Revocar esta invitación? El enlace dejará de funcionar.')) {
                act(() => revokeInvitation(invitation.id))
              }
            }}
            className="text-[var(--color-destructive)]"
          >
            Revocar
          </Button>
        ) : null}
      </div>
    </li>
  )
}

function CreateDialog({
  guests,
  onClose,
}: {
  guests: GuestOption[]
  onClose: () => void
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [label, setLabel] = useState('')
  const [partySize, setPartySize] = useState('')
  const [, startTransition] = useTransition()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function submit() {
    if (selected.size === 0) {
      setError('Selecciona al menos un invitado')
      return
    }
    setError(null)
    setBusy(true)
    const size = partySize.trim() ? Number(partySize) : undefined
    startTransition(async () => {
      const res = await createInvitation({
        guestIds: [...selected],
        partySize: Number.isFinite(size) ? size : undefined,
        label: label.trim() || undefined,
      })
      setBusy(false)
      if (!res.ok) {
        setError(res.error)
        return
      }
      onClose()
    })
  }

  return (
    <Dialog
      open
      onOpenChange={(o) => {
        if (!o) onClose()
      }}
      size="lg"
      aria-labelledby="invite-dialog-title"
    >
      <DialogHeader>
        <DialogTitle id="invite-dialog-title">Nueva invitación</DialogTitle>
        <DialogDescription>
          Elige a quién va dirigida; el enlace se genera al guardar.
        </DialogDescription>
      </DialogHeader>
      <DialogBody className="grid gap-4">
        <Field label="Etiqueta" hint="Para identificarla, p.ej. “Familia Pérez”">
          <Input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Familia Pérez"
          />
        </Field>

        <div>
          <p className="mb-1.5 text-sm font-medium text-[var(--color-foreground)]">
            Invitados
          </p>
          {guests.length === 0 ? (
            <p className="text-sm text-[var(--color-muted-foreground)]">
              No hay invitados todavía. Créalos primero en “Invitados”.
            </p>
          ) : (
            <div className="max-h-56 overflow-y-auto rounded-[var(--radius)] border border-[var(--color-border)]">
              {guests.map((g) => (
                <label
                  key={g.id}
                  className="flex items-center gap-2.5 border-b border-[var(--color-border)] px-3 py-2 text-[0.9375rem] last:border-b-0 hover:bg-[var(--color-muted)]"
                >
                  <input
                    type="checkbox"
                    checked={selected.has(g.id)}
                    onChange={() => toggle(g.id)}
                    className="h-4 w-4 rounded border-[var(--color-input)] accent-[var(--color-accent)]"
                  />
                  <span className="text-[var(--color-foreground)]">{g.name}</span>
                  {g.household ? (
                    <span className="text-xs text-[var(--color-muted-foreground)]">
                      · {g.household}
                    </span>
                  ) : null}
                </label>
              ))}
            </div>
          )}
        </div>

        <Field
          label="Para cuántas personas"
          hint="Opcional; por defecto, el número de invitados seleccionados"
        >
          <Input
            type="number"
            min={1}
            value={partySize}
            onChange={(e) => setPartySize(e.target.value)}
            placeholder={String(selected.size || 1)}
          />
        </Field>

        {error ? (
          <p role="alert" className="text-sm font-medium text-[var(--color-destructive)]">
            {error}
          </p>
        ) : null}
      </DialogBody>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button
          type="button"
          variant="primary"
          disabled={busy}
          aria-busy={busy}
          onClick={submit}
        >
          Crear invitación
        </Button>
      </DialogFooter>
    </Dialog>
  )
}

export function InvitationManager({
  invitations,
  guests,
  baseUrl,
}: {
  invitations: InvitationRow[]
  guests: GuestOption[]
  baseUrl: string
}) {
  const [creating, setCreating] = useState(false)

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-[var(--color-muted-foreground)]">
          {invitations.length}{' '}
          {invitations.length === 1 ? 'invitación' : 'invitaciones'}
        </p>
        <Button variant="primary" onClick={() => setCreating(true)}>
          Nueva invitación
        </Button>
      </div>

      {invitations.length === 0 ? (
        <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border)] bg-[var(--color-card)] px-6 py-12 text-center">
          <p className="text-[var(--color-foreground)]">Aún no hay invitaciones.</p>
          <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
            Crea la primera y comparte el enlace por WhatsApp.
          </p>
        </div>
      ) : (
        <ul className="grid gap-3">
          {invitations.map((inv) => (
            <InvitationCard key={inv.id} invitation={inv} baseUrl={baseUrl} />
          ))}
        </ul>
      )}

      {creating ? (
        <CreateDialog guests={guests} onClose={() => setCreating(false)} />
      ) : null}
    </>
  )
}
