'use client'

import { useState, useTransition } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { deleteVendor } from '@/lib/actions/proveedores'
import type { Vendor, VendorStatus } from '@/lib/db/schema'
import { formatCents } from '@/lib/utils/money'
import { VendorForm } from './vendor-form'

const STATUS_META: Record<VendorStatus, { label: string; dot: string }> = {
  contactado: { label: 'Contactado', dot: 'var(--color-gold)' },
  presupuestado: { label: 'Presupuestado', dot: 'var(--color-stone-400)' },
  contratado: { label: 'Contratado', dot: 'var(--color-success)' },
}

function StatusBadge({ status }: { status: VendorStatus }) {
  const meta = STATUS_META[status]
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-sm text-[var(--color-foreground)]">
      <span
        aria-hidden
        className="h-2 w-2 rounded-full"
        style={{ background: meta.dot }}
      />
      {meta.label}
    </span>
  )
}

export function VendorList({ vendors }: { vendors: Vendor[] }) {
  // undefined = closed; null = creating; Vendor = editing that vendor.
  const [editing, setEditing] = useState<Vendor | null | undefined>(undefined)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [, startTransition] = useTransition()
  const dialogOpen = editing !== undefined

  function handleDelete(v: Vendor) {
    if (
      !window.confirm(
        `¿Borrar a ${v.name}? Esta acción no se puede deshacer.`,
      )
    ) {
      return
    }
    setDeletingId(v.id)
    startTransition(async () => {
      const res = await deleteVendor(v.id)
      setDeletingId(null)
      if (!res.ok) window.alert(res.error)
    })
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-[var(--color-muted-foreground)]">
          {vendors.length}{' '}
          {vendors.length === 1 ? 'proveedor' : 'proveedores'}
        </p>
        <Button variant="primary" onClick={() => setEditing(null)}>
          Nuevo proveedor
        </Button>
      </div>

      {vendors.length === 0 ? (
        <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border)] bg-[var(--color-card)] px-6 py-12 text-center">
          <p className="text-[var(--color-foreground)]">
            Aún no hay proveedores que coincidan.
          </p>
          <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
            Añade el primero con “Nuevo proveedor”.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] shadow-[var(--shadow-soft)]">
          <table className="w-full min-w-[44rem] border-collapse text-left text-[0.9375rem]">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-xs uppercase tracking-wide text-[var(--color-muted-foreground)]">
                <th scope="col" className="px-4 py-3 font-medium">
                  Proveedor
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Estado
                </th>
                <th scope="col" className="px-4 py-3 text-right font-medium">
                  Importe
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Contrato
                </th>
                <th scope="col" className="px-4 py-3 text-right font-medium">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {vendors.map((v) => (
                <tr
                  key={v.id}
                  className="border-b border-[var(--color-border)] last:border-b-0"
                >
                  <td className="px-4 py-3">
                    <span className="block font-medium text-[var(--color-foreground)]">
                      {v.name}
                    </span>
                    {v.category ? (
                      <span className="block text-xs text-[var(--color-muted-foreground)]">
                        {v.category}
                      </span>
                    ) : null}
                    {v.contactPerson ? (
                      <span className="block text-xs text-[var(--color-muted-foreground)]">
                        {v.contactPerson}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={v.status} />
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-[var(--color-foreground)]">
                    {v.amountCents != null ? (
                      formatCents(v.amountCents)
                    ) : (
                      <span className="text-[var(--color-stone-400)]">—</span>
                    )}
                    {v.paid ? (
                      <span className="mt-0.5 block text-[0.65rem] font-medium uppercase tracking-wide text-[var(--color-success)]">
                        Pagado
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    {v.contractUrl ? (
                      <a
                        href={v.contractUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Ver contrato de ${v.name} (se abre en otra pestaña)`}
                        className="text-[var(--color-accent)] underline-offset-4 hover:underline"
                      >
                        Ver contrato
                      </a>
                    ) : (
                      <span className="text-[var(--color-stone-400)]">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditing(v)}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={deletingId === v.id}
                        onClick={() => handleDelete(v)}
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
        aria-labelledby="vendor-dialog-title"
        aria-describedby="vendor-dialog-desc"
      >
        {dialogOpen ? (
          <>
            <DialogHeader>
              <DialogTitle id="vendor-dialog-title">
                {editing ? 'Editar proveedor' : 'Nuevo proveedor'}
              </DialogTitle>
              <DialogDescription id="vendor-dialog-desc">
                {editing
                  ? 'Actualiza los datos del proveedor.'
                  : 'Añade un proveedor al directorio.'}
              </DialogDescription>
            </DialogHeader>
            <VendorForm
              key={editing?.id ?? 'new'}
              vendor={editing ?? undefined}
              onSuccess={() => setEditing(undefined)}
              onCancel={() => setEditing(undefined)}
            />
          </>
        ) : null}
      </Dialog>
    </>
  )
}
