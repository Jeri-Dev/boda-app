'use client'

import { useEffect, useRef, type ReactNode } from 'react'

import { cn } from '@/lib/utils/cn'

function fineHover() {
  return window.matchMedia('(hover: hover) and (pointer: fine)').matches
}

function reduceMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Inclinación 3D sutil siguiendo el puntero (solo escritorio con ratón). Escribe
 * `--rx` / `--ry` en el nodo; `landing.css` las aplica con perspectiva. Nunca
 * toca el layout — solo transform.
 */
export function Tilt({
  children,
  className,
  max = 6,
}: {
  children: ReactNode
  className?: string
  /** Grados máximos de inclinación. */
  max?: number
}) {
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const node = ref.current
    if (!node || !fineHover() || reduceMotion()) return

    let raf = 0
    const onMove = (e: PointerEvent) => {
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = 0
        const r = node.getBoundingClientRect()
        const px = (e.clientX - r.left) / r.width - 0.5
        const py = (e.clientY - r.top) / r.height - 0.5
        node.style.setProperty('--ry', `${(px * max * 2).toFixed(2)}deg`)
        node.style.setProperty('--rx', `${(-py * max * 2).toFixed(2)}deg`)
        node.style.setProperty('--gx', `${((px + 0.5) * 100).toFixed(1)}%`)
        node.style.setProperty('--gy', `${((py + 0.5) * 100).toFixed(1)}%`)
      })
    }
    const onLeave = () => {
      node.style.setProperty('--rx', '0deg')
      node.style.setProperty('--ry', '0deg')
    }
    node.addEventListener('pointermove', onMove)
    node.addEventListener('pointerleave', onLeave)
    return () => {
      node.removeEventListener('pointermove', onMove)
      node.removeEventListener('pointerleave', onLeave)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [max])

  return (
    <div ref={ref} className={cn('landing-tilt', className)}>
      {children}
    </div>
  )
}

/**
 * Luz que sigue al cursor sobre las placas de tinta (escritorio). Escribe
 * `--mx` / `--my` en porcentaje; el degradado radial vive en CSS.
 */
export function Spotlight({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const node = ref.current
    const parent = node?.parentElement
    if (!node || !parent || !fineHover() || reduceMotion()) return

    let raf = 0
    const onMove = (e: PointerEvent) => {
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = 0
        const r = parent.getBoundingClientRect()
        node.style.setProperty('--mx', `${(((e.clientX - r.left) / r.width) * 100).toFixed(1)}%`)
        node.style.setProperty('--my', `${(((e.clientY - r.top) / r.height) * 100).toFixed(1)}%`)
        node.style.opacity = '1'
      })
    }
    const onLeave = () => {
      node.style.opacity = '0'
    }
    parent.addEventListener('pointermove', onMove)
    parent.addEventListener('pointerleave', onLeave)
    return () => {
      parent.removeEventListener('pointermove', onMove)
      parent.removeEventListener('pointerleave', onLeave)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  return <div ref={ref} aria-hidden className={cn('landing-spotlight', className)} />
}
