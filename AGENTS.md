<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# boda-app — conventions

PWA to manage a single wedding. Two surfaces on one Supabase backend:

- **Back-office** (`(host)` route group, gated) — private, single account, installable PWA. Lives at the app root `/`.
- **Guest-facing** (`(public)` route group, no login) — `/i/[token]` invitation + RSVP, `/info` web + gift registry, `/~offline` fallback.
- **Login** (`(host-public)/login`) — `/login`, outside the gate so the gate can't loop.

Stack: Next.js 16 (App Router, React 19) · Supabase (Postgres/Auth/Storage) · Tailwind v4 (CSS-first, no `tailwind.config.ts`) · Zod 4 · Playwright · pnpm. Conventions replicate the sibling project `my-app`.

## Auth & data boundary (critical)

- **Triple gate:** `src/proxy.ts` (Next 16 — NOT `middleware.ts`) refreshes the session + optimistically gates → `requireHost()` in `src/lib/supabase/dal.ts` (first line of every host page/action) → **RLS** is the real authorization frontier.
- The proxy is **deny-by-default**: any path not in the public allowlist (`/login`, `/i`, `/info`, `/~offline`) requires a session. The proxy is UX only — never the security boundary.
- **Never authorize by `auth.role() = 'authenticated'`.** Authenticated ≠ authorized. Gate by membership in `public.host_allowlist`.
- The `host_allowlist` policy is a **non-recursive self-row check** (`USING (user_id = auth.uid())`). Never `EXISTS (SELECT FROM host_allowlist ...)` over itself — that recurses and breaks all authed access.
- `service_role` bypasses RLS → encapsulate in a server-only, minimal-surface module (`admin.ts`, Storage only, never `.from()`). Never `NEXT_PUBLIC_`.
- Every migration that creates a table ships its own `FORCE ROW LEVEL SECURITY` + policies. Migrations are idempotent (`IF NOT EXISTS`, `DROP POLICY IF EXISTS`).

## Next.js 16 reminders

- `cookies()` / `params` are async (await them). `redirect()` throws — call it **outside** try/catch around Supabase.
- `src/proxy.ts`, not `middleware.ts`. Read `node_modules/next/dist/docs/01-app/` before touching auth/routing. Avoid `'use cache'`.
- Server Action recipe: `'use server'` → `requireHost()` (except the public RSVP action) → `Schema.safeParse` → mutate via server-bound client → `revalidatePath` → `redirect()` outside try/catch.

## Local dev

- `pnpm dev` — app. `supabase start` — local Postgres/Auth/Storage. `supabase db reset` — apply migrations + seed. `pnpm generate:types` — regenerate `src/lib/supabase/types.ts` from the local DB.
- Copy in Spanish (`es-DO`); English only for code/env/logs.
