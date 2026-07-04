import 'server-only'

import { and, asc, eq, ne, sql } from 'drizzle-orm'

import { db } from '@/lib/db'
import { tasks, TASK_STATUSES, type TaskStatus } from '@/lib/db/schema'

/**
 * Kanban task core (U6a). Testable: accepts an explicit `database` (defaults to
 * the shared singleton). The `'use server'` wrappers in actions/tareas.ts add
 * auth + revalidation.
 *
 * `status` is the single source of truth for completion (there is no `done`
 * column). `position` is a 0-based intra-column order; moves renumber the
 * destination column densely so ordering never drifts or collides.
 */

/** Next free position (append to the end) of a column. */
export async function nextPositionCore(
  status: TaskStatus,
  database = db,
): Promise<number> {
  const row = (
    await database
      .select({ max: sql<number>`coalesce(max(${tasks.position}), -1)` })
      .from(tasks)
      .where(eq(tasks.status, status))
  )[0]
  return (row?.max ?? -1) + 1
}

/**
 * Move a task to `status`, inserted at index `position` within that column.
 * The destination column is renumbered 0..n-1 so positions stay dense and
 * unique — this handles both cross-column moves and within-column reorders.
 */
export async function moveTaskCore(
  id: string,
  status: TaskStatus,
  position: number,
  database = db,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!(TASK_STATUSES as readonly string[]).includes(status)) {
    return { ok: false, error: 'Estado inválido' }
  }
  try {
    return await database.transaction(async (tx) => {
      const existing = (
        await tx
          .select({ id: tasks.id, status: tasks.status })
          .from(tasks)
          .where(eq(tasks.id, id))
          .limit(1)
      )[0]
      if (!existing) return { ok: false, error: 'Tarea no encontrada' }
      const fromStatus = existing.status

      // Move into the target column, then rebuild that column's order with the
      // moved task inserted at the requested index.
      await tx.update(tasks).set({ status }).where(eq(tasks.id, id))

      const others = await tx
        .select({ id: tasks.id })
        .from(tasks)
        .where(and(eq(tasks.status, status), ne(tasks.id, id)))
        .orderBy(asc(tasks.position), asc(tasks.createdAt))

      const ids = others.map((o) => o.id)
      const idx = Number.isFinite(position)
        ? Math.max(0, Math.min(ids.length, Math.trunc(position)))
        : ids.length
      ids.splice(idx, 0, id)

      for (let i = 0; i < ids.length; i++) {
        await tx.update(tasks).set({ position: i }).where(eq(tasks.id, ids[i]))
      }

      // Close the gap left in the source column so positions stay dense.
      if (fromStatus !== status) {
        const src = await tx
          .select({ id: tasks.id })
          .from(tasks)
          .where(eq(tasks.status, fromStatus))
          .orderBy(asc(tasks.position), asc(tasks.createdAt))
        for (let i = 0; i < src.length; i++) {
          await tx.update(tasks).set({ position: i }).where(eq(tasks.id, src[i].id))
        }
      }
      return { ok: true }
    })
  } catch {
    return { ok: false, error: 'No se pudo mover la tarea' }
  }
}
