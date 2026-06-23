-- ============================================================================
-- 0001_init.sql
-- boda-app — initial database schema (Fase 0)
-- ----------------------------------------------------------------------------
-- Source of truth for table shape, FK rules, and CHECK constraints. RLS
-- policies live in 0002_rls.sql.
--
-- Conventions (mirroring my-app):
--   * pgcrypto for gen_random_uuid()
--   * created_at / updated_at maintained by a shared trigger function
--   * RLS ENABLED here; FORCE ROW LEVEL SECURITY + policies live in 0002 so a
--     reviewer sees the gate next to the rules
--   * IF NOT EXISTS guards everywhere so this script is safely re-runnable
--
-- Public/private boundary (R14): the wedding config is split into two tables.
-- `wedding_public` is readable by anon (date, venue, dress code — the guest
-- surface needs them). `wedding_private` and `host_allowlist` are never
-- readable by anon. RLS is column-blind, so we project public fields by
-- SEPARATING them into their own table rather than relying on a policy.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ----------------------------------------------------------------------------
-- updated_at trigger function — one shared implementation.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

-- ============================================================================
-- host_allowlist — the single-account allowlist of auth.users IDs that may
-- operate the back-office.
-- ----------------------------------------------------------------------------
-- RLS policies in 0002 authorize every private operation by membership here.
-- A bare authenticated user is NOT a host — they must have a row in this table.
-- The allowlist's OWN policy is a non-recursive self-row check (see 0002); the
-- first/only host row is inserted out-of-band (service role / dashboard), since
-- the referenced auth.users row must exist first. See docs/supabase-setup.md.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.host_allowlist (
  user_id    uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.host_allowlist ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- wedding_public — PUBLIC-readable wedding configuration (singleton).
-- ----------------------------------------------------------------------------
-- The guest surface (invitation, info page) reads these fields without a
-- session, so anon gets SELECT in 0002. Enforced singleton: id is fixed to 1.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.wedding_public (
  id            integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  couple_name_1 text,
  couple_name_2 text,
  event_date    date,
  ceremony_time text,
  venue_name    text,
  venue_address text,
  dress_code    text,
  message       text,
  updated_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.wedding_public ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS wedding_public_set_updated_at ON public.wedding_public;
CREATE TRIGGER wedding_public_set_updated_at
BEFORE UPDATE ON public.wedding_public
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- wedding_private — PRIVATE wedding configuration (singleton).
-- ----------------------------------------------------------------------------
-- Host-only. anon has NO access (no policy granted to anon in 0002). Holds
-- planning data that must never reach the guest surface. Enforced singleton.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.wedding_private (
  id              integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  planning_notes  text,
  budget_currency text NOT NULL DEFAULT 'DOP',
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.wedding_private ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS wedding_private_set_updated_at ON public.wedding_private;
CREATE TRIGGER wedding_private_set_updated_at
BEFORE UPDATE ON public.wedding_private
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
