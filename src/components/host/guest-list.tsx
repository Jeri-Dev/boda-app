'use client'

import { useState, useTransition } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { deleteGuest } from '@/lib/actions/invitados'
import type { Guest, RsvpStatus } from '@/lib/db/schema'
import { GuestForm } from './guest-form'

const STATUS_META: Record<RsvpStatus, { label: string; dot: string }> = {
  pending: { label: 'Pendiente', dot: 'var(--color-gold)' },
  confirmed: { label: 'Confirmado', dot: 'var(--color-success)' },
  declined: { label: 'No asiste', dot: 'var(--color-destructive)' },
}

function StatusBadge({ status }: { status: RsvpStatus }) {
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

export function GuestList({ guests }: { guests: Guest[] }) {
  // undefined = dialog closed; null = creating; Guest = editing that guest.
  const [editing, setEditing] = useState<Guest | null | undefined>(undefined)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [, startTransition] = useTransition()
  const dialogOpen = editing !== undefined

  function handleDelete(g: Guest) {
    if (
      !window.confirm(
        `¿Borrar a ${g.name}? Esta acción no se puede deshacer.`,
      )
    ) {
      return
    }
    setDeletingId(g.id)
    startTransition(async () => {
      const res = await deleteGuest(g.id)
      setDeletingId(null)
      if (!res.ok) window.alert(res.error)
    })
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-[var(--color-muted-foreground)]">
          {guests.length} {guests.length === 1 ? 'invitado' : 'invitados'}
        </p>
        <Button variant="primary" onClick={() => setEditing(null)}>
          Nuevo invitado
        </Button>
      </div>

      {guests.length === 0 ? (
        <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border)] bg-[var(--color-card)] px-6 py-12 text-center">
          <p className="text-[var(--color-foreground)]">
            Aún no hay invitados que coincidan.
          </p>
          <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
            Añade a la primera persona con “Nuevo invitado”.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] shadow-[var(--shadow-soft)]">
          <table className="w-full min-w-[40rem] border-collapse text-left text-[0.9375rem]">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-xs uppercase tracking-wide text-[var(--color-muted-foreground)]">
                <th scope="col" className="px-4 py-3 font-medium">Nombre</th>
                <th scope="col" className="px-4 py-3 font-medium">Contacto</th>
                <th scope="col" className="px-4 py-3 font-medium">RSVP</th>
                <th scope="col" className="px-4 py-3 font-medium">+1</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {guests.map((g) => (
                <tr
                  key={g.id}
                  className="border-b border-[var(--color-border)] last:border-b-0"
                >
                  <td className="px-4 py-3">
                    <span className="block font-medium text-[var(--color-foreground)]">
                      {g.name}
                    </span>
                    {g.household ? (
                      <span className="block text-xs text-[var(--color-muted-foreground)]">
                        {g.household}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-[var(--color-muted-foreground)]">
                    {g.email || g.phone || g.address ? (
                      <div className="flex flex-col">
                        {g.email ? <span>{g.email}</span> : null}
                        {g.phone ? (
                          <span className="text-xs">{g.phone}</span>
                        ) : null}
                        {g.address ? (
                          <span className="text-xs">{g.address}</span>
                        ) : null}
                      </div>
                    ) : (
                      <span className="text-[var(--color-stone-400)]">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={g.rsvpStatus} />
                    {g.lastModifiedSource === 'guest' ? (
                      <span className="mt-0.5 block text-[0.7rem] text-[var(--color-muted-foreground)]">
                        por el invitado
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-[var(--color-muted-foreground)]">
                    {g.plusOne ? (g.plusOneName ?? 'Sí') : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditing(g)}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={deletingId === g.id}
                        onClick={() => handleDelete(g)}
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
        aria-labelledby="guest-dialog-title"
        aria-describedby="guest-dialog-desc"
      >
        {dialogOpen ? (
          <>
            <DialogHeader>
              <DialogTitle id="guest-dialog-title">
                {editing ? 'Editar invitado' : 'Nuevo invitado'}
              </DialogTitle>
              <DialogDescription id="guest-dialog-desc">
                {editing
                  ? 'Actualiza los datos del invitado.'
                  : 'Añade una persona a la lista de la boda.'}
              </DialogDescription>
            </DialogHeader>
            <GuestForm
              key={editing?.id ?? 'new'}
              guest={editing ?? undefined}
              onSuccess={() => setEditing(undefined)}
              onCancel={() => setEditing(undefined)}
            />
          </>
        ) : null}
      </Dialog>
    </>
  )
}
