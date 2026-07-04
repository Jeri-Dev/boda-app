import { test, expect } from '@playwright/test'

/**
 * U2.4 — pending-to-confirm view + resend. A guest with an invitation but no
 * response shows a resend card; a guest with no invitation shows under "Sin
 * invitación"; confirming via the link drops the reminder. Self-cleaning.
 */

test.describe('Pendientes (U2.4)', () => {
  test('reminders for unanswered invitations + uninvited pending guests', async ({
    page,
    context,
  }) => {
    const ts = Date.now()
    const invited = `Pend Invitado ${ts}` // gets an invitation
    const uninvited = `Pend SinInv ${ts}` // no invitation

    // ── Two pending guests; only one gets an invitation ──────────────────
    await page.goto('/invitados')
    for (const name of [invited, uninvited]) {
      await page.getByRole('button', { name: 'Nuevo invitado' }).click()
      await page.getByRole('textbox', { name: 'Nombre', exact: true }).fill(name)
      await page.getByRole('button', { name: 'Añadir invitado' }).click()
      await expect(page.getByRole('row').filter({ hasText: name })).toBeVisible()
    }

    await page.goto('/invitados/invitaciones')
    await page.getByRole('button', { name: 'Nueva invitación' }).click()
    await page.getByRole('checkbox', { name: invited }).check()
    await page.getByRole('button', { name: 'Crear invitación' }).click()
    const card = page.getByRole('listitem').filter({ hasText: invited })
    const url = await card.getByLabel('Enlace de la invitación').inputValue()
    const token = url.split('/i/')[1]

    // ── Pendientes shows the resend card + the uninvited guest ───────────
    await page.goto('/invitados/pendientes')
    const reminder = page.getByRole('listitem').filter({ hasText: invited })
    await expect(reminder).toBeVisible()
    await expect(reminder).toContainText('Sin responder')
    await expect(reminder.getByRole('link', { name: /WhatsApp/ })).toBeVisible()

    // The uninvited pending guest is listed under "Sin invitación".
    await expect(page.getByText('Sin invitación')).toBeVisible()
    await expect(
      page.getByRole('listitem').filter({ hasText: uninvited }),
    ).toBeVisible()

    // ── Guest confirms → reminder drops off ──────────────────────────────
    const guest = await context.newPage()
    await guest.goto(`/i/${token}`)
    await guest.getByRole('button', { name: 'Sí, asistiré' }).click()
    await guest.getByRole('button', { name: 'Enviar confirmación' }).click()
    await expect(guest.getByText(/Recibimos tu confirmación/)).toBeVisible()
    await guest.close()

    await page.goto('/invitados/pendientes')
    await expect(
      page.getByRole('listitem').filter({ hasText: invited }),
    ).toHaveCount(0)

    // ── Clean up both guests ─────────────────────────────────────────────
    await page.goto('/invitados')
    for (const name of [invited, uninvited]) {
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
