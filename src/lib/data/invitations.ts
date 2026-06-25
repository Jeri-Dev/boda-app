import 'server-only'

import { randomUUID } from 'node:crypto'

import { eq } from 'drizzle-orm'

import { db } from '@/lib/db'
import {
  guests,
  inviteTokens,
  tokenGuests,
  type InviteStatus,
} from '@/lib/db/schema'
import { newInviteToken } from '@/lib/tokens'

/** Back-office view of an invitation, with its linked guests. */
export type InvitationRow = {
  id: string
  token: string
  label: string | null
  partySize: number
  status: InviteStatus
  members: { id: string; name: string }[]
}

export async function listInvitations(database = db): Promise<InvitationRow[]> {
  const tokens = await database
    .select({
      id: inviteTokens.id,
      token: inviteTokens.token,
      label: inviteTokens.label,
      partySize: inviteTokens.partySize,
      status: inviteTokens.status,
      createdAt: inviteTokens.createdAt,
    })
    .from(inviteTokens)
    .orderBy(inviteTokens.createdAt)

  const links = await database
    .select({
      tokenId: tokenGuests.tokenId,
      id: guests.id,
      name: guests.name,
    })
    .from(tokenGuests)
    .innerJoin(guests, eq(tokenGuests.guestId, guests.id))

  const byToken = new Map<string, { id: string; name: string }[]>()
  for (const l of links) {
    const arr = byToken.get(l.tokenId) ?? []
    arr.push({ id: l.id, name: l.name })
    byToken.set(l.tokenId, arr)
  }

  return tokens
    .map((t) => ({
      id: t.id,
      token: t.token,
      label: t.label,
      partySize: t.partySize,
      status: t.status,
      members: byToken.get(t.id) ?? [],
    }))
    // Newest first.
    .reverse()
}

/**
 * Invitation management core (U2.1). Testable: accepts an explicit `database`
 * (defaults to the shared singleton). The thin `'use server'` wrappers in
 * actions/tokens.ts add `revalidatePath`.
 */

export type CreateInvitationResult =
  | { ok: true; id: string; token: string }
  | { ok: false; error: string }

export async function createInvitation(
  args: {
    guestIds: string[]
    partySize?: number
    label?: string
    expiresAt?: Date | null
  },
  database = db,
): Promise<CreateInvitationResult> {
  const guestIds = [...new Set(args.guestIds)].filter(Boolean)
  if (guestIds.length === 0) {
    return { ok: false, error: 'Selecciona al menos un invitado' }
  }
  // party_size is the headcount the invitation covers; never fewer than linked.
  const partySize = Math.max(args.partySize ?? guestIds.length, guestIds.length)

  const id = randomUUID()
  const token = newInviteToken()

  const ops = [
    database.insert(inviteTokens).values({
      id,
      token,
      partySize,
      label: args.label?.trim() || null,
      expiresAt: args.expiresAt ?? null,
    }),
    ...guestIds.map((guestId) =>
      database.insert(tokenGuests).values({ tokenId: id, guestId }),
    ),
  ]

  try {
    await database.batch(ops as [(typeof ops)[number], ...typeof ops])
  } catch {
    return { ok: false, error: 'No se pudo crear la invitación' }
  }

  return { ok: true, id, token }
}

export async function revokeInvitation(
  id: string,
  database = db,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const updated = await database
      .update(inviteTokens)
      .set({ status: 'revocado' })
      .where(eq(inviteTokens.id, id))
      .returning({ id: inviteTokens.id })
    if (updated.length === 0) {
      return { ok: false, error: 'Invitación no encontrada' }
    }
  } catch {
    return { ok: false, error: 'No se pudo revocar la invitación' }
  }
  return { ok: true }
}

/**
 * Regenerate a token: issue a new one re-pointing the same guest links and
 * revoke the old, atomically — invalidates the previous link without touching
 * `guests` (preserves host/guest trazabilidad).
 */
export async function regenerateInvitation(
  id: string,
  database = db,
): Promise<CreateInvitationResult> {
  const old = (
    await database
      .select()
      .from(inviteTokens)
      .where(eq(inviteTokens.id, id))
      .limit(1)
  )[0]
  if (!old) return { ok: false, error: 'Invitación no encontrada' }

  const newId = randomUUID()
  const token = newInviteToken()

  try {
    await database.batch([
      database.insert(inviteTokens).values({
        id: newId,
        token,
        partySize: old.partySize,
        label: old.label,
        expiresAt: old.expiresAt,
      }),
      database
        .update(tokenGuests)
        .set({ tokenId: newId })
        .where(eq(tokenGuests.tokenId, id)),
      database
        .update(inviteTokens)
        .set({ status: 'revocado' })
        .where(eq(inviteTokens.id, id)),
    ])
  } catch {
    return { ok: false, error: 'No se pudo regenerar la invitación' }
  }

  return { ok: true, id: newId, token }
}
