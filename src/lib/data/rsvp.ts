import 'server-only'

import { eq } from 'drizzle-orm'

import { db } from '@/lib/db'
import {
  guests,
  inviteTokens,
  tokenGuests,
  type RsvpStatus,
} from '@/lib/db/schema'
import { isInviteValid } from '@/lib/tokens'

/**
 * Public RSVP data layer (U2.1). The browser never touches the DB — these
 * server functions ARE the security boundary (there is no RLS). Both accept an
 * explicit `database` (defaults to the shared singleton) so the security
 * guarantees can be unit-tested against an in-memory libSQL.
 */

/** A group member as seen on the PUBLIC surface — column allowlist, no PII. */
export type RsvpMember = {
  id: string
  name: string
  rsvpStatus: RsvpStatus
  plusOne: boolean
  plusOneName: string | null
}

export type RsvpView =
  | {
      state: 'valid'
      partySize: number
      message: string | null
      members: RsvpMember[]
    }
  // Non-existent, revoked, and expired all return the SAME shape — no oracle.
  | { state: 'invalid' }

/**
 * Resolve a public invitation by its token, returning ONLY safe columns.
 *
 * The projection is at the QUERY level (`db.select({...})` with a literal
 * allowlist), so prohibited columns — `notes`, `phone`, `email`, `household`,
 * `last_modified_source`, timestamps — are never read from the DB and cannot
 * leak by serialization. (A `select *` + omit-in-JS would re-leak the moment a
 * column is added.)
 */
export async function getRsvpView(
  token: string,
  database = db,
): Promise<RsvpView> {
  const tk = (
    await database
      .select({
        id: inviteTokens.id,
        partySize: inviteTokens.partySize,
        status: inviteTokens.status,
        expiresAt: inviteTokens.expiresAt,
        message: inviteTokens.message,
      })
      .from(inviteTokens)
      .where(eq(inviteTokens.token, token))
      .limit(1)
  )[0]

  if (!tk || !isInviteValid(tk)) return { state: 'invalid' }

  const members = await database
    .select({
      id: guests.id,
      name: guests.name,
      rsvpStatus: guests.rsvpStatus,
      plusOne: guests.plusOne,
      plusOneName: guests.plusOneName,
    })
    .from(tokenGuests)
    .innerJoin(guests, eq(tokenGuests.guestId, guests.id))
    .where(eq(tokenGuests.tokenId, tk.id))

  return {
    state: 'valid',
    partySize: tk.partySize,
    message: tk.message,
    members,
  }
}

export type RsvpMemberInput = {
  guestId: string
  rsvpStatus: RsvpStatus
  plusOneName?: string | null
}

export type ApplyRsvpInput = {
  token: string
  members: RsvpMemberInput[]
  message?: string | null
}

export type ApplyRsvpResult = { ok: true } | { ok: false; error: string }

/**
 * Apply an RSVP submission, scoped to the token's own guest rows and to the
 * guest-writable column allowlist, atomically.
 *
 * Guarantees:
 *  - token re-validated here (closes the read→write TOCTOU);
 *  - every submitted `guestId` must belong to this token, else the WHOLE op is
 *    rejected and nothing is written (no cross-group writes);
 *  - only `rsvp_status` / `plus_one_name` are written, each as a
 *    LITERAL key in `.set()` (the guest can't write `notes`/`household`/`name`/
 *    contact columns even by injecting keys);
 *  - `plus_one` is a host-granted capability, RE-READ from the DB and never
 *    written — a guest can't grant themselves a +1; `plus_one_name` is dropped
 *    if the row isn't +1-capable;
 *  - every write stamps `last_modified_source = 'guest'`;
 *  - all member updates + the message run in ONE `db.transaction` (atomic: a
 *    CHECK violation rolls the whole transaction back).
 */
export async function applyRsvp(
  input: ApplyRsvpInput,
  database = db,
): Promise<ApplyRsvpResult> {
  // An empty members list is allowed: the guest may only be (re)writing the
  // group message. Untouched members are intentionally NOT submitted, so they
  // keep whatever the host set — never clobbered to null.
  const tk = (
    await database
      .select({
        id: inviteTokens.id,
        status: inviteTokens.status,
        expiresAt: inviteTokens.expiresAt,
      })
      .from(inviteTokens)
      .where(eq(inviteTokens.token, input.token))
      .limit(1)
  )[0]

  if (!tk || !isInviteValid(tk)) {
    return { ok: false, error: 'Invitación no válida' }
  }

  // The set of guest rows this token is allowed to touch.
  const allowed = await database
    .select({ guestId: tokenGuests.guestId, plusOne: guests.plusOne })
    .from(tokenGuests)
    .innerJoin(guests, eq(tokenGuests.guestId, guests.id))
    .where(eq(tokenGuests.tokenId, tk.id))

  const capable = new Map(allowed.map((a) => [a.guestId, a.plusOne]))

  // Any out-of-scope guestId aborts the entire operation — nothing is written.
  for (const m of input.members) {
    if (!capable.has(m.guestId)) {
      return { ok: false, error: 'Datos fuera del alcance de la invitación' }
    }
  }

  try {
    await database.transaction(async (tx) => {
      for (const m of input.members) {
        await tx
          .update(guests)
          .set({
            rsvpStatus: m.rsvpStatus,
            // plus_one is host-granted: only keep a +1 name if the row is capable.
            plusOneName: capable.get(m.guestId)
              ? (m.plusOneName?.trim() ? m.plusOneName.trim() : null)
              : null,
            lastModifiedSource: 'guest',
          })
          .where(eq(guests.id, m.guestId))
      }
      // Always (re)write the group message — even with no members submitted.
      await tx
        .update(inviteTokens)
        .set({ message: input.message?.trim() ? input.message.trim() : null })
        .where(eq(inviteTokens.id, tk.id))
    })
  } catch {
    return { ok: false, error: 'No se pudo guardar la confirmación' }
  }

  return { ok: true }
}
