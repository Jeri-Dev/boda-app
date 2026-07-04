'use client'

import { useEffect, useState } from 'react'

/**
 * "Instalar app" affordance for the back-office PWA.
 *
 * Two paths:
 *  - Chrome/Edge/Android fire `beforeinstallprompt` → we show a functional
 *    "Instalar app" button that triggers the native prompt.
 *  - iOS Safari never fires that event (install is manual) → we show a hint
 *    telling the user to use Share → "Añadir a pantalla de inicio".
 *
 * Everything is gated on the app NOT already running standalone, and the button
 * path only lights up in production (the service worker is prod-only). Renders
 * nothing when there's nothing useful to offer.
 */

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function isStandalone(): boolean {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  )
}

/** iOS Safari only (Chrome/Firefox/Edge on iOS can't "Add to Home Screen"). */
function isIosSafari(): boolean {
  const ua = navigator.userAgent || ''
  const iOS =
    /iphone|ipad|ipod/i.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  const webkit = /webkit/i.test(ua)
  const otherBrowser = /crios|fxios|edgios|opios/i.test(ua)
  return iOS && webkit && !otherBrowser
}

export function InstallPwa() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [mode, setMode] = useState<'hidden' | 'button' | 'ios'>('hidden')

  useEffect(() => {
    if (isStandalone()) return // already installed → nothing to offer
    if (isIosSafari()) setMode('ios')

    function onPrompt(e: Event) {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
      setMode('button')
    }
    function onInstalled() {
      setMode('hidden')
      setDeferred(null)
    }

    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  if (mode === 'hidden') return null

  if (mode === 'ios') {
    return (
      <div className="border-t border-[var(--color-border)] p-3">
        <p className="flex items-start gap-2 text-xs leading-relaxed text-[var(--color-muted-foreground)]">
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
            className="mt-0.5 shrink-0"
          >
            <path d="M12 3v12" />
            <path d="m8 7 4-4 4 4" />
            <path d="M6 12H5a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5a2 2 0 0 0-2-2h-1" />
          </svg>
          <span>
            Para instalar: toca <strong>Compartir</strong> y luego{' '}
            <strong>Añadir a pantalla de inicio</strong>.
          </span>
        </p>
      </div>
    )
  }

  return (
    <div className="border-t border-[var(--color-border)] p-3">
      <button
        type="button"
        onClick={async () => {
          if (!deferred) return
          await deferred.prompt()
          await deferred.userChoice
          setDeferred(null)
          setMode('hidden')
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
