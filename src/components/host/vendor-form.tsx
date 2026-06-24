'use client'

import { useActionState, useEffect } from 'react'

import { Button } from '@/components/ui/button'
import { DialogBody, DialogFooter } from '@/components/ui/dialog'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  createVendor,
  updateVendor,
  type VendorActionState,
} from '@/lib/actions/proveedores'
import type { Vendor } from '@/lib/db/schema'

const STATUS_OPTIONS = [
  { value: 'contactado', label: 'Contactado' },
  { value: 'presupuestado', label: 'Presupuestado' },
  { value: 'contratado', label: 'Contratado' },
] as const

export function VendorForm({
  vendor,
  onSuccess,
  onCancel,
}: {
  vendor?: Vendor
  onSuccess: () => void
  onCancel: () => void
}) {
  const action = vendor ? updateVendor.bind(null, vendor.id) : createVendor
  const [state, formAction, pending] = useActionState<
    VendorActionState,
    FormData
  >(action, undefined)

  useEffect(() => {
    if (state?.ok) onSuccess()
  }, [state, onSuccess])

  const errs = state?.fieldErrors
  const amountDefault =
    vendor?.amountCents != null ? (vendor.amountCents / 100).toFixed(2) : ''

  return (
    <form action={formAction} noValidate>
      <DialogBody className="grid gap-4">
        <Field label="Nombre" error={errs?.name?.[0]} required>
          <Input name="name" defaultValue={vendor?.name ?? ''} autoFocus />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Categoría" error={errs?.category?.[0]}>
            <Input
              name="category"
              placeholder="Catering, Fotografía…"
              defaultValue={vendor?.category ?? ''}
            />
          </Field>
          <Field label="Estado del trato">
            <Select name="status" defaultValue={vendor?.status ?? 'contactado'}>
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Email" error={errs?.email?.[0]}>
            <Input
              name="email"
              type="email"
              defaultValue={vendor?.email ?? ''}
            />
          </Field>
          <Field label="Teléfono" error={errs?.phone?.[0]}>
            <Input name="phone" defaultValue={vendor?.phone ?? ''} />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            label="Importe (RD$)"
            hint="Solo números, p.ej. 85000 o 85000.50"
            error={errs?.amount?.[0]}
          >
            <Input
              name="amount"
              inputMode="decimal"
              placeholder="0.00"
              defaultValue={amountDefault}
            />
          </Field>
          <Field
            label="Enlace al contrato"
            hint="Drive, Dropbox…"
            error={errs?.contractUrl?.[0]}
          >
            <Input
              name="contractUrl"
              type="url"
              placeholder="https://…"
              defaultValue={vendor?.contractUrl ?? ''}
            />
          </Field>
        </div>

        <Field label="Notas" error={errs?.notes?.[0]}>
          <Textarea name="notes" rows={3} defaultValue={vendor?.notes ?? ''} />
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
          {vendor ? 'Guardar cambios' : 'Añadir proveedor'}
        </Button>
      </DialogFooter>
    </form>
  )
}
