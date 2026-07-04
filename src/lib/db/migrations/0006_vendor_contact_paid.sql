ALTER TABLE "vendors" ADD COLUMN "contact_person" text;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "paid" boolean DEFAULT false NOT NULL;