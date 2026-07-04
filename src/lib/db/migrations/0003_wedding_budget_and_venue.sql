ALTER TABLE "wedding" ADD COLUMN "total_budget_cents" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "wedding" ADD COLUMN "venue_address" text;--> statement-breakpoint
ALTER TABLE "wedding" ADD COLUMN "venue_phone" text;--> statement-breakpoint
ALTER TABLE "wedding" ADD COLUMN "venue_coordinator" text;--> statement-breakpoint
ALTER TABLE "wedding" ADD COLUMN "ceremony_start" text;--> statement-breakpoint
ALTER TABLE "wedding" ADD COLUMN "ceremony_end" text;--> statement-breakpoint
ALTER TABLE "wedding" ADD COLUMN "reception_start" text;--> statement-breakpoint
ALTER TABLE "wedding" ADD COLUMN "reception_end" text;--> statement-breakpoint
ALTER TABLE "wedding" ADD CONSTRAINT "wedding_total_budget_check" CHECK ("wedding"."total_budget_cents" >= 0);