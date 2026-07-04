import type { Metadata } from 'next'
import { asc } from 'drizzle-orm'

import { TaskBoard } from '@/components/host/task-board'
import { db } from '@/lib/db'
import { tasks } from '@/lib/db/schema'
import { isoDateDR, plusDaysDR } from '@/lib/utils/dates'

export const metadata: Metadata = {
  title: 'Tareas',
}

// Live data + "today" highlighting → render per request.
export const dynamic = 'force-dynamic'

export default async function TareasPage() {
  const rows = await db
    .select()
    .from(tasks)
    .orderBy(asc(tasks.position), asc(tasks.createdAt))

  const today = isoDateDR()
  const soon = plusDaysDR(14)

  return (
    <main className="w-full px-6 py-8 sm:px-8 lg:px-10">
      <header className="mb-8">
        <h1 className="font-display text-3xl tracking-tight text-[var(--color-foreground)]">
          Tareas
        </h1>
        <p className="mt-2 max-w-prose text-sm text-[var(--color-muted-foreground)]">
          Tu checklist como tablero: arrastra cada tarea entre columnas o usa el
          selector de cada tarjeta.
        </p>
      </header>

      <TaskBoard tasks={rows} today={today} soon={soon} />
    </main>
  )
}
