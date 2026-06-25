import { beforeEach, describe, expect, it } from 'vitest'

import { checkRateLimit } from '@/lib/rate-limit'
import { rateLimits } from '@/lib/db/schema'

import { makeTestDb, type TestDb } from './helpers/db'

let db: TestDb

beforeEach(async () => {
  db = await makeTestDb()
})

describe('checkRateLimit (fixed window, libSQL-backed)', () => {
  it('allows up to the limit, then blocks within the window', async () => {
    const results: boolean[] = []
    for (let i = 0; i < 12; i++) {
      results.push((await checkRateLimit('ip:x', 10, 60, db)).ok)
    }
    // First 10 allowed, 11th and 12th blocked.
    expect(results.slice(0, 10).every(Boolean)).toBe(true)
    expect(results[10]).toBe(false)
    expect(results[11]).toBe(false)
  })

  it('keeps separate buckets per key', async () => {
    for (let i = 0; i < 10; i++) await checkRateLimit('ip:a', 10, 60, db)
    // 'ip:a' is now at limit, but 'tok:b' is fresh.
    expect((await checkRateLimit('ip:a', 10, 60, db)).ok).toBe(false)
    expect((await checkRateLimit('tok:b', 10, 60, db)).ok).toBe(true)
  })

  it('resets once the window has elapsed', async () => {
    // windowSecs = 0 means every call starts a new window → always allowed.
    for (let i = 0; i < 5; i++) {
      expect((await checkRateLimit('ip:reset', 1, 0, db)).ok).toBe(true)
    }
  })

  it('resets a maxed-out bucket whose window is already in the past', async () => {
    // Seed a bucket at the limit but with a stale window (2 min ago, window 60s).
    await db.insert(rateLimits).values({
      key: 'ip:stale',
      count: 99,
      windowStart: new Date(Date.now() - 120_000),
    })
    // Next call falls outside the window → resets to 1 → allowed.
    expect((await checkRateLimit('ip:stale', 10, 60, db)).ok).toBe(true)
  })
})
