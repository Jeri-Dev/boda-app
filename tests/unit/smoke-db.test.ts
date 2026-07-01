import { eq } from 'drizzle-orm'
import { describe, expect, it } from 'vitest'

import {
  budgetCategories,
  guests,
  inviteTokens,
  payments,
  tokenGuests,
  vendors,
} from '@/lib/db/schema'

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

/**
 * The real FKs the delete actions now rely on (deleteVendor/deleteCategory ->
 * `set null`, deleteGuest -> `cascade`). Those actions use the non-injectable
 * `db` singleton, so their delete paths are otherwise untested; assert the FK
 * behavior directly here.
 */
describe('referential integrity (delete-action FKs)', () => {
  it('deleting a vendor nulls its payments’ vendor_id (payment kept)', async () => {
    const db = await makeTestDb()
    await db.insert(vendors).values({ id: 'v1', name: 'Catering' })
    await db
      .insert(payments)
      .values({ id: 'p1', concept: 'Anticipo', vendorId: 'v1' })

    await db.delete(vendors).where(eq(vendors.id, 'v1'))

    const [p] = await db.select().from(payments).where(eq(payments.id, 'p1'))
    expect(p).toBeDefined()
    expect(p.vendorId).toBeNull()
  })

  it('deleting a category nulls its payments’ category_id (payment kept)', async () => {
    const db = await makeTestDb()
    await db.insert(budgetCategories).values({ id: 'c1', name: 'Comida' })
    await db
      .insert(payments)
      .values({ id: 'p1', concept: 'Anticipo', categoryId: 'c1' })

    await db.delete(budgetCategories).where(eq(budgetCategories.id, 'c1'))

    const [p] = await db.select().from(payments).where(eq(payments.id, 'p1'))
    expect(p).toBeDefined()
    expect(p.categoryId).toBeNull()
  })

  it('deleting a guest cascades away its token_guests bridge rows', async () => {
    const db = await makeTestDb()
    await db.insert(guests).values({ id: 'g1', name: 'Ana' })
    await db
      .insert(inviteTokens)
      .values({ id: 't1', token: 'x'.repeat(43) })
    await db.insert(tokenGuests).values({ tokenId: 't1', guestId: 'g1' })

    await db.delete(guests).where(eq(guests.id, 'g1'))

    const bridge = await db.select().from(tokenGuests)
    expect(bridge).toHaveLength(0)
    // The token itself is untouched.
    const [tok] = await db.select().from(inviteTokens)
    expect(tok.id).toBe('t1')
  })
})
