'use server'

import 'server-only'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { requireBackofficeAuth } from '@/lib/auth/backoffice'
import { db } from '@/lib/db'
import { wedding, type GiftAccount } from '@/lib/db/schema'
import { normalizeAccounts } from '@/lib/wedding-content'

/**
 * Wedding config (U2.2 + landing «Nuestra boda»). The `wedding` table is a
 * singleton (id = 1, enforced by a CHECK). This upserts that single row; the
 * public landing (/nuestra-boda, /i/[token]) reads from it.
 */

const HttpUrl = z
  .string()
  .trim()
  .url('Enlace inválido (debe empezar por http)')
  .max(2048, 'Enlace demasiado largo')
  .refine((u) => {
    try {
      return ['http:', 'https:'].includes(new URL(u).protocol)
    } catch {
      return false
    }
  }, 'Solo se permiten enlaces http/https')

/** Same-origin path (`/pareja.jpg`) or an https URL. */
const ImageRef = z
  .string()
  .trim()
  .max(2048, 'Ruta demasiado larga')
  .refine((v) => {
    if (v.startsWith('/') && !v.startsWith('//')) return true
    try {
      return new URL(v).protocol === 'https:'
    } catch {
      return false
    }
  }, 'Usa una ruta del sitio (/pareja.jpg) o un enlace https')

const AccountSchema = z
  .object({
    bank: z.string().trim().min(1, 'Banco requerido').max(80, 'Máximo 80 caracteres'),
    holder: z.string().trim().max(120, 'Máximo 120 caracteres'),
    type: z.string().trim().max(60, 'Máximo 60 caracteres'),
    number: z.string().trim().min(1, 'Número requerido').max(60, 'Máximo 60 caracteres'),
    currency: z.string().trim().max(8, 'Máximo 8 caracteres'),
    reference: z.string().trim().max(120, 'Máximo 120 caracteres'),
  })
  .strict()

const text = (max: number) => z.string().trim().max(max, `Máximo ${max} caracteres`).optional()

const ConfigSchema = z.object({
  coupleNames: z.string().trim().max(160, 'Máximo 160 caracteres'),
  eventDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida')
    .refine((s) => {
      const d = new Date(`${s}T00:00:00Z`)
      return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s
    }, 'Fecha inexistente')
    .optional(),
  eventTime: text(40),
  venue: text(200),
  message: text(2000),
  // Public info (U2.5).
  mapUrl: HttpUrl.optional(),
  schedule: text(2000),
  dressCode: text(200),
  accommodation: text(2000),
  transport: text(2000),
  giftMessage: text(2000),
  giftDetails: text(2000),
  privacyContact: text(200),
  // Venue / ceremony / reception (U9). Address + start times are PUBLIC on the
  // landing; phone / coordinator / end times stay host-only.
  venueAddress: text(300),
  venuePhone: text(40),
  venueCoordinator: text(160),
  ceremonyStart: text(40),
  ceremonyEnd: text(40),
  receptionStart: text(40),
  receptionEnd: text(40),
  // Landing «Nuestra boda».
  monogram: text(12),
  hashtag: text(60),
  city: text(120),
  tagline: text(80),
  story: text(4000),
  quoteText: text(500),
  quoteAttribution: text(120),
  brideParents: text(300),
  groomParents: text(300),
  dressCodeNote: text(400),
  guestNotes: text(3000),
  receptionPlace: text(200),
  receptionAddress: text(300),
  receptionMapUrl: HttpUrl.optional(),
  giftEnvelopeNote: text(400),
  giftAccounts: z.array(AccountSchema).max(6, 'Máximo 6 cuentas'),
  contactWhatsapp: z
    .string()
    .trim()
    .regex(/^\d{8,15}$/, 'Número inválido (usa el formato internacional, p. ej. +1 809 555 0000)')
    .optional(),
  coupleImageUrl: ImageRef.optional(),
  musicTitle: text(120),
})

export type ConfigField = keyof z.infer<typeof ConfigSchema>

export type ConfigActionState =
  | {
      ok?: true
      error?: string
      fieldErrors?: Partial<Record<ConfigField, string[]>>
    }
  | undefined

export async function saveConfig(
  _prev: ConfigActionState,
  formData: FormData,
): Promise<ConfigActionState> {
  await requireBackofficeAuth()
  const str = (k: string) => {
    const v = formData.get(k)
    return typeof v === 'string' ? v.trim() : ''
  }
  const opt = (k: string) => {
    const s = str(k)
    return s.length > 0 ? s : undefined
  }

  // Accounts arrive as a JSON list from the repeatable editor. Blank rows are
  // dropped before validation so an unused row never blocks the save.
  let giftAccounts: unknown = []
  try {
    giftAccounts = normalizeAccounts(JSON.parse(str('giftAccounts') || '[]'))
  } catch {
    return { fieldErrors: { giftAccounts: ['Cuentas inválidas'] } }
  }

  const whatsappDigits = str('contactWhatsapp').replace(/\D/g, '')

  const parsed = ConfigSchema.safeParse({
    coupleNames: str('coupleNames'),
    eventDate: opt('eventDate'),
    eventTime: opt('eventTime'),
    venue: opt('venue'),
    message: opt('message'),
    mapUrl: opt('mapUrl'),
    schedule: opt('schedule'),
    dressCode: opt('dressCode'),
    accommodation: opt('accommodation'),
    transport: opt('transport'),
    giftMessage: opt('giftMessage'),
    giftDetails: opt('giftDetails'),
    privacyContact: opt('privacyContact'),
    venueAddress: opt('venueAddress'),
    venuePhone: opt('venuePhone'),
    venueCoordinator: opt('venueCoordinator'),
    ceremonyStart: opt('ceremonyStart'),
    ceremonyEnd: opt('ceremonyEnd'),
    receptionStart: opt('receptionStart'),
    receptionEnd: opt('receptionEnd'),
    monogram: opt('monogram'),
    hashtag: opt('hashtag'),
    city: opt('city'),
    tagline: opt('tagline'),
    story: opt('story'),
    quoteText: opt('quoteText'),
    quoteAttribution: opt('quoteAttribution'),
    brideParents: opt('brideParents'),
    groomParents: opt('groomParents'),
    dressCodeNote: opt('dressCodeNote'),
    guestNotes: opt('guestNotes'),
    receptionPlace: opt('receptionPlace'),
    receptionAddress: opt('receptionAddress'),
    receptionMapUrl: opt('receptionMapUrl'),
    giftEnvelopeNote: opt('giftEnvelopeNote'),
    giftAccounts,
    contactWhatsapp: whatsappDigits.length ? whatsappDigits : undefined,
    coupleImageUrl: opt('coupleImageUrl'),
    musicTitle: opt('musicTitle'),
  })
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors }
  }

  const d = parsed.data
  const accounts: GiftAccount[] = d.giftAccounts
  const values = {
    coupleNames: d.coupleNames,
    eventDate: d.eventDate ? new Date(d.eventDate) : null,
    eventTime: d.eventTime ?? null,
    venue: d.venue ?? null,
    message: d.message ?? null,
    mapUrl: d.mapUrl ?? null,
    schedule: d.schedule ?? null,
    dressCode: d.dressCode ?? null,
    accommodation: d.accommodation ?? null,
    transport: d.transport ?? null,
    giftMessage: d.giftMessage ?? null,
    giftDetails: d.giftDetails ?? null,
    privacyContact: d.privacyContact ?? null,
    venueAddress: d.venueAddress ?? null,
    venuePhone: d.venuePhone ?? null,
    venueCoordinator: d.venueCoordinator ?? null,
    ceremonyStart: d.ceremonyStart ?? null,
    ceremonyEnd: d.ceremonyEnd ?? null,
    receptionStart: d.receptionStart ?? null,
    receptionEnd: d.receptionEnd ?? null,
    monogram: d.monogram ?? null,
    hashtag: d.hashtag ?? null,
    city: d.city ?? null,
    tagline: d.tagline ?? null,
    story: d.story ?? null,
    quoteText: d.quoteText ?? null,
    quoteAttribution: d.quoteAttribution ?? null,
    brideParents: d.brideParents ?? null,
    groomParents: d.groomParents ?? null,
    dressCodeNote: d.dressCodeNote ?? null,
    guestNotes: d.guestNotes ?? null,
    receptionPlace: d.receptionPlace ?? null,
    receptionAddress: d.receptionAddress ?? null,
    receptionMapUrl: d.receptionMapUrl ?? null,
    giftEnvelopeNote: d.giftEnvelopeNote ?? null,
    giftAccounts: accounts.length ? accounts : null,
    contactWhatsapp: d.contactWhatsapp ?? null,
    coupleImageUrl: d.coupleImageUrl ?? null,
    musicTitle: d.musicTitle ?? null,
  }

  try {
    await db
      .insert(wedding)
      .values({ id: 1, ...values })
      .onConflictDoUpdate({ target: wedding.id, set: values })
  } catch {
    return { error: 'No se pudo guardar la configuración' }
  }

  revalidatePath('/configuracion')
  revalidatePath('/nuestra-boda')
  // The invitation surface reads this; bust any cached render.
  revalidatePath('/i', 'layout')
  return { ok: true }
}
