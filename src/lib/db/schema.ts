import { sql } from 'drizzle-orm'
import { check, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

/**
 * boda-app schema (Drizzle + SQLite/libSQL).
 *
 * Patterns to reuse for the Fase 1 tables:
 *   - text-PK with a generated default for stable IDs;
 *   - `text({ enum: [...] })` + a SQL `check()` = type-safe in TS *and* enforced
 *     in the database (the Drizzle equivalent of the roadmap's `text + CHECK`);
 *   - `created_at` / `updated_at` as unixepoch integers; `$onUpdate` refreshes
 *     `updated_at` on every Drizzle UPDATE.
 *
 * `wedding` is the singleton event-config row (id is fixed to 1). The real
 * domain backbone (guests, vendors, budget, tasks) lands in Fase 1 (U1.x).
 */
export const wedding = sqliteTable(
  'wedding',
  {
    id: integer('id').primaryKey().default(1),
    coupleNames: text('couple_names').notNull().default(''),
    eventDate: integer('event_date', { mode: 'timestamp' }),
    venue: text('venue'),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`)
      .$onUpdate(() => new Date()),
  },
  (t) => [check('wedding_singleton', sql`${t.id} = 1`)],
)

export type Wedding = typeof wedding.$inferSelect
export type NewWedding = typeof wedding.$inferInsert
