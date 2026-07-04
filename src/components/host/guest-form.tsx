'use client'

import { useActionState, useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { DialogBody, DialogFooter } from '@/components/ui/dialog'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  createGuest,
  updateGuest,
  type GuestActionState,
} from '@/lib/actions/invitados'
import type { Guest } from '@/lib/db/schema'

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pendiente' },
  { value: 'confirmed', label: 'Confirmado' },
  { value: 'declined', label: 'No asiste' },
] as const

export function GuestForm({
  guest,
  onSuccess,
  onCancel,
}: {
  /** Present → edit mode; absent → create mode. */
  guest?: Guest
  onSuccess: () => void
  onCancel: () => void
}) {
  const action = guest ? updateGuest.bind(null, guest.id) : createGuest
  const [state, formAction, pending] = useActionState<
    GuestActionState,
    FormData
  >(action, undefined)
  const [plusOne, setPlusOne] = useState(guest?.plusOne ?? false)

  useEffect(() => {
    if (state?.ok) onSuccess()
  }, [state, onSuccess])

  const errs = state?.fieldErrors

  return (
    // noValidate: let the Server Action + Zod own validation messaging (the
    // `required` attr still renders the visual asterisk) instead of the browser
    // blocking submit with a native bubble.
    <form action={formAction} noValidate>
      <DialogBody className="grid gap-4">
        {guest?.lastModifiedSource === 'guest' ? (
          <p className="rounded-[var(--radius)] border border-[var(--color-gold)] bg-[var(--color-gold)]/10 px-3 py-2 text-xs text-[var(--color-foreground)]">
            Este invitado ya respondió desde su enlace. Si guardas, sobrescribirás
            su respuesta.
          </p>
        ) : null}
        <Field label="Nombre" error={errs?.name?.[0]} required>
          <Input name="name" defaultValue={guest?.name ?? ''} autoFocus />
        </Field>

        <Field
          label="Hogar / grupo"
          hint="Para agrupar familias (opcional)"
          error={errs?.household?.[0]}
        >
          <Input name="household" defaultValue={guest?.household ?? ''} />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Email" error={errs?.email?.[0]}>
            <Input name="email" type="email" defaultValue={guest?.email ?? ''} />
          </Field>
          <Field label="Teléfono" error={errs?.phone?.[0]}>
            <Input name="phone" defaultValue={guest?.phone ?? ''} />
          </Field>
        </div>

        <Field
          label="Dirección"
          hint="Opcional (p.ej. para envíos)"
          error={errs?.address?.[0]}
        >
          <Input name="address" defaultValue={guest?.address ?? ''} />
        </Field>

        <Field label="Estado RSVP">
          <Select
            name="rsvpStatus"
            defaultValue={guest?.rsvpStatus ?? 'pending'}
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </Field>

        <label className="flex items-center gap-2.5 text-[0.9375rem] text-[var(--color-foreground)]">
          <input
            type="checkbox"
            name="plusOne"
            checked={plusOne}
            onChange={(e) => setPlusOne(e.target.checked)}
            className="h-4 w-4 rounded border-[var(--color-input)] accent-[var(--color-accent)]"
          />
          Permite acompañante (+1)
        </label>

        {plusOne ? (
          <Field
            label="Nombre del acompañante"
            error={errs?.plusOneName?.[0]}
          >
            <Input name="plusOneName" defaultValue={guest?.plusOneName ?? ''} />
          </Field>
        ) : null}

        <Field label="Notas (privadas)" error={errs?.notes?.[0]}>
          <Textarea name="notes" rows={3} defaultValue={guest?.notes ?? ''} />
        </Field>

        {state?.error ? (
          <p
            role="alert"
            className="text-sm font-medium text-[var(--color-destructive)]"
          >
            {state.error}
          </p>
        ) : null}
      </DialogBody>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={pending}
          aria-busy={pending}
        >
          {guest ? 'Guardar cambios' : 'Añadir invitado'}
        </Button>
      </DialogFooter>
    </form>
  )
}
