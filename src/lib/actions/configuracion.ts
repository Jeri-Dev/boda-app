'use server'

import 'server-only'

import { sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { db } from '@/lib/db'
import { wedding } from '@/lib/db/schema'

/**
 * Wedding config (U2.2). The `wedding` table is a singleton (id = 1, enforced by
 * a CHECK). This upserts that single row; the public invitation reads from it.
 */

const ConfigSchema = z.object({
  coupleNames: z.string().trim().max(160, 'Máximo 160 caracteres'),
  eventDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida')
    .refine((s) => {
      const d = new Date(`${s}T00:00:00Z`)
      return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s
    }, 'Fecha inexistente')
    .optional(),
  eventTime: z.string().trim().max(40, 'Máximo 40 caracteres').optional(),
  venue: z.string().trim().max(200, 'Máximo 200 caracteres').optional(),
  message: z.string().trim().max(2000, 'Máximo 2000 caracteres').optional(),
})

export type ConfigActionState =
  | {
      ok?: true
      error?: string
      fieldErrors?: Partial<Record<keyof z.infer<typeof ConfigSchema>, string[]>>
    }
  | undefined

export async function saveConfig(
  _prev: ConfigActionState,
  formData: FormData,
): Promise<ConfigActionState> {
  const str = (k: string) => {
    const v = formData.get(k)
    return typeof v === 'string' ? v.trim() : ''
  }
  const opt = (k: string) => {
    const s = str(k)
    return s.length > 0 ? s : undefined
  }

  const parsed = ConfigSchema.safeParse({
    coupleNames: str('coupleNames'),
    eventDate: opt('eventDate'),
    eventTime: opt('eventTime'),
    venue: opt('venue'),
    message: opt('message'),
  })
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors }
  }

  const values = {
    coupleNames: parsed.data.coupleNames,
    eventDate: parsed.data.eventDate ? new Date(parsed.data.eventDate) : null,
    eventTime: parsed.data.eventTime ?? null,
    venue: parsed.data.venue ?? null,
    message: parsed.data.message ?? null,
  }

  try {
    await db
      .insert(wedding)
      .values({ id: 1, ...values })
      .onConflictDoUpdate({ target: wedding.id, set: values })
  } catch {
    return { error: 'No se pudo guardar la configuración' }
  }

  revalidatePath('/configuracion')
  // The invitation surface reads this; bust any cached render.
  revalidatePath('/i', 'layout')
  return { ok: true }
}
