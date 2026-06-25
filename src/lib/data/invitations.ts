import 'server-only'

import { randomUUID } from 'node:crypto'

import { eq } from 'drizzle-orm'

import { db } from '@/lib/db'
import { inviteTokens, tokenGuests } from '@/lib/db/schema'
import { newInviteToken } from '@/lib/tokens'

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
