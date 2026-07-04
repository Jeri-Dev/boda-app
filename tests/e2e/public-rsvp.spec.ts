import { test, expect } from '@playwright/test'

/**
 * U2.3 — public RSVP. A guest confirms from their link (attendance + menu +
 * message), and it flows into the host's guest list, tagged "por el invitado"
 * (last_modified_source). Self-cleaning.
 */

test.describe('RSVP público (U2.3)', () => {
  test('guest confirms from the link → appears in the host list', async ({
    page,
    context,
  }) => {
    const ts = Date.now()
    const guestName = `RSVP Invitado ${ts}`

    // ── Host: create a guest + an invitation for them ────────────────────
    await page.goto('/invitados')
    await page.getByRole('button', { name: 'Nuevo invitado' }).click()
    await page.getByRole('textbox', { name: 'Nombre', exact: true }).fill(guestName)
    await page.getByRole('button', { name: 'Añadir invitado' }).click()
    await expect(page.getByRole('row').filter({ hasText: guestName })).toBeVisible()

    await page.goto('/invitados/invitaciones')
    await page.getByRole('button', { name: 'Nueva invitación' }).click()
    await page.getByRole('checkbox', { name: guestName }).check()
    await page.getByRole('button', { name: 'Crear invitación' }).click()
    const card = page.getByRole('listitem').filter({ hasText: guestName })
    const url = await card.getByLabel('Enlace de la invitación').inputValue()
    const token = url.split('/i/')[1]

    // ── Guest: open the link and confirm ─────────────────────────────────
    const guest = await context.newPage()
    await guest.goto(`/i/${token}`)
    await expect(
      guest.getByRole('heading', { name: 'Confirma tu asistencia' }),
    ).toBeVisible()

    await guest.getByRole('button', { name: 'Sí, asistiré' }).click()
    await guest
      .getByPlaceholder('Carne, pescado, vegetariano…')
      .fill('Vegetariano')
    await guest
      .getByPlaceholder('¡Felicidades! Allí estaremos…')
      .fill('¡Con mucho gusto!')
    await guest.getByRole('button', { name: 'Enviar confirmación' }).click()
    await expect(guest.getByText(/Recibimos tu confirmación/)).toBeVisible()
    await guest.close()

    // ── Host: the list reflects it, tagged as guest-sourced ──────────────
    await page.goto('/invitados?status=confirmed')
    const hostRow = page.getByRole('row').filter({ hasText: guestName })
    await expect(hostRow).toBeVisible()
    await expect(hostRow).toContainText('Confirmado')
    await expect(hostRow).toContainText('por el invitado')

    // ── Clean up ─────────────────────────────────────────────────────────
    await page.goto('/invitados')
    page.once('dialog', (d) => d.accept())
    await page
      .getByRole('row')
      .filter({ hasText: guestName })
      .getByRole('button', { name: 'Borrar' })
      .click()
    await expect(page.getByRole('row').filter({ hasText: guestName })).toHaveCount(0)
  })
})
