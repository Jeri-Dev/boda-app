import type { Metadata } from 'next'

/**
 * Offline fallback (`/~offline`). Precached by the service worker on install
 * and served for navigations that fail with no network and nothing cached.
 * Public route (proxy allowlist) — never gated.
 */
export const metadata: Metadata = {
  title: 'Sin conexión',
  robots: { index: false, follow: false },
}

export default function OfflinePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <p className="font-display text-3xl text-[var(--color-foreground)]">
        Sin conexión
      </p>
      <p className="mt-3 max-w-sm text-sm text-[var(--color-muted-foreground)]">
        No hay conexión a internet. Lo último que abriste sigue disponible; el
        resto volverá cuando recuperes la señal.
      </p>
    </main>
  )
}
