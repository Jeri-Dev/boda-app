'use server'

/**
 * Vendor CRUD Server Actions (U1.2). Open app (no auth gate). Same recipe as
 * invitados: `'use server'` → `Schema.safeParse` → Drizzle mutation →
 * `revalidatePath`; create/update return `{ ok: true }` so the dialog closes.
 *
 * The contract is an external link (`contractUrl`) — there is no file Storage.
 * `amount` is parsed to integer cents.
 */

import 'server-only'

import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { db } from '@/lib/db'
import { vendors, VENDOR_STATUSES } from '@/lib/db/schema'
import { parseMoneyToCents } from '@/lib/utils/money'

const VendorSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Nombre requerido')
    .max(160, 'Máximo 160 caracteres'),
  category: z.string().trim().max(80, 'Máximo 80 caracteres').optional(),
  status: z.enum(VENDOR_STATUSES),
  email: z
    .string()
    .trim()
    .email('Email inválido')
    .max(254, 'Máximo 254 caracteres')
    .optional(),
  phone: z.string().trim().max(40, 'Máximo 40 caracteres').optional(),
  amount: z.preprocess(
    (v) => {
      if (typeof v !== 'string' || v.trim() === '') return null
      return parseMoneyToCents(v)
    },
    z
      .number({ message: 'Importe inválido' })
      .int('Importe inválido')
      .nonnegative('No puede ser negativo')
      .max(99_999_999_99, 'Importe demasiado alto')
      .nullable(),
  ),
  contractUrl: z
    .string()
    .trim()
    .url('Enlace inválido (debe empezar por http)')
    .max(2048, 'Enlace demasiado largo')
    // z.url() accepts javascript:/data: — restrict to web schemes so the
    // rendered <a href> can't execute on click.
    .refine((u) => {
      try {
        return ['http:', 'https:'].includes(new URL(u).protocol)
      } catch {
        return false
      }
    }, 'Solo se permiten enlaces http/https')
    .optional(),
  notes: z.string().trim().max(2000, 'Máximo 2000 caracteres').optional(),
})

type VendorField = keyof z.infer<typeof VendorSchema>

export type VendorActionState =
  | {
      ok?: true
      error?: string
      fieldErrors?: Partial<Record<VendorField, string[]>>
    }
  | undefined

function readForm(formData: FormData) {
  const str = (key: string) => {
    const v = formData.get(key)
    return typeof v === 'string' ? v.trim() : ''
  }
  const opt = (key: string) => {
    const s = str(key)
    return s.length > 0 ? s : undefined
  }
  return {
    name: str('name'),
    category: opt('category'),
    status: str('status') || 'contactado',
    email: opt('email'),
    phone: opt('phone'),
    amount: str('amount'),
    contractUrl: opt('contractUrl'),
    notes: opt('notes'),
  }
}

function toRow(data: z.infer<typeof VendorSchema>) {
  return {
    name: data.name,
    category: data.category ?? null,
    status: data.status,
    email: data.email ?? null,
    phone: data.phone ?? null,
    amountCents: data.amount,
    contractUrl: data.contractUrl ?? null,
    notes: data.notes ?? null,
  }
}

export async function createVendor(
  _prev: VendorActionState,
  formData: FormData,
): Promise<VendorActionState> {
  const parsed = VendorSchema.safeParse(readForm(formData))
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors }
  }

  try {
    await db.insert(vendors).values(toRow(parsed.data))
  } catch {
    return { error: 'No se pudo crear el proveedor' }
  }

  revalidatePath('/proveedores')
  return { ok: true }
}

export async function updateVendor(
  id: string,
  _prev: VendorActionState,
  formData: FormData,
): Promise<VendorActionState> {
  const parsed = VendorSchema.safeParse(readForm(formData))
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors }
  }

  try {
    const updated = await db
      .update(vendors)
      .set(toRow(parsed.data))
      .where(eq(vendors.id, id))
      .returning({ id: vendors.id })
    if (updated.length === 0) {
      return { error: 'Proveedor no encontrado' }
    }
  } catch {
    return { error: 'No se pudo actualizar el proveedor' }
  }

  revalidatePath('/proveedores')
  return { ok: true }
}

export async function deleteVendor(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    // payments.vendor_id has an `on delete set null` FK, so deleting the vendor
    // detaches its payments automatically (kept, ref nulled).
    const deleted = await db
      .delete(vendors)
      .where(eq(vendors.id, id))
      .returning({ id: vendors.id })
    if (deleted.length === 0) {
      return { ok: false, error: 'Proveedor no encontrado' }
    }
  } catch {
    return { ok: false, error: 'No se pudo eliminar el proveedor' }
  }

  revalidatePath('/proveedores')
  revalidatePath('/presupuesto')
  return { ok: true }
}
