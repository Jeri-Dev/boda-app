import { test, expect } from '@playwright/test'

/**
 * U2.5/U2.6 — public info page + gift registry + privacy notice. Configures a
 * subset of fields and asserts filled sections show, empty ones are hidden, the
 * page is noindex, and the gift transfer details render.
 */

test.describe('Web informativa (U2.5)', () => {
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
    await page
      .getByRole('textbox', { name: 'Contacto para datos personales' })
      .fill('novios@example.com')
    await page.getByRole('button', { name: 'Guardar' }).click()
    await expect(page.getByText('Guardado ✓')).toBeVisible()

    // ── Public /info renders filled sections, hides empty ones ───────────
    await page.goto('/info')
    await expect(page.getByRole('heading', { name: couple })).toBeVisible()
    await expect(
      page.getByRole('heading', { name: 'Código de vestimenta' }),
    ).toBeVisible()
    await expect(page.getByText(dressCode)).toBeVisible()

    await expect(
      page.getByRole('heading', { name: 'Mesa de regalos' }),
    ).toBeVisible()
    await expect(page.getByText(giftDetails)).toBeVisible()

    // Transport was left empty → its section is not rendered.
    await expect(
      page.getByRole('heading', { name: 'Transporte' }),
    ).toHaveCount(0)

    // Privacy notice with the configured contact.
    await expect(page.getByText('novios@example.com')).toBeVisible()

    // noindex (gift/IBAN hygiene) — rendered as a <meta name="robots"> tag.
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      'content',
      /noindex/i,
    )
  })
})
