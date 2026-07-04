'use client'

import { useMemo, useOptimistic, useState, useTransition } from 'react'
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { deleteTask, moveTask } from '@/lib/actions/tareas'
import { TASK_STATUSES, type Task, type TaskStatus } from '@/lib/db/schema'
import { formatDateEs } from '@/lib/utils/dates'
import { TaskForm } from './task-form'

const COLUMNS: { status: TaskStatus; label: string }[] = [
  { status: 'todo', label: 'Por hacer' },
  { status: 'doing', label: 'En curso' },
  { status: 'done', label: 'Hecho' },
]

type Grouped = Record<TaskStatus, Task[]>
type Move = { id: string; toStatus: TaskStatus; toIndex: number }

function group(tasks: Task[]): Grouped {
  const g: Grouped = { todo: [], doing: [], done: [] }
  for (const t of tasks) g[t.status].push(t)
  for (const s of TASK_STATUSES) g[s].sort((a, b) => a.position - b.position)
  return g
}

function applyMove(grouped: Grouped, move: Move): Grouped {
  const next: Grouped = {
    todo: [...grouped.todo],
    doing: [...grouped.doing],
    done: [...grouped.done],
  }
  let moved: Task | undefined
  for (const s of TASK_STATUSES) {
    const i = next[s].findIndex((t) => t.id === move.id)
    if (i >= 0) {
      moved = next[s][i]
      next[s].splice(i, 1)
      break
    }
  }
  if (!moved) return grouped
  const dest = next[move.toStatus]
  const idx = Math.max(0, Math.min(dest.length, move.toIndex))
  dest.splice(idx, 0, { ...moved, status: move.toStatus })
  return next
}

function dueInfo(
  t: Task,
  today: string,
  soon: string,
): { color: string; tag: string | null } {
  if (t.status === 'done' || !t.dueDate) return { color: '', tag: null }
  if (t.dueDate < today) {
    return { color: 'text-[var(--color-destructive)]', tag: 'Vencida' }
  }
  if (t.dueDate <= soon) {
    return { color: 'text-[var(--color-gold)]', tag: 'Próxima' }
  }
  return { color: '', tag: null }
}

function CardBody({
  task,
  today,
  soon,
}: {
  task: Task
  today: string
  soon: string
}) {
  const due = dueInfo(task, today, soon)
  return (
    <div className="min-w-0">
      <p
        className={`truncate text-[0.9375rem] ${task.status === 'done' ? 'text-[var(--color-muted-foreground)] line-through' : 'text-[var(--color-foreground)]'}`}
      >
        {task.title}
      </p>
      {task.dueDate ? (
        <span className="mt-1 flex items-center gap-2 text-xs">
          <span className={`tabular-nums ${due.color}`}>
            {formatDateEs(task.dueDate)}
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
  )
}

function TaskCard({
  task,
  today,
  soon,
  onEdit,
  onDelete,
  onMoveTo,
  busy,
}: {
  task: Task
  today: string
  soon: string
  onEdit: () => void
  onDelete: () => void
  onMoveTo: (status: TaskStatus) => void
  busy: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id })

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-card)] p-3 shadow-[var(--shadow-soft)] ${isDragging ? 'opacity-50' : ''}`}
    >
      <div className="flex items-start gap-2">
        {/* Drag handle — keyboard-accessible via dnd-kit sensors. */}
        <button
          type="button"
          className="mt-0.5 shrink-0 cursor-grab touch-none rounded p-0.5 text-[var(--color-stone-400)] hover:text-[var(--color-foreground)] active:cursor-grabbing"
          aria-label={`Mover ${task.title}`}
          {...attributes}
          {...listeners}
        >
          <svg width={16} height={16} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <circle cx="9" cy="6" r="1.5" />
            <circle cx="15" cy="6" r="1.5" />
            <circle cx="9" cy="12" r="1.5" />
            <circle cx="15" cy="12" r="1.5" />
            <circle cx="9" cy="18" r="1.5" />
            <circle cx="15" cy="18" r="1.5" />
          </svg>
        </button>
        <CardBody task={task} today={today} soon={soon} />
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        {/* Accessible, non-drag fallback: move via a native select. */}
        <label className="sr-only" htmlFor={`move-${task.id}`}>
          Mover “{task.title}” a otra columna
        </label>
        <select
          id={`move-${task.id}`}
          value={task.status}
          disabled={busy}
          onChange={(e) => onMoveTo(e.target.value as TaskStatus)}
          className="h-8 rounded-[var(--radius-sm)] border border-[var(--color-input)] bg-[var(--color-background)] px-2 text-xs text-[var(--color-foreground)]"
        >
          {COLUMNS.map((c) => (
            <option key={c.status} value={c.status}>
              {c.label}
            </option>
          ))}
        </select>
        <span className="flex gap-0.5">
          <Button variant="ghost" size="sm" onClick={onEdit}>
            Editar
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="text-[var(--color-destructive)]"
          >
            Borrar
          </Button>
        </span>
      </div>
    </li>
  )
}

function Column({
  status,
  label,
  tasks,
  today,
  soon,
  onEdit,
  onDelete,
  onMoveTo,
  busy,
}: {
  status: TaskStatus
  label: string
  tasks: Task[]
  today: string
  soon: string
  onEdit: (t: Task) => void
  onDelete: (t: Task) => void
  onMoveTo: (t: Task, status: TaskStatus) => void
  busy: boolean
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `col-${status}` })
  return (
    <section
      aria-label={label}
      className="flex min-w-0 flex-col rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-muted)]/40 p-3"
    >
      <h2 className="mb-3 flex items-center justify-between px-1 font-display text-sm uppercase tracking-wide text-[var(--color-muted-foreground)]">
        {label}
        <span className="tabular-nums">{tasks.length}</span>
      </h2>
      <SortableContext
        items={tasks.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <ul
          ref={setNodeRef}
          className={`flex min-h-24 flex-1 flex-col gap-2 rounded-[var(--radius)] p-1 transition-colors ${isOver ? 'bg-[var(--color-sidebar-accent)]' : ''}`}
        >
          {tasks.length === 0 ? (
            <li className="grid flex-1 place-items-center rounded-[var(--radius)] border border-dashed border-[var(--color-border)] px-3 py-6 text-center text-xs text-[var(--color-muted-foreground)]">
              Arrastra una tarea aquí
            </li>
          ) : (
            tasks.map((t) => (
              <TaskCard
                key={t.id}
                task={t}
                today={today}
                soon={soon}
                busy={busy}
                onEdit={() => onEdit(t)}
                onDelete={() => onDelete(t)}
                onMoveTo={(s) => onMoveTo(t, s)}
              />
            ))
          )}
        </ul>
      </SortableContext>
    </section>
  )
}

export function TaskBoard({
  tasks,
  today,
  soon,
}: {
  tasks: Task[]
  today: string
  soon: string
}) {
  const base = useMemo(() => group(tasks), [tasks])
  const [optimistic, applyOptimistic] = useOptimistic(base, applyMove)
  const [, startTransition] = useTransition()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [editing, setEditing] = useState<Task | null | undefined>(undefined)
  const dialogOpen = editing !== undefined

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const byId = useMemo(() => {
    const m = new Map<string, Task>()
    for (const s of TASK_STATUSES) for (const t of optimistic[s]) m.set(t.id, t)
    return m
  }, [optimistic])

  function columnOf(id: string): TaskStatus | null {
    for (const s of TASK_STATUSES) {
      if (optimistic[s].some((t) => t.id === id)) return s
    }
    return null
  }

  function commitMove(id: string, toStatus: TaskStatus, toIndex: number) {
    startTransition(async () => {
      applyOptimistic({ id, toStatus, toIndex })
      const res = await moveTask(id, toStatus, toIndex)
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
    const id = String(active.id)
    const overId = String(over.id)

    let toStatus: TaskStatus
    let toIndex: number
    if (overId.startsWith('col-')) {
      toStatus = overId.slice(4) as TaskStatus
      toIndex = optimistic[toStatus].length
    } else {
      const s = columnOf(overId)
      if (!s) return
      toStatus = s
      toIndex = optimistic[s].findIndex((t) => t.id === overId)
    }

    const from = columnOf(id)
    const fromIndex = from ? optimistic[from].findIndex((t) => t.id === id) : -1
    if (from === toStatus && fromIndex === toIndex) return

    commitMove(id, toStatus, toIndex)
  }

  function handleDelete(t: Task) {
    if (!window.confirm(`¿Borrar la tarea “${t.title}”?`)) return
    startTransition(async () => {
      const res = await deleteTask(t.id)
      if (!res.ok) window.alert(res.error)
    })
  }

  const activeTask = activeId ? byId.get(activeId) : undefined

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-[var(--color-muted-foreground)]">
          {tasks.length} {tasks.length === 1 ? 'tarea' : 'tareas'}
        </p>
        <Button variant="primary" onClick={() => setEditing(null)}>
          Nueva tarea
        </Button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {COLUMNS.map((c) => (
            <Column
              key={c.status}
              status={c.status}
              label={c.label}
              tasks={optimistic[c.status]}
              today={today}
              soon={soon}
              busy={false}
              onEdit={(t) => setEditing(t)}
              onDelete={handleDelete}
              onMoveTo={(t, s) => {
                if (s !== t.status) commitMove(t.id, s, optimistic[s].length)
              }}
            />
          ))}
        </div>
        <DragOverlay>
          {activeTask ? (
            <div className="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-card)] p-3 shadow-[var(--shadow-warm)]">
              <CardBody task={activeTask} today={today} soon={soon} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <Dialog
        open={dialogOpen}
        onOpenChange={(o) => {
          if (!o) setEditing(undefined)
        }}
        aria-labelledby="task-dialog-title"
      >
        {dialogOpen ? (
          <>
            <DialogHeader>
              <DialogTitle id="task-dialog-title">
                {editing ? 'Editar tarea' : 'Nueva tarea'}
              </DialogTitle>
              <DialogDescription>
                {editing ? 'Actualiza la tarea.' : 'Añade una tarea al tablero.'}
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
