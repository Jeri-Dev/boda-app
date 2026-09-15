import type { Metadata } from 'next'

import { ConfigForm } from '@/components/host/config-form'
import { getWedding } from '@/lib/data/wedding'

export const metadata: Metadata = {
  title: 'Configuración',
}

export const dynamic = 'force-dynamic'

export default async function ConfiguracionPage() {
  const row = await getWedding()

  return (
    <main className="w-full px-6 py-8 sm:px-8 lg:px-10">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl tracking-tight text-[var(--color-foreground)]">
            Configuración de la boda
          </h1>
          <p className="mt-2 max-w-prose text-sm text-[var(--color-muted-foreground)]">
            Todo lo que verán los invitados en «Nuestra boda» y en cada invitación
            personal. Los apartados vacíos se ocultan en la web.
          </p>
        </div>
        <a
          href="/nuestra-boda"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-10 items-center gap-2 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-card)] px-4 text-sm font-medium text-[var(--color-foreground)] shadow-[var(--shadow-soft)] transition-colors hover:bg-[var(--color-muted)]"
        >
          Ver la invitación ↗
        </a>
      </header>

      <ConfigForm wedding={row} />
    </main>
  )
}
