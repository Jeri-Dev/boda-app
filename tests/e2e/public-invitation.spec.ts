import { test, expect } from '@playwright/test'

/**
 * U2.2 — wedding config → create invitation → open the public invitation by
 * token → invalid token is handled gracefully. Self-cleaning (revokes + the
 * guest is deleted at the end so the list stays clean).
 */

test.describe('Invitación pública (U2.2)', () => {
  test('config + invitation renders for a valid token, fails safe for invalid', async ({
    page,
    context,
  }) => {
    const ts = Date.now()
    const guestName = `Invitado Inv ${ts}`
    const couple = `Ana & Beto ${ts}`

    // ── Configure the wedding content ────────────────────────────────────
    await page.goto('/configuracion')
    await page.getByRole('textbox', { name: 'Nombres de la pareja' }).fill(couple)
    await page.getByRole('textbox', { name: 'Mensaje de bienvenida' }).fill(
      'Nos encantaría contar contigo.',
    )
    await page.getByRole('button', { name: 'Guardar' }).click()
    await expect(page.getByText('Guardado ✓')).toBeVisible()

    // ── Create a guest to invite ─────────────────────────────────────────
    await page.goto('/invitados')
    await page.getByRole('button', { name: 'Nuevo invitado' }).click()
    await page.getByRole('textbox', { name: 'Nombre', exact: true }).fill(guestName)
    await page.getByRole('button', { name: 'Añadir invitado' }).click()
    await expect(page.getByRole('row').filter({ hasText: guestName })).toBeVisible()

    // ── Create an invitation for that guest ──────────────────────────────
    await page.goto('/invitados/invitaciones')
    await page.getByRole('button', { name: 'Nueva invitación' }).click()
    // The checkbox sits inside a <label> → its accessible name is the guest's.
    await page.getByRole('checkbox', { name: guestName }).check()
    await page.getByRole('button', { name: 'Crear invitación' }).click()

    // Find OUR invitation card by the guest name, then read its link (robust to
    // any other invitations in the list).
    const card = page.getByRole('listitem').filter({ hasText: guestName })
    const linkInput = card.getByLabel('Enlace de la invitación')
    await expect(linkInput).toBeVisible()
    const url = await linkInput.inputValue()
    expect(url).toContain('/i/')
    const token = url.split('/i/')[1]
    expect(token.length).toBeGreaterThan(20)

    // ── Open the public invitation by token ──────────────────────────────
    const pub = await context.newPage()
    await pub.goto(`/i/${token}`)
    await expect(pub.getByRole('heading', { name: couple })).toBeVisible()
    await expect(pub.getByText('Nos encantaría contar contigo.')).toBeVisible()
    await expect(pub.getByText(guestName)).toBeVisible()

    // ── Invalid token fails safe (neutral page, no 500) ──────────────────
    await pub.goto('/i/este-token-no-existe')
    await expect(
      pub.getByRole('heading', { name: 'Invitación no disponible' }),
    ).toBeVisible()

    // ── Revoke → card updates (revalidation) + the public link dies ──────
    page.once('dialog', (d) => d.accept())
    await card.getByRole('button', { name: 'Revocar' }).click()
    await expect(card.getByText('Revocada')).toBeVisible()

    await pub.goto(`/i/${token}`)
    await expect(
      pub.getByRole('heading', { name: 'Invitación no disponible' }),
    ).toBeVisible()
    await pub.close()

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
