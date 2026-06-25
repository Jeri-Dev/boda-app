import 'server-only'

import { eq } from 'drizzle-orm'

import { db } from '@/lib/db'
import { guests, tables } from '@/lib/db/schema'

/**
 * Seating core (U3.1). Testable: accepts an explicit `database` (defaults to the
 * shared singleton). The `'use server'` wrappers in actions/mesas.ts add
 * revalidation.
 *
 * `guests.table_id` is a SOFT ref: deleting a table nulls its guests'
 * `table_id` (so they become "sin sentar"), never deletes guests. Assignment is
 * a plain update; capacity is a soft constraint checked on read, not enforced
 * here.
 */

/**
 * Persist a table's floor-plan position (U3.2). Coordinates are clamped to a
 * sane canvas range so a bad client can't store absurd values. Idempotent;
 * called debounced on drag-end.
 */
export async function setTablePositionCore(
  id: string,
  x: number,
  y: number,
  database = db,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    return { ok: false, error: 'Posición inválida' }
  }
  const clamp = (n: number) => Math.max(0, Math.min(10_000, Math.round(n)))
  try {
    const updated = await database
      .update(tables)
      .set({ posX: clamp(x), posY: clamp(y) })
      .where(eq(tables.id, id))
      .returning({ id: tables.id })
    if (updated.length === 0) return { ok: false, error: 'Mesa no encontrada' }
  } catch {
    return { ok: false, error: 'No se pudo guardar la posición' }
  }
  return { ok: true }
}

export async function deleteTableCore(
  id: string,
  database = db,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const [, deleted] = await database.batch([
      database.update(guests).set({ tableId: null }).where(eq(guests.tableId, id)),
      database.delete(tables).where(eq(tables.id, id)).returning({ id: tables.id }),
    ])
    if (deleted.length === 0) return { ok: false, error: 'Mesa no encontrada' }
  } catch {
    return { ok: false, error: 'No se pudo eliminar la mesa' }
  }
  return { ok: true }
}

/**
 * Seat a guest at a table (or unseat with `tableId = null`). When a target table
 * is given, the guest's row is only updated if the table actually exists (a
 * stale id from a concurrent delete is rejected rather than creating a dangling
 * ref).
 */
export async function assignGuestCore(
  guestId: string,
  tableId: string | null,
  database = db,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    if (tableId !== null) {
      const exists = (
        await database.select({ id: tables.id }).from(tables).where(eq(tables.id, tableId)).limit(1)
      )[0]
      if (!exists) return { ok: false, error: 'Mesa no encontrada' }
    }
    const updated = await database
      .update(guests)
      .set({ tableId })
      .where(eq(guests.id, guestId))
      .returning({ id: guests.id })
    if (updated.length === 0) return { ok: false, error: 'Invitado no encontrado' }
  } catch {
    return { ok: false, error: 'No se pudo asignar el invitado' }
  }
  return { ok: true }
}
