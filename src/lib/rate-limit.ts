import 'server-only'

import { lt, sql } from 'drizzle-orm'

import { db } from '@/lib/db'
import { rateLimits } from '@/lib/db/schema'

/**
 * Fixed-window rate limit backed by the Postgres `rate_limits` table (the DB is
 * the shared store across serverless invocations — an in-memory Map would be
 * fail-open useless on serverless).
 *
 * Atomic via a single UPSERT with `RETURNING`: the count is incremented (or
 * reset, if the window expired) in one statement, so concurrent invocations
 * can't race a read-then-write.
 *
 * FAIL-OPEN by design: if the store query throws, the request is allowed. This
 * is acceptable because the 256-bit token is the primary defense against
 * enumeration; the rate limit is secondary (anti-spam).
 *
 * Row growth is bounded by `pruneRateLimits`, called opportunistically from the
 * public RSVP action (each distinct `tok:`/`ip:` key would otherwise leave a
 * stale row once its window passes).
 *
 * @param key   bucket key, e.g. `ip:<sha256>` or `tok:<tokenId>`
 * @param limit max requests per window
 * @param windowSecs window length in seconds
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowSecs: number,
  database = db,
): Promise<{ ok: boolean }> {
  // Second-granularity, kept from the SQLite version; `window_start` is now a
  // `timestamptz`, so we compare against Date values (not unix ints).
  const nowSec = Math.floor(Date.now() / 1000)
  const now = new Date(nowSec * 1000)
  const threshold = new Date((nowSec - windowSecs) * 1000)

  try {
    const rows = await database
      .insert(rateLimits)
      .values({ key, count: 1, windowStart: now })
      .onConflictDoUpdate({
        target: rateLimits.key,
        set: {
          // Window expired → reset to 1; otherwise increment.
          count: sql`case when ${rateLimits.windowStart} <= ${threshold} then 1 else ${rateLimits.count} + 1 end`,
          windowStart: sql`case when ${rateLimits.windowStart} <= ${threshold} then ${now} else ${rateLimits.windowStart} end`,
        },
      })
      .returning({ count: rateLimits.count })

    const count = rows[0]?.count ?? 1
    return { ok: count <= limit }
  } catch {
    return { ok: true } // fail-open
  }
}

/**
 * Best-effort GC of expired rate-limit rows (windows older than `olderThanSecs`,
 * which should exceed the longest active window so live buckets are never
 * pruned). Safe to call opportunistically; failures are swallowed.
 */
export async function pruneRateLimits(
  olderThanSecs: number,
  database = db,
): Promise<void> {
  try {
    const cutoff = new Date(Date.now() - olderThanSecs * 1000)
    await database.delete(rateLimits).where(lt(rateLimits.windowStart, cutoff))
  } catch {
    /* best-effort */
  }
}
