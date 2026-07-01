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
    // pglite boots a real (WASM) Postgres per `makeTestDb()`; the first boot in
    // each worker pays the one-time WASM compile (~2-4s), and some security
    // tests spin up several isolated DBs in one case. The default 5s timeout is
    // too tight for a real engine — pure money/dates tests stay instant.
    testTimeout: 30_000,
    hookTimeout: 30_000,
    // The db singleton (@/lib/db) reads DATABASE_URL at import time and hands it
    // to postgres.js. Tests inject an explicit pglite db and never query the
    // singleton, so this dummy connection string just lets the import succeed
    // (postgres.js is lazy — it never actually connects).
    env: { DATABASE_URL: 'postgresql://user:pass@127.0.0.1:5432/boda_test' },
  },
})
