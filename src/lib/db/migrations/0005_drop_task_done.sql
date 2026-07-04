-- DESTRUCTIVE — drops tasks.done (status is now the single source of truth).
-- Apply only after the status-based bundle is live (out-of-band, after deploy).
ALTER TABLE "tasks" DROP COLUMN "done";