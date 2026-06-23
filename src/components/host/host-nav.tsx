import Link from 'next/link'

import { logoutAction } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'
import { site } from '@/lib/site'

/**
 * Top bar for the back-office shell. Shows the signed-in host's email and a
 * sign-out button wired to the `logoutAction` Server Action via a plain form
 * (works without JS).
 */
export function HostNav({ email }: { email: string }) {
  return (
    <header className="sticky top-0 z-10 border-b border-[var(--color-border)] bg-[var(--color-background)]/85 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="font-display text-lg tracking-tight text-[var(--color-foreground)]"
        >
          {site.name}
        </Link>
        <div className="flex items-center gap-3">
          <span className="hidden text-xs text-[var(--color-muted-foreground)] sm:inline">
            {email}
          </span>
          <form action={logoutAction}>
            <Button type="submit" variant="outline" size="sm">
              Salir
            </Button>
          </form>
        </div>
      </div>
    </header>
  )
}
