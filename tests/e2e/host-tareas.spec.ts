import { test, expect } from '@playwright/test'

/**
 * U1.4 — task checklist. Self-cleaning (unique title, deleted at the end). Works
 * in the "Todas" filter while toggling so completing a task doesn't remove it
 * from the view mid-assertion.
 */

test.describe('Tareas (U1.4)', () => {
  test('create → complete → filter → delete a task', async ({ page }) => {
    const title = `Tarea Prueba ${Date.now()}`

    await page.goto('/tareas')

    // ── Create ────────────────────────────────────────────────────────────
    await page.getByRole('button', { name: 'Nueva tarea' }).click()
    await page.getByRole('textbox', { name: 'Tarea', exact: true }).fill(title)
    await page.getByRole('button', { name: 'Añadir tarea' }).click()
    await expect(
      page.getByRole('listitem').filter({ hasText: title }),
    ).toBeVisible()

    // ── Complete (in "Todas" so it stays visible) ────────────────────────
    await page.getByRole('link', { name: /Todas/ }).click()
    const item = page.getByRole('listitem').filter({ hasText: title })
    await item.getByRole('checkbox').click()
    await expect(item.getByRole('checkbox')).toBeChecked()

    // ── Filter: gone from Pendientes, present in Hechas ──────────────────
    await page.getByRole('link', { name: /Pendientes/ }).click()
    await expect(
      page.getByRole('listitem').filter({ hasText: title }),
    ).toHaveCount(0)

    await page.getByRole('link', { name: /Hechas/ }).click()
    const doneItem = page.getByRole('listitem').filter({ hasText: title })
    await expect(doneItem).toBeVisible()

    // ── Delete ───────────────────────────────────────────────────────────
    page.once('dialog', (d) => d.accept())
    await doneItem.getByRole('button', { name: 'Borrar' }).click()
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
