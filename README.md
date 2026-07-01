# boda-app

PWA para gestionar una sola boda. **App abierta, sin autenticación.** Dos superficies sobre una misma base de datos:

- **Back-office** (`(host)`, raíz `/`) — gestión de invitados, presupuesto, proveedores, tareas, mesas y plano. Instalable como PWA. `robots: noindex`. El control de acceso, si lo hay, es a nivel de despliegue (URL privada, hosting con contraseña, uso local), no en la app.
- **Cara al invitado** (`(public)`) — sin login, por link: invitación digital + RSVP (`/i/[token]`), web informativa y mesa de regalos (`/info`), fallback offline (`/~offline`).

Stack: **Next.js 16** (App Router, React 19) · **Drizzle ORM + Supabase Postgres** (acceso server-side vía `postgres.js`) · **Tailwind v4** (CSS-first) · **Zod 4** · **Vitest + pglite** · **Playwright** · **pnpm**.

## Estado

**Las 3 fases completas.** Cimientos (scaffold, datos con Drizzle, PWA offline, cabeceras), núcleo privado (invitados, proveedores, presupuesto, tareas, dashboard), cara al invitado (invitaciones por token, RSVP público seguro, recordatorios, web informativa, regalos, privacidad) y distribución (mesas, plano 2D arrastrable, vista día-B offline). Hoja de ruta en [`docs/plans/`](docs/plans/).

> Nota: la hoja de ruta original asumía Supabase + auth de cuenta única (RLS, frontera público/privado). El proyecto es una **app abierta sobre Supabase Postgres** (sin auth): acceso solo server-side, Data API pública apagada, RLS deny-by-default como defensa en profundidad. Aquel documento queda como histórico. Detalle del despliegue en [`docs/deploy-netlify.md`](docs/deploy-netlify.md).

| Fase | Alcance |
|------|---------|
| **0 — Cimientos** ✅ | Scaffold · datos (Drizzle + Postgres) · PWA · cabeceras/CSP |
| **1 — Núcleo privado** ✅ | Invitados · proveedores · presupuesto · tareas · dashboard |
| **2 — Cara al invitado** ✅ | Tokens + RSVP seguro · invitación · pendientes · web/regalos · privacidad |
| **3 — Distribución** ✅ | Mesas · plano 2D (SVG) · vista día-B offline |

## Arquitectura (claves)

- **Un solo cliente de datos:** `src/lib/db/index.ts` (`server-only`) exporta `db` (Drizzle + `postgres.js` sobre Supabase Postgres). **El navegador nunca toca la DB.** El mismo código sirve dev y prod; solo cambia `DATABASE_URL` (cadena del pooler de Supabase; `prepare: false` para el transaction pooler serverless).
- **Schema y migraciones** en `src/lib/db/`. Columnas restringidas con `text({ enum })` + `check()` (type-safe en TS y forzado en Postgres); **FKs reales** (`on delete cascade`/`set null`) mantienen la integridad. Migraciones generadas por `drizzle-kit` y commiteadas; la inicial habilita RLS deny-by-default.
- **PWA artesanal** (`public/sw.js`, prod-only): offline de solo lectura sin acoplar el bundler (Turbopack). Nunca cachea respuestas RSC ni Server Actions.
- **Cabeceras de seguridad + CSP** en `next.config.ts` aplicadas a toda respuesta.

## Puesta en marcha

Requisitos: Node 22 (ver `.nvmrc`), pnpm, y un Postgres (un proyecto Supabase, o cualquier Postgres para dev).

```bash
pnpm install

cp .env.local.example .env.local   # edita DATABASE_URL → tu cadena de Postgres

pnpm db:migrate                    # aplica migraciones (incl. RLS) a esa DB

pnpm dev                           # http://localhost:3000
```

Producción (Netlify serverless + Supabase): ver el runbook [`docs/deploy-netlify.md`](docs/deploy-netlify.md).

## Tests

```bash
pnpm test                    # Vitest: unidad + seguridad RSVP contra pglite (Postgres WASM, sin Docker)

pnpm test:e2e:install        # una vez por máquina
pnpm test:e2e                # Playwright (requiere un Postgres en DATABASE_URL)
```

Los tests de unidad son **herméticos** (pglite en memoria, sin servicios); solo money/dates son puros. La suite e2e es **serial** (`workers: 1`). Detalle en [`tests/e2e/README.md`](tests/e2e/README.md).

## Scripts

| Comando | Acción |
|---------|--------|
| `pnpm dev` | Servidor de desarrollo |
| `pnpm build` | Build de producción |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm test` | Vitest (unidad + seguridad, pglite) |
| `pnpm db:generate` | Genera una migración desde `schema.ts` |
| `pnpm db:migrate` | Aplica migraciones a la base de datos |
| `pnpm db:studio` | Drizzle Studio |
| `pnpm test:e2e` | Suite Playwright |

## Estructura

```
src/
  app/
    (host)/                # back-office (raíz /) — sin gate
    (public)/~offline/     # fallback offline
    manifest.ts  layout.tsx  globals.css
  components/ui/  host/     # primitives hand-rolled + UI del host
  lib/db/                  # cliente Drizzle (postgres.js) + schema + migraciones (Postgres)
  lib/                     # site, utils
drizzle.config.ts          # config de drizzle-kit
docs/                      # plans · brainstorms · solutions
```

## Documentación

- [`docs/plans/`](docs/plans/) — hoja de ruta de las 3 fases (histórica; ver nota de Estado).
- [`docs/solutions/`](docs/solutions/) — decisiones técnicas (spike PWA/Serwist, modelo CSP).
- [`AGENTS.md`](AGENTS.md) — convenciones para agentes/colaboradores.

## Convenciones

Copy en español (`es-DO`); inglés solo para código/env/logs. Sin `tailwind.config.ts` (Tailwind v4 CSS-first). `cookies()`/`params` son async; `redirect()` lanza (fuera de try/catch).
