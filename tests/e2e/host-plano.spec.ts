import { createClient } from '@libsql/client'
import { test, expect } from '@playwright/test'

/**
 * U3.2 — floor plan. Drag a table on the SVG canvas and confirm the position
 * persists across a reload. Starts from a clean canvas so a leftover table with
 * a persisted position can't overlap the one under test.
 */

test.describe('Plano (U3.2)', () => {
  test.beforeEach(async () => {
    const c = createClient({ url: process.env.DATABASE_URL ?? 'file:local.db' })
    await c.execute('delete from tables')
    await c.execute('update guests set table_id = null')
    c.close()
  })

  test('dragging a table persists its position', async ({ page }) => {
    const label = `Plano Mesa ${Date.now()}`

    await page.goto('/mesas')
    await page.getByRole('button', { name: 'Nueva mesa' }).click()
    await page.getByRole('textbox', { name: 'Nombre de la mesa' }).fill(label)
    await page.getByRole('button', { name: 'Crear mesa' }).click()

    const node = page.getByRole('button', { name: new RegExp(`^Mesa ${label}`) })
    await expect(node).toBeVisible()

    function tx(transform: string | null): number {
      const m = transform?.match(/translate\(([-\d.]+)/)
      return m ? Number(m[1]) : NaN
    }
    const before = tx(await node.getAttribute('transform'))

    // Drag it ~180px to the right on screen.
    const box = (await node.boundingBox())!
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.mouse.down()
    await page.mouse.move(box.x + box.width / 2 + 180, box.y + box.height / 2, { steps: 8 })
    await page.mouse.up()

    // Local transform moved right.
    await expect
      .poll(async () => tx(await node.getAttribute('transform')))
      .toBeGreaterThan(before + 50)

    // Persisted: reload and the new x is still there (auto-layout would reset it).
    await page.reload()
    const persisted = page.getByRole('button', { name: new RegExp(`^Mesa ${label}`) })
    await expect
      .poll(async () => tx(await persisted.getAttribute('transform')))
      .toBeGreaterThan(before + 50)

    // ── Clean up ─────────────────────────────────────────────────────────
    const card = page.getByRole('region', { name: label })
    page.once('dialog', (d) => d.accept())
    await card.getByRole('button', { name: 'Borrar' }).click()
    await expect(page.getByRole('region', { name: label })).toHaveCount(0)
  })
})
