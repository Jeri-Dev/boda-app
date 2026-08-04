/**
 * Filigrana ornamental (SVG en línea) para separar secciones. Trazo fino con un
 * rombo central; hereda `currentColor`. Decorativa → `aria-hidden`.
 */
export function Ornament({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      aria-hidden
      className={className ?? 'h-5 w-full'}
    >
      <path d="M10 10h60" strokeLinecap="round" />
      <path d="M130 10h60" strokeLinecap="round" />
      <path d="M100 4l6 6-6 6-6-6 6-6Z" />
      <path d="M78 10c4-4 8-4 12 0-4 4-8 4-12 0Z" />
      <path d="M122 10c-4-4-8-4-12 0 4 4 8 4 12 0Z" />
      <circle cx="100" cy="10" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  )
}

/**
 * Thin gold corner brackets for cards — a stationery/foil-print touch. Parent
 * must be `relative`; the brackets are decorative and non-interactive.
 */
export function CornerAccents({ inset = 'inset-2.5' }: { inset?: string }) {
  const base = 'absolute h-6 w-6 border-[var(--color-gold)]'
  return (
    <div aria-hidden className={`pointer-events-none absolute ${inset} opacity-70`}>
      <span className={`${base} left-0 top-0 rounded-tl-[10px] border-l border-t`} />
      <span className={`${base} right-0 top-0 rounded-tr-[10px] border-r border-t`} />
      <span className={`${base} bottom-0 left-0 rounded-bl-[10px] border-b border-l`} />
      <span className={`${base} bottom-0 right-0 rounded-br-[10px] border-b border-r`} />
    </div>
  )
}

/**
 * Encabezado de sección reutilizable: overline + título serif + filigrana.
 */
export function SectionHeading({
  overline,
  title,
  className,
}: {
  overline: string
  title: string
  className?: string
}) {
  return (
    <div className={className ?? 'text-center'}>
      <p className="text-[0.7rem] uppercase tracking-[0.35em] text-[var(--color-accent)]">
        {overline}
      </p>
      <h2 className="mt-3 font-display text-3xl tracking-tight text-[var(--color-foreground)] sm:text-4xl">
        {title}
      </h2>
      <div className="mx-auto mt-5 w-32 text-[var(--color-accent)]/45">
        <Ornament />
      </div>
    </div>
  )
}
