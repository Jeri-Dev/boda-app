# E2E / integration tests

Playwright suite covering the Fase 0 foundation: the RLS public/private
boundary (`rls-isolation.spec.ts`) and the back-office login + gate
(`host-auth.spec.ts`).

## One-time setup

1. **Start the local stack** (Docker must be running):

   ```bash
   supabase start
   supabase db reset      # apply migrations + seed
   ```

2. **Wire `.env.local`** (copy from `.env.local.example`). The values printed by
   `supabase status` go in:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`        ← the *Publishable* key
   - `PLAYWRIGHT_SUPABASE_SERVICE_KEY`      ← the *Secret* key
   - `PLAYWRIGHT_HOST_EMAIL` / `PLAYWRIGHT_HOST_PASSWORD` (any test credentials)

3. **Install browsers** (once per machine):

   ```bash
   pnpm test:e2e:install
   ```

## Running

```bash
pnpm test:e2e
```

`global-setup.ts` is self-bootstrapping: it creates the host auth user (if
missing), forces its password, adds it to `public.host_allowlist`, then logs in
and saves the session to `tests/.auth/host.json`. No manual dashboard step is
needed for local runs.

## Notes

- The suite is **serial** (`workers: 1`) — specs share the singleton config
  rows in one database.
- `rls-isolation.spec.ts` talks to Supabase directly (no browser) using three
  roles: service (secret key, bypasses RLS), anon (publishable key), and host
  (anon client signed in). It proves isolation with real roles, not mocks.
- Never point these at a production project. The local stack's keys are shared
  dev defaults.
