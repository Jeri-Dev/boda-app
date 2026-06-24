import Link from 'next/link'

import { site } from '@/lib/site'

/**
 * Top bar for the back-office shell. The app is open (no auth), so this is a
 * plain navigation header — no session, no sign-out. Fase 1 adds the module
 * links (invitados, presupuesto, proveedores, tareas, mesas) here.
 */
export function HostNav() {
  return (
    <header className="sticky top-0 z-10 border-b border-[var(--color-border)] bg-[var(--color-background)]/85 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="font-display text-lg tracking-tight text-[var(--color-foreground)]"
        >
          {site.name}
        </Link>
      </div>
    </header>
  )
}
