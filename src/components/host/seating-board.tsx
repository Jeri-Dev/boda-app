'use client'

import { useActionState, useEffect, useState, useTransition } from 'react'

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
import { Select } from '@/components/ui/select'
import {
  assignGuest,
  createTable,
  deleteTable,
  updateTable,
  type TableActionState,
} from '@/lib/actions/mesas'
import type { RsvpStatus, TableShape } from '@/lib/db/schema'

export type TableLite = {
  id: string
  label: string
  capacity: number
  shape: TableShape
}
export type GuestLite = {
  id: string
  name: string
  rsvpStatus: RsvpStatus
  tableId: string | null
}

function SeatSelect({
  guest,
  tables,
}: {
  guest: GuestLite
  tables: TableLite[]
}) {
  const [busy, setBusy] = useState(false)
  const [, startTransition] = useTransition()
  return (
    <Select
      aria-label={`Mesa de ${guest.name}`}
      value={guest.tableId ?? ''}
      disabled={busy}
      className="h-9 w-auto min-w-[8rem] text-sm"
      onChange={(e) => {
        const next = e.target.value || null
        setBusy(true)
        startTransition(async () => {
          const res = await assignGuest(guest.id, next)
          setBusy(false)
          if (!res.ok) window.alert(res.error)
        })
      }}
    >
      <option value="">Sin sentar</option>
      {tables.map((t) => (
        <option key={t.id} value={t.id}>
          {t.label}
        </option>
      ))}
    </Select>
  )
}

function GuestRow({
  guest,
  tables,
}: {
  guest: GuestLite
  tables: TableLite[]
}) {
  return (
    <li className="flex items-center justify-between gap-3 py-2">
      <span className="min-w-0 truncate text-[0.9375rem] text-[var(--color-foreground)]">
        {guest.name}
        {guest.rsvpStatus !== 'confirmed' ? (
          <span className="ml-2 text-xs text-[var(--color-muted-foreground)]">
            {guest.rsvpStatus === 'declined' ? '(no asiste)' : '(sin confirmar)'}
          </span>
        ) : null}
      </span>
      <SeatSelect guest={guest} tables={tables} />
    </li>
  )
}

function TableForm({
  table,
  onSuccess,
  onCancel,
}: {
  table?: TableLite
  onSuccess: () => void
  onCancel: () => void
}) {
  const action = table ? updateTable.bind(null, table.id) : createTable
  const [state, formAction, pending] = useActionState<
    TableActionState,
    FormData
  >(action, undefined)

  useEffect(() => {
    if (state?.ok) onSuccess()
  }, [state, onSuccess])

  return (
    <form action={formAction} noValidate>
      <DialogBody className="grid gap-4">
        <Field label="Nombre de la mesa" error={state?.fieldErrors?.label?.[0]} required>
          <Input name="label" placeholder="Mesa 1 / Familia" defaultValue={table?.label ?? ''} autoFocus />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Capacidad" error={state?.fieldErrors?.capacity?.[0]}>
            <Input
              name="capacity"
              type="number"
              min={1}
              max={100}
              defaultValue={table?.capacity ?? 8}
            />
          </Field>
          <Field label="Forma">
            <Select name="shape" defaultValue={table?.shape ?? 'round'}>
              <option value="round">Redonda</option>
              <option value="rect">Rectangular</option>
            </Select>
          </Field>
        </div>
        {state?.error ? (
          <p role="alert" className="text-sm font-medium text-[var(--color-destructive)]">
            {state.error}
          </p>
        ) : null}
      </DialogBody>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" variant="primary" disabled={pending} aria-busy={pending}>
          {table ? 'Guardar' : 'Crear mesa'}
        </Button>
      </DialogFooter>
    </form>
  )
}

export function SeatingBoard({
  tables,
  guests,
}: {
  tables: TableLite[]
  guests: GuestLite[]
}) {
  const [editing, setEditing] = useState<TableLite | null | undefined>(undefined)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [, startTransition] = useTransition()
  const dialogOpen = editing !== undefined

  const seatedByTable = new Map<string, GuestLite[]>()
  const unseated: GuestLite[] = []
  for (const g of guests) {
    if (g.tableId) {
      const arr = seatedByTable.get(g.tableId) ?? []
      arr.push(g)
      seatedByTable.set(g.tableId, arr)
    } else if (g.rsvpStatus !== 'declined') {
      // A guest who declined isn't coming → not "pending seating".
      unseated.push(g)
    }
  }
  // A seat is occupied by someone who will attend; a declined guest still shown
  // at a table (with a marker) does NOT count toward capacity.
  const occupancy = (seated: GuestLite[]) =>
    seated.filter((s) => s.rsvpStatus !== 'declined').length

  function handleDelete(t: TableLite) {
    if (
      !window.confirm(
        `¿Borrar la mesa “${t.label}”? Sus invitados quedarán sin sentar.`,
      )
    ) {
      return
    }
    setDeletingId(t.id)
    startTransition(async () => {
      const res = await deleteTable(t.id)
      setDeletingId(null)
      if (!res.ok) window.alert(res.error)
    })
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-3">
        <p className="text-sm text-[var(--color-muted-foreground)]">
          {tables.length} {tables.length === 1 ? 'mesa' : 'mesas'} ·{' '}
          {unseated.length} sin sentar
        </p>
        <Button variant="primary" onClick={() => setEditing(null)}>
          Nueva mesa
        </Button>
      </div>

      {tables.length === 0 ? (
        <div className="mb-8 rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border)] bg-[var(--color-card)] px-6 py-10 text-center">
          <p className="text-[var(--color-foreground)]">Aún no hay mesas.</p>
          <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
            Crea la primera y empieza a sentar invitados.
          </p>
        </div>
      ) : (
        <div className="mb-10 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {tables.map((t) => {
            const seated = seatedByTable.get(t.id) ?? []
            const used = occupancy(seated)
            const over = used > t.capacity
            return (
              <section
                key={t.id}
                aria-labelledby={`table-${t.id}`}
                className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] px-5 py-4 shadow-[var(--shadow-soft)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2
                      id={`table-${t.id}`}
                      className="font-display text-lg text-[var(--color-foreground)]"
                    >
                      {t.label}
                    </h2>
                    <p
                      className={`text-xs ${over ? 'font-medium text-[var(--color-destructive)]' : 'text-[var(--color-muted-foreground)]'}`}
                    >
                      {used} / {t.capacity}
                      {over ? ' · sobre capacidad' : ''}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => setEditing(t)}>
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={deletingId === t.id}
                      onClick={() => handleDelete(t)}
                      className="text-[var(--color-destructive)]"
                    >
                      Borrar
                    </Button>
                  </div>
                </div>
                {seated.length > 0 ? (
                  <ul className="mt-2 divide-y divide-[var(--color-border)]">
                    {seated.map((g) => (
                      <GuestRow key={g.id} guest={g} tables={tables} />
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-sm text-[var(--color-muted-foreground)]">
                    Mesa vacía.
                  </p>
                )}
              </section>
            )
          })}
        </div>
      )}

      <section>
        <h2 className="mb-3 font-display text-xl tracking-tight text-[var(--color-foreground)]">
          Sin sentar ({unseated.length})
        </h2>
        {unseated.length === 0 ? (
          <p className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border)] bg-[var(--color-card)] px-6 py-8 text-center text-sm text-[var(--color-muted-foreground)]">
            Todos los invitados tienen mesa. 🎉
          </p>
        ) : (
          <ul className="divide-y divide-[var(--color-border)] rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] px-5 py-1 shadow-[var(--shadow-soft)]">
            {unseated.map((g) => (
              <GuestRow key={g.id} guest={g} tables={tables} />
            ))}
          </ul>
        )}
      </section>

      <Dialog
        open={dialogOpen}
        onOpenChange={(o) => {
          if (!o) setEditing(undefined)
        }}
        aria-labelledby="table-dialog-title"
      >
        {dialogOpen ? (
          <>
            <DialogHeader>
              <DialogTitle id="table-dialog-title">
                {editing ? 'Editar mesa' : 'Nueva mesa'}
              </DialogTitle>
              <DialogDescription>
                Nombre y capacidad (la capacidad solo avisa, no bloquea).
              </DialogDescription>
            </DialogHeader>
            <TableForm
              key={editing?.id ?? 'new'}
              table={editing ?? undefined}
              onSuccess={() => setEditing(undefined)}
              onCancel={() => setEditing(undefined)}
            />
          </>
        ) : null}
      </Dialog>
    </>
  )
}
