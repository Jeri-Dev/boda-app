import 'server-only'

import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

import * as schema from './schema'

/**
 * Drizzle + Supabase Postgres client (single source of data for boda-app).
 *
 * The SAME code serves both environments — only `DATABASE_URL` changes:
 *   - Dev:  a Supabase connection string (session pooler, port 5432) or any
 *           local Postgres.
 *   - Prod (Netlify serverless): Supabase's **transaction pooler** (pgBouncer,
 *           port 6543). The transaction pooler does NOT support prepared
 *           statements, hence `prepare: false` — without it queries fail under
 *           load. Going through the pooler (not a direct 5432 connection) is
 *           what keeps serverless from exhausting Postgres connections.
 *
 * The browser never imports this: `server-only` turns any accidental Client
 * Component import into a build error, so queries always run on the server
 * (Server Components / Server Actions). Supabase's public Data API is disabled,
 * and RLS is enabled deny-by-default as defense-in-depth — but the real boundary
 * is that only the server holds this connection string.
 */
const url = process.env.DATABASE_URL
if (!url) {
  throw new Error(
    'DATABASE_URL no está definido (cadena de conexión Postgres de Supabase)',
  )
}

const client = postgres(url, {
  // Required for Supabase's transaction pooler (pgBouncer) — prepared statements
  // are not supported in "Transaction" pool mode. Harmless on a direct/session
  // connection, so it's safe to always set.
  prepare: false,
})

export const db = drizzle(client, { schema })
export { schema }
