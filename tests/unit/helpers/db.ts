import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { migrate } from 'drizzle-orm/libsql/migrator'

import * as schema from '@/lib/db/schema'

export type TestDb = ReturnType<typeof drizzle<typeof schema>>

/**
 * Fresh in-memory libSQL with all migrations applied. Each call is fully
 * isolated, so security tests can't leak state into one another.
 */
export async function makeTestDb(): Promise<TestDb> {
  const client = createClient({ url: ':memory:' })
  const db = drizzle(client, { schema })
  await migrate(db, { migrationsFolder: 'src/lib/db/migrations' })
  return db
}
