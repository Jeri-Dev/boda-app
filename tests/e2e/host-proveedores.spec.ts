import { test, expect, type Page } from '@playwright/test'

/**
 * U1.2 — vendor directory CRUD + filters. Self-cleaning (unique name created
 * then deleted), so it never collides with existing rows.
 */

function openCreate(page: Page) {
  return page.getByRole('button', { name: 'Nuevo proveedor' }).click()
}

test.describe('Proveedores (U1.2)', () => {
  test('create → edit → filter → delete a vendor', async ({ page }) => {
    const name = `Proveedor Prueba ${Date.now()}`

    await page.goto('/proveedores')

    // ── Create ────────────────────────────────────────────────────────────
    await openCreate(page)
    await page.getByRole('textbox', { name: 'Nombre', exact: true }).fill(name)
    await page.getByRole('textbox', { name: 'Categoría' }).fill('Catering')
    await page
      .getByRole('combobox', { name: 'Estado del trato' })
      .selectOption('contratado')
    await page.getByRole('textbox', { name: 'Importe' }).fill('85000')
    await page
      .getByRole('textbox', { name: 'Enlace al contrato' })
      .fill('https://example.com/contrato')
    await page.getByRole('button', { name: 'Añadir proveedor' }).click()

    const row = page.getByRole('row').filter({ hasText: name })
    await expect(row).toBeVisible()
    await expect(row).toContainText('Contratado')
    await expect(row).toContainText('85,000.00')
    await expect(row.getByRole('link', { name: 'Ver contrato' })).toBeVisible()

    // ── Edit (change the amount) ──────────────────────────────────────────
    await row.getByRole('button', { name: 'Editar' }).click()
    await expect(
      page.getByRole('textbox', { name: 'Nombre', exact: true }),
    ).toHaveValue(name)
    await page.getByRole('textbox', { name: 'Importe' }).fill('90000.50')
    await page.getByRole('button', { name: 'Guardar cambios' }).click()

    await expect(
      page.getByRole('row').filter({ hasText: name }),
    ).toContainText('90,000.50')

    // ── Filter by status ─────────────────────────────────────────────────
    await page.getByRole('link', { name: /Contactado/ }).click()
    await expect(page.getByRole('row').filter({ hasText: name })).toHaveCount(0)

    await page.getByRole('link', { name: /Contratado/ }).click()
    await expect(
      page.getByRole('row').filter({ hasText: name }),
    ).toBeVisible()

    // ── Delete ───────────────────────────────────────────────────────────
    page.once('dialog', (dialog) => dialog.accept())
    await page
      .getByRole('row')
      .filter({ hasText: name })
      .getByRole('button', { name: 'Borrar' })
      .click()

    await expect(page.getByRole('row').filter({ hasText: name })).toHaveCount(0)
  })

  test('rejects an invalid amount via Zod', async ({ page }) => {
    await page.goto('/proveedores')
    await openCreate(page)
    await page
      .getByRole('textbox', { name: 'Nombre', exact: true })
      .fill('Proveedor sin importe válido')
    await page.getByRole('textbox', { name: 'Importe' }).fill('no-es-dinero')
    await page.getByRole('button', { name: 'Añadir proveedor' }).click()
    await expect(page.getByText('Importe inválido')).toBeVisible()

    // Ambiguous thousands-dot (`85.000`) is rejected, never silently 1000x off.
    await page.getByRole('textbox', { name: 'Importe' }).fill('85.000')
    await page.getByRole('button', { name: 'Añadir proveedor' }).click()
    await expect(page.getByText('Importe inválido')).toBeVisible()
  })
})
