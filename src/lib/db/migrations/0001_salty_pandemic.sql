CREATE TABLE `guests` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`household` text,
	`email` text,
	`phone` text,
	`rsvp_status` text DEFAULT 'pending' NOT NULL,
	`menu` text,
	`allergies` text,
	`plus_one` integer DEFAULT false NOT NULL,
	`plus_one_name` text,
	`notes` text,
	`last_modified_source` text DEFAULT 'host' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	CONSTRAINT "guests_rsvp_status_check" CHECK("guests"."rsvp_status" in ('pending', 'confirmed', 'declined')),
	CONSTRAINT "guests_last_modified_source_check" CHECK("guests"."last_modified_source" in ('host', 'guest'))
);
