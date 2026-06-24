CREATE TABLE `wedding` (
	`id` integer PRIMARY KEY DEFAULT 1 NOT NULL,
	`couple_names` text DEFAULT '' NOT NULL,
	`event_date` integer,
	`venue` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	CONSTRAINT "wedding_singleton" CHECK("wedding"."id" = 1)
);
