ALTER TABLE `tables` ADD COLUMN `pos_x` integer;--> statement-breakpoint
ALTER TABLE `tables` ADD COLUMN `pos_y` integer;--> statement-breakpoint
ALTER TABLE `tables` ADD COLUMN `shape` text DEFAULT 'round' NOT NULL CHECK (`shape` in ('round', 'rect'));
