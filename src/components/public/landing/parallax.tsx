'use client'

import { useEffect, useRef, type ReactNode } from 'react'

/**
 * Scroll-parallax layer — dependency-free and CSP-safe.
 *
 * Renders a static outer element (the measured box) and translates an inner
 * element with `translate3d` from a rAF-throttled scroll handler. Compositor
 * work only: transforms never dirty layout, so the per-frame rect read stays
 * cheap. Fully disabled under `prefers-reduced-motion`.
 *
 * `speed` is the fraction of the element's distance from the viewport center
 * applied as offset: positive = layer lags the page (classic background
 * parallax), negative = layer moves against the scroll.
 */
export function Parallax({
  speed = 0.12,
  className,
  innerClassName,
  children,
}: {
  speed?: number
  className?: string
  innerClassName?: string
  children: ReactNode
}) {
  const outerRef = useRef<HTMLDivElement | null>(null)
  const innerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let raf = 0
    const update = () => {
      raf = 0
      const outer = outerRef.current
      const inner = innerRef.current
      if (!outer || !inner) return
      const rect = outer.getBoundingClientRect()
      const delta = rect.top + rect.height / 2 - window.innerHeight / 2
      inner.style.transform = `translate3d(0, ${(-delta * speed).toFixed(1)}px, 0)`
    }
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule, { passive: true })
    return () => {
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [speed])

  return (
    <div ref={outerRef} className={className}>
      <div ref={innerRef} className={innerClassName} style={{ willChange: 'transform' }}>
        {children}
      </div>
    </div>
  )
}
