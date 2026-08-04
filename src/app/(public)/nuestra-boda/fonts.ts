import { Great_Vibes } from 'next/font/google'

/**
 * Fuente script para los nombres y el monograma de la pareja. Se auto-hospeda
 * vía `next/font` (servida desde el propio origen), por lo que respeta la CSP
 * estricta (`font-src 'self' data:`) sin añadir un host externo.
 *
 * Se expone como variable CSS y se aplica solo dentro de la landing (no toca el
 * layout global) mediante `script.variable` en el contenedor raíz de la página.
 */
export const script = Great_Vibes({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-script',
  display: 'swap',
})
