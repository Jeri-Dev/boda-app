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
import { Textarea } from '@/components/ui/textarea'
import {
  createTimelineEvent,
  deleteTimelineEvent,
  updateTimelineEvent,
  type TimelineActionState,
} from '@/lib/actions/timeline'
import type { TimelineEvent } from '@/lib/db/schema'

function TimelineForm({
  event,
  onSuccess,
  onCancel,
}: {
  event?: TimelineEvent
  onSuccess: () => void
  onCancel: () => void
}) {
  const action = event
    ? updateTimelineEvent.bind(null, event.id)
    : createTimelineEvent
  const [state, formAction, pending] = useActionState<
    TimelineActionState,
    FormData
  >(action, undefined)

  useEffect(() => {
    if (state?.ok) onSuccess()
  }, [state, onSuccess])

  const errs = state?.fieldErrors

  return (
    <form action={formAction} noValidate>
      <DialogBody className="grid gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[8rem_1fr]">
          <Field label="Hora" error={errs?.time?.[0]}>
            <Input name="time" type="time" defaultValue={event?.time ?? ''} />
          </Field>
          <Field label="Evento" error={errs?.event?.[0]} required>
            <Input
              name="event"
              placeholder="Ceremonia, cóctel, primer baile…"
              defaultValue={event?.event ?? ''}
              autoFocus
            />
          </Field>
        </div>
        <Field label="Notas" error={errs?.notes?.[0]}>
          <Textarea name="notes" rows={2} defaultValue={event?.notes ?? ''} />
        </Field>
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
          {event ? 'Guardar' : 'Añadir'}
        </Button>
      </DialogFooter>
    </form>
  )
}

export function TimelineManager({ events }: { events: TimelineEvent[] }) {
  const [editing, setEditing] = useState<TimelineEvent | null | undefined>(
    undefined,
  )
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [, startTransition] = useTransition()
  const dialogOpen = editing !== undefined

  function handleDelete(e: TimelineEvent) {
    if (!window.confirm(`¿Borrar “${e.event}” del cronograma?`)) return
    setDeletingId(e.id)
    startTransition(async () => {
      const res = await deleteTimelineEvent(e.id)
      setDeletingId(null)
      if (!res.ok) window.alert(res.error)
    })
  }

  return (
    <>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="font-display text-xl tracking-tight text-[var(--color-foreground)]">
          Cronograma
        </h2>
        <Button variant="outline" size="sm" onClick={() => setEditing(null)}>
          Añadir
        </Button>
      </div>

      {events.length === 0 ? (
        <p className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border)] bg-[var(--color-card)] px-5 py-6 text-sm text-[var(--color-muted-foreground)]">
          Aún no hay eventos. Añade la hora de la ceremonia, el cóctel, la
          cena…
        </p>
      ) : (
        <ul className="divide-y divide-[var(--color-border)] rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] shadow-[var(--shadow-soft)]">
          {events.map((e) => (
            <li key={e.id} className="flex items-start gap-3 px-5 py-3">
              <span className="w-14 shrink-0 pt-0.5 text-sm tabular-nums text-[var(--color-muted-foreground)]">
                {e.time || '—'}
              </span>
              <div className="min-w-0 flex-1">
                <span className="block text-[0.9375rem] text-[var(--color-foreground)]">
                  {e.event}
                </span>
                {e.notes ? (
                  <span className="mt-0.5 block text-xs text-[var(--color-muted-foreground)]">
                    {e.notes}
                  </span>
                ) : null}
              </div>
              <div className="flex shrink-0 gap-1">
                <Button variant="ghost" size="sm" onClick={() => setEditing(e)}>
                  Editar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={deletingId === e.id}
                  onClick={() => handleDelete(e)}
                  className="text-[var(--color-destructive)]"
                >
                  Borrar
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog
        open={dialogOpen}
        onOpenChange={(o) => {
          if (!o) setEditing(undefined)
        }}
        aria-labelledby="timeline-dialog-title"
      >
        {dialogOpen ? (
          <>
            <DialogHeader>
              <DialogTitle id="timeline-dialog-title">
                {editing ? 'Editar evento' : 'Nuevo evento'}
              </DialogTitle>
              <DialogDescription>
                Hora, evento y notas del cronograma del día.
              </DialogDescription>
            </DialogHeader>
            <TimelineForm
              key={editing?.id ?? 'new'}
              event={editing ?? undefined}
              onSuccess={() => setEditing(undefined)}
              onCancel={() => setEditing(undefined)}
            />
          </>
        ) : null}
      </Dialog>
    </>
  )
}
