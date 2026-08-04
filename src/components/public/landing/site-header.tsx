'use client'

import { useEffect, useState } from 'react'

import { cn } from '@/lib/utils/cn'

import { Close, Menu } from './icons'

const NAV = [
  { href: '#confirmar', label: 'Confirmar' },
  { href: '#detalles', label: 'Detalles' },
  { href: '#lugar', label: 'Lugar' },
  { href: '#regalos', label: 'Regalos' },
]

/**
 * Cabecera fija con monograma + navegación de anclas. Al hacer scroll adopta un
 * fondo de vidrio (glass) sutil. En móvil, menú desplegable accesible. El scroll
 * suave lo aporta `scroll-behavior: smooth` global + `scroll-mt` en las secciones.
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

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-colors duration-500',
        scrolled
          ? 'border-b border-[var(--color-border)]/70 bg-[var(--color-background)]/80 backdrop-blur-md'
          : 'border-b border-transparent bg-transparent',
      )}
    >
      <nav
        aria-label="Principal"
        className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:h-[4.5rem] sm:px-8"
      >
        <a
          href="#inicio"
          className="rounded-sm text-2xl leading-none text-[var(--color-foreground)] transition-opacity hover:opacity-70 sm:text-[1.7rem]"
          style={{ fontFamily: 'var(--font-script)' }}
        >
          {monogram}
        </a>

        {/* Navegación en escritorio */}
        <ul className="hidden items-center gap-8 md:flex">
          {NAV.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                className="group relative text-sm tracking-wide text-[var(--color-foreground)]/80 transition-colors hover:text-[var(--color-accent)]"
              >
                {item.label}
                <span className="absolute -bottom-1.5 left-0 h-px w-0 bg-[var(--color-accent)] transition-all duration-300 group-hover:w-full" />
              </a>
            </li>
          ))}
        </ul>

        <a
          href="#confirmar"
          className="hidden rounded-full bg-[var(--color-accent)] px-5 py-2 text-sm font-medium text-[var(--color-accent-foreground)] shadow-[var(--shadow-soft)] transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0 md:inline-block"
        >
          Confirmar asistencia
        </a>

        {/* CTA compacto + botón de menú (móvil) */}
        <div className="flex items-center gap-1.5 md:hidden">
          <a
            href="#confirmar"
            className="rounded-full bg-[var(--color-accent)] px-4 py-2 text-xs font-medium text-[var(--color-accent-foreground)] shadow-[var(--shadow-soft)]"
          >
            Confirmar
          </a>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="menu-movil"
            aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
            className="flex h-11 w-11 items-center justify-center rounded-full text-[var(--color-foreground)] transition-colors hover:bg-[var(--color-muted)]"
          >
            {open ? <Close className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </nav>

      {/* Barra de progreso de lectura (rosa → oro) */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-[2px] origin-left bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-gold)] transition-transform duration-150 ease-out"
        style={{ transform: `scaleX(${progress})` }}
      />

      {/* Menú móvil desplegable */}
      <div
        id="menu-movil"
        className={cn(
          'overflow-hidden border-t border-[var(--color-border)]/60 bg-[var(--color-background)]/95 backdrop-blur-md transition-[max-height,opacity] duration-300 md:hidden',
          open ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0',
        )}
      >
        <ul className="flex flex-col px-5 py-2">
          {NAV.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                onClick={() => setOpen(false)}
                className="block border-b border-[var(--color-border)]/50 py-3.5 text-[0.95rem] text-[var(--color-foreground)] transition-colors hover:text-[var(--color-accent)]"
              >
                {item.label}
              </a>
            </li>
          ))}
          <li className="py-3">
            <a
              href="#confirmar"
              onClick={() => setOpen(false)}
              className="block rounded-full bg-[var(--color-accent)] px-5 py-3 text-center text-sm font-medium text-[var(--color-accent-foreground)]"
            >
              Confirmar asistencia
            </a>
          </li>
        </ul>
      </div>
    </header>
  )
}
