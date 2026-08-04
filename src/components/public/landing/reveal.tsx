'use client'

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'

import { cn } from '@/lib/utils/cn'

/**
 * Revela su contenido al entrar en el viewport (fade + subida sutil). Respeta
 * `prefers-reduced-motion`: si el usuario la activa, el contenido aparece de
 * inmediato sin transformación. Usa solo `opacity`/`transform` (sin reflow).
 */
export function Reveal({
  children,
  delay = 0,
  className,
  y = 24,
}: {
  children: ReactNode
  /** Retardo en ms para escalonar entradas. */
  delay?: number
  className?: string
  /** Desplazamiento vertical inicial en px. */
  y?: number
}) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      setShown(true)
      return
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setShown(true)
            io.disconnect()
          }
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' },
    )

    io.observe(node)
    return () => io.disconnect()
  }, [])

  const style = {
    transitionDelay: shown ? `${delay}ms` : '0ms',
    '--reveal-y': `${y}px`,
  } as CSSProperties

  return (
    <div
      ref={ref}
      style={style}
      className={cn(
        'transition-[opacity,transform] duration-700 ease-out motion-reduce:transition-none',
        shown ? 'translate-y-0 opacity-100' : 'translate-y-[var(--reveal-y)] opacity-0',
        className,
      )}
    >
      {children}
    </div>
  )
}
