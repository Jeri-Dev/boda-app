import { cn } from '@/lib/utils/cn'

/**
 * Filete grabado: dos hilos que se afinan hacia el centro, un rombo y dos hojas.
 * Hereda `currentColor` y es decorativo → `aria-hidden`.
 */
export function Ornament({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="0.9"
      aria-hidden
      className={className ?? 'h-5 w-full'}
    >
      <path d="M4 10h68" strokeLinecap="round" />
      <path d="M128 10h68" strokeLinecap="round" />
      <path d="M100 3.5l5.5 6.5-5.5 6.5-5.5-6.5 5.5-6.5Z" />
      <path d="M78 10c4.5-4.5 9-4.5 13.5 0-4.5 4.5-9 4.5-13.5 0Z" />
      <path d="M122 10c-4.5-4.5-9-4.5-13.5 0 4.5 4.5 9 4.5 13.5 0Z" />
      <circle cx="100" cy="10" r="1.3" fill="currentColor" stroke="none" />
    </svg>
  )
}

/**
 * Esquinas en champán para las tarjetas — el guiño a la lámina estampada de la
 * papelería impresa. El padre debe ser `relative`; son decorativas.
 */
export function CornerAccents({ inset = 'inset-2.5' }: { inset?: string }) {
  const base = 'absolute h-5 w-5 border-[var(--color-gold-deep)]'
  return (
    <div aria-hidden className={`pointer-events-none absolute ${inset} opacity-60`}>
      <span className={`${base} left-0 top-0 border-l border-t`} />
      <span className={`${base} right-0 top-0 border-r border-t`} />
      <span className={`${base} bottom-0 left-0 border-b border-l`} />
      <span className={`${base} bottom-0 right-0 border-b border-r`} />
    </div>
  )
}

/**
 * Encabezado de sección: versalita + título en la serif grabada + filete.
 *
 * `tone` decide de qué lado de la papelería estamos: sobre papel el champán no
 * tiene contraste suficiente para texto pequeño, así que la versalita va en
 * turquesa; sobre los paneles de tinta, el champán es justo lo que brilla.
 */
export function SectionHeading({
  overline,
  title,
  tone = 'paper',
  align = 'center',
  className,
}: {
  overline: string
  title: string
  tone?: 'paper' | 'ink'
  align?: 'center' | 'start'
  className?: string
}) {
  const centered = align === 'center'

  return (
    <div className={cn(centered ? 'text-center' : 'text-left', className)}>
      <p
        className={cn(
          'text-[0.68rem] uppercase tracking-[0.38em]',
          tone === 'ink' ? 'text-[var(--color-gold)]' : 'text-[var(--color-accent)]',
        )}
      >
        {overline}
      </p>
      <h2
        className={cn(
          'mt-3 font-display text-[clamp(2rem,6vw,2.9rem)] font-light leading-[1.1]',
          tone === 'ink' ? 'text-[oklch(0.965_0.012_88)]' : 'text-[var(--color-foreground)]',
        )}
      >
        {title}
      </h2>
      <div
        className={cn(
          'mt-5 w-28',
          centered && 'mx-auto',
          tone === 'ink' ? 'text-[var(--color-gold)]/70' : 'text-[var(--color-gold-deep)]/80',
        )}
      >
        <Ornament />
      </div>
    </div>
  )
}
