import postgres from 'postgres'
import { test, expect } from '@playwright/test'

/**
 * U3.3 — day-of view (read-only). A confirmed guest seated at a table shows up
 * under that table; a vendor with a phone shows as a key contact. Starts from a
 * clean tables slate so leftovers don't interfere. Self-cleaning.
 *
 * The offline behavior is provided by the prod-only service worker
 * (NetworkFirst navigations) and isn't exercised here (dev disables the SW).
 */

test.describe('Día B (U3.3)', () => {
  test.beforeEach(async () => {
    const sql = postgres(process.env.DATABASE_URL!, { prepare: false })
    await sql`delete from tables`
    await sql`update guests set table_id = null`
    await sql.end()
  })

  test('shows seating + vendor contacts read-only', async ({ page }) => {
    const ts = Date.now()
    const guestName = `DiaB Inv ${ts}`
    const tableLabel = `DiaB Mesa ${ts}`
    const vendorName = `DiaB Catering ${ts}`
    const phone = '809-555-7788'

    // ── A confirmed guest, a table, seat them ────────────────────────────
    await page.goto('/invitados')
    await page.getByRole('button', { name: 'Nuevo invitado' }).click()
    await page.getByRole('textbox', { name: 'Nombre', exact: true }).fill(guestName)
    await page.getByRole('combobox', { name: 'Estado RSVP' }).selectOption('confirmed')
    await page.getByRole('button', { name: 'Añadir invitado' }).click()
    await expect(page.getByRole('row').filter({ hasText: guestName })).toBeVisible()

    await page.goto('/mesas')
    await page.getByRole('button', { name: 'Nueva mesa' }).click()
    await page.getByRole('textbox', { name: 'Nombre de la mesa' }).fill(tableLabel)
    await page.getByRole('button', { name: 'Crear mesa' }).click()
    await page.getByRole('combobox', { name: `Mesa de ${guestName}` }).selectOption({ label: tableLabel })

    // ── A vendor with a phone ────────────────────────────────────────────
    await page.goto('/proveedores')
    await page.getByRole('button', { name: 'Nuevo proveedor' }).click()
    await page.getByRole('textbox', { name: 'Nombre', exact: true }).fill(vendorName)
    await page.getByRole('textbox', { name: 'Teléfono' }).fill(phone)
    await page.getByRole('button', { name: 'Añadir proveedor' }).click()
    await expect(page.getByRole('row').filter({ hasText: vendorName })).toBeVisible()

    // ── Día B view ───────────────────────────────────────────────────────
    await page.goto('/dia-b')
    const tableItem = page.getByRole('listitem').filter({ hasText: tableLabel })
    await expect(tableItem).toBeVisible()
    await expect(tableItem).toContainText(guestName)

    const contact = page.getByRole('listitem').filter({ hasText: vendorName })
    await expect(contact).toBeVisible()
    await expect(contact.getByRole('link', { name: phone })).toHaveAttribute(
      'href',
      `tel:${phone}`,
    )

    // ── Clean up ─────────────────────────────────────────────────────────
    await page.goto('/proveedores')
    page.once('dialog', (d) => d.accept())
    await page.getByRole('row').filter({ hasText: vendorName }).getByRole('button', { name: 'Borrar' }).click()
    await expect(page.getByRole('row').filter({ hasText: vendorName })).toHaveCount(0)

    await page.goto('/invitados')
    page.once('dialog', (d) => d.accept())
    await page.getByRole('row').filter({ hasText: guestName }).getByRole('button', { name: 'Borrar' }).click()
    await expect(page.getByRole('row').filter({ hasText: guestName })).toHaveCount(0)
  })
})
