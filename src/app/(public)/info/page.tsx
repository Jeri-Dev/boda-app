import type { Metadata } from 'next'
import { eq } from 'drizzle-orm'

import { InfoSections } from '@/components/public/info-sections'
import { db } from '@/lib/db'
import { wedding } from '@/lib/db/schema'

/**
 * Public info page (U2.5) — location, schedule, dress code, accommodation,
 * transport, and the gift registry (transfer details). `noindex` is essential
 * here: the gift/IBAN details must never be search-indexed (phishing hygiene).
 */
export const metadata: Metadata = {
  title: 'Información',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default async function InfoPage() {
  const row =
    (await db.select().from(wedding).where(eq(wedding.id, 1)).limit(1))[0] ?? null

  return <InfoSections wedding={row} />
}
