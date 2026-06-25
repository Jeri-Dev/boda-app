CREATE TABLE `tables` (
	`id` text PRIMARY KEY NOT NULL,
	`label` text NOT NULL,
	`capacity` integer DEFAULT 8 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	CONSTRAINT "tables_capacity_check" CHECK("tables"."capacity" >= 1)
);
--> statement-breakpoint
ALTER TABLE `guests` ADD `table_id` text;