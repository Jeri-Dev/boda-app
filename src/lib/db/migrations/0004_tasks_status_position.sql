ALTER TABLE "tasks" ADD COLUMN "status" text DEFAULT 'todo' NOT NULL;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "position" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_status_check" CHECK ("tasks"."status" in ('todo', 'doing', 'done'));--> statement-breakpoint
-- Backfill: completed tasks become the 'done' column; the rest stay 'todo'.
UPDATE "tasks" SET "status" = 'done' WHERE "done" = true;--> statement-breakpoint
-- Seed intra-column order (0-based) by the previous urgency ordering.
UPDATE "tasks" SET "position" = sub.rn
FROM (
  SELECT "id", (row_number() OVER (
    PARTITION BY "status"
    ORDER BY ("due_date" IS NULL), "due_date", "created_at"
  ) - 1) AS rn
  FROM "tasks"
) AS sub
WHERE "tasks"."id" = sub."id";