import * as React from 'react'

/**
 * Brand mark — two interlocking wedding rings with a small gem. Inline SVG
 * (self-hosted; the CSP blocks external assets) that inherits `currentColor`,
 * so it themes with whatever text/accent color it's placed in.
 */
export function Logo(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 40 28"
      fill="none"
      role="img"
      aria-label="Nuestra Boda"
      {...props}
    >
      <circle cx="15" cy="17" r="8" stroke="currentColor" strokeWidth="2.4" />
      <circle cx="26" cy="17" r="8" stroke="currentColor" strokeWidth="2.4" />
      <path d="M15 3.2 17.2 6 15 8.8 12.8 6Z" fill="currentColor" />
    </svg>
  )
}
