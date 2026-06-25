'use server'

import 'server-only'

import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { db } from '@/lib/db'
import { tables } from '@/lib/db/schema'
import { assignGuestCore, deleteTableCore } from '@/lib/data/seating'

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
  return {
    label: typeof label === 'string' ? label.trim() : '',
    capacity: typeof capacity === 'string' ? capacity : '',
  }
}

export async function createTable(
  _prev: TableActionState,
  formData: FormData,
): Promise<TableActionState> {
  const parsed = TableSchema.safeParse(readTable(formData))
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors }

  try {
    await db.insert(tables).values({
      label: parsed.data.label,
      capacity: parsed.data.capacity,
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
  const parsed = TableSchema.safeParse(readTable(formData))
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors }

  try {
    const updated = await db
      .update(tables)
      .set({ label: parsed.data.label, capacity: parsed.data.capacity })
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
  const res = await deleteTableCore(id)
  if (res.ok) revalidatePath('/mesas')
  return res
}

export async function assignGuest(
  guestId: string,
  tableId: string | null,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const res = await assignGuestCore(guestId, tableId)
  if (res.ok) revalidatePath('/mesas')
  return res
}
