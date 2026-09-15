/**
 * Pétalos a la deriva sobre las placas de tinta. Puro CSS (`.landing-petal`):
 * cada uno recibe su columna, retardo y duración por variables inline, así que
 * el patrón nunca se repite a la vista. Decorativo; se apaga con
 * `prefers-reduced-motion`.
 */
export function Petals({ count = 12 }: { count?: number }) {
  return (
    <div aria-hidden className="landing-petals">
      {Array.from({ length: count }, (_, i) => {
        // Deterministic pseudo-random spread (same on server and client).
        const x = ((i * 61) % 97) + 2
        const delay = -((i * 7.3) % 18)
        const dur = 16 + ((i * 5) % 9)
        const size = 8 + ((i * 3) % 6)
        return (
          <i
            key={i}
            className="landing-petal"
            style={
              {
                '--x': `${x}%`,
                '--d': `${delay}s`,
                '--t': `${dur}s`,
                '--s': `${size}px`,
                '--r': `${(i * 47) % 360}deg`,
              } as React.CSSProperties
            }
          />
        )
      })}
    </div>
  )
}
