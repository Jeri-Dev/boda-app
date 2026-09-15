'use client'

import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { GiftAccount } from '@/lib/db/schema'

const EMPTY: GiftAccount = {
  bank: '',
  holder: '',
  type: 'Cuenta de ahorros',
  number: '',
  currency: 'DOP',
  reference: '',
}

/**
 * Repeatable list of bank accounts for the gift registry. Serialises to a
 * hidden `giftAccounts` JSON field (same pattern as the RSVP form) so the
 * Server Action gets one well-typed value instead of N indexed inputs.
 */
export function GiftAccountsEditor({
  initial,
  error,
}: {
  initial: GiftAccount[]
  error?: string
}) {
  const [rows, setRows] = useState<GiftAccount[]>(initial.length ? initial : [])

  function update(i: number, patch: Partial<GiftAccount>) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)))
  }

  return (
    <div className="grid gap-4">
      <input type="hidden" name="giftAccounts" value={JSON.stringify(rows)} />

      {rows.length === 0 ? (
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Sin cuentas todavía. Añade una para que aparezca como tarjeta en la
          mesa de regalos.
        </p>
      ) : null}

      <ul className="grid gap-4">
        {rows.map((row, i) => (
          <li
            key={i}
            className="grid gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] p-4"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]">
                Cuenta {i + 1}
              </p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setRows((prev) => prev.filter((_, idx) => idx !== i))}
              >
                Quitar
              </Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1.5 text-sm">
                <span className="text-[var(--color-muted-foreground)]">Banco</span>
                <Input
                  value={row.bank}
                  onChange={(e) => update(i, { bank: e.target.value })}
                  placeholder="Banco Popular"
                />
              </label>
              <label className="grid gap-1.5 text-sm">
                <span className="text-[var(--color-muted-foreground)]">Titular</span>
                <Input
                  value={row.holder}
                  onChange={(e) => update(i, { holder: e.target.value })}
                  placeholder="Nombre del titular"
                />
              </label>
              <label className="grid gap-1.5 text-sm">
                <span className="text-[var(--color-muted-foreground)]">Tipo de cuenta</span>
                <Input
                  value={row.type}
                  onChange={(e) => update(i, { type: e.target.value })}
                  placeholder="Cuenta de ahorros"
                />
              </label>
              <label className="grid gap-1.5 text-sm">
                <span className="text-[var(--color-muted-foreground)]">Número</span>
                <Input
                  value={row.number}
                  onChange={(e) => update(i, { number: e.target.value })}
                  placeholder="000-0000000-0"
                />
              </label>
              <label className="grid gap-1.5 text-sm">
                <span className="text-[var(--color-muted-foreground)]">Moneda</span>
                <Input
                  value={row.currency}
                  onChange={(e) => update(i, { currency: e.target.value })}
                  placeholder="DOP"
                  maxLength={8}
                />
              </label>
              <label className="grid gap-1.5 text-sm">
                <span className="text-[var(--color-muted-foreground)]">
                  Referencia (cédula / alias, opcional)
                </span>
                <Input
                  value={row.reference}
                  onChange={(e) => update(i, { reference: e.target.value })}
                />
              </label>
            </div>
          </li>
        ))}
      </ul>

      {error ? (
        <p role="alert" className="text-xs font-medium text-[var(--color-destructive)]">
          {error}
        </p>
      ) : null}

      {rows.length < 6 ? (
        <div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setRows((prev) => [...prev, { ...EMPTY }])}
          >
            + Añadir cuenta
          </Button>
        </div>
      ) : null}
    </div>
  )
}
