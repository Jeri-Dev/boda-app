import { test, expect } from '@playwright/test'

/**
 * U6a/U6b — task Kanban board. Self-cleaning (unique title, deleted at the end).
 * The move is asserted through the card's accessible "Mover a…" <select> (the
 * keyboard/e2e fallback for drag), which calls the same moveTask action as drag.
 */

test.describe('Tareas Kanban (U6)', () => {
  test('create → move to Hecho → delete a task', async ({ page }) => {
    const title = `Tarea Prueba ${Date.now()}`

    await page.goto('/tareas')

    // ── Create (lands in "Por hacer") ────────────────────────────────────
    await page.getByRole('button', { name: 'Nueva tarea' }).click()
    await page.getByRole('textbox', { name: 'Tarea', exact: true }).fill(title)
    await page.getByRole('button', { name: 'Añadir tarea' }).click()

    const card = page.getByRole('listitem').filter({ hasText: title })
    await expect(card).toBeVisible()

    // ── Move to "Hecho" via the accessible fallback select ───────────────
    await card.getByRole('combobox').selectOption('done')
    const doneColumn = page.getByRole('region', { name: 'Hecho' })
    await expect(doneColumn.getByText(title)).toBeVisible()

    // ── Delete ───────────────────────────────────────────────────────────
    page.once('dialog', (d) => d.accept())
    await card.getByRole('button', { name: 'Borrar' }).click()
    await expect(
      page.getByRole('listitem').filter({ hasText: title }),
    ).toHaveCount(0)
  })

  test('validates a required title', async ({ page }) => {
    await page.goto('/tareas')
    await page.getByRole('button', { name: 'Nueva tarea' }).click()
    await page.getByRole('button', { name: 'Añadir tarea' }).click()
    await expect(page.getByText('Título requerido')).toBeVisible()
  })
})
