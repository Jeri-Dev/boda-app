'use client'

import { useActionState, useEffect } from 'react'

import { Button } from '@/components/ui/button'
import { DialogBody, DialogFooter } from '@/components/ui/dialog'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  createPayment,
  updatePayment,
  type PaymentActionState,
} from '@/lib/actions/presupuesto'
import type { Payment } from '@/lib/db/schema'

type Option = { id: string; name: string }

const STATUS_OPTIONS = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'pagado', label: 'Pagado' },
] as const

export function PaymentForm({
  payment,
  vendorOptions,
  categoryOptions,
  onSuccess,
  onCancel,
}: {
  payment?: Payment
  vendorOptions: Option[]
  categoryOptions: Option[]
  onSuccess: () => void
  onCancel: () => void
}) {
  const action = payment ? updatePayment.bind(null, payment.id) : createPayment
  const [state, formAction, pending] = useActionState<
    PaymentActionState,
    FormData
  >(action, undefined)

  useEffect(() => {
    if (state?.ok) onSuccess()
  }, [state, onSuccess])

  const errs = state?.fieldErrors
  const amountDefault =
    payment?.amountCents != null ? (payment.amountCents / 100).toFixed(2) : ''

  return (
    <form action={formAction} noValidate>
      <DialogBody className="grid gap-4">
        <Field label="Concepto" error={errs?.concept?.[0]} required>
          <Input
            name="concept"
            placeholder="Anticipo, pago final…"
            defaultValue={payment?.concept ?? ''}
            autoFocus
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            label="Importe (RD$)"
            hint="Solo números, p.ej. 25000 o 25000.50"
            error={errs?.amount?.[0]}
          >
            <Input
              name="amount"
              inputMode="decimal"
              placeholder="0.00"
              defaultValue={amountDefault}
            />
          </Field>
          <Field label="Estado">
            <Select name="status" defaultValue={payment?.status ?? 'pendiente'}>
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Vence" error={errs?.dueDate?.[0]}>
            <Input
              name="dueDate"
              type="date"
              defaultValue={payment?.dueDate ?? ''}
            />
          </Field>
          <Field label="Proveedor">
            <Select name="vendorId" defaultValue={payment?.vendorId ?? ''}>
              <option value="">Sin proveedor</option>
              {vendorOptions.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field label="Categoría">
          <Select name="categoryId" defaultValue={payment?.categoryId ?? ''}>
            <option value="">Sin categoría</option>
            {categoryOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Notas" error={errs?.notes?.[0]}>
          <Textarea name="notes" rows={2} defaultValue={payment?.notes ?? ''} />
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
          {payment ? 'Guardar cambios' : 'Añadir pago'}
        </Button>
      </DialogFooter>
    </form>
  )
}
