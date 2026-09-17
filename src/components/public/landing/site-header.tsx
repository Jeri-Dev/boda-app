'use client'

import { useEffect, useRef, useState } from 'react'

import { cn } from '@/lib/utils/cn'

import { Close, Menu } from './icons'

export type NavSection = { id: string; label: string }

/**
 * Cabecera fija con monograma + anclas. Sobre el hero (tinta) es transparente y
 * el texto va en champán; en cuanto se entra en el papel adopta un fondo de
 * vidrio y el texto pasa a tinta. Se esconde al bajar y reaparece al subir,
 * para no tapar la invitación mientras se lee. El filete inferior es el
 * progreso de lectura.
 */
export function SiteHeader({
  monogram,
  sections,
}: {
  monogram: string
  sections: NavSection[]
}) {
  const [scrolled, setScrolled] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [progress, setProgress] = useState(0)
  const [open, setOpen] = useState(false)
  const lastY = useRef(0)

  useEffect(() => {
    let raf = 0
    const onScroll = () => {
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = 0
        const y = window.scrollY
        setScrolled(y > 24)
        const max = document.documentElement.scrollHeight - window.innerHeight
        setProgress(max > 0 ? Math.min(1, y / max) : 0)
        // Hide when scrolling down past the hero, show as soon as we scroll up.
        const delta = y - lastY.current
        if (y > 160 && delta > 4) setHidden(true)
        else if (delta < -4 || y <= 160) setHidden(false)
        lastY.current = y
      })
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const onInk = !scrolled
  const nav = sections.filter((s) => s.id !== 'confirmar')
  const linkColor = onInk
    ? 'text-[oklch(0.94_0.025_88)]/85 hover:text-[var(--color-gold)]'
    : 'text-[var(--color-foreground)]/75 hover:text-[var(--color-accent)]'

  return (
    <header
      className={cn(
        'landing-header fixed inset-x-0 top-0 z-50 transition-[transform,background-color,border-color] duration-500',
        scrolled
          ? 'border-b border-[var(--color-border)]/70 bg-[var(--color-background)]/85 backdrop-blur-md'
          : 'border-b border-transparent bg-transparent',
        hidden && !open && '-translate-y-full',
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

        <ul className="hidden items-center gap-9 md:flex">
          {nav.map((item) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
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
            'landing-shine hidden border px-5 py-2.5 text-[0.7rem] uppercase tracking-[0.2em] indent-[0.2em] transition-colors md:inline-block',
            onInk
              ? 'border-[var(--color-gold)]/50 text-[var(--color-gold)] hover:bg-[var(--color-gold)] hover:text-[var(--color-ink)]'
              : 'border-[var(--color-accent)] bg-[var(--color-accent)] text-[var(--color-accent-foreground)] hover:bg-transparent hover:text-[var(--color-accent)]',
          )}
        >
          Confirmar
        </a>

        {/* El botón de confirmar se oculta con el menú abierto: ahí ya está la
            llamada a la acción a ancho completo, y así el aspa respira. */}
        <div className="flex items-center gap-1 md:hidden">
          <a
            href="#confirmar"
            className={cn(
              'border px-3 py-2 text-[0.6rem] uppercase tracking-[0.14em] indent-[0.14em] transition-opacity',
              open && 'pointer-events-none opacity-0',
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

      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-px origin-left bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-gold)] transition-transform duration-150 ease-out"
        style={{ transform: `scaleX(${progress})` }}
      />

      <div
        id="menu-movil"
        className={cn(
          'overflow-y-auto overscroll-contain border-t border-[var(--color-border)]/60 bg-[var(--color-background)]/97 backdrop-blur-md transition-[max-height,opacity] duration-300 md:hidden',
          // Cabe cualquier número de secciones sin recortar el último enlace.
          open ? 'max-h-[calc(100dvh-4rem)] opacity-100' : 'max-h-0 opacity-0',
        )}
      >
        <ul className="flex flex-col px-5 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          {[{ id: 'inicio', label: 'Inicio' }, ...nav].map((item) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
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
              className="block bg-[var(--color-accent)] px-5 py-3 text-center text-[0.72rem] uppercase tracking-[0.22em] indent-[0.22em] text-[var(--color-accent-foreground)]"
            >
              Confirmar asistencia
            </a>
          </li>
        </ul>
      </div>
    </header>
  )
}
