'use client'

import { useActionState, useEffect } from 'react'

import { Button } from '@/components/ui/button'
import { DialogBody, DialogFooter } from '@/components/ui/dialog'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  createTask,
  updateTask,
  type TaskActionState,
} from '@/lib/actions/tareas'
import type { Task } from '@/lib/db/schema'

export function TaskForm({
  task,
  onSuccess,
  onCancel,
}: {
  task?: Task
  onSuccess: () => void
  onCancel: () => void
}) {
  const action = task ? updateTask.bind(null, task.id) : createTask
  const [state, formAction, pending] = useActionState<
    TaskActionState,
    FormData
  >(action, undefined)

  useEffect(() => {
    if (state?.ok) onSuccess()
  }, [state, onSuccess])

  const errs = state?.fieldErrors

  return (
    <form action={formAction} noValidate>
      <DialogBody className="grid gap-4">
        <Field label="Tarea" error={errs?.title?.[0]} required>
          <Input
            name="title"
            placeholder="Reservar el local, enviar invitaciones…"
            defaultValue={task?.title ?? ''}
            autoFocus
          />
        </Field>

        <Field label="Fecha límite" error={errs?.dueDate?.[0]}>
          <Input name="dueDate" type="date" defaultValue={task?.dueDate ?? ''} />
        </Field>

        <Field label="Notas" error={errs?.notes?.[0]}>
          <Textarea name="notes" rows={3} defaultValue={task?.notes ?? ''} />
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
          {task ? 'Guardar cambios' : 'Añadir tarea'}
        </Button>
      </DialogFooter>
    </form>
  )
}
