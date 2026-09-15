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

/** Etiqueta / código de vestimenta: esmoquin junto a un vestido largo. */
export function Attire(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M6.5 3.2 4 4.6V21h5V4.6L6.5 3.2Z" />
      <path d="M5 3.6 6.5 6 8 3.6" />
      <path d="M17.5 3.2c-1.6 0-2.5 1-2.5 2.6 0 1.6-1.5 3.6-1.5 6.2 0 2.4 1.6 3 1.6 5.2V21h4.8v-3.8c0-2.2 1.6-2.8 1.6-5.2 0-2.6-1.5-4.6-1.5-6.2 0-1.6-.9-2.6-2.5-2.6Z" />
      <path d="M16 3.6c.4 1 2.6 1 3 0" />
    </svg>
  )
}

/** Sobre cerrado — la marca del hero y de la lluvia de sobres. */
export function Envelope(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="2.5" y="5" width="19" height="14" rx="2" />
      <path d="M3 6.5 12 13.5 21 6.5" />
    </svg>
  )
}

/** Transferencia bancaria. */
export function Bank(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M3 9.5 12 4l9 5.5" />
      <path d="M4.5 9.5v8M9.5 9.5v8M14.5 9.5v8M19.5 9.5v8" />
      <path d="M2.5 20.5h19" />
    </svg>
  )
}

export function Play(props: IconProps) {
  return (
    <svg {...base(props)} fill="currentColor" stroke="none">
      <path d="M7 4.5v15a.8.8 0 0 0 1.2.7l12-7.5a.8.8 0 0 0 0-1.4l-12-7.5A.8.8 0 0 0 7 4.5Z" />
    </svg>
  )
}

export function Pause(props: IconProps) {
  return (
    <svg {...base(props)} fill="currentColor" stroke="none">
      <rect x="6" y="4" width="4" height="16" rx="1" />
      <rect x="14" y="4" width="4" height="16" rx="1" />
    </svg>
  )
}

export function Volume(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M11 5 6 9H3v6h3l5 4V5Z" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7" />
      <path d="M18.5 5.5a9 9 0 0 1 0 13" />
    </svg>
  )
}

export function VolumeOff(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M11 5 6 9H3v6h3l5 4V5Z" />
      <path d="m22 9-6 6" />
      <path d="m16 9 6 6" />
    </svg>
  )
}

export function Whatsapp(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M3.5 20.5 5 16.2A8.5 8.5 0 1 1 8 19.1l-4.5 1.4Z" />
      <path d="M9.2 8.6c.2-.5.5-.5.8-.5h.5c.2 0 .4.1.5.4l.6 1.5c.1.2 0 .4-.1.6l-.5.6c-.1.1-.1.3 0 .4a6 6 0 0 0 2.9 2.7c.2.1.3.1.4 0l.6-.7c.2-.2.4-.2.6-.1l1.5.7c.2.1.3.3.3.5-.1.8-.6 1.5-1.4 1.7-.6.2-1.3.1-2.2-.3a9.3 9.3 0 0 1-4.3-4.1c-.5-1-.5-1.9-.2-2.7Z" />
    </svg>
  )
}

export function Download(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 4v11" />
      <path d="m7 10 5 5 5-5" />
      <path d="M4 19h16" />
    </svg>
  )
}

export function Apple(props: IconProps) {
  return (
    <svg {...base(props)} fill="currentColor" stroke="none">
      <path d="M16.4 12.7c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.1-2.8.9-3.5.9-.7 0-1.8-.9-3-.8-1.5 0-3 .9-3.8 2.3-1.6 2.8-.4 7 1.2 9.3.8 1.1 1.7 2.4 2.9 2.3 1.2 0 1.6-.8 3-.8s1.8.8 3 .8 2-1.1 2.8-2.3c.9-1.3 1.2-2.5 1.3-2.6-.1 0-2.5-.9-2.5-3.8ZM14.1 5.9c.6-.8 1.1-1.9.9-3-.9 0-2 .6-2.7 1.4-.6.7-1.1 1.8-1 2.9 1.1.1 2.1-.5 2.8-1.3Z" />
    </svg>
  )
}

export function Google(props: IconProps) {
  return (
    <svg {...base(props)} fill="currentColor" stroke="none">
      <path d="M21.6 12.2c0-.7-.1-1.3-.2-1.9H12v3.7h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.3Z" opacity=".9" />
      <path d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22Z" opacity=".75" />
      <path d="M6.4 14a6 6 0 0 1 0-3.9V7.5H3.1a10 10 0 0 0 0 9l3.3-2.5Z" opacity=".6" />
      <path d="M12 6c1.5 0 2.8.5 3.8 1.5l2.8-2.8A10 10 0 0 0 3.1 7.5l3.3 2.6C7.2 7.8 9.4 6 12 6Z" opacity=".85" />
    </svg>
  )
}
