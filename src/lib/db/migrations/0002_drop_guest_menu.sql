-- DESTRUCTIVE — drops guests.menu (the meal-selection feature was removed end
-- to end, host + public RSVP). Before applying in production:
--   1. Back up the column, e.g.
--      \copy (select id, menu from guests where menu is not null) to 'menu_backup.csv' csv header
--   2. Ensure the menu-free bundle is ALREADY deployed (no live code selects or
--      writes guests.menu) — this migration is applied out-of-band, so run it
--      only after that deploy is live.
ALTER TABLE "guests" DROP COLUMN "menu";