# boda-app

PWA para gestionar una sola boda. Dos superficies sobre un mismo backend de Supabase:

- **Back-office privado** (`(host)`, raíz `/`) — cuenta única, instalable como PWA, gestión de invitados, presupuesto, proveedores, tareas, mesas y plano.
- **Cara al invitado** (`(public)`) — sin login, por link: invitación digital + RSVP (`/i/[token]`), web informativa y mesa de regalos (`/info`), fallback offline (`/~offline`).

Stack: **Next.js 16** (App Router, React 19) · **Supabase** (Postgres/Auth/Storage) · **Tailwind v4** (CSS-first) · **Zod 4** · **Playwright** · **pnpm**.

## Estado

**Fase 0 · Cimientos — completa.** Scaffold, modelo de datos + RLS (frontera público/privado), auth de cuenta única, shell PWA offline y cabeceras de seguridad. Hoja de ruta completa en [`docs/plans/`](docs/plans/).

| Fase | Alcance |
|------|---------|
| **0 — Cimientos** ✅ | Scaffold · datos + RLS · auth · PWA · cabeceras/CSP |
| 1 — Núcleo privado | Invitados · proveedores · presupuesto · tareas · dashboard |
| 2 — Cara al invitado | Tokens + RSVP seguro · invitación · web/regalos · RGPD |
| 3 — Distribución | Mesas · plano 2D (SVG) · vista día-B offline |

## Arquitectura (claves)

- **Triple gate de auth:** `src/proxy.ts` (Next 16, no `middleware.ts`) refresca la sesión y aplica un gate **deny-by-default** → `requireHost()` en el DAL (primera línea de cada página/acción privada) → **RLS** como frontera real de autorización.
- **Autorización por pertenencia a `host_allowlist`**, nunca por `auth.role() = 'authenticated'`. La política de la allowlist es un self-row check **no recursivo**.
- **Frontera público/privado:** `wedding_public` es legible por `anon`; `wedding_private` y `host_allowlist` no. RLS forzada (`FORCE ROW LEVEL SECURITY`) en cada tabla.
- **PWA artesanal** (`public/sw.js`, prod-only): offline de solo lectura sin acoplar el bundler (Turbopack). Nunca cachea respuestas RSC ni Server Actions.

## Puesta en marcha

Requisitos: Node 20+, pnpm, Docker (para Supabase local), [Supabase CLI](https://supabase.com/docs/guides/cli).

```bash
pnpm install

# Stack local de Supabase (Postgres/Auth/Storage)
supabase start
supabase db reset            # aplica migraciones + seed
pnpm generate:types          # regenera src/lib/supabase/types.ts

# Copia las claves de `supabase status` a .env.local (ver .env.local.example)
cp .env.local.example .env.local

pnpm dev                     # http://localhost:3000
```

Crear la cuenta de host (no hay registro público): ver [`docs/supabase-setup.md`](docs/supabase-setup.md).

## Tests

```bash
pnpm test:e2e:install        # una vez por máquina
pnpm test:e2e                # Playwright: RLS, auth, cabeceras
```

El suite es **serial** y se autoabastece (provisiona el host de test). Detalle en [`tests/e2e/README.md`](tests/e2e/README.md).

## Scripts

| Comando | Acción |
|---------|--------|
| `pnpm dev` | Servidor de desarrollo |
| `pnpm build` | Build de producción |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm generate:types` | Tipos de Supabase desde la DB local |
| `pnpm test:e2e` | Suite Playwright |

## Estructura

```
src/
  proxy.ts                 # gate de sesión (Next 16)
  app/
    (host)/                # back-office gateado (raíz /)
    (host-public)/login/   # login fuera del gate
    (public)/~offline/     # fallback offline
    manifest.ts  layout.tsx  globals.css
  components/ui/  host/     # primitives hand-rolled + UI del host
  lib/supabase/            # server / browser / dal / types
  lib/actions/             # Server Actions (Zod + requireHost)
supabase/migrations/       # esquema + RLS (idempotentes, FORCE RLS)
docs/                      # plans · brainstorms · solutions · runbooks
```

## Documentación

- [`docs/plans/`](docs/plans/) — hoja de ruta de las 3 fases.
- [`docs/solutions/`](docs/solutions/) — decisiones técnicas (spike PWA/Serwist, modelo CSP).
- [`docs/supabase-setup.md`](docs/supabase-setup.md) — runbook de Supabase + provisión del host.
- [`AGENTS.md`](AGENTS.md) — convenciones para agentes/colaboradores.

## Convenciones

Copy en español (`es-DO`); inglés solo para código/env/logs. Sin `tailwind.config.ts` (Tailwind v4 CSS-first). `cookies()`/`params` son async; `redirect()` lanza (fuera de try/catch).
