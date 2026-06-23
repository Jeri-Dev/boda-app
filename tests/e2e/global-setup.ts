import { chromium, type FullConfig } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { dirname } from 'node:path'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Global setup — provision the test users, then log in once and persist the
 * authenticated host state to `tests/.auth/host.json`.
 *
 * Self-bootstrapping against the LOCAL Supabase stack (the chosen test target),
 * using the service key:
 *   - the HOST user: created if missing, password forced, added to
 *     `public.host_allowlist` (service role bypasses RLS; the allowlist is wiped
 *     by `supabase db reset`).
 *   - a NON-HOST user: created if missing, password forced, and explicitly
 *     REMOVED from the allowlist. The RLS suite uses it to prove that being
 *     authenticated is NOT the gate — membership is.
 *
 * Then we drive the real login form so the captured cookies are exactly what
 * the app issues. Runs ONCE per `pnpm test:e2e`, before any spec.
 */
const STORAGE_PATH = 'tests/.auth/host.json'

/** Create-or-update a user and force its password + confirmed email. */
async function ensureUser(
  admin: SupabaseClient,
  email: string,
  password: string,
): Promise<string> {
  const { data: list, error: listErr } = await admin.auth.admin.listUsers()
  if (listErr) throw listErr
  const existing = list.users.find((u) => u.email === email)

  if (existing) {
    const { error } = await admin.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
    })
    if (error) throw error
    return existing.id
  }

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (error) throw error
  if (!data.user?.id) throw new Error(`global-setup: could not create ${email}`)
  return data.user.id
}

export default async function globalSetup(config: FullConfig) {
  const email = process.env.PLAYWRIGHT_HOST_EMAIL ?? 'host@test.local'
  const password =
    process.env.PLAYWRIGHT_HOST_PASSWORD ?? 'test-host-password-123'
  const nonHostEmail = process.env.PLAYWRIGHT_NONHOST_EMAIL ?? 'nonhost@test.local'
  const nonHostPassword =
    process.env.PLAYWRIGHT_NONHOST_PASSWORD ?? 'test-nonhost-password-123'
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

  // Host user → in the allowlist.
  const hostId = await ensureUser(admin, email, password)
  const { error: upErr } = await admin
    .from('host_allowlist')
    .upsert({ user_id: hostId }, { onConflict: 'user_id' })
  if (upErr) throw upErr

  // Non-host user → explicitly NOT in the allowlist (defensively removed in
  // case a prior run added it).
  const nonHostId = await ensureUser(admin, nonHostEmail, nonHostPassword)
  const { error: delErr } = await admin
    .from('host_allowlist')
    .delete()
    .eq('user_id', nonHostId)
  if (delErr) throw delErr

  // Drive the real login form and capture the host session.
  await mkdir(dirname(STORAGE_PATH), { recursive: true })
  const browser = await chromium.launch()
  try {
    const context = await browser.newContext({ baseURL })
    const page = await context.newPage()

    await page.goto('/login')
    await page.getByLabel(/correo/i).fill(email)
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
