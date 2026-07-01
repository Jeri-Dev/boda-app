CREATE TABLE "budget_categories" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"planned_cents" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "budget_categories_planned_check" CHECK ("budget_categories"."planned_cents" >= 0)
);
--> statement-breakpoint
CREATE TABLE "guests" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"household" text,
	"email" text,
	"phone" text,
	"rsvp_status" text DEFAULT 'pending' NOT NULL,
	"menu" text,
	"plus_one" boolean DEFAULT false NOT NULL,
	"plus_one_name" text,
	"notes" text,
	"table_id" text,
	"last_modified_source" text DEFAULT 'host' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "guests_rsvp_status_check" CHECK ("guests"."rsvp_status" in ('pending', 'confirmed', 'declined')),
	CONSTRAINT "guests_last_modified_source_check" CHECK ("guests"."last_modified_source" in ('host', 'guest'))
);
--> statement-breakpoint
CREATE TABLE "invite_tokens" (
	"id" text PRIMARY KEY NOT NULL,
	"token" text NOT NULL,
	"party_size" integer DEFAULT 1 NOT NULL,
	"status" text DEFAULT 'valido' NOT NULL,
	"expires_at" timestamp with time zone,
	"label" text,
	"message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "invite_tokens_token_unique" UNIQUE("token"),
	CONSTRAINT "invite_tokens_status_check" CHECK ("invite_tokens"."status" in ('valido', 'revocado')),
	CONSTRAINT "invite_tokens_party_size_check" CHECK ("invite_tokens"."party_size" >= 1)
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" text PRIMARY KEY NOT NULL,
	"concept" text NOT NULL,
	"amount_cents" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'pendiente' NOT NULL,
	"due_date" text,
	"vendor_id" text,
	"category_id" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payments_amount_check" CHECK ("payments"."amount_cents" >= 0),
	CONSTRAINT "payments_status_check" CHECK ("payments"."status" in ('pendiente', 'pagado'))
);
--> statement-breakpoint
CREATE TABLE "rate_limits" (
	"key" text PRIMARY KEY NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"window_start" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tables" (
	"id" text PRIMARY KEY NOT NULL,
	"label" text NOT NULL,
	"capacity" integer DEFAULT 8 NOT NULL,
	"pos_x" integer,
	"pos_y" integer,
	"shape" text DEFAULT 'round' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tables_capacity_check" CHECK ("tables"."capacity" >= 1),
	CONSTRAINT "tables_shape_check" CHECK ("tables"."shape" in ('round', 'rect'))
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"due_date" text,
	"done" boolean DEFAULT false NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "token_guests" (
	"id" text PRIMARY KEY NOT NULL,
	"token_id" text NOT NULL,
	"guest_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vendors" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"category" text,
	"status" text DEFAULT 'contactado' NOT NULL,
	"email" text,
	"phone" text,
	"amount_cents" integer,
	"contract_url" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "vendors_status_check" CHECK ("vendors"."status" in ('contactado', 'presupuestado', 'contratado')),
	CONSTRAINT "vendors_amount_check" CHECK ("vendors"."amount_cents" is null or "vendors"."amount_cents" >= 0)
);
--> statement-breakpoint
CREATE TABLE "wedding" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"couple_names" text DEFAULT '' NOT NULL,
	"event_date" timestamp with time zone,
	"event_time" text,
	"venue" text,
	"message" text,
	"map_url" text,
	"schedule" text,
	"dress_code" text,
	"accommodation" text,
	"transport" text,
	"gift_message" text,
	"gift_details" text,
	"privacy_contact" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "wedding_singleton" CHECK ("wedding"."id" = 1)
);
--> statement-breakpoint
ALTER TABLE "guests" ADD CONSTRAINT "guests_table_id_tables_id_fk" FOREIGN KEY ("table_id") REFERENCES "public"."tables"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_category_id_budget_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."budget_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "token_guests" ADD CONSTRAINT "token_guests_token_id_invite_tokens_id_fk" FOREIGN KEY ("token_id") REFERENCES "public"."invite_tokens"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "token_guests" ADD CONSTRAINT "token_guests_guest_id_guests_id_fk" FOREIGN KEY ("guest_id") REFERENCES "public"."guests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "token_guests_token_guest_uq" ON "token_guests" USING btree ("token_id","guest_id");--> statement-breakpoint
CREATE INDEX "token_guests_token_idx" ON "token_guests" USING btree ("token_id");--> statement-breakpoint
CREATE INDEX "token_guests_guest_idx" ON "token_guests" USING btree ("guest_id");--> statement-breakpoint
-- Row-Level Security: deny-by-default (enable, ZERO policies, NO force).
-- Defense-in-depth only — the primary control is that the browser never gets a
-- connection string and Supabase's public Data API is disabled. With no FORCE,
-- the table owner (the `postgres` role the app connects as, and pglite in tests)
-- bypasses RLS; anon/authenticated via PostgREST would hit deny-by-default IF the
-- Data API were ever re-enabled. See docs/deploy-netlify.md.
ALTER TABLE "budget_categories" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "guests" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "invite_tokens" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "payments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "rate_limits" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "tables" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "tasks" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "token_guests" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "vendors" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "wedding" ENABLE ROW LEVEL SECURITY;