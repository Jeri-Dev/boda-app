/**
 * Iconos SVG en línea (sin emojis, según la guía de UI). Trazo consistente de
 * 1.5, `currentColor`, tamaño controlado por la clase. Ligeros y auto-contenidos
 * (no requieren red — compatibles con la CSP estricta).
 */
import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

const base = (props: IconProps) => ({
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  focusable: false,
  ...props,
})

export function MapPin(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M20 10c0 4.4-8 12-8 12s-8-7.6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
}

export function CalendarIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="3" y="4.5" width="18" height="17" rx="2.5" />
      <path d="M3 9h18M8 2.5v4M16 2.5v4" />
    </svg>
  )
}

export function ClockIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  )
}

export function Heart(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 20s-7-4.35-9.33-9A5 5 0 0 1 12 6a5 5 0 0 1 9.33 5C19 15.65 12 20 12 20Z" />
    </svg>
  )
}

export function ChevronDown(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

export function Copy(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="9" y="9" width="12" height="12" rx="2.5" />
      <path d="M6 15H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1" />
    </svg>
  )
}

export function Check(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="m4.5 12.5 5 5 10-11" />
    </svg>
  )
}

export function Gift(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M20 12v8.5a.5.5 0 0 1-.5.5h-15a.5.5 0 0 1-.5-.5V12" />
      <path d="M2.5 8h19a.5.5 0 0 1 .5.5V11a.5.5 0 0 1-.5.5h-19A.5.5 0 0 1 2 11V8.5a.5.5 0 0 1 .5-.5ZM12 8v13" />
      <path d="M12 8S10.5 3 7.75 3a2.25 2.25 0 0 0 0 4.5H12Zm0 0s1.5-5 4.25-5a2.25 2.25 0 0 1 0 4.5H12Z" />
    </svg>
  )
}

export function Sparkle(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 3c.3 3.9 1.8 5.4 5.7 5.7C13.8 9 12.3 10.5 12 14.4 11.7 10.5 10.2 9 6.3 8.7 10.2 8.4 11.7 6.9 12 3Z" />
      <path d="M18.5 14c.15 1.85.85 2.55 2.7 2.7-1.85.15-2.55.85-2.7 2.7-.15-1.85-.85-2.55-2.7-2.7 1.85-.15 2.55-.85 2.7-2.7Z" />
    </svg>
  )
}

export function Menu(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  )
}

export function Close(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  )
}

export function Rings(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="9" cy="14" r="6" />
      <circle cx="15" cy="14" r="6" />
      <path d="M9 8V4.5M15 8V4.5M9 4.5l1.5-1.5M9 4.5 7.5 3M15 4.5 16.5 3M15 4.5 13.5 3" />
    </svg>
  )
}

export function ArrowRight(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  )
}

export function Church(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 2.5v5M9.8 4.8h4.4" />
      <path d="M6.5 21v-8.2L12 8.5l5.5 4.3V21" />
      <path d="M3 21h18" />
      <path d="M10 21v-3.4a2 2 0 0 1 4 0V21" />
    </svg>
  )
}

export function Champagne(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M9 2.5h6l-.7 6a2.8 2.8 0 0 1-5.6 0l-.7-6Z" />
      <path d="M9.5 6.5h5M12 11.5V19M9 21.5h6" />
    </svg>
  )
}

export function Cutlery(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M8 2.5v5.5a2.5 2.5 0 0 1-5 0V2.5" />
      <path d="M5.5 2.5v19" />
      <path d="M19 14.5V2.5a4.5 4.5 0 0 0-4.5 4.5v5.5a2 2 0 0 0 2 2H19Z" />
      <path d="M19 14.5v7" />
    </svg>
  )
}

export function Music(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M9.5 17.5V5.5l10-2v12" />
      <circle cx="6.8" cy="17.5" r="2.7" />
      <circle cx="16.8" cy="15.5" r="2.7" />
    </svg>
  )
}
