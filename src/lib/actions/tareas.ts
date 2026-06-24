'use server'

/**
 * Task checklist Server Actions (U1.4). Open app (no auth gate). In-app only —
 * no proactive notifications. `toggleTask` is a lightweight done/undone flip
 * driven by the row checkbox, separate from the full edit dialog.
 */

import 'server-only'

import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { db } from '@/lib/db'
import { tasks } from '@/lib/db/schema'

const TaskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Título requerido')
    .max(200, 'Máximo 200 caracteres'),
  dueDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida')
    .refine((s) => {
      const d = new Date(`${s}T00:00:00Z`)
      return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s
    }, 'Fecha inexistente')
    .optional(),
  notes: z.string().trim().max(2000, 'Máximo 2000 caracteres').optional(),
})

type TaskField = keyof z.infer<typeof TaskSchema>

export type TaskActionState =
  | {
      ok?: true
      error?: string
      fieldErrors?: Partial<Record<TaskField, string[]>>
    }
  | undefined

function readForm(formData: FormData) {
  const str = (key: string) => {
    const v = formData.get(key)
    return typeof v === 'string' ? v.trim() : ''
  }
  const opt = (key: string) => {
    const s = str(key)
    return s.length > 0 ? s : undefined
  }
  return {
    title: str('title'),
    dueDate: opt('dueDate'),
    notes: opt('notes'),
  }
}

function toRow(data: z.infer<typeof TaskSchema>) {
  return {
    title: data.title,
    dueDate: data.dueDate ?? null,
    notes: data.notes ?? null,
  }
}

export async function createTask(
  _prev: TaskActionState,
  formData: FormData,
): Promise<TaskActionState> {
  const parsed = TaskSchema.safeParse(readForm(formData))
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors }

  try {
    await db.insert(tasks).values(toRow(parsed.data))
  } catch {
    return { error: 'No se pudo crear la tarea' }
  }

  revalidatePath('/tareas')
  return { ok: true }
}

export async function updateTask(
  id: string,
  _prev: TaskActionState,
  formData: FormData,
): Promise<TaskActionState> {
  const parsed = TaskSchema.safeParse(readForm(formData))
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors }

  try {
    const updated = await db
      .update(tasks)
      .set(toRow(parsed.data))
      .where(eq(tasks.id, id))
      .returning({ id: tasks.id })
    if (updated.length === 0) return { error: 'Tarea no encontrada' }
  } catch {
    return { error: 'No se pudo actualizar la tarea' }
  }

  revalidatePath('/tareas')
  return { ok: true }
}

export async function toggleTask(
  id: string,
  done: boolean,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const updated = await db
      .update(tasks)
      .set({ done })
      .where(eq(tasks.id, id))
      .returning({ id: tasks.id })
    if (updated.length === 0) return { ok: false, error: 'Tarea no encontrada' }
  } catch {
    return { ok: false, error: 'No se pudo actualizar la tarea' }
  }

  revalidatePath('/tareas')
  return { ok: true }
}

export async function deleteTask(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const deleted = await db
      .delete(tasks)
      .where(eq(tasks.id, id))
      .returning({ id: tasks.id })
    if (deleted.length === 0) return { ok: false, error: 'Tarea no encontrada' }
  } catch {
    return { ok: false, error: 'No se pudo eliminar la tarea' }
  }

  revalidatePath('/tareas')
  return { ok: true }
}
