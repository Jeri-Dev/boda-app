# Supabase setup (boda-app)

## Local development

1. **Start the stack** (Docker must be running):

   ```bash
   supabase start          # first run pulls images
   supabase db reset       # apply migrations + seed
   ```

2. **Copy keys into `.env.local`** from `supabase status`:
   - `NEXT_PUBLIC_SUPABASE_URL`        → Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`   → **Publishable** key (`sb_publishable_…`)
   - `SUPABASE_SERVICE_ROLE_KEY`       → **Secret** key (`sb_secret_…`)

   The modern CLI emits publishable/secret keys; they map to the `anon` and
   `service_role` Postgres roles respectively and work directly with
   `@supabase/ssr`.

3. **Regenerate types** after any migration:

   ```bash
   pnpm generate:types     # supabase gen types … --local > src/lib/supabase/types.ts
   ```

## Creating the host account (single-account model)

There is no public signup. The single host user is provisioned out-of-band, and
authorization is membership in `public.host_allowlist` — **not** merely being
authenticated.

1. Create the user (Studio → Authentication, or the admin API). Confirm the
   email.
2. Add them to the allowlist (service-role SQL / Studio SQL editor — bypasses
   RLS; PostgREST cannot insert here by design):

   ```sql
   insert into public.host_allowlist (user_id)
   values ('<auth.users.id>')
   on conflict do nothing;
   ```

The E2E suite automates this for the test host (see `tests/e2e/README.md` and
`tests/e2e/global-setup.ts`).

## Security invariants

- **RLS is the authorization frontier.** `requireHost()` + the proxy are UX/defense
  in depth; the database is the real gate.
- **`host_allowlist` uses a non-recursive self-row policy** (`user_id = auth.uid()`).
  Never `EXISTS (SELECT FROM host_allowlist …)` over itself — it recurses.
- **`anon` never reads private data.** `wedding_private` + `host_allowlist` grant
  no anon policy; `wedding_public` is the only anon-readable table.
- **`service_role`/secret key bypasses RLS** — server-only, never `NEXT_PUBLIC_`.

## Before production

- Disable public signup; enable MFA (TOTP) for the host.
- Short JWT sessions (1h).
- Use an EU-region project (RGPD — guest PII / health data in later phases).
- Never point the E2E suite at production.
