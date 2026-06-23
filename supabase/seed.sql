-- ============================================================================
-- seed.sql
-- boda-app — minimal singleton config for local dev / tests
-- ----------------------------------------------------------------------------
-- Run after migrations (e.g. `supabase db reset`). Idempotent via ON CONFLICT.
-- Executes as the postgres role (BYPASSRLS), so FORCE RLS does not block it.
--
-- NOT seeded here:
--   * host_allowlist rows — the referenced auth.users row must exist first.
--     docs/supabase-setup.md covers the manual INSERT after creating the host
--     user in the dashboard (and the test bootstrap in tests/e2e/README.md).
-- ============================================================================

-- Singleton wedding config rows. The CHECK (id = 1) + PK make these the only
-- rows the tables can ever hold.
INSERT INTO public.wedding_public (id, couple_name_1, couple_name_2, message)
VALUES (1, 'Nombre 1', 'Nombre 2', 'Nos casamos. Acompáñanos.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.wedding_private (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;
