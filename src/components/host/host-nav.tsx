import Link from 'next/link'

import { site } from '@/lib/site'

/**
 * Top bar for the back-office shell. The app is open (no auth) — a plain
 * navigation header. Module links grow here as Fase 1 lands.
 */
const LINKS = [
  { href: '/', label: 'Panel' },
  { href: '/invitados', label: 'Invitados' },
  { href: '/invitaciones', label: 'Invitaciones' },
  { href: '/pendientes', label: 'Pendientes' },
  { href: '/proveedores', label: 'Proveedores' },
  { href: '/presupuesto', label: 'Presupuesto' },
  { href: '/tareas', label: 'Tareas' },
  { href: '/mesas', label: 'Mesas' },
  { href: '/dia-b', label: 'Día B' },
  { href: '/configuracion', label: 'Configuración' },
] as const

export function HostNav() {
  return (
    <header className="sticky top-0 z-10 border-b border-[var(--color-border)] bg-[var(--color-background)]/85 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="font-display text-lg tracking-tight text-[var(--color-foreground)]"
        >
          {site.name}
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-[var(--radius)] px-3 py-1.5 text-[var(--color-muted-foreground)] transition-colors hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  )
}
