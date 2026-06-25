import { beforeEach, describe, expect, it } from 'vitest'

import { assignGuestCore, deleteTableCore } from '@/lib/data/seating'
import { guests, tables } from '@/lib/db/schema'

import { makeTestDb, type TestDb } from './helpers/db'

let db: TestDb

beforeEach(async () => {
  db = await makeTestDb()
  await db.insert(tables).values([
    { id: 't1', label: 'Mesa 1', capacity: 4 },
    { id: 't2', label: 'Mesa 2', capacity: 4 },
  ])
  await db.insert(guests).values([
    { id: 'g1', name: 'Ana', tableId: 't1' },
    { id: 'g2', name: 'Beto', tableId: 't1' },
    { id: 'g3', name: 'Carla', tableId: null },
  ])
})

describe('assignGuestCore', () => {
  it('seats and unseats a guest', async () => {
    expect((await assignGuestCore('g3', 't2', db)).ok).toBe(true)
    expect((await db.select().from(guests)).find((g) => g.id === 'g3')!.tableId).toBe('t2')

    expect((await assignGuestCore('g3', null, db)).ok).toBe(true)
    expect((await db.select().from(guests)).find((g) => g.id === 'g3')!.tableId).toBeNull()
  })

  it('rejects a non-existent table (no dangling ref)', async () => {
    const res = await assignGuestCore('g3', 'no-existe', db)
    expect(res.ok).toBe(false)
    expect((await db.select().from(guests)).find((g) => g.id === 'g3')!.tableId).toBeNull()
  })
})

describe('deleteTableCore', () => {
  it('unseats its guests and deletes the table — never the guests', async () => {
    const res = await deleteTableCore('t1', db)
    expect(res.ok).toBe(true)

    // Table gone.
    expect((await db.select().from(tables)).some((t) => t.id === 't1')).toBe(false)
    // Guests survive, now unseated.
    const all = await db.select().from(guests)
    expect(all).toHaveLength(3)
    expect(all.find((g) => g.id === 'g1')!.tableId).toBeNull()
    expect(all.find((g) => g.id === 'g2')!.tableId).toBeNull()
  })

  it('returns not-found for a missing table', async () => {
    expect((await deleteTableCore('nope', db)).ok).toBe(false)
  })
})
