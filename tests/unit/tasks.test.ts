import { asc, eq } from 'drizzle-orm'
import { beforeEach, describe, expect, it } from 'vitest'

import { moveTaskCore, nextPositionCore } from '@/lib/data/tasks'
import { tasks, type TaskStatus } from '@/lib/db/schema'

import { makeTestDb, type TestDb } from './helpers/db'

let db: TestDb

async function seed() {
  await db.insert(tasks).values([
    { id: 't1', title: 'A', status: 'todo', position: 0 },
    { id: 't2', title: 'B', status: 'todo', position: 1 },
    { id: 't3', title: 'C', status: 'todo', position: 2 },
    { id: 't4', title: 'D', status: 'done', position: 0 },
  ])
}

async function colIds(status: TaskStatus) {
  const rows = await db
    .select({ id: tasks.id, position: tasks.position })
    .from(tasks)
    .where(eq(tasks.status, status))
    .orderBy(asc(tasks.position))
  return rows.map((r) => r.id)
}

/** Positions in a column must be a dense 0..n-1 sequence. */
async function positionsDense(status: TaskStatus) {
  const rows = await db
    .select({ position: tasks.position })
    .from(tasks)
    .where(eq(tasks.status, status))
    .orderBy(asc(tasks.position))
  return rows.map((r) => r.position)
}

beforeEach(async () => {
  db = await makeTestDb()
})

describe('nextPositionCore', () => {
  it('appends after the last card in a column; 0 for an empty column', async () => {
    await seed()
    expect(await nextPositionCore('todo', db)).toBe(3)
    expect(await nextPositionCore('doing', db)).toBe(0)
    expect(await nextPositionCore('done', db)).toBe(1)
  })
})

describe('moveTaskCore', () => {
  it('moves a task to another column at an index and renumbers densely', async () => {
    await seed()
    const res = await moveTaskCore('t1', 'done', 0, db)
    expect(res).toEqual({ ok: true })

    // t1 now leads the done column; t4 follows.
    expect(await colIds('done')).toEqual(['t1', 't4'])
    expect(await positionsDense('done')).toEqual([0, 1])
    // The source column closed its gap.
    expect(await colIds('todo')).toEqual(['t2', 't3'])
    expect(await positionsDense('todo')).toEqual([0, 1])

    const t1 = (await db.select().from(tasks).where(eq(tasks.id, 't1')))[0]
    expect(t1.status).toBe('done')
  })

  it('reorders within the same column', async () => {
    await seed()
    // Move C (index 2) to the front of todo.
    await moveTaskCore('t3', 'todo', 0, db)
    expect(await colIds('todo')).toEqual(['t3', 't1', 't2'])
    expect(await positionsDense('todo')).toEqual([0, 1, 2])
  })

  it('clamps an out-of-range index to the end', async () => {
    await seed()
    await moveTaskCore('t4', 'todo', 999, db)
    expect(await colIds('todo')).toEqual(['t1', 't2', 't3', 't4'])
  })

  it('rejects an invalid status and a missing id', async () => {
    await seed()
    expect(await moveTaskCore('t1', 'nope' as TaskStatus, 0, db)).toEqual({
      ok: false,
      error: 'Estado inválido',
    })
    expect(await moveTaskCore('ghost', 'done', 0, db)).toEqual({
      ok: false,
      error: 'Tarea no encontrada',
    })
  })
})
