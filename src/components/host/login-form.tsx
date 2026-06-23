'use client'

import { useActionState, useState } from 'react'

import { loginAction, type LoginState } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { site } from '@/lib/site'

const INITIAL_STATE: LoginState = undefined

/**
 * Host login form.
 *
 * Progressively enhanced via `useActionState`: works without JS (the action
 * runs server-side) and adds `pending` state + inline error rendering when
 * hydrated.
 *
 * Inputs are CONTROLLED by client `useState` so typed values survive a Server
 * Action re-render on auth error. The action never echoes the password back
 * through state — keeping the values client-side is the right place for that.
 *
 * Error policy:
 *   - `state.fieldErrors` → render under the relevant input (Zod failures).
 *   - `state.error` → destructive banner at the top of the card (Supabase
 *     failures collapse to one generic message to avoid email enumeration).
 */
export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, INITIAL_STATE)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="items-center text-center">
        <p className="text-[0.65rem] uppercase tracking-[0.25em] text-[var(--color-muted-foreground)]">
          {site.name}
        </p>
        <CardTitle className="text-2xl">Iniciar sesión</CardTitle>
        <CardDescription>
          Acceso privado a la gestión de la boda.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-4" noValidate>
          {state?.error ? (
            <div
              role="alert"
              className="rounded-[var(--radius)] border border-[var(--color-destructive)]/30 bg-[var(--color-destructive)]/10 px-3 py-2 text-sm font-medium text-[var(--color-destructive)]"
            >
              {state.error}
            </div>
          ) : null}

          <Field label="Correo" error={state?.fieldErrors?.email?.[0]} required>
            <Input
              name="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              placeholder="tu@correo.com"
              disabled={pending}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>

          <Field
            label="Contraseña"
            error={state?.fieldErrors?.password?.[0]}
            required
          >
            <PasswordInput
              name="password"
              autoComplete="current-password"
              placeholder="••••••••"
              disabled={pending}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            block
            disabled={pending}
            aria-busy={pending || undefined}
          >
            {pending ? 'Entrando…' : 'Entrar'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
