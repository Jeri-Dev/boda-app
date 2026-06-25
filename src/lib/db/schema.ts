import { randomUUID } from 'node:crypto'

import { sql } from 'drizzle-orm'
import {
  check,
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core'

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
    /** Free-text time of day, e.g. "5:00 PM". */
    eventTime: text('event_time'),
    venue: text('venue'),
    /** Welcome / invitation message shown on the public invitation. */
    message: text('message'),
    /* ── Public info page (/info), U2.5 — all optional, hidden when empty ── */
    mapUrl: text('map_url'),
    schedule: text('schedule'),
    dressCode: text('dress_code'),
    accommodation: text('accommodation'),
    transport: text('transport'),
    /** Gift registry intro + transfer details (no payment gateway). */
    giftMessage: text('gift_message'),
    giftDetails: text('gift_details'),
    /** Contact for exercising data rights (RGPD notice, U2.6). */
    privacyContact: text('privacy_contact'),
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
    /** Whether this guest may bring a +1. */
    plusOne: integer('plus_one', { mode: 'boolean' }).notNull().default(false),
    plusOneName: text('plus_one_name'),
    /** Host-only private notes. */
    notes: text('notes'),
    /** Seating (Fase 3): soft ref to a logical `tables` row; nulled in app code
     * when that table is deleted (never CASCADE — a deleted table = "sin sentar"). */
    tableId: text('table_id'),
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

/**
 * Budget + payments (U1.3). A budget `category` holds the PLANNED amount
 * (previsto); `payments` track the real spend. "Real" = sum of paid payments
 * (globally and per category). Payments link to a category and (optionally) a
 * vendor by **soft reference** (plain id columns, no enforced FK — libSQL/Turso
 * doesn't enforce FKs reliably over HTTP). Delete actions null these refs in
 * application code; reads LEFT JOIN and tolerate orphans.
 */
export const budgetCategories = sqliteTable(
  'budget_categories',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    name: text('name').notNull(),
    /** Planned amount (previsto), in DOP cents. */
    plannedCents: integer('planned_cents').notNull().default(0),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`)
      .$onUpdate(() => sql`(unixepoch())`),
  },
  (t) => [
    check('budget_categories_planned_check', sql`${t.plannedCents} >= 0`),
  ],
)

export type BudgetCategory = typeof budgetCategories.$inferSelect
export type NewBudgetCategory = typeof budgetCategories.$inferInsert

export const PAYMENT_STATUSES = ['pendiente', 'pagado'] as const
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number]

export const payments = sqliteTable(
  'payments',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    concept: text('concept').notNull(),
    /** Payment amount in DOP cents (0 is allowed). */
    amountCents: integer('amount_cents').notNull().default(0),
    status: text('status', { enum: PAYMENT_STATUSES })
      .notNull()
      .default('pendiente'),
    /** Due / expected date as a calendar date `YYYY-MM-DD` (timezone-free). */
    dueDate: text('due_date'),
    /** Soft references (no enforced FK) — nulled by app code on parent delete. */
    vendorId: text('vendor_id'),
    categoryId: text('category_id'),
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
    check('payments_amount_check', sql`${t.amountCents} >= 0`),
    check('payments_status_check', sql`${t.status} in ('pendiente', 'pagado')`),
  ],
)

export type Payment = typeof payments.$inferSelect
export type NewPayment = typeof payments.$inferInsert

/**
 * Task checklist (U1.4). In-app only (no proactive notifications). Ordered by
 * urgency in the read; `dueDate` is a timezone-free `YYYY-MM-DD`.
 */
export const tasks = sqliteTable('tasks', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => randomUUID()),
  title: text('title').notNull(),
  dueDate: text('due_date'),
  done: integer('done', { mode: 'boolean' }).notNull().default(false),
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`)
    .$onUpdate(() => sql`(unixepoch())`),
})

export type Task = typeof tasks.$inferSelect
export type NewTask = typeof tasks.$inferInsert

/**
 * Invitation tokens + RSVP infrastructure (U2.1).
 *
 * Security model (no RLS — the browser never touches the DB; the Next server is
 * the only DB client). The token is a 256-bit URL-safe SECRET (see lib/tokens),
 * never `randomUUID`. Validity is COMPUTED on every read (`status='valido'` AND
 * not past `expires_at`) — there is no persisted "expired" state to drift.
 * `party_size` is how many people the invitation covers (1 = individual).
 */
export const INVITE_STATUSES = ['valido', 'revocado'] as const
export type InviteStatus = (typeof INVITE_STATUSES)[number]

export const inviteTokens = sqliteTable(
  'invite_tokens',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    /** High-entropy URL-safe secret (256 bits) — set via lib/tokens, not here. */
    token: text('token').notNull().unique(),
    /** How many people this invitation is for (its linked guest rows). */
    partySize: integer('party_size').notNull().default(1),
    status: text('status', { enum: INVITE_STATUSES })
      .notNull()
      .default('valido'),
    /** Computed-validity cutoff; NULL = never expires. */
    expiresAt: integer('expires_at', { mode: 'timestamp' }),
    /** Back-office label, e.g. "Familia Pérez". */
    label: text('label'),
    /** The guest's free-text RSVP message (one per invitation). */
    message: text('message'),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`)
      .$onUpdate(() => sql`(unixepoch())`),
  },
  (t) => [
    check('invite_tokens_status_check', sql`${t.status} in ('valido', 'revocado')`),
    check('invite_tokens_party_size_check', sql`${t.partySize} >= 1`),
  ],
)

export type InviteToken = typeof inviteTokens.$inferSelect
export type NewInviteToken = typeof inviteTokens.$inferInsert

/**
 * Bridge token↔guests (soft refs, no enforced FK — cleaned in app code on
 * delete). A token covers `party_size` guest rows; an INNER JOIN discards
 * orphaned links naturally.
 */
export const tokenGuests = sqliteTable(
  'token_guests',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    tokenId: text('token_id').notNull(),
    guestId: text('guest_id').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [
    uniqueIndex('token_guests_token_guest_uq').on(t.tokenId, t.guestId),
    index('token_guests_token_idx').on(t.tokenId),
    index('token_guests_guest_idx').on(t.guestId),
  ],
)

export type TokenGuest = typeof tokenGuests.$inferSelect

/**
 * Persistent rate-limit store (libSQL is the shared store across serverless
 * invocations; an in-memory Map would be fail-open useless on Vercel). Fixed
 * window via atomic UPSERT.
 */
export const rateLimits = sqliteTable('rate_limits', {
  key: text('key').primaryKey(),
  count: integer('count').notNull().default(0),
  windowStart: integer('window_start', { mode: 'timestamp' }).notNull(),
})

export type RateLimit = typeof rateLimits.$inferSelect

/**
 * Seating tables (U3.1) — the LOGICAL table (label + capacity, the assignable
 * thing), separate from floor-plan geometry (U3.2). Guests link via the soft
 * `guests.table_id` ref; capacity is a SOFT constraint (recomputed on read,
 * over-capacity warns, never blocks).
 */
export const tables = sqliteTable(
  'tables',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    label: text('label').notNull(),
    capacity: integer('capacity').notNull().default(8),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`)
      .$onUpdate(() => sql`(unixepoch())`),
  },
  (t) => [check('tables_capacity_check', sql`${t.capacity} >= 1`)],
)

export type Table = typeof tables.$inferSelect
export type NewTable = typeof tables.$inferInsert
