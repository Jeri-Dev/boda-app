import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { defineConfig, devices } from '@playwright/test'

/**
 * Load `.env.local` into `process.env` for the Playwright runner (global-setup
 * + specs) without adding a dependency. Next.js loads it for the dev server
 * child on its own; the runner process does not, so we do it here. Shell-set
 * vars win (we only fill what's unset).
 *
 * Resolved from `process.cwd()` (the project root, where `pnpm test:e2e` runs)
 * — Playwright loads this config via CommonJS, so `import.meta` is unavailable.
 */
function loadEnvLocal() {
  try {
    const text = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8')
    for (const line of text.split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
      if (!m) continue
      let val = m[2].trim()
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1)
      }
      if (process.env[m[1]] === undefined) process.env[m[1]] = val
    }
  } catch {
    // No .env.local — rely on shell env (e.g. CI secrets).
  }
}
loadEnvLocal()

/**
 * Playwright config for the boda-app E2E + integration suite.
 *
 * Serial by design: specs share one local Supabase stack, so running in
 * parallel would race on the singleton config rows and leak state. `global-
 * setup` provisions the test host user + allowlist membership and captures an
 * authenticated `storageState` once per run.
 *
 * Required env (see `.env.local` / `tests/e2e/README.md`):
 *   NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
 *   PLAYWRIGHT_SUPABASE_SERVICE_KEY  (service/secret key — RLS asserts + setup)
 *   PLAYWRIGHT_HOST_EMAIL, PLAYWRIGHT_HOST_PASSWORD
 */
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000'

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 2 : 0,
  forbidOnly: Boolean(process.env.CI),
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  globalSetup: './tests/e2e/global-setup.ts',
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'pnpm dev',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
