import { test, expect } from '@playwright/test'

/**
 * U3.1 — seating. Create a small table, seat two guests (triggering the
 * over-capacity warning), then delete the table and confirm the guests return
 * to "Sin sentar" (never deleted). Self-cleaning.
 */

test.describe('Mesas (U3.1)', () => {
  test('create table → seat → over-capacity warning → delete unseats', async ({
    page,
  }) => {
    const ts = Date.now()
    const a = `Mesa Inv A ${ts}`
    const b = `Mesa Inv B ${ts}`
    const tableLabel = `Mesa Prueba ${ts}`

    // Two guests.
    await page.goto('/invitados')
    for (const name of [a, b]) {
      await page.getByRole('button', { name: 'Nuevo invitado' }).click()
      await page.getByRole('textbox', { name: 'Nombre', exact: true }).fill(name)
      await page.getByRole('button', { name: 'Añadir invitado' }).click()
      await expect(page.getByRole('row').filter({ hasText: name })).toBeVisible()
    }

    // ── Create a capacity-1 table ────────────────────────────────────────
    await page.goto('/mesas')
    await page.getByRole('button', { name: 'Nueva mesa' }).click()
    await page.getByRole('textbox', { name: 'Nombre de la mesa' }).fill(tableLabel)
    await page.getByRole('spinbutton', { name: 'Capacidad' }).fill('1')
    await page.getByRole('button', { name: 'Crear mesa' }).click()

    const tableCard = page.getByRole('region').filter({ hasText: tableLabel })
    await expect(tableCard).toBeVisible()
    await expect(tableCard).toContainText('0 / 1')

    // ── Seat both guests via their selects (over capacity → warning) ─────
    await page.getByRole('combobox', { name: `Mesa de ${a}` }).selectOption({ label: tableLabel })
    await expect(tableCard).toContainText('1 / 1')

    await page.getByRole('combobox', { name: `Mesa de ${b}` }).selectOption({ label: tableLabel })
    await expect(tableCard).toContainText('2 / 1')
    await expect(tableCard).toContainText('sobre capacidad')

    // ── Delete the table → both guests return to "Sin sentar" ────────────
    page.once('dialog', (d) => d.accept())
    await tableCard.getByRole('button', { name: 'Borrar' }).click()
    await expect(page.getByRole('region').filter({ hasText: tableLabel })).toHaveCount(0)

    // Both guests are listed under "Sin sentar" again.
    await expect(page.getByRole('combobox', { name: `Mesa de ${a}` })).toBeVisible()
    await expect(page.getByRole('combobox', { name: `Mesa de ${b}` })).toBeVisible()

    // ── Clean up the guests ──────────────────────────────────────────────
    await page.goto('/invitados')
    for (const name of [a, b]) {
      page.once('dialog', (d) => d.accept())
      await page
        .getByRole('row')
        .filter({ hasText: name })
        .getByRole('button', { name: 'Borrar' })
        .click()
      await expect(page.getByRole('row').filter({ hasText: name })).toHaveCount(0)
    }
  })
})
