import { test, expect } from '@playwright/test'

/**
 * U1.3 — budget categories + payments. Verifies that "real" (paid) reconciles
 * against the category's planned amount. Self-cleaning (unique names, deleted
 * at the end), scoped to the page's labelled regions so the category name
 * (which also appears in the payment row) never matches across tables.
 */

test.describe('Presupuesto (U1.3)', () => {
  test('category + payment reconcile previsto vs real', async ({ page }) => {
    const ts = Date.now()
    const catName = `Categoría Prueba ${ts}`
    const payConcept = `Pago Prueba ${ts}`

    await page.goto('/presupuesto')
    const catSection = page.getByRole('region', { name: 'Categorías' })
    const paySection = page.getByRole('region', { name: 'Pagos' })

    // ── Create category (previsto 100,000) ───────────────────────────────
    await catSection.getByRole('button', { name: 'Nueva categoría' }).click()
    await page
      .getByRole('textbox', { name: 'Nombre', exact: true })
      .fill(catName)
    await page.getByRole('textbox', { name: 'Previsto' }).fill('100000')
    await page.getByRole('button', { name: 'Añadir categoría' }).click()

    const catRow = catSection.getByRole('row').filter({ hasText: catName })
    await expect(catRow).toBeVisible()
    await expect(catRow).toContainText('100,000.00')

    // ── Register a paid payment of 30,000 in that category ───────────────
    await paySection.getByRole('button', { name: 'Nuevo pago' }).click()
    await page.getByRole('textbox', { name: 'Concepto' }).fill(payConcept)
    await page.getByRole('textbox', { name: 'Importe' }).fill('30000')
    await page.getByRole('combobox', { name: 'Estado' }).selectOption('pagado')
    await page
      .getByRole('combobox', { name: 'Categoría' })
      .selectOption({ label: catName })
    await page.getByRole('button', { name: 'Añadir pago' }).click()

    const payRow = paySection.getByRole('row').filter({ hasText: payConcept })
    await expect(payRow).toBeVisible()
    await expect(payRow).toContainText('30,000.00')
    await expect(payRow).toContainText('Pagado')

    // Category reflects real spend: pagado 30,000 → restante 70,000.
    await expect(catRow).toContainText('30,000.00')
    await expect(catRow).toContainText('70,000.00')

    // ── Clean up ─────────────────────────────────────────────────────────
    page.once('dialog', (d) => d.accept())
    await payRow.getByRole('button', { name: 'Borrar' }).click()
    await expect(
      paySection.getByRole('row').filter({ hasText: payConcept }),
    ).toHaveCount(0)

    page.once('dialog', (d) => d.accept())
    await catSection
      .getByRole('row')
      .filter({ hasText: catName })
      .getByRole('button', { name: 'Borrar' })
      .click()
    await expect(
      catSection.getByRole('row').filter({ hasText: catName }),
    ).toHaveCount(0)
  })

  test('a payment amount of 0 is accepted', async ({ page }) => {
    const concept = `Pago cero ${Date.now()}`
    await page.goto('/presupuesto')
    const paySection = page.getByRole('region', { name: 'Pagos' })

    await paySection.getByRole('button', { name: 'Nuevo pago' }).click()
    await page.getByRole('textbox', { name: 'Concepto' }).fill(concept)
    await page.getByRole('textbox', { name: 'Importe' }).fill('0')
    await page.getByRole('button', { name: 'Añadir pago' }).click()

    const row = paySection.getByRole('row').filter({ hasText: concept })
    await expect(row).toBeVisible()
    await expect(row).toContainText('0.00')

    page.once('dialog', (d) => d.accept())
    await row.getByRole('button', { name: 'Borrar' }).click()
    await expect(
      paySection.getByRole('row').filter({ hasText: concept }),
    ).toHaveCount(0)
  })
})
