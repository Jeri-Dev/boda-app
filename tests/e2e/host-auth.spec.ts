import { test, expect } from '@playwright/test'

import { hostTest } from './fixtures/test-host'

/**
 * U0.3 — back-office auth + deny-by-default gate (R13).
 *
 * The anonymous block imports `@playwright/test` directly so it does NOT
 * inherit the host storage state from global-setup — each test gets a fresh,
 * cookie-less context.
 */

test.describe('Auth — anonymous', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test('anonymous request to the dashboard root redirects to /login', async ({
    page,
  }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/\/login/)
    await expect(
      page.getByRole('heading', { name: /iniciar sesión/i }),
    ).toBeVisible()
  })

  test('invalid credentials show a generic error message', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel(/correo/i).fill('no-existe@example.com')
    await page.locator('input[name="password"]').fill('definitivamente-mal')
    await page.getByRole('button', { name: /entrar/i }).click()

    await expect(page).toHaveURL(/\/login/)
    // Scope to our banner's text — Next's empty route announcer is also role=alert.
    await expect(
      page.getByRole('alert').filter({ hasText: /credenciales inválidas/i }),
    ).toBeVisible()
  })

  test('invalid creds preserve both email and password field values', async ({
    page,
  }) => {
    const typedEmail = 'preserva@example.com'
    const typedPassword = 'definitivamente-mal'

    await page.goto('/login')
    await page.getByLabel(/correo/i).fill(typedEmail)
    await page.locator('input[name="password"]').fill(typedPassword)
    await page.getByRole('button', { name: /entrar/i }).click()

    await expect(page).toHaveURL(/\/login/)
    await expect(
      page.getByRole('alert').filter({ hasText: /credenciales inválidas/i }),
    ).toBeVisible()
    await expect(page.locator('input[name="email"]')).toHaveValue(typedEmail)
    await expect(page.locator('input[name="password"]')).toHaveValue(
      typedPassword,
    )
  })

  test('password visibility toggle flips input type and aria-label', async ({
    page,
  }) => {
    await page.goto('/login')
    const passwordInput = page.locator('input[name="password"]')
    await expect(passwordInput).toHaveAttribute('type', 'password')
    await passwordInput.fill('secreto123')

    const showBtn = page.getByRole('button', { name: /mostrar contraseña/i })
    await expect(showBtn).toHaveAttribute('aria-pressed', 'false')
    await showBtn.click()
    await expect(passwordInput).toHaveAttribute('type', 'text')

    const hideBtn = page.getByRole('button', { name: /ocultar contraseña/i })
    await expect(hideBtn).toHaveAttribute('aria-pressed', 'true')
    await hideBtn.click()
    await expect(passwordInput).toHaveAttribute('type', 'password')
    // Never left the login page — confirms the toggle is type="button".
    await expect(page).toHaveURL(/\/login/)
  })

  test('valid credentials redirect into the dashboard', async ({ page }) => {
    const email = process.env.PLAYWRIGHT_HOST_EMAIL ?? 'host@test.local'
    const password =
      process.env.PLAYWRIGHT_HOST_PASSWORD ?? 'test-host-password-123'

    await page.goto('/login')
    await page.getByLabel(/correo/i).fill(email)
    await page.locator('input[name="password"]').fill(password)
    await page.getByRole('button', { name: /entrar/i }).click()

    await page.waitForURL((u) => !u.pathname.startsWith('/login'))
    await expect(
      page.getByRole('heading', { name: /panel de la boda/i }),
    ).toBeVisible()
  })
})

hostTest.describe('Auth — host session', () => {
  hostTest('dashboard renders for an authenticated host', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/\/$/)
    await expect(
      page.getByRole('heading', { name: /panel de la boda/i }),
    ).toBeVisible()
  })

  hostTest('host can sign out and lands back on /login', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: /salir/i }).click()
    await expect(page).toHaveURL(/\/login/)
    await expect(
      page.getByRole('heading', { name: /iniciar sesión/i }),
    ).toBeVisible()
  })
})
