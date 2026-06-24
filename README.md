# boda-app

PWA para gestionar una sola boda. **App abierta, sin autenticación.** Dos superficies sobre una misma base de datos:

- **Back-office** (`(host)`, raíz `/`) — gestión de invitados, presupuesto, proveedores, tareas, mesas y plano. Instalable como PWA. `robots: noindex`. El control de acceso, si lo hay, es a nivel de despliegue (URL privada, hosting con contraseña, uso local), no en la app.
- **Cara al invitado** (`(public)`) — sin login, por link: invitación digital + RSVP (`/i/[token]`), web informativa y mesa de regalos (`/info`), fallback offline (`/~offline`).

Stack: **Next.js 16** (App Router, React 19) · **Drizzle ORM + libSQL** (SQLite local en dev, Turso/libSQL remoto en prod) · **Tailwind v4** (CSS-first) · **Zod 4** · **Playwright** · **pnpm**.

## Estado

**Fase 0 · Cimientos — completa.** Scaffold, capa de datos (Drizzle + libSQL), shell PWA offline y cabeceras de seguridad. Hoja de ruta en [`docs/plans/`](docs/plans/).

> Nota: la hoja de ruta original asumía Supabase + auth de cuenta única (RLS, frontera público/privado). El proyecto se replanteó como **app abierta sobre Drizzle/libSQL**; ese documento queda como histórico y será revisado por fase.

| Fase | Alcance |
|------|---------|
| **0 — Cimientos** ✅ | Scaffold · datos (Drizzle/libSQL) · PWA · cabeceras/CSP |
| 1 — Núcleo privado | Invitados · proveedores · presupuesto · tareas · dashboard |
| 2 — Cara al invitado | Tokens + RSVP · invitación · web/regalos · RGPD |
| 3 — Distribución | Mesas · plano 2D (SVG) · vista día-B offline |

## Arquitectura (claves)

- **Un solo cliente de datos:** `src/lib/db/index.ts` (`server-only`) exporta `db` (Drizzle + libSQL). El mismo código sirve dev y prod; solo cambia `DATABASE_URL` (`file:local.db` → `libsql://…turso.io`).
- **Schema y migraciones** en `src/lib/db/`. Columnas restringidas con `text({ enum })` + `check()` (type-safe en TS y forzado en SQLite). Migraciones generadas por `drizzle-kit` y commiteadas.
- **PWA artesanal** (`public/sw.js`, prod-only): offline de solo lectura sin acoplar el bundler (Turbopack). Nunca cachea respuestas RSC ni Server Actions.
- **Cabeceras de seguridad + CSP** en `next.config.ts` aplicadas a toda respuesta.

## Puesta en marcha

Requisitos: Node 20+, pnpm.

```bash
pnpm install

cp .env.local.example .env.local   # DATABASE_URL=file:local.db ya por defecto

pnpm db:generate                   # genera la migración desde schema.ts
pnpm db:migrate                    # crea local.db y aplica migraciones

pnpm dev                           # http://localhost:3000
```

Producción (serverless): apuntar `DATABASE_URL` a una base libSQL/Turso remota y definir `DATABASE_AUTH_TOKEN`.

## Tests

```bash
pnpm test:e2e:install        # una vez por máquina
pnpm test:e2e                # Playwright: cabeceras de seguridad
```

Suite **serial** (`workers: 1`). Detalle en [`tests/e2e/README.md`](tests/e2e/README.md).

## Scripts

| Comando | Acción |
|---------|--------|
| `pnpm dev` | Servidor de desarrollo |
| `pnpm build` | Build de producción |
| `pnpm typecheck` | `tsc --noEmit` |
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
  lib/db/                  # cliente Drizzle + schema + migraciones (libSQL)
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
