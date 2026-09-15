import 'server-only'

import { eq } from 'drizzle-orm'

import { db } from '@/lib/db'
import { wedding, type Wedding } from '@/lib/db/schema'
import { buildWeddingContent, type WeddingContent } from '@/lib/wedding-content'

/** The singleton wedding row (id = 1), or null before the host configures it. */
export async function getWedding(): Promise<Wedding | null> {
  return (await db.select().from(wedding).where(eq(wedding.id, 1)).limit(1))[0] ?? null
}

/**
 * Public content for the landing — the ONLY projection of `wedding` that
 * reaches the guest surface. Host-only fields (venue phone/coordinator, end
 * times, budget) are dropped by `buildWeddingContent`.
 */
export async function getWeddingContent(): Promise<WeddingContent> {
  return buildWeddingContent(await getWedding())
}
