import 'server-only'

import { sql } from 'drizzle-orm'

import { db } from '@/lib/db'
import { rateLimits } from '@/lib/db/schema'

/**
 * Fixed-window rate limit backed by the libSQL `rate_limits` table (libSQL is
 * the shared store across serverless invocations — an in-memory Map would be
 * fail-open useless on Vercel).
 *
 * Atomic via a single UPSERT with `RETURNING`: the count is incremented (or
 * reset, if the window expired) in one statement, so concurrent invocations
 * can't race a read-then-write.
 *
 * FAIL-OPEN by design: if the store query throws, the request is allowed. This
 * is acceptable because the 256-bit token is the primary defense against
 * enumeration; the rate limit is secondary (anti-spam).
 *
 * TODO(U2.2): the table has no TTL — each distinct `tok:`/`ip:` key inserts a
 * row. Add a GC (delete where `window_start < now - maxWindow`) when the
 * `/i/[token]` route is wired and a cleanup cadence exists. Negligible at a
 * single-wedding scale; not route-reachable yet.
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
  const nowSec = Math.floor(Date.now() / 1000)
  const thresholdSec = nowSec - windowSecs

  try {
    const rows = await database
      .insert(rateLimits)
      .values({ key, count: 1, windowStart: new Date(nowSec * 1000) })
      .onConflictDoUpdate({
        target: rateLimits.key,
        set: {
          // Window expired → reset to 1; otherwise increment.
          count: sql`case when ${rateLimits.windowStart} <= ${thresholdSec} then 1 else ${rateLimits.count} + 1 end`,
          windowStart: sql`case when ${rateLimits.windowStart} <= ${thresholdSec} then ${nowSec} else ${rateLimits.windowStart} end`,
        },
      })
      .returning({ count: rateLimits.count })

    const count = rows[0]?.count ?? 1
    return { ok: count <= limit }
  } catch {
    return { ok: true } // fail-open
  }
}
