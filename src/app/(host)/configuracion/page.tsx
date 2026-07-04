import type { Metadata } from 'next'
import { eq } from 'drizzle-orm'

import { ConfigForm } from '@/components/host/config-form'
import { db } from '@/lib/db'
import { wedding } from '@/lib/db/schema'

export const metadata: Metadata = {
  title: 'Configuración',
}

export const dynamic = 'force-dynamic'

export default async function ConfiguracionPage() {
  const row = (await db.select().from(wedding).where(eq(wedding.id, 1)).limit(1))[0] ?? null

  return (
    <main className="w-full px-6 py-8 sm:px-8 lg:px-10">
      <header className="mb-8">
        <h1 className="font-display text-3xl tracking-tight text-[var(--color-foreground)]">
          Configuración de la boda
        </h1>
        <p className="mt-2 max-w-prose text-sm text-[var(--color-muted-foreground)]">
          El contenido que verán los invitados en la invitación.
        </p>
      </header>

      <ConfigForm wedding={row} />
    </main>
  )
}
