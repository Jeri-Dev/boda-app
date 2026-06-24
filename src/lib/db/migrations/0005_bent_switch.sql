CREATE TABLE `invite_tokens` (
	`id` text PRIMARY KEY NOT NULL,
	`token` text NOT NULL,
	`party_size` integer DEFAULT 1 NOT NULL,
	`status` text DEFAULT 'valido' NOT NULL,
	`expires_at` integer,
	`label` text,
	`message` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	CONSTRAINT "invite_tokens_status_check" CHECK("invite_tokens"."status" in ('valido', 'revocado')),
	CONSTRAINT "invite_tokens_party_size_check" CHECK("invite_tokens"."party_size" >= 1)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `invite_tokens_token_unique` ON `invite_tokens` (`token`);--> statement-breakpoint
CREATE TABLE `rate_limits` (
	`key` text PRIMARY KEY NOT NULL,
	`count` integer DEFAULT 0 NOT NULL,
	`window_start` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `token_guests` (
	`id` text PRIMARY KEY NOT NULL,
	`token_id` text NOT NULL,
	`guest_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `token_guests_token_guest_uq` ON `token_guests` (`token_id`,`guest_id`);--> statement-breakpoint
CREATE INDEX `token_guests_token_idx` ON `token_guests` (`token_id`);--> statement-breakpoint
CREATE INDEX `token_guests_guest_idx` ON `token_guests` (`guest_id`);--> statement-breakpoint
ALTER TABLE `guests` DROP COLUMN `allergies`;