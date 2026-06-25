'use client'

import { useActionState, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { submitRsvp, type RsvpActionState } from '@/lib/actions/rsvp'
import type { RsvpMember } from '@/lib/data/rsvp'

type MemberState = {
  guestId: string
  name: string
  plusOne: boolean
  rsvpStatus: 'pending' | 'confirmed' | 'declined'
  menu: string
  plusOneName: string
}

function initState(members: RsvpMember[]): MemberState[] {
  return members.map((m) => ({
    guestId: m.id,
    name: m.name,
    plusOne: m.plusOne,
    rsvpStatus: m.rsvpStatus,
    menu: m.menu ?? '',
    plusOneName: m.plusOneName ?? '',
  }))
}

/**
 * Public RSVP form (U2.3). Controlled state per member; on submit it serializes
 * only the guest-writable fields into a hidden `members` JSON field. The action
 * is `submitRsvp` bound to the token — the server re-scopes to the token's rows
 * and the write allowlist regardless of what's posted.
 */
export function RsvpForm({
  token,
  members,
  initialMessage,
}: {
  token: string
  members: RsvpMember[]
  initialMessage: string | null
}) {
  const [state, formAction, pending] = useActionState<
    RsvpActionState,
    FormData
  >(submitRsvp.bind(null, token), undefined)
  const [people, setPeople] = useState<MemberState[]>(() => initState(members))
  // Only members the guest actually interacts with are submitted, so an
  // untouched member's existing (host-set) data is never clobbered.
  const [touched, setTouched] = useState<Set<string>>(new Set())

  function update(guestId: string, patch: Partial<MemberState>) {
    setPeople((prev) =>
      prev.map((p) => (p.guestId === guestId ? { ...p, ...patch } : p)),
    )
    setTouched((prev) => (prev.has(guestId) ? prev : new Set(prev).add(guestId)))
  }

  // Only touched members + only guest-writable fields go to the server (menu/+1
  // dropped when not attending). The server enforces the same allowlist again.
  const payload = people
    .filter((p) => touched.has(p.guestId))
    .map((p) => ({
      guestId: p.guestId,
      rsvpStatus: p.rsvpStatus,
      menu: p.rsvpStatus === 'confirmed' ? p.menu : '',
      plusOneName:
        p.rsvpStatus === 'confirmed' && p.plusOne ? p.plusOneName : '',
    }))

  return (
    <form action={formAction}>
      <input type="hidden" name="members" value={JSON.stringify(payload)} />
      {/* Honeypot — hidden from people, tempting to bots. */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute left-[-9999px] h-0 w-0 opacity-0"
      />

      <ul className="grid gap-5">
        {people.map((p) => (
          <li
            key={p.guestId}
            className="border-b border-[var(--color-border)] pb-5 last:border-b-0 last:pb-0"
          >
            <p className="font-medium text-[var(--color-foreground)]">{p.name}</p>

            <div className="mt-2 flex gap-2">
              <Button
                type="button"
                size="sm"
                variant={p.rsvpStatus === 'confirmed' ? 'primary' : 'outline'}
                aria-pressed={p.rsvpStatus === 'confirmed'}
                onClick={() => update(p.guestId, { rsvpStatus: 'confirmed' })}
              >
                Sí, asistiré
              </Button>
              <Button
                type="button"
                size="sm"
                variant={p.rsvpStatus === 'declined' ? 'default' : 'outline'}
                aria-pressed={p.rsvpStatus === 'declined'}
                onClick={() => update(p.guestId, { rsvpStatus: 'declined' })}
              >
                No podré ir
              </Button>
            </div>

            {p.rsvpStatus === 'confirmed' ? (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="grid gap-1.5">
                  <span className="text-sm text-[var(--color-muted-foreground)]">
                    Menú / preferencia
                  </span>
                  <Input
                    value={p.menu}
                    onChange={(e) => update(p.guestId, { menu: e.target.value })}
                    placeholder="Carne, pescado, vegetariano…"
                  />
                </label>
                {p.plusOne ? (
                  <label className="grid gap-1.5">
                    <span className="text-sm text-[var(--color-muted-foreground)]">
                      Nombre de tu acompañante
                    </span>
                    <Input
                      value={p.plusOneName}
                      onChange={(e) =>
                        update(p.guestId, { plusOneName: e.target.value })
                      }
                      placeholder="Opcional"
                    />
                  </label>
                ) : null}
              </div>
            ) : null}
          </li>
        ))}
      </ul>

      <label className="mt-5 grid gap-1.5">
        <span className="text-sm text-[var(--color-muted-foreground)]">
          Un mensaje para los novios (opcional)
        </span>
        <Textarea
          name="message"
          rows={3}
          defaultValue={initialMessage ?? ''}
          placeholder="¡Felicidades! Allí estaremos…"
        />
      </label>

      <div className="mt-5 flex items-center gap-3">
        <Button type="submit" variant="primary" disabled={pending} aria-busy={pending}>
          Enviar confirmación
        </Button>
        {state?.ok ? (
          <span role="status" className="text-sm text-[var(--color-success)]">
            ¡Gracias! Recibimos tu confirmación. Puedes editarla cuando quieras.
          </span>
        ) : null}
        {state?.error ? (
          <span role="alert" className="text-sm text-[var(--color-destructive)]">
            {state.error}
          </span>
        ) : null}
      </div>
    </form>
  )
}
