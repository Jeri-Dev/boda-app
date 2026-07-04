'use server'

/**
 * Wedding-day timeline Server Actions (U10). Open app (no auth gate at the app
 * level, but every action still calls requireBackofficeAuth() — the deploy gate
 * keys on route, actions dispatch by id). Same recipe as the other modules.
 */

import 'server-only'

import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { requireBackofficeAuth } from '@/lib/auth/backoffice'
import { db } from '@/lib/db'
import { timelineEvents } from '@/lib/db/schema'

const TimelineSchema = z.object({
  time: z.string().trim().max(20, 'Máximo 20 caracteres').optional(),
  event: z
    .string()
    .trim()
    .min(1, 'Evento requerido')
    .max(200, 'Máximo 200 caracteres'),
  notes: z.string().trim().max(2000, 'Máximo 2000 caracteres').optional(),
})

type TimelineField = keyof z.infer<typeof TimelineSchema>

export type TimelineActionState =
  | {
      ok?: true
      error?: string
      fieldErrors?: Partial<Record<TimelineField, string[]>>
    }
  | undefined

function readForm(formData: FormData) {
  const str = (k: string) => {
    const v = formData.get(k)
    return typeof v === 'string' ? v.trim() : ''
  }
  const opt = (k: string) => {
    const s = str(k)
    return s.length > 0 ? s : undefined
  }
  return { time: opt('time'), event: str('event'), notes: opt('notes') }
}

function toRow(data: z.infer<typeof TimelineSchema>) {
  return {
    time: data.time ?? null,
    event: data.event,
    notes: data.notes ?? null,
  }
}

export async function createTimelineEvent(
  _prev: TimelineActionState,
  formData: FormData,
): Promise<TimelineActionState> {
  await requireBackofficeAuth()
  const parsed = TimelineSchema.safeParse(readForm(formData))
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors }

  try {
    await db.insert(timelineEvents).values(toRow(parsed.data))
  } catch {
    return { error: 'No se pudo crear el evento' }
  }

  revalidatePath('/dia-b')
  return { ok: true }
}

export async function updateTimelineEvent(
  id: string,
  _prev: TimelineActionState,
  formData: FormData,
): Promise<TimelineActionState> {
  await requireBackofficeAuth()
  const parsed = TimelineSchema.safeParse(readForm(formData))
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors }

  try {
    const updated = await db
      .update(timelineEvents)
      .set(toRow(parsed.data))
      .where(eq(timelineEvents.id, id))
      .returning({ id: timelineEvents.id })
    if (updated.length === 0) return { error: 'Evento no encontrado' }
  } catch {
    return { error: 'No se pudo actualizar el evento' }
  }

  revalidatePath('/dia-b')
  return { ok: true }
}

export async function deleteTimelineEvent(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireBackofficeAuth()
  try {
    const deleted = await db
      .delete(timelineEvents)
      .where(eq(timelineEvents.id, id))
      .returning({ id: timelineEvents.id })
    if (deleted.length === 0) return { ok: false, error: 'Evento no encontrado' }
  } catch {
    return { ok: false, error: 'No se pudo eliminar el evento' }
  }

  revalidatePath('/dia-b')
  return { ok: true }
}
