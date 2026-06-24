import { test, expect } from '@playwright/test'

/**
 * U1.5 — dashboard. Smoke-renders the summary cards (incl. the empty/zero
 * state, which must not error) and verifies that a payment created elsewhere
 * shows up in "Próximos pagos" after revalidation. Self-cleaning.
 */

test.describe('Dashboard (U1.5)', () => {
  test('renders the summary cards', async ({ page }) => {
    await page.goto('/')
    await expect(
      page.getByRole('heading', { name: 'Panel de la boda' }),
    ).toBeVisible()
    await expect(
      page.getByText('Invitados confirmados', { exact: true }),
    ).toBeVisible()
    await expect(
      page.getByText('Presupuesto restante', { exact: true }),
    ).toBeVisible()
    await expect(
      page.getByText('Pagos pendientes', { exact: true }),
    ).toBeVisible()
    await expect(
      page.getByText('Tareas pendientes', { exact: true }),
    ).toBeVisible()
  })

  test('reflects a new pending payment in Próximos pagos', async ({ page }) => {
    const concept = `Pago panel ${Date.now()}`
    const today = new Date().toISOString().slice(0, 10)

    await page.goto('/presupuesto')
    let paySection = page.getByRole('region', { name: 'Pagos' })
    await paySection.getByRole('button', { name: 'Nuevo pago' }).click()
    await page.getByRole('textbox', { name: 'Concepto' }).fill(concept)
    await page.getByRole('textbox', { name: 'Importe' }).fill('12345')
    await page.locator('input[name="dueDate"]').fill(today)
    await page.getByRole('button', { name: 'Añadir pago' }).click()
    await expect(
      paySection.getByRole('row').filter({ hasText: concept }),
    ).toBeVisible()

    // The dashboard reflects it (revalidation across routes).
    await page.goto('/')
    const upcoming = page.getByRole('region', { name: 'Próximos pagos' })
    await expect(upcoming.getByText(concept)).toBeVisible()

    // Clean up.
    await page.goto('/presupuesto')
    paySection = page.getByRole('region', { name: 'Pagos' })
    page.once('dialog', (d) => d.accept())
    await paySection
      .getByRole('row')
      .filter({ hasText: concept })
      .getByRole('button', { name: 'Borrar' })
      .click()
    await expect(
      paySection.getByRole('row').filter({ hasText: concept }),
    ).toHaveCount(0)
  })
})
