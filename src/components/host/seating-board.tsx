'use client'

import {
  useActionState,
  useEffect,
  useMemo,
  useOptimistic,
  useState,
  useTransition,
} from 'react'
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  pointerWithin,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'

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

const UNSEATED = 'unseated'

function rsvpMark(status: RsvpStatus): string | null {
  if (status === 'confirmed') return null
  return status === 'declined' ? '(no asiste)' : '(sin confirmar)'
}

/* ── Draggable guest chip (with an accessible <select> fallback) ──────────── */

function GuestChip({
  guest,
  tables,
  onAssign,
  busy,
}: {
  guest: GuestLite
  tables: TableLite[]
  onAssign: (guestId: string, tableId: string | null) => void
  busy: boolean
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: guest.id,
  })
  const mark = rsvpMark(guest.rsvpStatus)

  return (
    <div
      ref={setNodeRef}
      className={`flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-card)] py-1 pl-2 pr-1 text-sm shadow-[var(--shadow-soft)] ${isDragging ? 'opacity-40' : ''}`}
    >
      <button
        type="button"
        className="shrink-0 cursor-grab touch-none rounded-full p-0.5 text-[var(--color-stone-400)] hover:text-[var(--color-foreground)] active:cursor-grabbing"
        aria-label={`Arrastrar a ${guest.name}`}
        {...attributes}
        {...listeners}
      >
        <svg width={14} height={14} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <circle cx="9" cy="6" r="1.6" />
          <circle cx="15" cy="6" r="1.6" />
          <circle cx="9" cy="12" r="1.6" />
          <circle cx="15" cy="12" r="1.6" />
          <circle cx="9" cy="18" r="1.6" />
          <circle cx="15" cy="18" r="1.6" />
        </svg>
      </button>
      <span className="min-w-0 truncate text-[var(--color-foreground)]">
        {guest.name}
        {mark ? (
          <span className="ml-1 text-xs text-[var(--color-muted-foreground)]">
            {mark}
          </span>
        ) : null}
      </span>
      <label className="sr-only" htmlFor={`seat-${guest.id}`}>
        Mesa de {guest.name}
      </label>
      <Select
        id={`seat-${guest.id}`}
        value={guest.tableId ?? ''}
        disabled={busy}
        onChange={(e) => onAssign(guest.id, e.target.value || null)}
        className="h-8 w-auto min-w-[6.5rem] shrink-0 text-xs"
      >
        <option value="">Sin sentar</option>
        {tables.map((t) => (
          <option key={t.id} value={t.id}>
            {t.label}
          </option>
        ))}
      </Select>
    </div>
  )
}

/* ── Droppable panes ──────────────────────────────────────────────────────── */

function UnseatedPane({
  guests,
  tables,
  onAssign,
  busy,
  isDropTarget,
}: {
  guests: GuestLite[]
  tables: TableLite[]
  onAssign: (guestId: string, tableId: string | null) => void
  busy: boolean
  isDropTarget: boolean
}) {
  const { setNodeRef, isOver } = useDroppable({ id: UNSEATED })
  return (
    <section
      aria-label="Sin sentar"
      className="flex flex-col rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] p-4 shadow-[var(--shadow-soft)]"
    >
      <h2 className="mb-3 flex items-center justify-between font-display text-lg tracking-tight text-[var(--color-foreground)]">
        Sin sentar
        <span className="text-sm tabular-nums text-[var(--color-muted-foreground)]">
          {guests.length}
        </span>
      </h2>
      <div
        ref={setNodeRef}
        className={`flex min-h-24 flex-col gap-2 rounded-[var(--radius)] p-1 transition-colors ${isOver && isDropTarget ? 'bg-[var(--color-sidebar-accent)]' : ''}`}
      >
        {guests.length === 0 ? (
          <p className="grid flex-1 place-items-center px-3 py-6 text-center text-sm text-[var(--color-muted-foreground)]">
            Todos los invitados tienen mesa. 🎉
          </p>
        ) : (
          guests.map((g) => (
            <GuestChip
              key={g.id}
              guest={g}
              tables={tables}
              onAssign={onAssign}
              busy={busy}
            />
          ))
        )}
      </div>
    </section>
  )
}

function TableCard({
  table,
  seated,
  allTables,
  onAssign,
  onEdit,
  onDelete,
  busy,
  deleting,
  draggingWouldOverflow,
}: {
  table: TableLite
  seated: GuestLite[]
  allTables: TableLite[]
  onAssign: (guestId: string, tableId: string | null) => void
  onEdit: () => void
  onDelete: () => void
  busy: boolean
  deleting: boolean
  draggingWouldOverflow: boolean
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `table-${table.id}` })
  const used = seated.filter((g) => g.rsvpStatus !== 'declined').length
  const over = used > table.capacity
  const roundish = table.shape === 'round'

  return (
    <section
      aria-labelledby={`table-${table.id}`}
      className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] p-4 shadow-[var(--shadow-soft)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2
            id={`table-${table.id}`}
            className="font-display text-lg text-[var(--color-foreground)]"
          >
            {table.label}
          </h2>
          <p
            className={`text-xs ${over ? 'font-medium text-[var(--color-destructive)]' : 'text-[var(--color-muted-foreground)]'}`}
          >
            {used} / {table.capacity}
            {over ? ' · sobre capacidad' : ''}
          </p>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={onEdit}>
            Editar
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={deleting}
            onClick={onDelete}
            className="text-[var(--color-destructive)]"
          >
            Borrar
          </Button>
        </div>
      </div>

      {/* Drop zone — the "around the table" cluster. */}
      <div
        ref={setNodeRef}
        className={[
          'mt-3 flex min-h-20 flex-wrap content-start gap-2 border-2 p-3 transition-colors',
          roundish ? 'rounded-[var(--radius-xl)]' : 'rounded-[var(--radius)]',
          isOver
            ? draggingWouldOverflow
              ? 'border-[var(--color-destructive)] bg-[var(--color-destructive)]/5'
              : 'border-[var(--color-sage)] bg-[var(--color-sage)]/8'
            : 'border-dashed border-[var(--color-border)]',
        ].join(' ')}
      >
        {seated.length === 0 ? (
          <p className="w-full py-2 text-center text-xs text-[var(--color-muted-foreground)]">
            Arrastra invitados aquí
          </p>
        ) : (
          seated.map((g) => (
            <GuestChip
              key={g.id}
              guest={g}
              tables={allTables}
              onAssign={onAssign}
              busy={busy}
            />
          ))
        )}
      </div>
    </section>
  )
}

/* ── Table create/edit dialog (unchanged behavior) ───────────────────────── */

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
  const [state, formAction, pending] = useActionState<TableActionState, FormData>(
    action,
    undefined,
  )

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
            <Input name="capacity" type="number" min={1} max={100} defaultValue={table?.capacity ?? 8} />
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

/* ── Board ────────────────────────────────────────────────────────────────── */

export function SeatingBoard({
  tables,
  guests,
}: {
  tables: TableLite[]
  guests: GuestLite[]
}) {
  const [optimisticGuests, applyAssign] = useOptimistic(
    guests,
    (state: GuestLite[], patch: { guestId: string; tableId: string | null }) =>
      state.map((g) =>
        g.id === patch.guestId ? { ...g, tableId: patch.tableId } : g,
      ),
  )
  const [, startTransition] = useTransition()
  const [editing, setEditing] = useState<TableLite | null | undefined>(undefined)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const dialogOpen = editing !== undefined

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  )

  const { seatedByTable, unseated } = useMemo(() => {
    const byTable = new Map<string, GuestLite[]>()
    const un: GuestLite[] = []
    for (const g of optimisticGuests) {
      if (g.tableId) {
        const arr = byTable.get(g.tableId) ?? []
        arr.push(g)
        byTable.set(g.tableId, arr)
      } else if (g.rsvpStatus !== 'declined') {
        un.push(g)
      }
    }
    return { seatedByTable: byTable, unseated: un }
  }, [optimisticGuests])

  function assign(guestId: string, tableId: string | null) {
    const current = optimisticGuests.find((g) => g.id === guestId)
    if (current && current.tableId === tableId) return
    startTransition(async () => {
      applyAssign({ guestId, tableId })
      const res = await assignGuest(guestId, tableId)
      if (!res.ok) window.alert(res.error)
    })
  }

  function onDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id))
  }

  function onDragEnd(e: DragEndEvent) {
    setActiveId(null)
    const { active, over } = e
    if (!over) return
    const guestId = String(active.id)
    const overId = String(over.id)
    const tableId = overId === UNSEATED ? null : overId.slice('table-'.length)
    assign(guestId, tableId)
  }

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

  const activeGuest = activeId
    ? optimisticGuests.find((g) => g.id === activeId)
    : undefined

  // Which table (if any) would overflow if the dragged guest landed there.
  function wouldOverflow(t: TableLite): boolean {
    if (!activeGuest || activeGuest.rsvpStatus === 'declined') return false
    if (activeGuest.tableId === t.id) return false
    const used = (seatedByTable.get(t.id) ?? []).filter(
      (g) => g.rsvpStatus !== 'declined',
    ).length
    return used + 1 > t.capacity
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

      <DndContext
        sensors={sensors}
        collisionDetection={pointerWithin}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,18rem)_1fr]">
          <UnseatedPane
            guests={unseated}
            tables={tables}
            onAssign={assign}
            busy={false}
            isDropTarget={Boolean(activeGuest)}
          />

          <div>
            {tables.length === 0 ? (
              <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border)] bg-[var(--color-card)] px-6 py-10 text-center">
                <p className="text-[var(--color-foreground)]">Aún no hay mesas.</p>
                <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
                  Crea la primera y empieza a sentar invitados.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                {tables.map((t) => (
                  <TableCard
                    key={t.id}
                    table={t}
                    seated={seatedByTable.get(t.id) ?? []}
                    allTables={tables}
                    onAssign={assign}
                    onEdit={() => setEditing(t)}
                    onDelete={() => handleDelete(t)}
                    busy={false}
                    deleting={deletingId === t.id}
                    draggingWouldOverflow={wouldOverflow(t)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <DragOverlay>
          {activeGuest ? (
            <div className="flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-card)] py-1 pl-3 pr-3 text-sm shadow-[var(--shadow-warm)]">
              {activeGuest.name}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

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
