import { test, expect } from '@playwright/test'

/**
 * U2.5/U2.6 — «Nuestra boda» (landing pública sin token): configura un
 * subconjunto de campos y comprueba que los bloques rellenos aparecen, los
 * vacíos se ocultan, la página es noindex y los datos de regalos se muestran.
 */

test.describe('Web informativa (U2.5) — /nuestra-boda', () => {
  test('configured sections render; empty ones are hidden; noindex', async ({
    page,
  }) => {
    const ts = Date.now()
    const couple = `Info Pareja ${ts}`
    const dressCode = `Etiqueta ${ts}`
    const giftDetails = `Cuenta 0000-1111-${ts}`

    // ── Configure a subset (dress code + gift, NO transport) ─────────────
    await page.goto('/configuracion')
    await page.getByRole('textbox', { name: 'Nombres de la pareja' }).fill(couple)
    await page.getByRole('textbox', { name: 'Código de vestimenta' }).fill(dressCode)
    await page
      .getByRole('textbox', { name: 'Datos para transferencia' })
      .fill(giftDetails)
    await page.getByRole('textbox', { name: 'Transporte' }).fill('')
    await page
      .getByRole('textbox', { name: 'Contacto para datos personales' })
      .fill('novios@example.com')
    await page.getByRole('button', { name: 'Guardar' }).click()
    await expect(page.getByText('Guardado ✓')).toBeVisible()

    // ── Public landing: open the envelope, then check the blocks ─────────
    await page.goto('/nuestra-boda')
    await page.getByRole('button', { name: 'Abrir la invitación' }).click()
    await expect(page.getByRole('heading', { name: couple })).toBeVisible()

    await expect(page.getByText('Código de vestimenta')).toBeVisible()
    await expect(page.getByText(dressCode)).toBeVisible()

    await expect(page.getByRole('heading', { name: 'Mesa de regalos' })).toBeVisible()
    await expect(page.getByText(giftDetails)).toBeVisible()

    // Transport was left empty → its note is not rendered.
    await expect(page.getByText('Transporte', { exact: true })).toHaveCount(0)

    // Privacy notice with the configured contact (footer).
    await expect(page.getByText('novios@example.com')).toBeVisible()

    // Without a personal link there is no RSVP form, only the hint.
    await expect(page.getByText('Confirma desde tu enlace personal')).toBeVisible()

    // noindex (gift/IBAN hygiene) — rendered as a <meta name="robots"> tag.
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      'content',
      /noindex/i,
    )

    // /info keeps working as a permanent redirect to the landing.
    const res = await page.goto('/info')
    expect(res?.url()).toContain('/nuestra-boda')
  })
})
