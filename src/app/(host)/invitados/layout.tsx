import type { ReactNode } from 'react'

import { TabNav } from '@/components/ui/tabs'

/**
 * Invitados module shell (U3). Unifies the guest list, invitations, and pending
 * confirmations under one module with a shared tab bar. The former top-level
 * `/invitaciones` and `/pendientes` routes now live here (old paths 308-redirect
 * via next.config).
 */
export default function InvitadosLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <main className="w-full px-6 py-8 sm:px-8 lg:px-10">
      <header className="mb-5">
        <h1 className="font-display text-3xl tracking-tight text-[var(--color-foreground)]">
          Invitados
        </h1>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-muted-foreground)]">
          Lista, invitaciones y confirmaciones pendientes en un solo lugar.
        </p>
      </header>

      <TabNav
        className="mb-6"
        ariaLabel="Secciones de invitados"
        items={[
          { href: '/invitados', label: 'Lista', exact: true },
          { href: '/invitados/invitaciones', label: 'Invitaciones' },
          { href: '/invitados/pendientes', label: 'Pendientes' },
        ]}
      />

      {children}
    </main>
  )
}
