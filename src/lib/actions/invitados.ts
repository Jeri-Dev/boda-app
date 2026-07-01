'use server'

/**
 * Guest CRUD Server Actions (U1.1).
 *
 * The app is open — there is NO auth gate. The recipe is otherwise the
 * `my-app` one: `'use server'` → `Schema.safeParse` → mutate via Drizzle →
 * `revalidatePath`. We stay on the list (no redirect), so create/update return
 * `{ ok: true }` for the form to close its dialog.
 *
 * Every host write stamps `last_modified_source: 'host'` (Fase 2's public RSVP
 * will stamp `'guest'`).
 */

import 'server-only'

import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { requireBackofficeAuth } from '@/lib/auth/backoffice'
import { db } from '@/lib/db'
import { guests, RSVP_STATUSES } from '@/lib/db/schema'

const GuestSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Nombre requerido')
    .max(160, 'Máximo 160 caracteres'),
  household: z.string().trim().max(160, 'Máximo 160 caracteres').optional(),
  email: z
    .string()
    .trim()
    .email('Email inválido')
    .max(254, 'Máximo 254 caracteres')
    .optional(),
  phone: z.string().trim().max(40, 'Máximo 40 caracteres').optional(),
  rsvpStatus: z.enum(RSVP_STATUSES),
  menu: z.string().trim().max(120, 'Máximo 120 caracteres').optional(),
  plusOne: z.boolean(),
  plusOneName: z.string().trim().max(160, 'Máximo 160 caracteres').optional(),
  notes: z.string().trim().max(2000, 'Máximo 2000 caracteres').optional(),
})

type GuestField = keyof z.infer<typeof GuestSchema>

export type GuestActionState =
  | {
      ok?: true
      error?: string
      fieldErrors?: Partial<Record<GuestField, string[]>>
    }
  | undefined

/** Read FormData → a normalized object: empty optional strings become undefined. */
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
    name: str('name'),
    household: opt('household'),
    email: opt('email'),
    phone: opt('phone'),
    rsvpStatus: str('rsvpStatus') || 'pending',
    menu: opt('menu'),
    // Checkbox: present ('on') when checked, absent otherwise.
    plusOne: formData.get('plusOne') != null,
    plusOneName: opt('plusOneName'),
    notes: opt('notes'),
  }
}

/** Map the validated payload to DB columns (undefined optionals → null). */
function toRow(data: z.infer<typeof GuestSchema>) {
  return {
    name: data.name,
    household: data.household ?? null,
    email: data.email ?? null,
    phone: data.phone ?? null,
    rsvpStatus: data.rsvpStatus,
    menu: data.menu ?? null,
    plusOne: data.plusOne,
    // Keep the +1 name coherent with the flag: no orphan name when there's no +1.
    plusOneName: data.plusOne ? (data.plusOneName ?? null) : null,
    notes: data.notes ?? null,
    lastModifiedSource: 'host' as const,
  }
}

export async function createGuest(
  _prev: GuestActionState,
  formData: FormData,
): Promise<GuestActionState> {
  await requireBackofficeAuth()
  const parsed = GuestSchema.safeParse(readForm(formData))
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors }
  }

  try {
    await db.insert(guests).values(toRow(parsed.data))
  } catch {
    return { error: 'No se pudo crear el invitado' }
  }

  revalidatePath('/invitados')
  return { ok: true }
}

export async function updateGuest(
  id: string,
  _prev: GuestActionState,
  formData: FormData,
): Promise<GuestActionState> {
  await requireBackofficeAuth()
  const parsed = GuestSchema.safeParse(readForm(formData))
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors }
  }

  try {
    const updated = await db
      .update(guests)
      .set(toRow(parsed.data))
      .where(eq(guests.id, id))
      .returning({ id: guests.id })
    if (updated.length === 0) {
      return { error: 'Invitado no encontrado' }
    }
  } catch {
    return { error: 'No se pudo actualizar el invitado' }
  }

  revalidatePath('/invitados')
  return { ok: true }
}

export async function deleteGuest(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireBackofficeAuth()
  try {
    // token_guests.guest_id has an `on delete cascade` FK, so deleting the guest
    // detaches it from any invitation links automatically.
    const deleted = await db
      .delete(guests)
      .where(eq(guests.id, id))
      .returning({ id: guests.id })
    if (deleted.length === 0) {
      return { ok: false, error: 'Invitado no encontrado' }
    }
  } catch {
    return { ok: false, error: 'No se pudo eliminar el invitado' }
  }

  revalidatePath('/invitados')
  return { ok: true }
}
