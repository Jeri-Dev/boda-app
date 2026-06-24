CREATE TABLE `budget_categories` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`planned_cents` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	CONSTRAINT "budget_categories_planned_check" CHECK("budget_categories"."planned_cents" >= 0)
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` text PRIMARY KEY NOT NULL,
	`concept` text NOT NULL,
	`amount_cents` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'pendiente' NOT NULL,
	`due_date` text,
	`vendor_id` text,
	`category_id` text,
	`notes` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	CONSTRAINT "payments_amount_check" CHECK("payments"."amount_cents" >= 0),
	CONSTRAINT "payments_status_check" CHECK("payments"."status" in ('pendiente', 'pagado'))
);
