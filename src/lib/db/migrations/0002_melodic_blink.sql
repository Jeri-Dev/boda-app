CREATE TABLE `vendors` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`category` text,
	`status` text DEFAULT 'contactado' NOT NULL,
	`email` text,
	`phone` text,
	`amount_cents` integer,
	`contract_url` text,
	`notes` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	CONSTRAINT "vendors_status_check" CHECK("vendors"."status" in ('contactado', 'presupuestado', 'contratado')),
	CONSTRAINT "vendors_amount_check" CHECK("vendors"."amount_cents" is null or "vendors"."amount_cents" >= 0)
);
