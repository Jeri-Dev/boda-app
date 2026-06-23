import { chromium, type FullConfig } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { dirname } from 'node:path'
import { createClient } from '@supabase/supabase-js'

/**
 * Global setup — provision the test host, then log in once and persist the
 * authenticated state to `tests/.auth/host.json`.
 *
 * Self-bootstrapping against the LOCAL Supabase stack (the user's chosen test
 * target): using the service key we (1) create the host auth user if missing
 * and force its password to match the env, and (2) add it to
 * `public.host_allowlist` (service role bypasses RLS, and the allowlist is
 * wiped by `supabase db reset`). Then we drive the real login form so the
 * captured cookies are exactly what the app issues.
 *
 * NOTE: runs ONCE per `pnpm test:e2e`, before any spec.
 */
const STORAGE_PATH = 'tests/.auth/host.json'

export default async function globalSetup(config: FullConfig) {
  const email = process.env.PLAYWRIGHT_HOST_EMAIL ?? 'host@test.local'
  const password =
    process.env.PLAYWRIGHT_HOST_PASSWORD ?? 'test-host-password-123'
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey =
    process.env.PLAYWRIGHT_SUPABASE_SERVICE_KEY ??
    process.env.SUPABASE_SERVICE_ROLE_KEY
  const baseURL = config.projects[0]?.use.baseURL ?? 'http://localhost:3000'

  if (!url || !serviceKey) {
    throw new Error(
      'global-setup: NEXT_PUBLIC_SUPABASE_URL and a service key (PLAYWRIGHT_SUPABASE_SERVICE_KEY) are required. See tests/e2e/README.md.',
    )
  }

  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  // 1. Find-or-create the host user; force the password so reruns are stable.
  const { data: list, error: listErr } = await admin.auth.admin.listUsers()
  if (listErr) throw listErr
  const existing = list.users.find((u) => u.email === email)

  let userId: string | undefined
  if (existing) {
    userId = existing.id
    const { error } = await admin.auth.admin.updateUserById(userId, {
      password,
      email_confirm: true,
    })
    if (error) throw error
  } else {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })
    if (error) throw error
    userId = data.user?.id
  }
  if (!userId) throw new Error('global-setup: could not resolve host user id')

  // 2. Ensure allowlist membership (idempotent; service role bypasses RLS).
  const { error: upErr } = await admin
    .from('host_allowlist')
    .upsert({ user_id: userId }, { onConflict: 'user_id' })
  if (upErr) throw upErr

  // 3. Drive the real login form and capture the session.
  await mkdir(dirname(STORAGE_PATH), { recursive: true })
  const browser = await chromium.launch()
  try {
    const context = await browser.newContext({ baseURL })
    const page = await context.newPage()

    await page.goto('/login')
    await page.getByLabel(/correo/i).fill(email)
    // `input[name="password"]` avoids the strict-mode clash with the show/hide
    // toggle button, whose aria-label also contains "contraseña".
    await page.locator('input[name="password"]').fill(password)
    await page.getByRole('button', { name: /entrar/i }).click()

    // loginAction redirects to the dashboard root `/`. Wait until we leave
    // /login (any non-login path counts).
    await page.waitForURL((u) => !u.pathname.startsWith('/login'), {
      timeout: 15_000,
    })

    await context.storageState({ path: STORAGE_PATH })
    await context.close()
  } finally {
    await browser.close()
  }
}
