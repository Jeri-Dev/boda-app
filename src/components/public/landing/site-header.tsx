'use client'

import { useEffect, useState } from 'react'

import { cn } from '@/lib/utils/cn'

import { Close, Menu } from './icons'

const NAV = [
  { href: '#info', label: 'Info' },
  { href: '#lugar', label: 'Lugar' },
  { href: '#regalos', label: 'Regalos' },
]

/**
 * Cabecera fija con monograma + anclas. Sobre el hero es transparente (el sobre
 * es de tinta, así que el texto va en champán); en cuanto se entra en el papel
 * adopta un fondo de vidrio y el texto pasa a tinta. El filete de progreso de
 * abajo dice cuánto queda de invitación.
 */
export function SiteHeader({ monogram }: { monogram: string }) {
  const [scrolled, setScrolled] = useState(false)
  const [progress, setProgress] = useState(0)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 24)
      const max = document.documentElement.scrollHeight - window.innerHeight
      setProgress(max > 0 ? Math.min(1, window.scrollY / max) : 0)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Cierra el menú móvil al pulsar Escape.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  // Sobre la tinta del hero el texto es champán; sobre el papel, turquesa.
  const onInk = !scrolled
  const linkColor = onInk
    ? 'text-[oklch(0.94_0.025_88)]/85 hover:text-[var(--color-gold)]'
    : 'text-[var(--color-foreground)]/75 hover:text-[var(--color-accent)]'

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-colors duration-500',
        scrolled
          ? 'border-b border-[var(--color-border)]/70 bg-[var(--color-background)]/85 backdrop-blur-md'
          : 'border-b border-transparent bg-transparent',
      )}
    >
      <nav
        aria-label="Principal"
        className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:h-[4.5rem] sm:px-8"
      >
        <a
          href="#inicio"
          className={cn(
            'rounded-sm text-2xl leading-none transition-opacity hover:opacity-70 sm:text-[1.7rem]',
            onInk ? 'text-[var(--color-gold)]' : 'text-[var(--color-foreground)]',
          )}
          style={{ fontFamily: 'var(--font-script)' }}
        >
          {monogram}
        </a>

        {/* Navegación en escritorio */}
        <ul className="hidden items-center gap-9 md:flex">
          {NAV.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                className={cn(
                  'group relative text-[0.7rem] uppercase tracking-[0.24em] transition-colors',
                  linkColor,
                )}
              >
                {item.label}
                <span
                  className={cn(
                    'absolute -bottom-1.5 left-0 h-px w-0 transition-all duration-300 group-hover:w-full',
                    onInk ? 'bg-[var(--color-gold)]' : 'bg-[var(--color-accent)]',
                  )}
                />
              </a>
            </li>
          ))}
        </ul>

        <a
          href="#confirmar"
          className={cn(
            'hidden border px-5 py-2.5 text-[0.7rem] uppercase tracking-[0.2em] transition-colors md:inline-block',
            onInk
              ? 'border-[var(--color-gold)]/50 text-[var(--color-gold)] hover:bg-[var(--color-gold)] hover:text-[var(--color-ink)]'
              : 'border-[var(--color-accent)] bg-[var(--color-accent)] text-[var(--color-accent-foreground)] hover:bg-transparent hover:text-[var(--color-accent)]',
          )}
        >
          Confirmar
        </a>

        {/* CTA compacto + botón de menú (móvil) */}
        <div className="flex items-center gap-1.5 md:hidden">
          <a
            href="#confirmar"
            className={cn(
              'border px-3.5 py-2 text-[0.65rem] uppercase tracking-[0.18em] transition-colors',
              onInk
                ? 'border-[var(--color-gold)]/50 text-[var(--color-gold)]'
                : 'border-[var(--color-accent)] bg-[var(--color-accent)] text-[var(--color-accent-foreground)]',
            )}
          >
            Confirmar
          </a>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="menu-movil"
            aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
            className={cn(
              'flex h-11 w-11 items-center justify-center transition-colors',
              onInk ? 'text-[oklch(0.94_0.025_88)]' : 'text-[var(--color-foreground)]',
            )}
          >
            {open ? <Close className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </nav>

      {/* Filete de progreso de lectura (turquesa → champán) */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-px origin-left bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-gold)] transition-transform duration-150 ease-out"
        style={{ transform: `scaleX(${progress})` }}
      />

      {/* Menú móvil desplegable */}
      <div
        id="menu-movil"
        className={cn(
          'overflow-hidden border-t border-[var(--color-border)]/60 bg-[var(--color-background)]/97 backdrop-blur-md transition-[max-height,opacity] duration-300 md:hidden',
          open ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0',
        )}
      >
        <ul className="flex flex-col px-5 py-2">
          {[{ href: '#inicio', label: 'Inicio' }, ...NAV].map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                onClick={() => setOpen(false)}
                className="block border-b border-[var(--color-border)]/50 py-3.5 text-[0.72rem] uppercase tracking-[0.22em] text-[var(--color-foreground)] transition-colors hover:text-[var(--color-accent)]"
              >
                {item.label}
              </a>
            </li>
          ))}
          <li className="py-3">
            <a
              href="#confirmar"
              onClick={() => setOpen(false)}
              className="block bg-[var(--color-accent)] px-5 py-3 text-center text-[0.72rem] uppercase tracking-[0.22em] text-[var(--color-accent-foreground)]"
            >
              Confirmar asistencia
            </a>
          </li>
        </ul>
      </div>
    </header>
  )
}
