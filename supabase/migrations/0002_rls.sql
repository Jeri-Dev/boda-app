-- ============================================================================
-- 0002_rls.sql
-- boda-app — Row Level Security policies (Fase 0)
-- ----------------------------------------------------------------------------
-- CRITICAL READING BEFORE EDITING THIS FILE
-- ----------------------------------------------------------------------------
-- The host gate is ALWAYS membership in public.host_allowlist. NEVER write a
-- policy that uses `auth.role() = 'authenticated'` (or `auth.uid() IS NOT
-- NULL`) as the sole authorization condition. A bare authenticated user is not
-- a host — they have credentials, but no permission.
--
-- Every host policy below includes, in BOTH USING and WITH CHECK (whichever it
-- declares):
--
--     EXISTS (SELECT 1 FROM public.host_allowlist a WHERE a.user_id = auth.uid())
--
-- EXCEPTION — public.host_allowlist itself: its policy must be a NON-RECURSIVE
-- self-row check (`user_id = auth.uid()`). An EXISTS over host_allowlist inside
-- a policy ON host_allowlist recurses ("infinite recursion detected in policy")
-- and breaks all authenticated access. This is the bug my-app shipped and then
-- fixed in 0004; boda-app is born correct.
--
-- FORCE ROW LEVEL SECURITY is set on every table so the table owner is not
-- exempt. The service-role key bypasses RLS entirely; that bypass is
-- intentional and confined to server-only Storage code (added in Fase 1).
--
-- Idempotent: DROP POLICY IF EXISTS before each CREATE.
-- ============================================================================

ALTER TABLE public.host_allowlist  FORCE ROW LEVEL SECURITY;
ALTER TABLE public.wedding_public  FORCE ROW LEVEL SECURITY;
ALTER TABLE public.wedding_private FORCE ROW LEVEL SECURITY;

-- ============================================================================
-- host_allowlist — NON-RECURSIVE self-row read only.
-- ----------------------------------------------------------------------------
-- An authenticated user may read ONLY their own row (so the app can answer
-- "am I a host?"). No INSERT/UPDATE/DELETE policies exist → those operations
-- are denied for every non-service-role caller. Host provisioning happens
-- out-of-band (Supabase dashboard / service-role SQL, both bypass RLS).
-- See docs/supabase-setup.md.
-- ============================================================================
DROP POLICY IF EXISTS host_allowlist_self_select ON public.host_allowlist;
CREATE POLICY host_allowlist_self_select
  ON public.host_allowlist
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================================================
-- wedding_public — anon + host read; host-only writes.
-- ----------------------------------------------------------------------------
-- The guest surface reads this without a session. Writes require host
-- membership.
-- ============================================================================
DROP POLICY IF EXISTS wedding_public_public_select ON public.wedding_public;
CREATE POLICY wedding_public_public_select
  ON public.wedding_public
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS wedding_public_host_insert ON public.wedding_public;
CREATE POLICY wedding_public_host_insert
  ON public.wedding_public
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.host_allowlist a WHERE a.user_id = auth.uid())
  );

DROP POLICY IF EXISTS wedding_public_host_update ON public.wedding_public;
CREATE POLICY wedding_public_host_update
  ON public.wedding_public
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.host_allowlist a WHERE a.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.host_allowlist a WHERE a.user_id = auth.uid())
  );

DROP POLICY IF EXISTS wedding_public_host_delete ON public.wedding_public;
CREATE POLICY wedding_public_host_delete
  ON public.wedding_public
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.host_allowlist a WHERE a.user_id = auth.uid())
  );

-- ============================================================================
-- wedding_private — host-only on EVERY operation. anon has NO access.
-- ----------------------------------------------------------------------------
-- No anon policy = anon SELECT returns zero rows. This is the core
-- public/private isolation guarantee tested in U0.2.
-- ============================================================================
DROP POLICY IF EXISTS wedding_private_host_select ON public.wedding_private;
CREATE POLICY wedding_private_host_select
  ON public.wedding_private
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.host_allowlist a WHERE a.user_id = auth.uid())
  );

DROP POLICY IF EXISTS wedding_private_host_insert ON public.wedding_private;
CREATE POLICY wedding_private_host_insert
  ON public.wedding_private
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.host_allowlist a WHERE a.user_id = auth.uid())
  );

DROP POLICY IF EXISTS wedding_private_host_update ON public.wedding_private;
CREATE POLICY wedding_private_host_update
  ON public.wedding_private
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.host_allowlist a WHERE a.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.host_allowlist a WHERE a.user_id = auth.uid())
  );

DROP POLICY IF EXISTS wedding_private_host_delete ON public.wedding_private;
CREATE POLICY wedding_private_host_delete
  ON public.wedding_private
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.host_allowlist a WHERE a.user_id = auth.uid())
  );
