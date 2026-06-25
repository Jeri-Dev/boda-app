'use client'

import { useActionState } from 'react'

import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { saveConfig, type ConfigActionState } from '@/lib/actions/configuracion'
import type { Wedding } from '@/lib/db/schema'

export function ConfigForm({ wedding }: { wedding: Wedding | null }) {
  const [state, formAction, pending] = useActionState<
    ConfigActionState,
    FormData
  >(saveConfig, undefined)

  const errs = state?.fieldErrors
  const dateValue = wedding?.eventDate
    ? new Date(wedding.eventDate).toISOString().slice(0, 10)
    : ''

  return (
    <form action={formAction} noValidate className="grid max-w-xl gap-5">
      <Field
        label="Nombres de la pareja"
        hint="Como aparecerán en la invitación"
        error={errs?.coupleNames?.[0]}
      >
        <Input
          name="coupleNames"
          placeholder="Ana & Beto"
          defaultValue={wedding?.coupleNames ?? ''}
        />
      </Field>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label="Fecha" error={errs?.eventDate?.[0]}>
          <Input name="eventDate" type="date" defaultValue={dateValue} />
        </Field>
        <Field label="Hora" hint="p.ej. 5:00 PM" error={errs?.eventTime?.[0]}>
          <Input
            name="eventTime"
            placeholder="5:00 PM"
            defaultValue={wedding?.eventTime ?? ''}
          />
        </Field>
      </div>

      <Field label="Lugar" error={errs?.venue?.[0]}>
        <Input
          name="venue"
          placeholder="Hacienda La Esperanza, Santo Domingo"
          defaultValue={wedding?.venue ?? ''}
        />
      </Field>

      <Field
        label="Mensaje de bienvenida"
        hint="Texto que verán los invitados en la invitación"
        error={errs?.message?.[0]}
      >
        <Textarea
          name="message"
          rows={4}
          placeholder="Con mucha ilusión queremos compartir este día con ustedes…"
          defaultValue={wedding?.message ?? ''}
        />
      </Field>

      <div className="flex items-center gap-3">
        <Button type="submit" variant="primary" disabled={pending} aria-busy={pending}>
          Guardar
        </Button>
        {state?.ok ? (
          <span role="status" className="text-sm text-[var(--color-success)]">
            Guardado ✓
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
