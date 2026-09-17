import { Seal } from './seal'

/**
 * Página neutra para un token inexistente / revocado / caducado (sin oráculo,
 * sin 500). Mantiene la estética de la invitación.
 */
export function InvitationInvalid() {
  return (
    <main
      className="flex min-h-dvh flex-col items-center justify-center px-6 text-center"
      style={{
        background:
          'linear-gradient(168deg, var(--color-ink-2), var(--color-ink) 58%, oklch(0.245 0.058 198))',
      }}
    >
      <Seal monogram="✕" className="h-16 w-16 text-[var(--color-gold)]/70" monogramClassName="text-lg" />
      <h1 className="mt-8 font-display text-3xl font-light text-[oklch(0.95_0.02_88)]">
        Invitación no disponible
      </h1>
      <p className="mt-3 max-w-sm text-sm leading-relaxed text-[oklch(0.92_0.02_88)]/75">
        Este enlace no es válido o ha caducado. Si crees que es un error,
        contacta con los novios para que te envíen uno nuevo.
      </p>
      <a
        href="/nuestra-boda"
        className="mt-8 inline-block border border-[var(--color-gold)]/40 px-5 py-2.5 text-[0.7rem] uppercase tracking-[0.2em] indent-[0.2em] text-[var(--color-gold)] transition-colors hover:bg-[var(--color-gold)] hover:text-[var(--color-ink)]"
      >
        Ver la web de la boda
      </a>
    </main>
  )
}
