import 'server-only'

import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'

import * as schema from './schema'

/**
 * Drizzle + libSQL client (single source of data for boda-app).
 *
 * The SAME code serves both environments — only the env vars change:
 *   - Dev:  DATABASE_URL=file:local.db          (embedded SQLite file on disk)
 *   - Prod: DATABASE_URL=libsql://<db>.turso.io  + DATABASE_AUTH_TOKEN (Turso)
 *
 * `server-only` makes any accidental import from a Client Component a build
 * error — queries always run on the server (Server Components / Server Actions).
 * `@libsql/client` uses native bindings → the Node.js runtime only, never Edge.
 */
const url = process.env.DATABASE_URL
if (!url) {
  throw new Error('DATABASE_URL no está definido (p.ej. file:local.db en dev)')
}

const client = createClient({
  url,
  // Omitted for file: URLs (empty string → undefined); required for remote Turso.
  authToken: process.env.DATABASE_AUTH_TOKEN || undefined,
})

export const db = drizzle(client, { schema })
export { schema }
