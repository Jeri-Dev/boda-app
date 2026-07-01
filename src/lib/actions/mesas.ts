'use server'

import 'server-only'

import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { requireBackofficeAuth } from '@/lib/auth/backoffice'
import { db } from '@/lib/db'
import { tables, TABLE_SHAPES } from '@/lib/db/schema'
import {
  assignGuestCore,
  deleteTableCore,
  setTablePositionCore,
} from '@/lib/data/seating'

/**
 * Seating Server Actions (U3.1). Open app (no auth gate). Table CRUD here;
 * delete + assignment delegate to the testable core in data/seating.ts.
 */

const TableSchema = z.object({
  label: z
    .string()
    .trim()
    .min(1, 'Nombre requerido')
    .max(80, 'Máximo 80 caracteres'),
  capacity: z.preprocess(
    (v) => {
      if (typeof v !== 'string' || v.trim() === '') return 8
      const n = Number(v)
      return Number.isInteger(n) ? n : NaN
    },
    z
      .number({ message: 'Capacidad inválida' })
      .int('Capacidad inválida')
      .min(1, 'Mínimo 1')
      .max(100, 'Máximo 100'),
  ),
  shape: z.enum(TABLE_SHAPES).catch('round'),
})

export type TableActionState =
  | {
      ok?: true
      error?: string
      fieldErrors?: Partial<Record<'label' | 'capacity', string[]>>
    }
  | undefined

function readTable(formData: FormData) {
  const label = formData.get('label')
  const capacity = formData.get('capacity')
  const shape = formData.get('shape')
  return {
    label: typeof label === 'string' ? label.trim() : '',
    capacity: typeof capacity === 'string' ? capacity : '',
    shape: typeof shape === 'string' ? shape : 'round',
  }
}

export async function createTable(
  _prev: TableActionState,
  formData: FormData,
): Promise<TableActionState> {
  await requireBackofficeAuth()
  const parsed = TableSchema.safeParse(readTable(formData))
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors }

  try {
    await db.insert(tables).values({
      label: parsed.data.label,
      capacity: parsed.data.capacity,
      shape: parsed.data.shape,
    })
  } catch {
    return { error: 'No se pudo crear la mesa' }
  }

  revalidatePath('/mesas')
  return { ok: true }
}

export async function updateTable(
  id: string,
  _prev: TableActionState,
  formData: FormData,
): Promise<TableActionState> {
  await requireBackofficeAuth()
  const parsed = TableSchema.safeParse(readTable(formData))
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors }

  try {
    const updated = await db
      .update(tables)
      .set({
        label: parsed.data.label,
        capacity: parsed.data.capacity,
        shape: parsed.data.shape,
      })
      .where(eq(tables.id, id))
      .returning({ id: tables.id })
    if (updated.length === 0) return { error: 'Mesa no encontrada' }
  } catch {
    return { error: 'No se pudo actualizar la mesa' }
  }

  revalidatePath('/mesas')
  return { ok: true }
}

export async function deleteTable(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireBackofficeAuth()
  const res = await deleteTableCore(id)
  if (res.ok) revalidatePath('/mesas')
  return res
}

export async function assignGuest(
  guestId: string,
  tableId: string | null,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireBackofficeAuth()
  const res = await assignGuestCore(guestId, tableId)
  if (res.ok) revalidatePath('/mesas')
  return res
}

export async function setTablePosition(
  id: string,
  x: number,
  y: number,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireBackofficeAuth()
  const res = await setTablePositionCore(id, x, y)
  if (res.ok) revalidatePath('/mesas')
  return res
}
