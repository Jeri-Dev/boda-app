'use client'

import { useOptimistic, useState, useTransition } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { deleteTask, toggleTask } from '@/lib/actions/tareas'
import type { Task } from '@/lib/db/schema'
import { formatDateEs } from '@/lib/utils/dates'
import { TaskForm } from './task-form'

export function TaskList({
  tasks,
  today,
  soon,
}: {
  tasks: Task[]
  today: string
  soon: string
}) {
  const [editing, setEditing] = useState<Task | null | undefined>(undefined)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [, startTransition] = useTransition()
  // Optimistic done-flip so the checkbox responds instantly; reverts to the
  // server value if the action fails or once revalidation lands.
  const [optimisticTasks, applyOptimistic] = useOptimistic(
    tasks,
    (state: Task[], patch: { id: string; done: boolean }) =>
      state.map((t) => (t.id === patch.id ? { ...t, done: patch.done } : t)),
  )
  const dialogOpen = editing !== undefined

  function handleToggle(t: Task) {
    startTransition(async () => {
      applyOptimistic({ id: t.id, done: !t.done })
      const res = await toggleTask(t.id, !t.done)
      if (!res.ok) window.alert(res.error)
    })
  }

  function handleDelete(t: Task) {
    if (!window.confirm(`¿Borrar la tarea “${t.title}”?`)) return
    setBusyId(t.id)
    startTransition(async () => {
      const res = await deleteTask(t.id)
      setBusyId(null)
      if (!res.ok) window.alert(res.error)
    })
  }

  function dueInfo(t: Task): { color: string; tag: string | null } {
    if (t.done || !t.dueDate) return { color: '', tag: null }
    if (t.dueDate < today) {
      return { color: 'text-[var(--color-destructive)]', tag: 'Vencida' }
    }
    if (t.dueDate <= soon) {
      return { color: 'text-[var(--color-gold)]', tag: 'Próxima' }
    }
    return { color: '', tag: null }
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-[var(--color-muted-foreground)]">
          {optimisticTasks.length}{' '}
          {optimisticTasks.length === 1 ? 'tarea' : 'tareas'}
        </p>
        <Button variant="primary" onClick={() => setEditing(null)}>
          Nueva tarea
        </Button>
      </div>

      {optimisticTasks.length === 0 ? (
        <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border)] bg-[var(--color-card)] px-6 py-12 text-center">
          <p className="text-[var(--color-foreground)]">
            Aún no hay tareas que coincidan.
          </p>
          <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
            Añade la primera con “Nueva tarea”.
          </p>
        </div>
      ) : (
        <ul className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] shadow-[var(--shadow-soft)]">
          {optimisticTasks.map((t) => {
            const due = dueInfo(t)
            return (
              <li
                key={t.id}
                className="flex items-center gap-3 border-b border-[var(--color-border)] px-4 py-3 last:border-b-0"
              >
                <input
                  type="checkbox"
                  checked={t.done}
                  onChange={() => handleToggle(t)}
                  aria-label={`Marcar “${t.title}” como ${
                    t.done ? 'pendiente' : 'hecha'
                  }`}
                  className="h-4 w-4 shrink-0 rounded border-[var(--color-input)] accent-[var(--color-success)]"
                />

                <div className="min-w-0 flex-1">
                  <span
                    className={`block truncate ${
                      t.done
                        ? 'text-[var(--color-muted-foreground)] line-through'
                        : 'text-[var(--color-foreground)]'
                    }`}
                  >
                    {t.title}
                  </span>
                  {t.dueDate ? (
                    <span className="mt-0.5 flex items-center gap-2 text-xs">
                      <span className={`tabular-nums ${due.color}`}>
                        {formatDateEs(t.dueDate)}
                      </span>
                      {due.tag ? (
                        <span
                          className={`rounded-full border border-current px-1.5 py-px text-[0.65rem] font-medium uppercase tracking-wide ${due.color}`}
                        >
                          {due.tag}
                        </span>
                      ) : null}
                    </span>
                  ) : null}
                </div>

                <div className="flex shrink-0 gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditing(t)}
                  >
                    Editar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={busyId === t.id}
                    onClick={() => handleDelete(t)}
                    className="text-[var(--color-destructive)]"
                  >
                    Borrar
                  </Button>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <Dialog
        open={dialogOpen}
        onOpenChange={(o) => {
          if (!o) setEditing(undefined)
        }}
        aria-labelledby="task-dialog-title"
        aria-describedby="task-dialog-desc"
      >
        {dialogOpen ? (
          <>
            <DialogHeader>
              <DialogTitle id="task-dialog-title">
                {editing ? 'Editar tarea' : 'Nueva tarea'}
              </DialogTitle>
              <DialogDescription id="task-dialog-desc">
                {editing
                  ? 'Actualiza la tarea.'
                  : 'Añade una tarea al checklist.'}
              </DialogDescription>
            </DialogHeader>
            <TaskForm
              key={editing?.id ?? 'new'}
              task={editing ?? undefined}
              onSuccess={() => setEditing(undefined)}
              onCancel={() => setEditing(undefined)}
            />
          </>
        ) : null}
      </Dialog>
    </>
  )
}
