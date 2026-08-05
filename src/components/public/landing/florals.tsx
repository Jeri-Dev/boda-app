/**
 * Botánica dibujada a mano (SVG en línea, compatible con la CSP, sin assets).
 *
 * Todas las piezas son solo trazo (relleno únicamente en bayas y puntos),
 * heredan `currentColor` y comparten un grosor de 1.4 para que se lean como una
 * misma familia de ilustración. El tinte y la opacidad los pone quien las usa —
 * mantenlas por debajo del 50 % de opacidad cuando haya texto encima.
 *
 * La selección es deliberadamente caribeña y sobria: eucalipto, una fronda de
 * palma y ramitas de gypsophila en champán. Nada de rosas: el turquesa pide
 * verde de mar, no jardín inglés.
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

/** Rama de eucalipto silver-dollar — hojas redondas alternas sobre un tallo en S. */
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

/**
 * Fronda de palma — folíolos pareados a lo largo del raquis, más largos en el
 * centro y afilándose hacia la punta. La curva de cada folíolo se calcula (no
 * se dibuja a mano) para que la caída sea regular como en una hoja real.
 */
export function PalmFrond(props: Props) {
  const leaflets = Array.from({ length: 15 }, (_, i) => {
    const t = i / 14
    const y = 268 - t * 244
    // Seno recortado: cortos en la base, máximos hacia el tercio superior.
    const len = 52 * Math.sin(Math.PI * (0.2 + t * 0.7))
    return { y: Number(y.toFixed(1)), len: Number(len.toFixed(1)) }
  })

  return (
    <svg viewBox="0 0 140 280" {...strokeProps} {...props}>
      {/* Raquis */}
      <path d="M70 278 C66 226 74 170 68 118 C64 78 70 44 66 14" />
      {leaflets.map(({ y, len }, i) => {
        const x = 70 - (y > 140 ? 2 : -2)
        return (
          <g key={i}>
            <path d={`M${x} ${y} Q${x - len * 0.62} ${y - 5} ${x - len} ${y - 19}`} />
            <path d={`M${x} ${y} Q${x + len * 0.62} ${y - 5} ${x + len} ${y - 19}`} />
          </g>
        )
      })}
      <path d="M66 14 C64 10 65 6 68 3" />
    </svg>
  )
}

/** Gypsophila / ramita de bayas — ramas finas rematadas en puntos (mejor en champán). */
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

/** Hoja suelta a la deriva (para las animaciones de flotación). */
export function Leaf(props: Props) {
  return (
    <svg viewBox="0 0 24 32" {...strokeProps} {...props}>
      <path d="M12 2 C19 8 20 19 12 30 C4 19 5 8 12 2 Z" />
      <path d="M12 8 C12 15 12 21 12 26" strokeOpacity="0.6" />
    </svg>
  )
}

/**
 * Textura de papel: un mosaico de turbulencia SVG como data URI (lo permite
 * `img-src data:` de la CSP), fijo y no interactivo. Mantén la opacidad muy
 * baja — debe leerse como grano de papel, no como ruido.
 */
const GRAIN_TILE =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)'/%3E%3C/svg%3E\")"

export function Grain() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[60] opacity-[0.04] mix-blend-multiply"
      style={{ backgroundImage: GRAIN_TILE, backgroundSize: '160px 160px' }}
    />
  )
}
