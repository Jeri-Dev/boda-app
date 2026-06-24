import { randomUUID } from 'node:crypto'

import { sql } from 'drizzle-orm'
import { check, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

/**
 * boda-app schema (Drizzle + SQLite/libSQL).
 *
 * Conventions:
 *   - text-PK with a generated UUID default for stable IDs;
 *   - `text({ enum: [...] })` + a SQL `check()` = type-safe in TS *and* enforced
 *     in the database (the roadmap's `text + CHECK`);
 *   - `created_at` / `updated_at` as unixepoch integers; `$onUpdate` refreshes
 *     `updated_at` on every Drizzle UPDATE.
 */

/** Singleton event-config row (id fixed to 1). */
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
      .$onUpdate(() => sql`(unixepoch())`),
  },
  (t) => [check('wedding_singleton', sql`${t.id} = 1`)],
)

export type Wedding = typeof wedding.$inferSelect
export type NewWedding = typeof wedding.$inferInsert

/**
 * Guest list (U1.1) — the backbone the rest of the app hangs off of.
 *
 * `last_modified_source` + `updated_at` exist from day one (the roadmap calls
 * for them): Fase 2's public RSVP writes `'guest'`, the back-office writes
 * `'host'`, so the UI can show "updated by guest X ago" before overwriting.
 * `table_id` (seating, Fase 3) is intentionally NOT here yet.
 */
export const RSVP_STATUSES = ['pending', 'confirmed', 'declined'] as const
export type RsvpStatus = (typeof RSVP_STATUSES)[number]

export const guests = sqliteTable(
  'guests',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    name: text('name').notNull(),
    /** Household / group label, to cluster families. */
    household: text('household'),
    email: text('email'),
    phone: text('phone'),
    rsvpStatus: text('rsvp_status', { enum: RSVP_STATUSES })
      .notNull()
      .default('pending'),
    menu: text('menu'),
    /** Health data (RGPD Art. 9) — nullable; every read must tolerate NULL. */
    allergies: text('allergies'),
    /** Whether this guest may bring a +1. */
    plusOne: integer('plus_one', { mode: 'boolean' }).notNull().default(false),
    plusOneName: text('plus_one_name'),
    /** Host-only private notes. */
    notes: text('notes'),
    lastModifiedSource: text('last_modified_source', {
      enum: ['host', 'guest'],
    })
      .notNull()
      .default('host'),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`)
      .$onUpdate(() => sql`(unixepoch())`),
  },
  (t) => [
    check(
      'guests_rsvp_status_check',
      sql`${t.rsvpStatus} in ('pending', 'confirmed', 'declined')`,
    ),
    check(
      'guests_last_modified_source_check',
      sql`${t.lastModifiedSource} in ('host', 'guest')`,
    ),
  ],
)

export type Guest = typeof guests.$inferSelect
export type NewGuest = typeof guests.$inferInsert

/**
 * Vendors + contracts (U1.2). Simple deal status (no transition logic). The
 * contract is an EXTERNAL link in the MVP (there is no file Storage layer);
 * `amount_cents` is the agreed/quoted total in DOP cents that U1.3's budget
 * sums payments against.
 */
export const VENDOR_STATUSES = [
  'contactado',
  'presupuestado',
  'contratado',
] as const
export type VendorStatus = (typeof VENDOR_STATUSES)[number]

export const vendors = sqliteTable(
  'vendors',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    name: text('name').notNull(),
    /** Free-text category, e.g. "Catering", "Fotografía". */
    category: text('category'),
    status: text('status', { enum: VENDOR_STATUSES })
      .notNull()
      .default('contactado'),
    email: text('email'),
    phone: text('phone'),
    /** Agreed/quoted total, in DOP cents (nullable). */
    amountCents: integer('amount_cents'),
    /** External link to the contract / quote document. */
    contractUrl: text('contract_url'),
    notes: text('notes'),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`)
      .$onUpdate(() => sql`(unixepoch())`),
  },
  (t) => [
    check(
      'vendors_status_check',
      sql`${t.status} in ('contactado', 'presupuestado', 'contratado')`,
    ),
    check(
      'vendors_amount_check',
      sql`${t.amountCents} is null or ${t.amountCents} >= 0`,
    ),
  ],
)

export type Vendor = typeof vendors.$inferSelect
export type NewVendor = typeof vendors.$inferInsert
