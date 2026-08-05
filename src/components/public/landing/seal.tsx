import { cn } from '@/lib/utils/cn'

/**
 * Sello de lacre en champán con el monograma.
 *
 * El borde festoneado se genera encadenando arcos alrededor de una
 * circunferencia: así el contorno tiene la irregularidad de la cera prensada
 * sin depender de ninguna imagen. El disco es SVG (`currentColor`) y el
 * monograma va en HTML encima, para que herede la tipografía script y se pueda
 * seleccionar/leer como texto.
 */
const R = 45
const C = 50
const BUMPS = 26

function scallopedDisc() {
  const step = (Math.PI * 2) / BUMPS
  const point = (i: number) => {
    const a = i * step - Math.PI / 2
    return [C + R * Math.cos(a), C + R * Math.sin(a)] as const
  }
  // Radio del arco = algo más que la media cuerda → festón convexo.
  const arc = ((2 * R * Math.sin(Math.PI / BUMPS)) / 2) * 1.25
  const [x0, y0] = point(0)

  let d = `M${x0.toFixed(2)} ${y0.toFixed(2)}`
  for (let i = 1; i <= BUMPS; i += 1) {
    const [x, y] = point(i)
    d += ` A${arc.toFixed(2)} ${arc.toFixed(2)} 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)}`
  }
  return `${d} Z`
}

const DISC = scallopedDisc()

export function Seal({
  monogram,
  className,
  monogramClassName,
}: {
  monogram: string
  /** Tamaño y color del disco (p. ej. `h-20 w-20 text-[var(--color-gold)]`). */
  className?: string
  monogramClassName?: string
}) {
  return (
    <span className={cn('relative inline-flex items-center justify-center', className)}>
      <svg viewBox="0 0 100 100" aria-hidden className="absolute inset-0 h-full w-full">
        <path d={DISC} fill="currentColor" />
        <circle
          cx={C}
          cy={C}
          r={R - 8}
          fill="none"
          stroke="var(--color-ink)"
          strokeOpacity="0.22"
          strokeWidth="1"
        />
      </svg>
      <span
        className={cn(
          'relative whitespace-nowrap leading-none text-[var(--color-ink)]',
          monogramClassName,
        )}
        style={{ fontFamily: 'var(--font-script)' }}
      >
        {monogram}
      </span>
    </span>
  )
}
