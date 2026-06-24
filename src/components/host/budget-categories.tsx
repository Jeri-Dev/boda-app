'use client'

import { useActionState, useEffect, useState, useTransition } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogBody,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  createCategory,
  deleteCategory,
  updateCategory,
  type CategoryActionState,
} from '@/lib/actions/presupuesto'
import { formatCents } from '@/lib/utils/money'

export type CategoryRow = {
  id: string
  name: string
  plannedCents: number
  pagadoCents: number
}

function CategoryForm({
  category,
  onSuccess,
  onCancel,
}: {
  category?: CategoryRow
  onSuccess: () => void
  onCancel: () => void
}) {
  const action = category
    ? updateCategory.bind(null, category.id)
    : createCategory
  const [state, formAction, pending] = useActionState<
    CategoryActionState,
    FormData
  >(action, undefined)

  useEffect(() => {
    if (state?.ok) onSuccess()
  }, [state, onSuccess])

  const plannedDefault = category
    ? (category.plannedCents / 100).toFixed(2)
    : ''

  return (
    <form action={formAction} noValidate>
      <DialogBody className="grid gap-4">
        <Field label="Nombre" error={state?.fieldErrors?.name?.[0]} required>
          <Input
            name="name"
            placeholder="Catering, Música…"
            defaultValue={category?.name ?? ''}
            autoFocus
          />
        </Field>
        <Field
          label="Previsto (RD$)"
          hint="Solo números, p.ej. 150000"
          error={state?.fieldErrors?.planned?.[0]}
        >
          <Input
            name="planned"
            inputMode="decimal"
            placeholder="0.00"
            defaultValue={plannedDefault}
          />
        </Field>
        {state?.error ? (
          <p
            role="alert"
            className="text-sm font-medium text-[var(--color-destructive)]"
          >
            {state.error}
          </p>
        ) : null}
      </DialogBody>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={pending}
          aria-busy={pending}
        >
          {category ? 'Guardar cambios' : 'Añadir categoría'}
        </Button>
      </DialogFooter>
    </form>
  )
}

export function BudgetCategories({
  categories,
}: {
  categories: CategoryRow[]
}) {
  const [editing, setEditing] = useState<CategoryRow | null | undefined>(
    undefined,
  )
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [, startTransition] = useTransition()
  const dialogOpen = editing !== undefined

  function handleDelete(c: CategoryRow) {
    if (
      !window.confirm(
        `¿Borrar la categoría “${c.name}”? Los pagos se conservan, sin categoría.`,
      )
    ) {
      return
    }
    setDeletingId(c.id)
    startTransition(async () => {
      const res = await deleteCategory(c.id)
      setDeletingId(null)
      if (!res.ok) window.alert(res.error)
    })
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-[var(--color-muted-foreground)]">
          {categories.length}{' '}
          {categories.length === 1 ? 'categoría' : 'categorías'}
        </p>
        <Button variant="outline" size="sm" onClick={() => setEditing(null)}>
          Nueva categoría
        </Button>
      </div>

      {categories.length === 0 ? (
        <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border)] bg-[var(--color-card)] px-6 py-8 text-center text-sm text-[var(--color-muted-foreground)]">
          Sin categorías todavía. Crea la primera para repartir el presupuesto.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] shadow-[var(--shadow-soft)]">
          <table className="w-full min-w-[36rem] border-collapse text-left text-[0.9375rem]">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-xs uppercase tracking-wide text-[var(--color-muted-foreground)]">
                <th scope="col" className="px-4 py-3 font-medium">
                  Categoría
                </th>
                <th scope="col" className="px-4 py-3 text-right font-medium">
                  Previsto
                </th>
                <th scope="col" className="px-4 py-3 text-right font-medium">
                  Pagado
                </th>
                <th scope="col" className="px-4 py-3 text-right font-medium">
                  Restante
                </th>
                <th scope="col" className="px-4 py-3 text-right font-medium">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => {
                const restante = c.plannedCents - c.pagadoCents
                return (
                  <tr
                    key={c.id}
                    className="border-b border-[var(--color-border)] last:border-b-0"
                  >
                    <td className="px-4 py-3 font-medium text-[var(--color-foreground)]">
                      {c.name}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-[var(--color-foreground)]">
                      {formatCents(c.plannedCents)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-[var(--color-muted-foreground)]">
                      {formatCents(c.pagadoCents)}
                    </td>
                    <td
                      className={`px-4 py-3 text-right tabular-nums ${
                        restante < 0
                          ? 'font-medium text-[var(--color-destructive)]'
                          : 'text-[var(--color-foreground)]'
                      }`}
                    >
                      {formatCents(restante)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditing(c)}
                        >
                          Editar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={deletingId === c.id}
                          onClick={() => handleDelete(c)}
                          className="text-[var(--color-destructive)]"
                        >
                          Borrar
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <Dialog
        open={dialogOpen}
        onOpenChange={(o) => {
          if (!o) setEditing(undefined)
        }}
        aria-labelledby="category-dialog-title"
        aria-describedby="category-dialog-desc"
      >
        {dialogOpen ? (
          <>
            <DialogHeader>
              <DialogTitle id="category-dialog-title">
                {editing ? 'Editar categoría' : 'Nueva categoría'}
              </DialogTitle>
              <DialogDescription id="category-dialog-desc">
                Importe previsto para esta partida del presupuesto.
              </DialogDescription>
            </DialogHeader>
            <CategoryForm
              key={editing?.id ?? 'new'}
              category={editing ?? undefined}
              onSuccess={() => setEditing(undefined)}
              onCancel={() => setEditing(undefined)}
            />
          </>
        ) : null}
      </Dialog>
    </>
  )
}
