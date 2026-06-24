'use client'

import { useState, useTransition } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { deletePayment } from '@/lib/actions/presupuesto'
import type { Payment, PaymentStatus } from '@/lib/db/schema'
import { formatDateEs } from '@/lib/utils/dates'
import { formatCents } from '@/lib/utils/money'
import { PaymentForm } from './payment-form'

type Option = { id: string; name: string }
export type PaymentRow = {
  payment: Payment
  vendorName: string | null
  categoryName: string | null
}

const STATUS_META: Record<PaymentStatus, { label: string; dot: string }> = {
  pendiente: { label: 'Pendiente', dot: 'var(--color-gold)' },
  pagado: { label: 'Pagado', dot: 'var(--color-success)' },
}

export function PaymentList({
  rows,
  vendorOptions,
  categoryOptions,
  today,
  soon,
}: {
  rows: PaymentRow[]
  vendorOptions: Option[]
  categoryOptions: Option[]
  /** `YYYY-MM-DD` today, and the soon-threshold (today + N days). */
  today: string
  soon: string
}) {
  const [editing, setEditing] = useState<Payment | null | undefined>(undefined)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [, startTransition] = useTransition()
  const dialogOpen = editing !== undefined

  function handleDelete(p: Payment) {
    if (
      !window.confirm(`¿Borrar el pago “${p.concept}”? No se puede deshacer.`)
    ) {
      return
    }
    setDeletingId(p.id)
    startTransition(async () => {
      const res = await deletePayment(p.id)
      setDeletingId(null)
      if (!res.ok) window.alert(res.error)
    })
  }

  function dueInfo(p: Payment): { color: string; tag: string | null } {
    if (p.status !== 'pendiente' || !p.dueDate) return { color: '', tag: null }
    if (p.dueDate < today) {
      return { color: 'text-[var(--color-destructive)]', tag: 'Vencido' }
    }
    if (p.dueDate <= soon) {
      return { color: 'text-[var(--color-gold)]', tag: 'Próximo' }
    }
    return { color: '', tag: null }
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-[var(--color-muted-foreground)]">
          {rows.length} {rows.length === 1 ? 'pago' : 'pagos'}
        </p>
        <Button variant="primary" onClick={() => setEditing(null)}>
          Nuevo pago
        </Button>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border)] bg-[var(--color-card)] px-6 py-10 text-center">
          <p className="text-[var(--color-foreground)]">Aún no hay pagos.</p>
          <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
            Registra el primero con “Nuevo pago”.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] shadow-[var(--shadow-soft)]">
          <table className="w-full min-w-[48rem] border-collapse text-left text-[0.9375rem]">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-xs uppercase tracking-wide text-[var(--color-muted-foreground)]">
                <th scope="col" className="px-4 py-3 font-medium">
                  Concepto
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Proveedor
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Categoría
                </th>
                <th scope="col" className="px-4 py-3 text-right font-medium">
                  Importe
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Estado
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Vence
                </th>
                <th scope="col" className="px-4 py-3 text-right font-medium">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ payment: p, vendorName, categoryName }) => (
                <tr
                  key={p.id}
                  className="border-b border-[var(--color-border)] last:border-b-0"
                >
                  <td className="px-4 py-3 font-medium text-[var(--color-foreground)]">
                    {p.concept}
                  </td>
                  <td className="px-4 py-3 text-[var(--color-muted-foreground)]">
                    {vendorName ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-[var(--color-muted-foreground)]">
                    {categoryName ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-[var(--color-foreground)]">
                    {formatCents(p.amountCents)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-sm text-[var(--color-foreground)]">
                      <span
                        aria-hidden
                        className="h-2 w-2 rounded-full"
                        style={{ background: STATUS_META[p.status].dot }}
                      />
                      {STATUS_META[p.status].label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {(() => {
                      if (!p.dueDate) return '—'
                      const due = dueInfo(p)
                      return (
                        <span className="inline-flex items-center gap-2 tabular-nums">
                          <span className={due.color}>
                            {formatDateEs(p.dueDate)}
                          </span>
                          {due.tag ? (
                            <span
                              className={`rounded-full border border-current px-1.5 py-0.5 text-[0.65rem] font-medium uppercase tracking-wide ${due.color}`}
                            >
                              {due.tag}
                            </span>
                          ) : null}
                        </span>
                      )
                    })()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditing(p)}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={deletingId === p.id}
                        onClick={() => handleDelete(p)}
                        className="text-[var(--color-destructive)]"
                      >
                        Borrar
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog
        open={dialogOpen}
        onOpenChange={(o) => {
          if (!o) setEditing(undefined)
        }}
        size="lg"
        aria-labelledby="payment-dialog-title"
        aria-describedby="payment-dialog-desc"
      >
        {dialogOpen ? (
          <>
            <DialogHeader>
              <DialogTitle id="payment-dialog-title">
                {editing ? 'Editar pago' : 'Nuevo pago'}
              </DialogTitle>
              <DialogDescription id="payment-dialog-desc">
                {editing
                  ? 'Actualiza los datos del pago.'
                  : 'Registra un pago previsto o realizado.'}
              </DialogDescription>
            </DialogHeader>
            <PaymentForm
              key={editing?.id ?? 'new'}
              payment={editing ?? undefined}
              vendorOptions={vendorOptions}
              categoryOptions={categoryOptions}
              onSuccess={() => setEditing(undefined)}
              onCancel={() => setEditing(undefined)}
            />
          </>
        ) : null}
      </Dialog>
    </>
  )
}
