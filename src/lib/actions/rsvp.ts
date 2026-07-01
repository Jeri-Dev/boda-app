'use server'

import 'server-only'

import { createHash } from 'node:crypto'

import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { z } from 'zod'

import { applyRsvp } from '@/lib/data/rsvp'
import { RSVP_STATUSES } from '@/lib/db/schema'
import { checkRateLimit, pruneRateLimits } from '@/lib/rate-limit'

/**
 * Public RSVP Server Action (U2.1). NO auth (public surface). Pipeline:
 * honeypot → rate-limit (IP + token) → Zod `.strict()` → `applyRsvp` (scoped,
 * atomic) → revalidate.
 */

export type RsvpActionState =
  | { ok?: true; error?: string }
  | undefined

const MemberSchema = z
  .object({
    guestId: z.string().min(1).max(64),
    rsvpStatus: z.enum(RSVP_STATUSES),
    menu: z.string().trim().max(120, 'Máximo 120 caracteres').optional(),
    plusOneName: z.string().trim().max(160, 'Máximo 160 caracteres').optional(),
  })
  .strict() // unknown keys (notes/household/name/…) are rejected outright

const PayloadSchema = z
  .object({
    // May be empty: the guest can submit only the group message, and untouched
    // members are intentionally not posted (so their host-set data is kept).
    members: z.array(MemberSchema).max(20),
    message: z.string().trim().max(2000, 'Máximo 2000 caracteres').optional(),
  })
  .strict()

/**
 * Client IP for rate-limiting, hashed (SHA-256) for data minimization. Reads the
 * platform's TRUSTED hop — on Netlify that is `x-nf-client-connection-ip` (set by
 * the edge, not client-controllable); `x-real-ip` is a secondary fallback. NEVER
 * the leftmost `x-forwarded-for` (client-injected → spoofable, would let an
 * attacker rotate the value and empty the per-IP bucket). If no trusted header is
 * present (local dev / outside the Netlify edge), everything shares the `unknown`
 * bucket — acceptable there; in production the Netlify header is always set. The
 * per-token bucket is the other, always-available limit.
 */
async function clientIpHash(): Promise<string> {
  try {
    const h = await headers()
    const ip =
      h.get('x-nf-client-connection-ip') ?? h.get('x-real-ip') ?? 'unknown'
    return createHash('sha256').update(ip).digest('hex')
  } catch {
    return 'unknown'
  }
}

export async function submitRsvp(
  token: string,
  _prev: RsvpActionState,
  formData: FormData,
): Promise<RsvpActionState> {
  // Honeypot: a bot fills the hidden `website` field. Pretend success, write
  // nothing, never reveal the trap.
  if ((formData.get('website') as string)?.trim()) {
    return { ok: true }
  }

  // Opportunistic GC so the rate_limits table can't grow unbounded (rows older
  // than 1h are long past any active window). ~5% of submissions.
  if (Math.random() < 0.05) await pruneRateLimits(3600)

  // Rate-limit: per token (non-spoofable) and per trusted IP. Generous limits —
  // the token entropy is the real defense; this is anti-spam.
  const ipHash = await clientIpHash()
  const [ipLimit, tokenLimit] = await Promise.all([
    checkRateLimit(`ip:${ipHash}`, 10, 60),
    checkRateLimit(`tok:${token}`, 20, 600),
  ])
  if (!ipLimit.ok || !tokenLimit.ok) {
    return { error: 'Demasiados intentos. Inténtalo de nuevo en un momento.' }
  }

  let members: unknown
  try {
    members = JSON.parse((formData.get('members') as string) ?? '[]')
  } catch {
    return { error: 'Datos inválidos' }
  }

  const parsed = PayloadSchema.safeParse({
    members,
    message: (formData.get('message') as string) ?? undefined,
  })
  if (!parsed.success) {
    return { error: 'Revisa los datos del formulario' }
  }

  const result = await applyRsvp({
    token,
    members: parsed.data.members,
    message: parsed.data.message ?? null,
  })
  if (!result.ok) return { error: result.error }

  revalidatePath('/invitados')
  return { ok: true }
}
