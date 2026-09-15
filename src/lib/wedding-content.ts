import type { GiftAccount, Wedding } from '@/lib/db/schema'

export type { GiftAccount }

/**
 * Modelo de contenido de la landing «Nuestra boda» (/nuestra-boda y
 * /i/[token]) y el mapeo desde la fila `wedding` (Drizzle) editada en
 * /configuracion.
 *
 * Módulo PURO (sin `server-only`, sin DB): las mismas funciones sirven al
 * servidor (page.tsx) y a los tests unitarios. Todo lo que devuelve es
 * serializable (strings/arrays/objetos planos) para viajar como props a los
 * Client Components.
 *
 * Regla de oro: cada bloque de la invitación se OCULTA cuando su dato está
 * vacío — nunca se muestran marcadores de posición ni «TODO» al invitado.
 *
 * ⚠️ Solo campos públicos. Los datos internos del lugar (teléfono, coordinador,
 * horas de fin) NO pasan por aquí y nunca se renderizan en la cara pública.
 */

/** Archivos estáticos que la landing busca en `public/`. */
export const LANDING_ASSETS = {
  /** Foto de la pareja (arco del hero + sección de la invitación). */
  coupleImage: '/pareja.jpg',
  /** Imagen 1200×630 para la previsualización al compartir (WhatsApp/OG). */
  ogImage: '/og-boda.jpg',
  /** Canción del reproductor flotante. */
  music: '/musica/nuestra-cancion.mp3',
} as const

/** República Dominicana: UTC-4 todo el año (sin horario de verano). */
export const EVENT_TZ = 'America/Santo_Domingo'
const EVENT_UTC_OFFSET = '-04:00'

export type EventPlace = {
  label: string
  place: string
  time: string | null
  address: string | null
  mapUrl: string | null
  /** La recepción reutiliza el lugar de la ceremonia. */
  sameAsCeremony: boolean
}

export type TimelineIcon = 'ceremonia' | 'brindis' | 'cena' | 'fiesta' | 'momento'

export type TimelineItem = {
  time: string | null
  title: string
  detail: string | null
  icon: TimelineIcon
}

export type GuestNote = { title: string; text: string }

export type WeddingContent = {
  couple: {
    /** Tal como se escribió en configuración, p. ej. «Esther & Jeriel». */
    names: string
    first: string
    second: string | null
    monogram: string
    hashtag: string | null
    parents: { line: string; names: string[] }[]
  }
  event: {
    /** Fecha y hora con el desfase de RD, p. ej. 2026-11-07T16:30:00-04:00. */
    startISO: string | null
    /** Fecha de calendario YYYY-MM-DD. */
    date: string | null
    timeLabel: string | null
    city: string | null
  }
  tagline: string
  welcome: string | null
  story: string[]
  quote: { text: string; attribution: string | null } | null
  ceremony: EventPlace | null
  reception: EventPlace | null
  timeline: TimelineItem[]
  dressCode: { title: string; note: string | null } | null
  notes: GuestNote[]
  gifts: {
    message: string | null
    envelopeNote: string | null
    accounts: GiftAccount[]
    details: string | null
  } | null
  contact: { whatsapp: string; href: string } | null
  privacyContact: string | null
  media: {
    coupleImageUrl: string
    musicUrl: string
    musicTitle: string | null
  }
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Helpers de texto                                                           */
/* ────────────────────────────────────────────────────────────────────────── */

function clean(value: string | null | undefined): string | null {
  const s = value?.trim()
  return s ? s : null
}

/** Líneas no vacías (recorta espacios). */
function lines(text: string | null | undefined): string[] {
  return (text ?? '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
}

/** Bloques separados por una (o más) líneas en blanco. */
function blocks(text: string | null | undefined): string[][] {
  return (text ?? '')
    .split(/\r?\n\s*\r?\n/)
    .map((b) => lines(b))
    .filter((b) => b.length > 0)
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/** «Esther & Jeriel» → ['Esther', 'Jeriel']; acepta &, +, «y», «and». */
export function splitCoupleNames(names: string): [string, string | null] {
  const parts = names
    .split(/\s*(?:&|\+|\by\b|\band\b)\s*/i)
    .map((p) => p.trim())
    .filter(Boolean)
  if (parts.length >= 2) return [parts[0], parts.slice(1).join(' & ')]
  return [names.trim(), null]
}

/** Monograma por iniciales: «E & J». */
export function monogramFor(first: string, second: string | null): string {
  const f = first.charAt(0).toUpperCase()
  const s = second?.charAt(0).toUpperCase()
  return s ? `${f} & ${s}` : f
}

/**
 * Hora en texto libre → {h, m} (24 h). Acepta «4:30 PM», «4 pm», «16:30»,
 * «4:30 p. m.». Sin sufijo AM/PM se interpreta como 24 h.
 */
export function parseTimeLabel(label: string | null | undefined): { h: number; m: number } | null {
  if (!label) return null
  const m = label.match(/(\d{1,2})(?:[:.h](\d{2}))?\s*([ap])?\.?\s*m?\.?/i)
  if (!m) return null
  let h = Number(m[1])
  const min = m[2] ? Number(m[2]) : 0
  const ampm = m[3]?.toLowerCase()
  if (Number.isNaN(h) || h > 23 || min > 59) return null
  if (ampm === 'p' && h < 12) h += 12
  if (ampm === 'a' && h === 12) h = 0
  return { h, m: min }
}

/**
 * Fecha (guardada a medianoche UTC desde el `<input type=date>`) + hora en
 * texto → ISO con el desfase de RD. Sin hora → medianoche local.
 */
export function eventStartISO(eventDate: Date | null, timeLabel: string | null): string | null {
  if (!eventDate) return null
  const date = eventDate.toISOString().slice(0, 10)
  const t = parseTimeLabel(timeLabel) ?? { h: 0, m: 0 }
  const hh = String(t.h).padStart(2, '0')
  const mm = String(t.m).padStart(2, '0')
  return `${date}T${hh}:${mm}:00${EVENT_UTC_OFFSET}`
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Itinerario                                                                 */
/* ────────────────────────────────────────────────────────────────────────── */

const TIME_RE = /^\d{1,2}(?:[:.h]\d{2})?\s*(?:[ap]\.?\s*m\.?|h)?$/i

/** Icono según palabras clave del título. */
export function timelineIconFor(title: string): TimelineIcon {
  const t = title.toLowerCase()
  if (/ceremon|iglesia|parroquia|misa|boda|votos|civil/.test(t)) return 'ceremonia'
  if (/c[oó]ctel|brindis|bienvenida|aperitiv|recepci/.test(t)) return 'brindis'
  if (/cena|comida|banquete|almuerzo|pastel|torta/.test(t)) return 'cena'
  if (/fiesta|baile|bailar|m[uú]sica|dj|hora loca|celebraci/.test(t)) return 'fiesta'
  return 'momento'
}

/**
 * «Horario / agenda» → hitos. Una línea por hito:
 *   `4:00 PM · Ceremonia religiosa · Recíbenos con tu mejor sonrisa`
 * Separadores admitidos: «·», «|», « - », « – », « — ». La hora es opcional.
 */
export function parseSchedule(text: string | null | undefined): TimelineItem[] {
  return lines(text).map((line) => {
    const parts = line
      .split(/\s*[·|]\s*|\s+[-–—]\s+/)
      .map((p) => p.trim())
      .filter(Boolean)
    let time: string | null = null
    if (parts.length > 1 && TIME_RE.test(parts[0])) time = parts.shift() ?? null
    else {
      // «4:00 PM Ceremonia» sin separador.
      const m = parts[0]?.match(/^(\d{1,2}(?:[:.h]\d{2})?\s*(?:[ap]\.?\s*m\.?|h)?)\s+(.+)$/i)
      if (m) {
        time = m[1].trim()
        parts[0] = m[2].trim()
      }
    }
    const title = parts.shift() ?? line
    const detail = parts.length ? parts.join(' · ') : null
    return { time, title, detail, icon: timelineIconFor(title) }
  })
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Bloques de texto                                                           */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * Etiqueta: si no hay nota explícita y el título es largo con una coma o un
 * punto, se parte en título + nota («Vestimenta formal, deja el blanco para la
 * novia» → «Vestimenta formal» / «Deja el blanco para la novia»).
 */
export function parseDressCode(
  title: string | null | undefined,
  note: string | null | undefined,
): { title: string; note: string | null } | null {
  const t = clean(title)
  const n = clean(note)
  if (!t) return null
  if (n) return { title: t, note: n }
  const m = t.match(/^(.{3,60}?)[,.;:]\s+(.{6,})$/)
  if (m) return { title: m[1].trim(), note: capitalize(m[2].trim()) }
  return { title: t, note: null }
}

/**
 * Detalles prácticos: bloques separados por una línea en blanco; la primera
 * línea es el título. Una sola línea «Título: texto» también vale.
 */
export function parseNotes(text: string | null | undefined): GuestNote[] {
  return blocks(text).map((b) => {
    if (b.length >= 2) return { title: b[0].replace(/:$/, ''), text: b.slice(1).join('\n') }
    const m = b[0].match(/^([^:]{2,60}):\s*(.+)$/)
    if (m) return { title: m[1].trim(), text: m[2].trim() }
    return { title: 'Ten en cuenta', text: b[0] }
  })
}

/** Nombres: una por línea, o separados por comas / «y» en una sola línea. */
export function parseNames(text: string | null | undefined): string[] {
  const ls = lines(text)
  if (ls.length !== 1) return ls
  return ls[0]
    .split(/\s*,\s*|\s+y\s+/i)
    .map((s) => s.trim())
    .filter(Boolean)
}

/** Solo dígitos; null si no parece un número internacional. */
export function normalizeWhatsapp(value: string | null | undefined): string | null {
  const digits = (value ?? '').replace(/\D/g, '')
  return digits.length >= 8 && digits.length <= 15 ? digits : null
}

/** Normaliza y valida la lista de cuentas guardada en JSON. */
export function normalizeAccounts(value: unknown): GiftAccount[] {
  if (!Array.isArray(value)) return []
  return value
    .map((a) => {
      const o = (a ?? {}) as Record<string, unknown>
      const str = (k: string) => (typeof o[k] === 'string' ? (o[k] as string).trim() : '')
      return {
        bank: str('bank'),
        holder: str('holder'),
        type: str('type'),
        number: str('number'),
        currency: str('currency').toUpperCase(),
        reference: str('reference'),
      }
    })
    .filter((a) => a.bank && a.number)
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Mapeo principal                                                            */
/* ────────────────────────────────────────────────────────────────────────── */

export const DEFAULT_COUPLE = 'Nuestra boda'
export const DEFAULT_TAGLINE = 'Nos casamos'

export function buildWeddingContent(row: Wedding | null): WeddingContent {
  const names = clean(row?.coupleNames) ?? DEFAULT_COUPLE
  const [first, second] = splitCoupleNames(names)
  const monogram = clean(row?.monogram) ?? monogramFor(first, second)
  const hashtagRaw = clean(row?.hashtag)
  const hashtag = hashtagRaw ? (hashtagRaw.startsWith('#') ? hashtagRaw : `#${hashtagRaw}`) : null

  const parents: WeddingContent['couple']['parents'] = []
  const bride = parseNames(row?.brideParents)
  const groom = parseNames(row?.groomParents)
  if (bride.length) parents.push({ line: 'Padres de la novia', names: bride })
  if (groom.length) parents.push({ line: 'Padres del novio', names: groom })

  const timeLabel = clean(row?.eventTime)
  const eventDate = row?.eventDate ? new Date(row.eventDate) : null
  const startISO = eventStartISO(eventDate, timeLabel)

  const venue = clean(row?.venue)
  const ceremony: EventPlace | null = venue
    ? {
        label: 'Ceremonia',
        place: venue,
        time: clean(row?.ceremonyStart) ?? timeLabel,
        address: clean(row?.venueAddress),
        mapUrl: clean(row?.mapUrl),
        sameAsCeremony: false,
      }
    : null

  const receptionPlace = clean(row?.receptionPlace)
  const receptionStart = clean(row?.receptionStart)
  let reception: EventPlace | null = null
  if (receptionPlace) {
    reception = {
      label: 'Recepción',
      place: receptionPlace,
      time: receptionStart,
      address: clean(row?.receptionAddress),
      mapUrl: clean(row?.receptionMapUrl),
      sameAsCeremony: false,
    }
  } else if (ceremony && receptionStart) {
    reception = { ...ceremony, label: 'Recepción', time: receptionStart, sameAsCeremony: true }
  }

  let timeline = parseSchedule(row?.schedule)
  if (!timeline.length) {
    if (ceremony?.time) {
      timeline.push({ time: ceremony.time, title: 'Ceremonia', detail: null, icon: 'ceremonia' })
    }
    if (reception?.time) {
      timeline.push({ time: reception.time, title: 'Recepción', detail: null, icon: 'brindis' })
    }
  }
  timeline = timeline.slice(0, 12)

  const notes = parseNotes(row?.guestNotes)
  const accommodation = clean(row?.accommodation)
  const transport = clean(row?.transport)
  if (transport) notes.push({ title: 'Transporte', text: transport })
  if (accommodation) notes.push({ title: 'Alojamiento', text: accommodation })

  const accounts = normalizeAccounts(row?.giftAccounts)
  const giftMessage = clean(row?.giftMessage)
  const giftDetails = clean(row?.giftDetails)
  const giftEnvelopeNote = clean(row?.giftEnvelopeNote)
  const gifts =
    giftMessage || giftDetails || accounts.length
      ? { message: giftMessage, envelopeNote: giftEnvelopeNote, accounts, details: giftDetails }
      : null

  const whatsapp = normalizeWhatsapp(row?.contactWhatsapp)
  const quoteText = clean(row?.quoteText)

  return {
    couple: { names, first, second, monogram, hashtag, parents },
    event: {
      startISO,
      date: eventDate ? eventDate.toISOString().slice(0, 10) : null,
      timeLabel,
      city: clean(row?.city),
    },
    tagline: clean(row?.tagline) ?? DEFAULT_TAGLINE,
    welcome: clean(row?.message),
    story: lines(row?.story),
    quote: quoteText ? { text: quoteText, attribution: clean(row?.quoteAttribution) } : null,
    ceremony,
    reception,
    timeline,
    dressCode: parseDressCode(row?.dressCode, row?.dressCodeNote),
    notes,
    gifts,
    contact: whatsapp ? { whatsapp, href: `https://wa.me/${whatsapp}` } : null,
    privacyContact: clean(row?.privacyContact),
    media: {
      coupleImageUrl: clean(row?.coupleImageUrl) ?? LANDING_ASSETS.coupleImage,
      musicUrl: LANDING_ASSETS.music,
      musicTitle: clean(row?.musicTitle),
    },
  }
}

/** Secciones presentes (para la navegación de la cabecera). */
export function landingSections(c: WeddingContent): { id: string; label: string }[] {
  const s: { id: string; label: string }[] = [{ id: 'invitacion', label: 'Invitación' }]
  if (c.ceremony || c.reception) s.push({ id: 'lugar', label: 'Lugar' })
  if (c.timeline.length || c.dressCode || c.notes.length) s.push({ id: 'detalles', label: 'Detalles' })
  if (c.gifts) s.push({ id: 'regalos', label: 'Regalos' })
  s.push({ id: 'confirmar', label: 'Confirmar' })
  return s
}
