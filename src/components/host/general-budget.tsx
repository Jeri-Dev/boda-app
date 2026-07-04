'use client'

import { useActionState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  setGeneralBudget,
  type GeneralBudgetActionState,
} from '@/lib/actions/presupuesto'

/**
 * Inline editor for the overall/general budget envelope (U5). Writes to the
 * `wedding` singleton via a gated action. A cleared field resets it to 0.
 */
export function GeneralBudget({ currentCents }: { currentCents: number }) {
  const [state, formAction, pending] = useActionState<
    GeneralBudgetActionState,
    FormData
  >(setGeneralBudget, undefined)

  const defaultValue = currentCents > 0 ? String(currentCents / 100) : ''

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <label className="grid gap-1.5">
        <span className="text-[0.7rem] uppercase tracking-wide text-[var(--color-muted-foreground)]">
          Presupuesto general (RD$)
        </span>
        <Input
          name="total"
          inputMode="decimal"
          defaultValue={defaultValue}
          placeholder="0"
          aria-label="Presupuesto general"
          className="h-10 max-w-[12rem]"
        />
      </label>
      <Button
        type="submit"
        variant="outline"
        size="sm"
        disabled={pending}
        aria-busy={pending}
      >
        Guardar
      </Button>
      {state?.fieldErrors?.total?.[0] ? (
        <span role="alert" className="text-sm text-[var(--color-destructive)]">
          {state.fieldErrors.total[0]}
        </span>
      ) : state?.error ? (
        <span role="alert" className="text-sm text-[var(--color-destructive)]">
          {state.error}
        </span>
      ) : state?.ok ? (
        <span role="status" className="text-sm text-[var(--color-success)]">
          Guardado ✓
        </span>
      ) : null}
    </form>
  )
}
