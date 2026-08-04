/**
 * Hand-drawn botanical line art (inline SVG, CSP-safe, zero assets).
 *
 * All pieces are stroke-only (fill on tiny berries/dots), inherit
 * `currentColor`, and use a consistent 1.4 stroke so they read as one
 * illustration family. Tint + opacity are applied by the caller via classes —
 * keep them ≤ 50% opacity behind text.
 */
import type { SVGProps } from 'react'

type Props = SVGProps<SVGSVGElement>

const strokeProps = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.4,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true as const,
  focusable: false as const,
}

/** Silver-dollar eucalyptus branch — round leaves alternating along an S stem. */
export function EucalyptusBranch(props: Props) {
  return (
    <svg viewBox="0 0 140 280" {...strokeProps} {...props}>
      <path d="M70 275 C62 220 76 165 64 110 C58 80 68 40 62 6" />
      <path d="M66 245 L48 238" /> <circle cx="43" cy="236" r="13" />
      <path d="M65 220 L84 212" /> <circle cx="89" cy="210" r="12.5" />
      <path d="M67 193 L50 185" /> <circle cx="45" cy="183" r="12" />
      <path d="M70 167 L88 160" /> <circle cx="93" cy="158" r="11" />
      <path d="M69 142 L53 135" /> <circle cx="48" cy="133" r="10.5" />
      <path d="M66 118 L82 111" /> <circle cx="86" cy="109" r="10" />
      <path d="M63 95 L49 89" /> <circle cx="44" cy="87" r="9" />
      <path d="M62 72 L76 66" /> <circle cx="80" cy="64" r="8.5" />
      <path d="M64 50 L52 44" /> <circle cx="48" cy="42" r="7.5" />
      <path d="M64 30 L75 25" /> <circle cx="79" cy="23" r="6.5" />
      <path d="M63 14 L54 10" /> <circle cx="50" cy="8" r="5.5" />
      <circle cx="62" cy="4" r="3.5" />
    </svg>
  )
}

/** Line-art rose: arc-chain spiral heart + broken petal arcs + leaf. */
export function RoseBloom(props: Props) {
  return (
    <svg viewBox="0 0 120 130" {...strokeProps} {...props}>
      {/* spiral center */}
      <path d="M58 60 a2.5 2.5 0 0 1 5 0 a5 5 0 0 1 -10 0 a7.5 7.5 0 0 1 15 0 a10 10 0 0 1 -20 0 a12.5 12.5 0 0 1 25 0" />
      {/* inner petal arcs (hand-drawn gaps) */}
      <path d="M62 28 C43 30 32 44 33 62" />
      <path d="M33 68 C34 84 46 94 60 95" />
      <path d="M68 94 C84 90 93 78 92 62" />
      <path d="M90 54 C86 40 76 31 66 28" />
      {/* outer hints */}
      <path d="M54 20 C36 24 22 40 24 60" />
      <path d="M97 66 C95 85 82 97 66 100" />
      {/* stem + leaves */}
      <path d="M60 96 C59 106 58 116 58 126" />
      <path d="M58 112 C48 108 40 110 33 118 C41 124 52 122 58 114" />
      <path d="M58 118 C66 114 74 115 80 122 C73 128 63 126 58 120" />
    </svg>
  )
}

/** Gypsophila / berry sprig — thin branches tipped with dots (best in gold). */
export function BlossomSprig(props: Props) {
  return (
    <svg viewBox="0 0 90 140" {...strokeProps} {...props}>
      <path d="M45 138 C43 108 48 84 44 58 C42 44 46 30 44 18" />
      <path d="M44 102 C36 94 30 86 28 74" /> <circle cx="27" cy="70" r="3" fill="currentColor" stroke="none" />
      <path d="M45 90 C54 82 60 74 62 64" /> <circle cx="63" cy="60" r="3" fill="currentColor" stroke="none" />
      <path d="M44 72 C37 63 34 54 35 44" /> <circle cx="35" cy="40" r="2.8" fill="currentColor" stroke="none" />
      <path d="M44 62 C51 52 55 44 54 34" /> <circle cx="54" cy="30" r="2.8" fill="currentColor" stroke="none" />
      <path d="M44 40 C38 33 36 26 37 19" /> <circle cx="37" cy="15" r="2.5" fill="currentColor" stroke="none" />
      <path d="M44 32 C50 25 53 19 52 12" /> <circle cx="52" cy="9" r="2.5" fill="currentColor" stroke="none" />
      <circle cx="44" cy="13" r="3.2" fill="currentColor" stroke="none" />
    </svg>
  )
}

/** Open peony — radiating petals around a dotted heart. */
export function PeonyBloom(props: Props) {
  const petal = 'M60 56 C53 43 53 30 60 21 C67 30 67 43 60 56 Z'
  return (
    <svg viewBox="0 0 120 120" {...strokeProps} {...props}>
      {[0, 40, 80, 120, 160, 200, 240, 280, 320].map((deg) => (
        <path key={deg} d={petal} transform={`rotate(${deg} 60 60)`} />
      ))}
      <circle cx="60" cy="60" r="4" />
      <circle cx="54" cy="57" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="66" cy="57" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="60" cy="67" r="1.3" fill="currentColor" stroke="none" />
    </svg>
  )
}

/** Single falling petal (for drift animations). */
export function Petal(props: Props) {
  return (
    <svg viewBox="0 0 24 32" {...strokeProps} {...props}>
      <path d="M12 2 C19 8 20 19 12 30 C4 19 5 8 12 2 Z" />
      <path d="M12 8 C12 15 12 21 12 26" strokeOpacity="0.6" />
    </svg>
  )
}

/**
 * Paper-grain overlay: SVG turbulence tile as a data URI (allowed by the CSP's
 * `img-src data:`), fixed and non-interactive. Keep opacity very low — it
 * should read as texture, not noise.
 */
const GRAIN_TILE =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)'/%3E%3C/svg%3E\")"

export function Grain() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[60] opacity-[0.045] mix-blend-multiply"
      style={{ backgroundImage: GRAIN_TILE, backgroundSize: '160px 160px' }}
    />
  )
}
