/**
 * Borde rasgado (deckle) entre el papel champán y las placas de tinta.
 *
 * Siempre es color PAPEL y va superpuesto al borde de un panel de tinta, de
 * modo que el papel parece desgarrado sobre la tinta. Un solo trazado
 * irregular, estirado con `preserveAspectRatio="none"`; en `bottom` se
 * voltea. Decorativo → `aria-hidden`.
 */
const DECKLE =
  'M0 0 L0 22 C18 21 27 30 44 27 C58 25 63 18 78 20 C96 23 104 33 122 31 C137 29 141 20 158 19 C173 18 179 26 196 27 C214 28 220 20 238 19 C254 18 259 27 277 28 C295 29 301 21 318 21 C336 21 343 31 361 30 C378 29 384 19 400 18 C417 17 422 25 441 26 C458 27 464 19 481 20 C498 21 503 30 522 30 C540 30 546 21 563 20 C580 19 585 27 603 28 C620 29 626 21 644 19 C661 17 667 26 684 28 C702 30 708 22 726 21 C743 20 748 28 766 29 C784 30 790 20 807 19 C824 18 829 26 847 27 C865 28 871 20 888 19 C905 18 910 27 928 29 C946 31 952 22 970 21 C987 20 992 28 1010 29 C1028 30 1034 21 1051 20 C1068 19 1073 27 1091 28 C1108 29 1114 20 1131 19 C1148 18 1155 27 1172 28 C1185 29 1191 24 1200 22 L1200 0 Z'

export function Edge({
  position,
  className,
}: {
  position: 'top' | 'bottom'
  className?: string
}) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 1200 34"
      preserveAspectRatio="none"
      className={`pointer-events-none absolute inset-x-0 z-10 h-6 w-full text-[var(--color-background)] sm:h-8 ${
        position === 'top' ? 'top-0' : 'bottom-0 rotate-180'
      } ${className ?? ''}`}
    >
      <path d={DECKLE} fill="currentColor" />
    </svg>
  )
}
