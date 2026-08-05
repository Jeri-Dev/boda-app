import { Cormorant_Garamond, Pinyon_Script } from 'next/font/google'

/**
 * Tres voces, un trabajo cada una:
 *
 * - `script` (Pinyon Script) — solo los nombres, el monograma y el sello. Es
 *   una copperplate grabada, más fina y menos vista que la script por defecto
 *   de las invitaciones; se usa siempre a partir de ~1.6rem, nunca en texto
 *   corrido.
 * - `serif` (Cormorant Garamond) — títulos de sección, horas, lugares y la
 *   prosa. Una sola familia grabada en varios tamaños, como en la papelería
 *   impresa de verdad.
 * - Geist (global) — versalitas, etiquetas, botones y cifras tabulares.
 *
 * Ambas se auto-hospedan vía `next/font` (mismo origen), así que respetan la
 * CSP estricta (`font-src 'self' data:`) sin añadir hosts externos. Se aplican
 * solo dentro de la landing mediante sus variables en el contenedor raíz.
 */
export const script = Pinyon_Script({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-script',
  display: 'swap',
})

export const serif = Cormorant_Garamond({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  variable: '--font-serif-stack',
  display: 'swap',
})
