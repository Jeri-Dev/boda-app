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

      <fieldset className="grid gap-5 border-t border-[var(--color-border)] pt-6">
        <legend className="font-display text-lg text-[var(--color-foreground)]">
          Información para invitados
        </legend>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Se muestra en la página pública <code>/info</code>. Los apartados
          vacíos se ocultan.
        </p>

        <Field label="Enlace al mapa" hint="Google Maps u otro" error={errs?.mapUrl?.[0]}>
          <Input
            name="mapUrl"
            type="url"
            placeholder="https://maps.google.com/…"
            defaultValue={wedding?.mapUrl ?? ''}
          />
        </Field>

        <Field label="Horario / agenda" error={errs?.schedule?.[0]}>
          <Textarea
            name="schedule"
            rows={3}
            placeholder="5:00 PM Ceremonia · 7:00 PM Cóctel · 8:00 PM Recepción"
            defaultValue={wedding?.schedule ?? ''}
          />
        </Field>

        <Field label="Código de vestimenta" error={errs?.dressCode?.[0]}>
          <Input
            name="dressCode"
            placeholder="Formal / etiqueta"
            defaultValue={wedding?.dressCode ?? ''}
          />
        </Field>

        <Field label="Alojamiento" error={errs?.accommodation?.[0]}>
          <Textarea
            name="accommodation"
            rows={3}
            defaultValue={wedding?.accommodation ?? ''}
          />
        </Field>

        <Field label="Transporte" error={errs?.transport?.[0]}>
          <Textarea
            name="transport"
            rows={3}
            defaultValue={wedding?.transport ?? ''}
          />
        </Field>
      </fieldset>

      <fieldset className="grid gap-5 border-t border-[var(--color-border)] pt-6">
        <legend className="font-display text-lg text-[var(--color-foreground)]">
          Mesa de regalos
        </legend>

        <Field label="Mensaje" error={errs?.giftMessage?.[0]}>
          <Textarea
            name="giftMessage"
            rows={3}
            placeholder="Tu presencia es nuestro mejor regalo. Si deseas obsequiarnos algo…"
            defaultValue={wedding?.giftMessage ?? ''}
          />
        </Field>

        <Field
          label="Datos para transferencia"
          hint="Cuenta / IBAN. La página pública no se indexa."
          error={errs?.giftDetails?.[0]}
        >
          <Textarea
            name="giftDetails"
            rows={3}
            defaultValue={wedding?.giftDetails ?? ''}
          />
        </Field>
      </fieldset>

      <fieldset className="grid gap-5 border-t border-[var(--color-border)] pt-6">
        <legend className="font-display text-lg text-[var(--color-foreground)]">
          Privacidad
        </legend>
        <Field
          label="Contacto para datos personales"
          hint="Email/teléfono para que los invitados ejerzan sus derechos (RGPD)"
          error={errs?.privacyContact?.[0]}
        >
          <Input
            name="privacyContact"
            placeholder="novios@ejemplo.com"
            defaultValue={wedding?.privacyContact ?? ''}
          />
        </Field>
      </fieldset>

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
