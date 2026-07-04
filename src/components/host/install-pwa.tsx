'use client'

import { useEffect, useState } from 'react'

/**
 * "Instalar app" affordance for the back-office PWA.
 *
 * Captures the browser's `beforeinstallprompt` (Chrome/Edge/Android) and shows
 * an install button only when the app is genuinely installable — i.e. in
 * production (the service worker is prod-only), over HTTPS, with the manifest
 * met, and not already installed. On iOS Safari the event never fires (install
 * is Share → "Añadir a pantalla de inicio"), so the button simply stays hidden
 * there. Renders nothing when unavailable.
 */

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function isStandalone(): boolean {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    // iOS Safari
    (navigator as unknown as { standalone?: boolean }).standalone === true
  )
}

export function InstallPwa() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [hidden, setHidden] = useState(true)

  useEffect(() => {
    if (isStandalone()) return // already installed → nothing to offer

    function onPrompt(e: Event) {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
      setHidden(false)
    }
    function onInstalled() {
      setHidden(true)
      setDeferred(null)
    }

    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  if (hidden || !deferred) return null

  return (
    <div className="border-t border-[var(--color-border)] p-3">
      <button
        type="button"
        onClick={async () => {
          await deferred.prompt()
          await deferred.userChoice
          setDeferred(null)
          setHidden(true)
        }}
        className="flex w-full items-center justify-center gap-2 rounded-[var(--radius)] border border-[var(--color-accent)] px-3 py-2 text-sm font-medium text-[var(--color-accent)] transition-colors hover:bg-[var(--color-accent)] hover:text-[var(--color-accent-foreground)]"
      >
        <svg
          width={16}
          height={16}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.75}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M12 3v12m0 0 4-4m-4 4-4-4" />
          <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
        </svg>
        Instalar app
      </button>
    </div>
  )
}
