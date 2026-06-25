import { beforeEach, describe, expect, it } from 'vitest'

import { applyRsvp, getRsvpView } from '@/lib/data/rsvp'
import { guests, inviteTokens, tokenGuests } from '@/lib/db/schema'

import { makeTestDb, type TestDb } from './helpers/db'

let db: TestDb

/** Seed a group invitation of two guests and return ids + token. */
async function seedGroup(opts?: {
  status?: 'valido' | 'revocado'
  expiresAt?: Date | null
  token?: string
}) {
  const token = opts?.token ?? 'tok_group_secret'
  const tokenId = 'tk1'
  const [a, b] = ['guest_a', 'guest_b']

  await db.insert(guests).values([
    {
      id: a,
      name: 'Ana',
      email: 'ana@example.com',
      phone: '809-555-0001',
      notes: 'VIP, sienta cerca de la pista',
      household: 'Pérez',
      menu: 'carne',
      plusOne: true,
    },
    {
      id: b,
      name: 'Beto',
      email: 'beto@example.com',
      notes: 'alérgico declarado por el host',
      plusOne: false,
    },
  ])
  await db.insert(inviteTokens).values({
    id: tokenId,
    token,
    partySize: 2,
    status: opts?.status ?? 'valido',
    expiresAt: opts?.expiresAt ?? null,
  })
  await db.insert(tokenGuests).values([
    { tokenId, guestId: a },
    { tokenId, guestId: b },
  ])
  return { token, tokenId, a, b }
}

beforeEach(async () => {
  db = await makeTestDb()
})

describe('getRsvpView (projected public read)', () => {
  it('returns ONLY the safe column allowlist — never other members PII', async () => {
    const { token } = await seedGroup()
    const view = await getRsvpView(token, db)

    expect(view.state).toBe('valid')
    if (view.state !== 'valid') return
    expect(view.partySize).toBe(2)
    expect(view.members).toHaveLength(2)

    const allowed = ['id', 'name', 'rsvpStatus', 'menu', 'plusOne', 'plusOneName']
    for (const m of view.members) {
      // The query projection must not have grown a prohibited column.
      expect(Object.keys(m).sort()).toEqual([...allowed].sort())
      for (const banned of ['email', 'phone', 'notes', 'household', 'lastModifiedSource']) {
        expect(banned in m).toBe(false)
      }
    }
  })

  it('returns the SAME {state:invalid} for missing, revoked and expired — no oracle', async () => {
    const missing = await getRsvpView('does-not-exist', db)
    expect(missing).toEqual({ state: 'invalid' })

    db = await makeTestDb()
    const { token: revokedToken } = await seedGroup({ status: 'revocado', token: 't_revoked' })
    expect(await getRsvpView(revokedToken, db)).toEqual({ state: 'invalid' })

    db = await makeTestDb()
    const past = new Date(Date.now() - 86_400_000)
    const { token: expiredToken } = await seedGroup({ expiresAt: past, token: 't_expired' })
    expect(await getRsvpView(expiredToken, db)).toEqual({ state: 'invalid' })
  })
})

describe('applyRsvp (scoped atomic write)', () => {
  it('writes only guest-writable columns and stamps source=guest', async () => {
    const { token, a } = await seedGroup()
    const res = await applyRsvp(
      { token, members: [{ guestId: a, rsvpStatus: 'confirmed', menu: 'pescado' }], message: '¡Allí estaremos!' },
      db,
    )
    expect(res).toEqual({ ok: true })

    const ana = (await db.select().from(guests)).find((g) => g.id === a)!
    expect(ana.rsvpStatus).toBe('confirmed')
    expect(ana.menu).toBe('pescado')
    expect(ana.lastModifiedSource).toBe('guest')
    // Host-managed columns untouched.
    expect(ana.notes).toBe('VIP, sienta cerca de la pista')
    expect(ana.name).toBe('Ana')
    expect(ana.email).toBe('ana@example.com')

    const tk = (await db.select().from(inviteTokens)).find((t) => t.token === token)!
    expect(tk.message).toBe('¡Allí estaremos!')
  })

  it('rejects a guestId outside the token and writes NOTHING', async () => {
    const { token, a } = await seedGroup()
    // Foreign guest belonging to no token.
    await db.insert(guests).values({ id: 'intruder', name: 'Intruso' })

    const res = await applyRsvp(
      {
        token,
        members: [
          { guestId: a, rsvpStatus: 'confirmed' },
          { guestId: 'intruder', rsvpStatus: 'confirmed' },
        ],
      },
      db,
    )
    expect(res.ok).toBe(false)

    // The legitimate member was NOT written either (whole op aborted).
    const all = await db.select().from(guests)
    expect(all.find((g) => g.id === a)!.rsvpStatus).toBe('pending')
    expect(all.find((g) => g.id === 'intruder')!.rsvpStatus).toBe('pending')
  })

  it('ignores plusOneName when the row is not +1-capable; keeps it when it is', async () => {
    const { token, a, b } = await seedGroup() // a: plusOne=true, b: plusOne=false
    await applyRsvp(
      {
        token,
        members: [
          { guestId: a, rsvpStatus: 'confirmed', plusOneName: 'Carla' },
          { guestId: b, rsvpStatus: 'confirmed', plusOneName: 'Intento de colado' },
        ],
      },
      db,
    )
    const all = await db.select().from(guests)
    expect(all.find((g) => g.id === a)!.plusOneName).toBe('Carla')
    // b can't grant itself a +1.
    expect(all.find((g) => g.id === b)!.plusOneName).toBeNull()
  })

  it('is atomic: a DB-level CHECK violation reverts the whole batch', async () => {
    const { token, a, b } = await seedGroup()
    const res = await applyRsvp(
      {
        token,
        members: [
          { guestId: a, rsvpStatus: 'confirmed' },
          // Bypasses Zod (calling applyRsvp directly) → violates the CHECK.
          { guestId: b, rsvpStatus: 'no-es-un-estado' as never },
        ],
      },
      db,
    )
    expect(res.ok).toBe(false)
    // Neither member changed.
    const all = await db.select().from(guests)
    expect(all.find((g) => g.id === a)!.rsvpStatus).toBe('pending')
    expect(all.find((g) => g.id === b)!.rsvpStatus).toBe('pending')
  })

  it('rejects writes against a revoked token', async () => {
    db = await makeTestDb()
    const { token, a } = await seedGroup({ status: 'revocado' })
    const res = await applyRsvp(
      { token, members: [{ guestId: a, rsvpStatus: 'confirmed' }] },
      db,
    )
    expect(res.ok).toBe(false)
    expect((await db.select().from(guests)).find((g) => g.id === a)!.rsvpStatus).toBe('pending')
  })

  it('rejects writes against an expired token', async () => {
    db = await makeTestDb()
    const past = new Date(Date.now() - 86_400_000)
    const { token, a } = await seedGroup({ expiresAt: past })
    const res = await applyRsvp(
      { token, members: [{ guestId: a, rsvpStatus: 'confirmed' }] },
      db,
    )
    expect(res.ok).toBe(false)
    expect((await db.select().from(guests)).find((g) => g.id === a)!.rsvpStatus).toBe('pending')
  })
})
