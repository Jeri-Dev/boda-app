import { randomUUID } from 'node:crypto'

import { sql } from 'drizzle-orm'
import {
  boolean,
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core'

/**
 * boda-app schema (Drizzle + Supabase Postgres).
 *
 * Conventions:
 *   - text-PK with a Node-generated UUID default for stable IDs (entropy stays
 *     in the app, matching `lib/tokens`; never a DB-side default);
 *   - `text({ enum: [...] })` + a SQL `check()` = type-safe in TS *and* enforced
 *     in the database (the roadmap's `text + CHECK`);
 *   - `created_at` / `updated_at` as `timestamptz`; `$onUpdate` refreshes
 *     `updated_at` on every Drizzle UPDATE (no DB trigger needed — the server is
 *     the only writer);
 *   - REAL foreign keys (Postgres enforces them, unlike libSQL over HTTP):
 *     `on delete set null` for soft ownership ("parent gone = orphaned but kept")
 *     and `on delete cascade` for the token↔guest bridge. The app no longer
 *     cleans these refs by hand.
 *
 * Security note: the browser never touches the DB — the Next server is the only
 * client (open app, no auth). RLS is enabled deny-by-default in the migration as
 * defense-in-depth; the primary control is that only the server holds the
 * connection string and Supabase's public Data API is disabled.
 */

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
}

/** Singleton event-config row (id fixed to 1). */
export const wedding = pgTable(
  'wedding',
  {
    id: integer('id').primaryKey().default(1),
    coupleNames: text('couple_names').notNull().default(''),
    eventDate: timestamp('event_date', { withTimezone: true, mode: 'date' }),
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
    /** Overall/general budget envelope (U5), in DOP cents. */
    totalBudgetCents: integer('total_budget_cents').notNull().default(0),
    /* ── Venue / ceremony / reception details (U9) — host-only, never public ── */
    venueAddress: text('venue_address'),
    venuePhone: text('venue_phone'),
    venueCoordinator: text('venue_coordinator'),
    ceremonyStart: text('ceremony_start'),
    ceremonyEnd: text('ceremony_end'),
    receptionStart: text('reception_start'),
    receptionEnd: text('reception_end'),
    ...timestamps,
  },
  (t) => [
    check('wedding_singleton', sql`${t.id} = 1`),
    check('wedding_total_budget_check', sql`${t.totalBudgetCents} >= 0`),
  ],
)

export type Wedding = typeof wedding.$inferSelect
export type NewWedding = typeof wedding.$inferInsert

/**
 * Guest list (U1.1) — the backbone the rest of the app hangs off of.
 *
 * `last_modified_source` + `updated_at` exist from day one (the roadmap calls
 * for them): Fase 2's public RSVP writes `'guest'`, the back-office writes
 * `'host'`, so the UI can show "updated by guest X ago" before overwriting.
 */
export const RSVP_STATUSES = ['pending', 'confirmed', 'declined'] as const
export type RsvpStatus = (typeof RSVP_STATUSES)[number]

export const guests = pgTable(
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
    /** Host-only postal address (optional; never shown on public pages). */
    address: text('address'),
    /** Whether this guest may bring a +1. */
    plusOne: boolean('plus_one').notNull().default(false),
    plusOneName: text('plus_one_name'),
    /** Host-only private notes. */
    notes: text('notes'),
    /** Seating (Fase 3): FK to a logical `tables` row; `set null` on table
     * delete (a deleted table = "sin sentar", never a deleted guest). */
    tableId: text('table_id').references(() => tables.id, {
      onDelete: 'set null',
    }),
    lastModifiedSource: text('last_modified_source', {
      enum: ['host', 'guest'],
    })
      .notNull()
      .default('host'),
    ...timestamps,
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

export const vendors = pgTable(
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
    /** Vendor Contact form (U8): named contact + a manual at-a-glance paid flag
     * (independent of the payments ledger, which remains the source of truth). */
    contactPerson: text('contact_person'),
    paid: boolean('paid').notNull().default(false),
    email: text('email'),
    phone: text('phone'),
    /** Agreed/quoted total, in DOP cents (nullable). */
    amountCents: integer('amount_cents'),
    /** External link to the contract / quote document. */
    contractUrl: text('contract_url'),
    notes: text('notes'),
    ...timestamps,
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
 * vendor by REAL FK with `on delete set null` — deleting a parent orphans the
 * payment (ref nulled) but never deletes it; reads LEFT JOIN and tolerate nulls.
 */
export const budgetCategories = pgTable(
  'budget_categories',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    name: text('name').notNull(),
    /** Planned amount (previsto), in DOP cents. */
    plannedCents: integer('planned_cents').notNull().default(0),
    ...timestamps,
  },
  (t) => [
    check('budget_categories_planned_check', sql`${t.plannedCents} >= 0`),
  ],
)

export type BudgetCategory = typeof budgetCategories.$inferSelect
export type NewBudgetCategory = typeof budgetCategories.$inferInsert

export const PAYMENT_STATUSES = ['pendiente', 'pagado'] as const
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number]

export const payments = pgTable(
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
    /** Real FKs, nulled by the DB on parent delete (`on delete set null`). */
    vendorId: text('vendor_id').references(() => vendors.id, {
      onDelete: 'set null',
    }),
    categoryId: text('category_id').references(() => budgetCategories.id, {
      onDelete: 'set null',
    }),
    notes: text('notes'),
    ...timestamps,
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
export const TASK_STATUSES = ['todo', 'doing', 'done'] as const
export type TaskStatus = (typeof TASK_STATUSES)[number]

export const tasks = pgTable(
  'tasks',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    title: text('title').notNull(),
    dueDate: text('due_date'),
    /** Kanban column (U6a) — the single source of truth for completion. */
    status: text('status', { enum: TASK_STATUSES }).notNull().default('todo'),
    /** Intra-column order (0-based). */
    position: integer('position').notNull().default(0),
    notes: text('notes'),
    ...timestamps,
  },
  (t) => [
    check('tasks_status_check', sql`${t.status} in ('todo', 'doing', 'done')`),
  ],
)

export type Task = typeof tasks.$inferSelect
export type NewTask = typeof tasks.$inferInsert

/**
 * Invitation tokens + RSVP infrastructure (U2.1).
 *
 * Security model (no RLS gating — the browser never touches the DB; the Next
 * server is the only DB client). The token is a 256-bit URL-safe SECRET (see
 * lib/tokens), never `randomUUID`. Validity is COMPUTED on every read
 * (`status='valido'` AND not past `expires_at`) — there is no persisted
 * "expired" state to drift. `party_size` is how many people the invitation
 * covers (1 = individual).
 */
export const INVITE_STATUSES = ['valido', 'revocado'] as const
export type InviteStatus = (typeof INVITE_STATUSES)[number]

export const inviteTokens = pgTable(
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
    expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }),
    /** Back-office label, e.g. "Familia Pérez". */
    label: text('label'),
    /** The guest's free-text RSVP message (one per invitation). */
    message: text('message'),
    ...timestamps,
  },
  (t) => [
    check(
      'invite_tokens_status_check',
      sql`${t.status} in ('valido', 'revocado')`,
    ),
    check('invite_tokens_party_size_check', sql`${t.partySize} >= 1`),
  ],
)

export type InviteToken = typeof inviteTokens.$inferSelect
export type NewInviteToken = typeof inviteTokens.$inferInsert

/**
 * Bridge token↔guests. REAL FKs with `on delete cascade` on BOTH sides: a
 * deleted guest or a deleted token takes its bridge rows with it (the app no
 * longer deletes these by hand). An INNER JOIN discards nothing extra.
 */
export const tokenGuests = pgTable(
  'token_guests',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    tokenId: text('token_id')
      .notNull()
      .references(() => inviteTokens.id, { onDelete: 'cascade' }),
    guestId: text('guest_id')
      .notNull()
      .references(() => guests.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex('token_guests_token_guest_uq').on(t.tokenId, t.guestId),
    index('token_guests_token_idx').on(t.tokenId),
    index('token_guests_guest_idx').on(t.guestId),
  ],
)

export type TokenGuest = typeof tokenGuests.$inferSelect

/**
 * Persistent rate-limit store (the DB is the shared store across serverless
 * invocations; an in-memory Map would be fail-open useless). Fixed window via
 * atomic UPSERT.
 */
export const rateLimits = pgTable('rate_limits', {
  key: text('key').primaryKey(),
  count: integer('count').notNull().default(0),
  windowStart: timestamp('window_start', {
    withTimezone: true,
    mode: 'date',
  }).notNull(),
})

export type RateLimit = typeof rateLimits.$inferSelect

/**
 * Seating tables (U3.1) — the LOGICAL table (label + capacity, the assignable
 * thing), separate from floor-plan geometry (U3.2). Guests link via the
 * `guests.table_id` FK; capacity is a SOFT constraint (recomputed on read,
 * over-capacity warns, never blocks).
 */
export const TABLE_SHAPES = ['round', 'rect'] as const
export type TableShape = (typeof TABLE_SHAPES)[number]

export const tables = pgTable(
  'tables',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    label: text('label').notNull(),
    capacity: integer('capacity').notNull().default(8),
    /** Floor-plan geometry (U3.2). NULL = not placed yet (auto-laid-out). */
    posX: integer('pos_x'),
    posY: integer('pos_y'),
    shape: text('shape', { enum: TABLE_SHAPES }).notNull().default('round'),
    ...timestamps,
  },
  (t) => [
    check('tables_capacity_check', sql`${t.capacity} >= 1`),
    check('tables_shape_check', sql`${t.shape} in ('round', 'rect')`),
  ],
)

export type Table = typeof tables.$inferSelect
export type NewTable = typeof tables.$inferInsert
