import { beforeEach, describe, expect, it } from 'vitest'

import {
  createInvitation,
  regenerateInvitation,
  revokeInvitation,
} from '@/lib/data/invitations'
import { getRsvpView } from '@/lib/data/rsvp'
import { guests } from '@/lib/db/schema'

import { makeTestDb, type TestDb } from './helpers/db'

let db: TestDb

beforeEach(async () => {
  db = await makeTestDb()
  await db
    .insert(guests)
    .values([
      { id: 'g1', name: 'Ana' },
      { id: 'g2', name: 'Beto' },
    ])
})

describe('invitation lifecycle', () => {
  it('creates an invitation that resolves the linked group', async () => {
    const res = await createInvitation(
      { guestIds: ['g1', 'g2'], label: 'Familia' },
      db,
    )
    expect(res.ok).toBe(true)
    if (!res.ok) return
    // 256-bit base64url token is URL-safe and long.
    expect(res.token).toMatch(/^[A-Za-z0-9_-]{43}$/)

    const view = await getRsvpView(res.token, db)
    expect(view.state).toBe('valid')
    if (view.state !== 'valid') return
    expect(view.partySize).toBe(2)
    expect(view.members.map((m) => m.name).sort()).toEqual(['Ana', 'Beto'])
  })

  it('party_size is never fewer than the linked guests', async () => {
    const res = await createInvitation(
      { guestIds: ['g1', 'g2'], partySize: 1 },
      db,
    )
    expect(res.ok).toBe(true)
    if (!res.ok) return
    const view = await getRsvpView(res.token, db)
    if (view.state !== 'valid') throw new Error('expected valid')
    expect(view.partySize).toBe(2)
  })

  it('revoking invalidates the token', async () => {
    const res = await createInvitation({ guestIds: ['g1'] }, db)
    if (!res.ok) return
    expect((await getRsvpView(res.token, db)).state).toBe('valid')

    await revokeInvitation(res.id, db)
    expect(await getRsvpView(res.token, db)).toEqual({ state: 'invalid' })
  })

  it('regenerating invalidates the old token and re-points the group', async () => {
    const first = await createInvitation({ guestIds: ['g1', 'g2'] }, db)
    if (!first.ok) return

    const second = await regenerateInvitation(first.id, db)
    expect(second.ok).toBe(true)
    if (!second.ok) return
    expect(second.token).not.toBe(first.token)

    // Old token is dead; new token resolves the same group.
    expect(await getRsvpView(first.token, db)).toEqual({ state: 'invalid' })
    const view = await getRsvpView(second.token, db)
    expect(view.state).toBe('valid')
    if (view.state !== 'valid') return
    expect(view.members.map((m) => m.name).sort()).toEqual(['Ana', 'Beto'])
  })

  it('rejects creating an invitation with no guests', async () => {
    const res = await createInvitation({ guestIds: [] }, db)
    expect(res.ok).toBe(false)
  })
})
