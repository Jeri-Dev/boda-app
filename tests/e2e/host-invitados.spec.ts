import { test, expect, type Page } from '@playwright/test'

/**
 * U1.1 — guest list CRUD + filters.
 *
 * Self-cleaning: each run creates a uniquely-named guest, exercises edit /
 * filter, then deletes it — so it leaves the local dev DB as it found it and
 * never collides with existing rows.
 */

function openCreate(page: Page) {
  return page.getByRole('button', { name: 'Nuevo invitado' }).click()
}

test.describe('Invitados (U1.1)', () => {
  test('create → edit → filter → delete a guest', async ({ page }) => {
    const name = `Invitado Prueba ${Date.now()}`
    const household = 'Familia Prueba'

    await page.goto('/invitados')

    // ── Create ────────────────────────────────────────────────────────────
    await openCreate(page)
    await page.getByRole('textbox', { name: 'Nombre', exact: true }).fill(name)
    await page.getByRole('textbox', { name: 'Email', exact: true }).fill('prueba@example.com')
    await page.getByRole('combobox', { name: 'Estado RSVP' }).selectOption('confirmed')
    await page.getByRole('button', { name: 'Añadir invitado' }).click()

    const row = page.getByRole('row').filter({ hasText: name })
    await expect(row).toBeVisible()
    await expect(row).toContainText('Confirmado')

    // ── Edit (add a household) ────────────────────────────────────────────
    await row.getByRole('button', { name: 'Editar' }).click()
    await expect(page.getByRole('textbox', { name: 'Nombre', exact: true })).toHaveValue(name)
    await page.getByRole('textbox', { name: 'Hogar / grupo' }).fill(household)
    await page.getByRole('button', { name: 'Guardar cambios' }).click()

    await expect(
      page.getByRole('row').filter({ hasText: name }),
    ).toContainText(household)

    // ── Filter by status ─────────────────────────────────────────────────
    // The guest is "confirmed": hidden under "No asiste", shown under "Confirmado".
    await page.getByRole('link', { name: /No asiste/ }).click()
    await expect(page.getByRole('row').filter({ hasText: name })).toHaveCount(0)

    await page.getByRole('link', { name: /Confirmado/ }).click()
    await expect(
      page.getByRole('row').filter({ hasText: name }),
    ).toBeVisible()

    // ── Delete (accept the native confirm) ───────────────────────────────
    page.once('dialog', (dialog) => dialog.accept())
    await page
      .getByRole('row')
      .filter({ hasText: name })
      .getByRole('button', { name: 'Borrar' })
      .click()

    await expect(page.getByRole('row').filter({ hasText: name })).toHaveCount(0)
  })

  test('validates a required name', async ({ page }) => {
    await page.goto('/invitados')
    await openCreate(page)
    // Submit empty → the dialog stays open with a field error, no row added.
    await page.getByRole('button', { name: 'Añadir invitado' }).click()
    await expect(page.getByText('Nombre requerido')).toBeVisible()
  })
})
