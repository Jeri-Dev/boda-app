import { fileURLToPath } from 'node:url'

import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      // `server-only` throws on import outside an RSC bundle — stub it so the
      // server-side data/security modules can be unit-tested directly.
      'server-only': fileURLToPath(
        new URL('./tests/unit/stubs/server-only.ts', import.meta.url),
      ),
    },
  },
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.ts'],
    // The db singleton (@/lib/db) reads DATABASE_URL at import time. Tests pass
    // an explicit in-memory db, so this just lets the import succeed.
    env: { DATABASE_URL: 'file:local.db' },
  },
})
