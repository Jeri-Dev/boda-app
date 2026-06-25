import { randomBytes } from 'node:crypto'

/**
 * Invitation-token helpers (U2.1).
 *
 * The token is a bearer SECRET, NOT an id: 256 bits of entropy encoded
 * URL-safe (base64url → 43 chars, no `+/=` to escape in `/i/[token]`). This is
 * the PRIMARY defense against enumeration — 2^256 is not brute-forceable; the
 * rate-limit is only secondary.
 */
export function newInviteToken(): string {
  return randomBytes(32).toString('base64url')
}

/**
 * Validity is COMPUTED, never read from a persisted "expired" flag (which would
 * drift without a cron): valid = status 'valido' AND not past `expiresAt`
 * (NULL = never expires). Reused by both the public read and the public write
 * so they can't disagree (closes the read→write TOCTOU window).
 */
export function isInviteValid(
  tk: { status: string; expiresAt: Date | null },
  now: Date = new Date(),
): boolean {
  return tk.status === 'valido' && (tk.expiresAt == null || tk.expiresAt > now)
}
