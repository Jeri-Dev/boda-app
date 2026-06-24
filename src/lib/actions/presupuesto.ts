'use server'

/**
 * Budget + payment CRUD Server Actions (U1.3). Open app (no auth gate). Same
 * recipe as the other modules. Soft references: payments hold `vendorId` /
 * `categoryId` without an enforced FK, so deleting a category here (and a
 * vendor in proveedores.ts) nulls those refs in app code.
 */

import 'server-only'

import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { db } from '@/lib/db'
import { budgetCategories, payments, PAYMENT_STATUSES } from '@/lib/db/schema'
import { parseMoneyToCents } from '@/lib/utils/money'

function readStr(formData: FormData, key: string) {
  const v = formData.get(key)
  return typeof v === 'string' ? v.trim() : ''
}
function readOpt(formData: FormData, key: string) {
  const s = readStr(formData, key)
  return s.length > 0 ? s : undefined
}

const moneyField = z.preprocess(
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
)

/* ── Categories ─────────────────────────────────────────────────────────── */

const CategorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Nombre requerido')
    .max(120, 'Máximo 120 caracteres'),
  planned: moneyField,
})

type CategoryField = keyof z.infer<typeof CategorySchema>

export type CategoryActionState =
  | {
      ok?: true
      error?: string
      fieldErrors?: Partial<Record<CategoryField, string[]>>
    }
  | undefined

function readCategory(formData: FormData) {
  return { name: readStr(formData, 'name'), planned: readStr(formData, 'planned') }
}

export async function createCategory(
  _prev: CategoryActionState,
  formData: FormData,
): Promise<CategoryActionState> {
  const parsed = CategorySchema.safeParse(readCategory(formData))
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors }

  try {
    await db.insert(budgetCategories).values({
      name: parsed.data.name,
      plannedCents: parsed.data.planned ?? 0,
    })
  } catch {
    return { error: 'No se pudo crear la categoría' }
  }

  revalidatePath('/presupuesto')
  return { ok: true }
}

export async function updateCategory(
  id: string,
  _prev: CategoryActionState,
  formData: FormData,
): Promise<CategoryActionState> {
  const parsed = CategorySchema.safeParse(readCategory(formData))
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors }

  try {
    const updated = await db
      .update(budgetCategories)
      .set({ name: parsed.data.name, plannedCents: parsed.data.planned ?? 0 })
      .where(eq(budgetCategories.id, id))
      .returning({ id: budgetCategories.id })
    if (updated.length === 0) return { error: 'Categoría no encontrada' }
  } catch {
    return { error: 'No se pudo actualizar la categoría' }
  }

  revalidatePath('/presupuesto')
  return { ok: true }
}

export async function deleteCategory(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    // Soft-ref cleanup + delete in one atomic batch: detach payments from the
    // category, then remove it.
    const [, deleted] = await db.batch([
      db
        .update(payments)
        .set({ categoryId: null })
        .where(eq(payments.categoryId, id)),
      db
        .delete(budgetCategories)
        .where(eq(budgetCategories.id, id))
        .returning({ id: budgetCategories.id }),
    ])
    if (deleted.length === 0) {
      return { ok: false, error: 'Categoría no encontrada' }
    }
  } catch {
    return { ok: false, error: 'No se pudo eliminar la categoría' }
  }

  revalidatePath('/presupuesto')
  return { ok: true }
}

/* ── Payments ───────────────────────────────────────────────────────────── */

const PaymentSchema = z.object({
  concept: z
    .string()
    .trim()
    .min(1, 'Concepto requerido')
    .max(160, 'Máximo 160 caracteres'),
  amount: moneyField,
  status: z.enum(PAYMENT_STATUSES),
  dueDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida')
    // Shape isn't enough: reject impossible dates (2026-13-40, 2026-02-31).
    .refine((s) => {
      const d = new Date(`${s}T00:00:00Z`)
      return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s
    }, 'Fecha inexistente')
    .optional(),
  vendorId: z.string().trim().max(64).optional(),
  categoryId: z.string().trim().max(64).optional(),
  notes: z.string().trim().max(2000, 'Máximo 2000 caracteres').optional(),
})

type PaymentField = keyof z.infer<typeof PaymentSchema>

export type PaymentActionState =
  | {
      ok?: true
      error?: string
      fieldErrors?: Partial<Record<PaymentField, string[]>>
    }
  | undefined

function readPayment(formData: FormData) {
  return {
    concept: readStr(formData, 'concept'),
    amount: readStr(formData, 'amount'),
    status: readStr(formData, 'status') || 'pendiente',
    dueDate: readOpt(formData, 'dueDate'),
    vendorId: readOpt(formData, 'vendorId'),
    categoryId: readOpt(formData, 'categoryId'),
    notes: readOpt(formData, 'notes'),
  }
}

function paymentRow(data: z.infer<typeof PaymentSchema>) {
  return {
    concept: data.concept,
    amountCents: data.amount ?? 0,
    status: data.status,
    dueDate: data.dueDate ?? null,
    vendorId: data.vendorId ?? null,
    categoryId: data.categoryId ?? null,
    notes: data.notes ?? null,
  }
}

export async function createPayment(
  _prev: PaymentActionState,
  formData: FormData,
): Promise<PaymentActionState> {
  const parsed = PaymentSchema.safeParse(readPayment(formData))
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors }

  try {
    await db.insert(payments).values(paymentRow(parsed.data))
  } catch {
    return { error: 'No se pudo crear el pago' }
  }

  revalidatePath('/presupuesto')
  return { ok: true }
}

export async function updatePayment(
  id: string,
  _prev: PaymentActionState,
  formData: FormData,
): Promise<PaymentActionState> {
  const parsed = PaymentSchema.safeParse(readPayment(formData))
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors }

  try {
    const updated = await db
      .update(payments)
      .set(paymentRow(parsed.data))
      .where(eq(payments.id, id))
      .returning({ id: payments.id })
    if (updated.length === 0) return { error: 'Pago no encontrado' }
  } catch {
    return { error: 'No se pudo actualizar el pago' }
  }

  revalidatePath('/presupuesto')
  return { ok: true }
}

export async function deletePayment(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const deleted = await db
      .delete(payments)
      .where(eq(payments.id, id))
      .returning({ id: payments.id })
    if (deleted.length === 0) return { ok: false, error: 'Pago no encontrado' }
  } catch {
    return { ok: false, error: 'No se pudo eliminar el pago' }
  }

  revalidatePath('/presupuesto')
  return { ok: true }
}
