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
  // Public info (U2.5).
  mapUrl: z
    .string()
    .trim()
    .url('Enlace inválido (debe empezar por http)')
    .max(2048, 'Enlace demasiado largo')
    .refine((u) => {
      try {
        return ['http:', 'https:'].includes(new URL(u).protocol)
      } catch {
        return false
      }
    }, 'Solo se permiten enlaces http/https')
    .optional(),
  schedule: z.string().trim().max(2000, 'Máximo 2000 caracteres').optional(),
  dressCode: z.string().trim().max(200, 'Máximo 200 caracteres').optional(),
  accommodation: z.string().trim().max(2000, 'Máximo 2000 caracteres').optional(),
  transport: z.string().trim().max(2000, 'Máximo 2000 caracteres').optional(),
  giftMessage: z.string().trim().max(2000, 'Máximo 2000 caracteres').optional(),
  giftDetails: z.string().trim().max(2000, 'Máximo 2000 caracteres').optional(),
  privacyContact: z.string().trim().max(200, 'Máximo 200 caracteres').optional(),
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
    mapUrl: opt('mapUrl'),
    schedule: opt('schedule'),
    dressCode: opt('dressCode'),
    accommodation: opt('accommodation'),
    transport: opt('transport'),
    giftMessage: opt('giftMessage'),
    giftDetails: opt('giftDetails'),
    privacyContact: opt('privacyContact'),
  })
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors }
  }

  const d = parsed.data
  const values = {
    coupleNames: d.coupleNames,
    eventDate: d.eventDate ? new Date(d.eventDate) : null,
    eventTime: d.eventTime ?? null,
    venue: d.venue ?? null,
    message: d.message ?? null,
    mapUrl: d.mapUrl ?? null,
    schedule: d.schedule ?? null,
    dressCode: d.dressCode ?? null,
    accommodation: d.accommodation ?? null,
    transport: d.transport ?? null,
    giftMessage: d.giftMessage ?? null,
    giftDetails: d.giftDetails ?? null,
    privacyContact: d.privacyContact ?? null,
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
  revalidatePath('/info')
  // The invitation surface reads this; bust any cached render.
  revalidatePath('/i', 'layout')
  return { ok: true }
}
