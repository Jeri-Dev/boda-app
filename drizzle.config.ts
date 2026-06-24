import { defineConfig } from 'drizzle-kit'

/**
 * drizzle-kit config (generate / migrate / push / studio).
 *
 * `dialect: 'turso'` accepts BOTH a local `file:local.db` URL (dev, no token)
 * and a remote `libsql://…turso.io` URL (prod, with token) — one config for
 * both environments.
 *
 * drizzle-kit runs as a separate process and does NOT read `.env.local`, so the
 * `db:*` scripts launch it with `node --env-file=.env.local` (see package.json).
 */
const url = process.env.DATABASE_URL ?? 'file:local.db'
const isLocalFile = url.startsWith('file:')

export default defineConfig({
  schema: './src/lib/db/schema.ts',
  out: './src/lib/db/migrations',
  dialect: 'turso',
  dbCredentials: {
    url,
    // The 'turso' dialect requires a non-empty authToken even for a local
    // file: DB (where libSQL ignores it). Use a placeholder for file: URLs;
    // the real token is only needed for remote Turso in prod.
    authToken: isLocalFile ? 'local-file-ignored' : process.env.DATABASE_AUTH_TOKEN,
  },
  strict: true,
  verbose: true,
})
