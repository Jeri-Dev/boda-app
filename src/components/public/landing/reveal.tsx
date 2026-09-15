'use client'

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'

import { cn } from '@/lib/utils/cn'

/**
 * `useInView` — true once the node has entered the viewport (one-shot). Under
 * `prefers-reduced-motion` it resolves immediately so nothing waits on scroll.
 */
export function useInView<T extends HTMLElement>(
  options: { threshold?: number; rootMargin?: string } = {},
) {
  const ref = useRef<T | null>(null)
  const [inView, setInView] = useState(false)
  const { threshold = 0.15, rootMargin = '0px 0px -8% 0px' } = options

  useEffect(() => {
    const node = ref.current
    if (!node) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setInView(true)
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setInView(true)
            io.disconnect()
          }
        }
      },
      { threshold, rootMargin },
    )
    io.observe(node)
    return () => io.disconnect()
  }, [threshold, rootMargin])

  return { ref, inView }
}

export type RevealVariant = 'up' | 'blur' | 'scale' | 'line' | 'fade'

/**
 * Revela su contenido al entrar en el viewport. Variantes (solo
 * opacity/transform/filter/clip-path — nada que provoque reflow):
 *
 *  - `up`    fade + subida sutil (por defecto)
 *  - `blur`  fade + desenfoque que se enfoca — para prosa y títulos
 *  - `scale` fade + escala 0.94 → 1 — para tarjetas y fotos
 *  - `line`  máscara que sube como una cortina — para títulos
 *  - `fade`  solo opacidad
 *
 * Con `prefers-reduced-motion` el contenido aparece de inmediato.
 */
export function Reveal({
  children,
  delay = 0,
  className,
  variant = 'up',
  y = 28,
}: {
  children: ReactNode
  /** Retardo en ms para escalonar entradas. */
  delay?: number
  className?: string
  variant?: RevealVariant
  /** Desplazamiento vertical inicial en px (variante `up`). */
  y?: number
}) {
  const { ref, inView } = useInView<HTMLDivElement>()

  const style = {
    '--reveal-delay': `${delay}ms`,
    '--reveal-y': `${y}px`,
  } as CSSProperties

  return (
    <div
      ref={ref}
      style={style}
      data-variant={variant}
      className={cn('landing-reveal', inView && 'is-shown', className)}
    >
      {children}
    </div>
  )
}
