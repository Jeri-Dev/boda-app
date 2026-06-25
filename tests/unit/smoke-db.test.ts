import { describe, expect, it } from 'vitest'

import { guests } from '@/lib/db/schema'

import { makeTestDb } from './helpers/db'

describe('in-memory test db', () => {
  it('applies migrations and round-trips a guest', async () => {
    const db = await makeTestDb()
    await db.insert(guests).values({ name: 'Ana' })
    const rows = await db.select().from(guests)
    expect(rows).toHaveLength(1)
    expect(rows[0].name).toBe('Ana')
    expect(rows[0].rsvpStatus).toBe('pending')
  })
})
