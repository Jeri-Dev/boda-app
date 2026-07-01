'use server'

import 'server-only'

import { revalidatePath } from 'next/cache'

import { requireBackofficeAuth } from '@/lib/auth/backoffice'
import {
  createInvitation as createInvitationCore,
  regenerateInvitation as regenerateInvitationCore,
  revokeInvitation as revokeInvitationCore,
  type CreateInvitationResult,
} from '@/lib/data/invitations'

/**
 * Back-office invitation Server Actions (U2.1). Open app (no auth gate). Thin
 * wrappers over the testable core in data/invitations.ts, adding revalidation.
 */

export async function createInvitation(args: {
  guestIds: string[]
  partySize?: number
  label?: string
  expiresAt?: Date | null
}): Promise<CreateInvitationResult> {
  await requireBackofficeAuth()
  const res = await createInvitationCore(args)
  if (res.ok) revalidatePath('/invitaciones')
  return res
}

export async function revokeInvitation(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireBackofficeAuth()
  const res = await revokeInvitationCore(id)
  if (res.ok) revalidatePath('/invitaciones')
  return res
}

export async function regenerateInvitation(
  id: string,
): Promise<CreateInvitationResult> {
  await requireBackofficeAuth()
  const res = await regenerateInvitationCore(id)
  if (res.ok) revalidatePath('/invitaciones')
  return res
}
