import { test as base, expect } from '@playwright/test'

/**
 * `hostTest` — Playwright test factory that yields an authenticated-host `page`
 * via the storage state captured in `global-setup.ts`.
 *
 *   import { hostTest as test, expect } from './fixtures/test-host'
 *
 *   test('dashboard renders', async ({ page }) => {
 *     await page.goto('/')
 *   })
 *
 * Specs that need an ANONYMOUS page (the login flow) import from
 * `@playwright/test` directly so they don't inherit this storage state.
 */
export const hostTest = base.extend({
  storageState: 'tests/.auth/host.json',
})

export { expect }
