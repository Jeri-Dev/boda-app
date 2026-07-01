import { PGlite } from '@electric-sql/pglite'
import { drizzle } from 'drizzle-orm/pglite'
import { migrate } from 'drizzle-orm/pglite/migrator'

import * as schema from '@/lib/db/schema'

/**
 * Exactly the production db type (postgres-js + schema, including its `$client`),
 * so a test db drops in wherever the data layer expects the real singleton. This
 * `typeof import(...)` is type-only — it never executes `@/lib/db` (no
 * `server-only`, no connection). pglite implements the same `PgDatabase` runtime
 * API, so the coercion in `makeTestDb` is purely STATIC; every method the data
 * layer calls (select / insert / update / delete / transaction /
 * onConflictDoUpdate / returning) exists identically on both drivers.
 */
export type TestDb = typeof import('@/lib/db').db

/**
 * Fresh in-memory Postgres (pglite — WASM, no Docker) with all migrations
 * applied, so tests exercise the REAL Postgres engine (FKs, CHECKs, timestamptz,
 * transactions) hermetically. Each call is fully isolated: a brand-new database
 * per test, so security tests can't leak state into one another.
 */
export async function makeTestDb(): Promise<TestDb> {
  const client = new PGlite()
  const db = drizzle(client, { schema })
  await migrate(db, { migrationsFolder: 'src/lib/db/migrations' })
  return db as unknown as TestDb
}
