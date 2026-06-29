---
title: "feat: Migrar persistencia a Supabase (SDK + RLS deny-by-default) y dejar la app desplegable en Netlify"
type: feat
status: active
date: 2026-06-29
deepened: 2026-06-29
---

# feat: Migrar persistencia a Supabase y dejar la app lista para Netlify

## Overview

Cambiar la capa de datos de **Drizzle ORM + libSQL (SQLite/Turso)** a **Supabase (Postgres)**, accedida mediante el **SDK `@supabase/supabase-js` desde el servidor** con la *secret key* (antes `service_role`). El objetivo del usuario: datos centralizados en la nube (usables desde cualquier dispositivo contra el mismo backend) y la app **lista para desplegar manualmente en Netlify**.

La app sigue siendo **abierta (sin login)** — decisión explícita del usuario. La protección de los datos se reconcilia así:

- El **navegador nunca toca Supabase**: todo el acceso a datos vive en Server Components y Server Actions usando un cliente con la *secret key* (rol `service_role`, atributo `BYPASSRLS`).
- **RLS habilitada deny-by-default, sin ninguna policy** en todas las tablas (defensa en profundidad) → la Data API pública rechaza cualquier acceso con la *publishable/anon* key; solo la *secret key* (en el servidor, con `BYPASSRLS`) lee/escribe. El **control primario** es que solo el servidor tiene esa key.
- La protección de la **app** (la URL pública en Netlify) es a nivel de despliegue (contraseña de Netlify en plan Pro, o un *edge-function basic-auth gate* en plan gratuito) — no en la aplicación.

Conviene ser honesto sobre el **alcance real**: aunque conceptualmente "volvemos a Supabase", esto **no es recuperar código existente**. Las Fases 1–3 (los 22 módulos, los 36 Vitest + 20 Playwright) se escribieron **desde cero sobre Drizzle *después* del pivote `ca29e89`**; el material recuperable de git es solo *scaffolding* de DB pre-Drizzle (un `0001_init.sql`/`0002_rls.sql` y un `server.ts` que preceden a toda la lógica actual). Por tanto es, en lo esencial, una **reescritura de ~22 módulos + re-implementación de las garantías de seguridad del RSVP en plpgsql + reconstrucción de la infraestructura de tests**, descartando código recién enviado y validado. Se mantiene la postura abierta (sin auth) y se adopta el patrón Supabase (RLS deny-by-default, funciones Postgres) con acceso server-side por *secret key*.

## Problem Frame

Hoy los datos viven en SQLite: en dev un fichero local (`DATABASE_URL=file:local.db`), en prod habría que apuntar a Turso. El usuario quiere **Supabase** como almacén único en la nube y desplegar el front en Netlify a mano. La app nunca se ha desplegado (no hay datos de producción que migrar). El reto no es de producto sino de **replataforma de la capa de persistencia**: cambiar el driver/ORM, portar el esquema SQLite→Postgres, mover las operaciones atómicas (que libSQL hacía con `db.batch`) a transacciones nativas (FKs reales + funciones RPC), preservar el **modelo de seguridad del RSVP público** ya construido y red-teameado, y adaptar testing y despliegue.

## Requirements Trace

- **R1.** Toda la persistencia usa Supabase (Postgres) vía `@supabase/supabase-js`, server-side, con la *secret key*. Drizzle/libSQL desaparece del árbol.
- **R2.** La app permanece **abierta** (sin auth en la aplicación); el acceso a datos solo ocurre en el servidor.
- **R3.** **RLS habilitada deny-by-default** en todas las tablas (cero policies; sin `FORCE`); la *publishable/anon* key no puede leer ni escribir nada. Las funciones RPC con `REVOKE EXECUTE FROM PUBLIC`. (Defensa en profundidad; el control primario es el aislamiento de la secret key.)
- **R4.** Las operaciones hoy atómicas (los 7 `db.batch` + el UPSERT del rate-limit) siguen siendo **atómicas** en Postgres (FKs reales + funciones RPC en una transacción implícita).
- **R5.** Se preservan **íntegras** las garantías de seguridad del RSVP público: token de 256 bits, validez computada (sin estado "usado"), proyección de columnas en lecturas, escritura acotada al token (abort si hay `guest_id` fuera de alcance), `plus_one` host-granted nunca escrito por el invitado, honeypot, Zod `.strict()`, rate-limit por IP **y** por token, respuesta uniforme sin oráculo.
- **R6.** La app **compila y se ejecuta en Netlify** (Server Actions sobre funciones Node) con la *secret key* nunca expuesta al bundle del cliente.
- **R7.** Existe un **runbook de despliegue manual** (Netlify + aplicar migraciones de Supabase como paso separado) y una opción documentada de **protección de la URL** a nivel de despliegue.
- **R8.** El testing cubre la nueva capa: pgTAP para las funciones RPC y para la frontera RLS deny-by-default; integración/e2e contra el stack local de Supabase; los tests puros (money/dates) intactos.
- **R9.** Los tipos/consts del esquema que consumen 13 client components siguen existiendo con los mismos nombres (capa de compatibilidad sobre los tipos generados).

## Scope Boundaries

- **NO** se reintroduce autenticación, login, `host_allowlist`, `requireHost`/DAL ni `proxy.ts` de gate. La app sigue abierta.
- **NO** se reintroducen las alergias (eliminadas en la migración 0005; carga RGPD Art. 9). No vuelven en ninguna tabla.
- **NO** se adopta CSP nonce-strict: como el navegador no habla con Supabase, no hay sesión privilegiada que proteger; la CSP actual (`'unsafe-inline'` + escape de React) se mantiene.
- **NO** se usa `@supabase/ssr` (existe solo para sesiones de auth en cookies; aquí no hay auth).
- **NO** se construye Storage de contratos (bucket privado + URLs firmadas, R4 del brainstorm): nunca existió (`admin.ts`/`storage.ts` jamás se implementaron) y está fuera del alcance de esta migración. Los contratos siguen como `contract_url` (enlace externo), igual que hoy.
- **NO** hay migración de datos: la base actual (`local.db`) es desechable; Supabase arranca con el esquema limpio (+ `seed.sql` opcional para dev).
- El navegador **no** consulta Supabase directamente; no se adopta Realtime ni acceso client-side por anon key (incompatible con app abierta + PII).

### Deferred to Separate Tasks

- **Storage de contratos de proveedores** (bucket privado, URLs firmadas, módulo server-only `uploadObject`/`deleteObject` de superficie mínima): futura iteración si se requiere subir archivos en vez de enlazar.
- **Export/import de datos reales de dev**: si el usuario ya cargó datos de boda reales en `local.db` que quiera conservar, es un volcado puntual SQLite→Postgres (no cubierto aquí; ver Open Questions).
- **CI para migraciones** (`supabase db push` en GitHub Actions): el runbook manual basta para un proyecto pequeño; automatizar es un paso posterior.

## Context & Research

### Relevant Code and Patterns

**Superficie a migrar (mapa completo, 2026-06-29):**

- **Cliente único:** `src/lib/db/index.ts` (`server-only` → `drizzle(createClient(libsql))`). Se reemplaza por `src/lib/supabase/server.ts`.
- **Esquema:** `src/lib/db/schema.ts` (397 líneas, 9 tablas + `tables` = 10; patrón `text({enum})`+`check()`, timestamps `unixepoch()`, `randomUUID()`, soft-refs). Fuente del DDL Postgres.
- **9 migraciones Drizzle/SQLite** en `src/lib/db/migrations/` (+ `meta/`): se descartan; se escribe un único `init_schema.sql` Postgres a mano.
- **22 ficheros importan `db`**: 6 actions (`configuracion`, `invitados`, `proveedores`, `presupuesto`, `tareas`, `mesas`; `rsvp` indirecto), 3 módulos `data/` (`rsvp`, `invitations`, `seating`), `rate-limit.ts`, 12 page Server Components (`(host)/**/page.tsx`, `(public)/i/[token]/page.tsx`, `(public)/info/page.tsx`).
- **7 `db.batch` atómicos** (con file:symbol): `actions/invitados.ts` `deleteGuest`; `actions/proveedores.ts` `deleteVendor`; `actions/presupuesto.ts` `deleteCategory`; `data/seating.ts` `deleteTableCore`; `data/invitations.ts` `createInvitation` y `regenerateInvitation`; `data/rsvp.ts` `applyRsvp`. **Más** el UPSERT condicional `rate-limit.ts` `checkRateLimit` y el upsert singleton `configuracion.ts` `saveConfig`.
- **Capa de seguridad RSVP:** `src/lib/tokens.ts` (`newInviteToken` 256-bit base64url, `isInviteValid` validez computada), `src/lib/data/rsvp.ts` (`getRsvpView` proyección, `applyRsvp` escritura acotada atómica), `src/lib/actions/rsvp.ts` (honeypot, doble rate-limit, Zod strict, `clientIpHash` lee solo hop de confianza).
- **13 client components** importan `type`/consts de `@/lib/db/schema` (`Guest`, `RsvpStatus`, `RSVP_STATUSES`, …) — deben seguir resolviéndose.
- **Tests:** 5 suites Vitest sobre libSQL `:memory:` vía `tests/unit/helpers/db.ts` (`makeTestDb` + `drizzle-orm/libsql/migrator`); `tests/unit/stubs/server-only.ts`; puros `money`/`dates`. 2 specs e2e (`host-plano`, `host-dia-b`) borran estado vía `@libsql/client` contra `local.db` en `beforeEach`.
- **Config:** `drizzle.config.ts`, `package.json` (deps `@libsql/client`, `drizzle-orm`, dev `drizzle-kit`; scripts `db:*`), `next.config.ts` (`serverExternalPackages: ['@libsql/client','libsql']`, `images.remotePatterns`, CSP `connect-src 'self'`), `.env.local.example`, `vitest.config.ts`, `playwright.config.ts`, `AGENTS.md`, `README.md`.

**Material recuperable de git (referencia, `git show ca29e89^:<path>`):** `supabase/migrations/0002_rls.sql` (patrón RLS forzada), `0001_init.sql`, `supabase/config.toml`, `lib/supabase/server.ts`/`browser.ts`, `docs/supabase-setup.md`. **Descartar como referencia** (lógica de auth, obsoleta): `dal.ts`, `proxy.ts`, `types.ts` (regenerar).

### Institutional Learnings

- `docs/solutions/2026-06-23-fase0-security-headers.md`: la CSP `connect-src` se simplificó al quitar Supabase; **solo** habría que re-permitir el origen Supabase si el navegador hablara con él — **no es el caso** (acceso server-side). El nonce-strict CSP quedó desarmado *porque* no hay sesión privilegiada; sigue desarmado. `Referrer-Policy: no-referrer` en rutas de token se mantiene.
- `docs/solutions/2026-06-23-pwa-serwist-turbopack-spike.md`: el SW (`public/sw.js`) ya **excluye cross-origin y no-GET**; las llamadas Supabase serían cross-origin igualmente (no aplica, son server-side). No requiere rediseño. Verificar que ninguna respuesta GET con PII se cachee (NetworkFirst de navegaciones ya lo cubre).
- Roadmap original `docs/plans/2026-06-22-001-...`: KTD originales (clientes Supabase, RLS como frontera, funciones `security definer`, token ≥128 bits, enum nativo→`text`+`CHECK`). Adaptación clave: el diseño gateaba RLS por `host_allowlist + auth.uid()`, **que ya no existe** → RLS deny-by-default + acceso por *secret key*.
- Memoria `stack-pivot-no-auth-drizzle` y `fase2-rsvp-decisions`: app abierta; sin alergias; invitaciones con `party_size`; seguridad RSVP en la capa servidor; Vitest.

### External References

Investigación 2026 (versiones verificadas):

- **Cliente server-side:** `@supabase/supabase-js@^2`; `createClient(url, secretKey, { auth: { persistSession: false, autoRefreshToken: false } })` en módulo `server-only`; **singleton correcto** (cliente sin estado). `@supabase/ssr` innecesario. [Creating a client for SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client), [Service role en Next.js #30739](https://github.com/orgs/supabase/discussions/30739).
- **Keys 2025/2026:** legacy `anon`/`service_role` → **publishable** (`sb_publishable_…`) / **secret** (`sb_secret_…`); la *secret* reemplaza `service_role` y bypasea RLS; proyectos nuevos tras 2025-11-01 ya no traen legacy. [API keys](https://supabase.com/docs/guides/getting-started/api-keys), [Migrating to new API keys](https://supabase.com/docs/guides/getting-started/migrating-to-new-api-keys).
- **RLS deny-by-default:** `enable row level security` sin policies = nada accesible por la publishable key; `service_role`/secret (`BYPASSRLS`) pasa. `FORCE` afecta solo al *owner*, **no** anula `BYPASSRLS`. [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [PostgreSQL §5.9](https://www.postgresql.org/docs/current/ddl-rowsecurity.html), [RLS footguns](https://www.bytebase.com/blog/postgres-row-level-security-footguns/).
- **Atomicidad:** FKs reales (`on delete cascade`/`set null`) eliminan limpiezas manuales; funciones Postgres vía `supabase.rpc()` = transacción implícita; `security invoker` basta (único llamador = secret key) + `set search_path = ''`. [Database Functions](https://supabase.com/docs/guides/database/functions).
- **CLI:** `supabase init/start/migration new/db reset/link/db push`; `supabase gen types typescript` reemplaza `$inferSelect`. [Database Migrations](https://supabase.com/docs/guides/deployment/database-migrations), [CLI](https://github.com/supabase/cli).
- **Netlify:** `@netlify/plugin-nextjs@^5.15.12` (runtime OpenNext-for-Netlify), **Next 16 zero-config**; Server Actions sobre funciones Node (el SDK Supabase corre bien ahí; **nunca** en `middleware`/edge). `netlify.toml` mínimo + Node 22. Env `SUPABASE_SECRET_KEY` marcada `--secret`; **secret-scanning** bloquea filtraciones al bundle. [Next 16 en Netlify](https://www.netlify.com/changelog/next-js-16-deploy-on-netlify/), [Netlify Next docs](https://docs.netlify.com/build/frameworks/framework-setup-guides/nextjs/overview/), [Secrets Controller](https://docs.netlify.com/build/environment-variables/secrets-controller/).
- **IP de confianza en Netlify:** `x-nf-client-connection-ip` (no `x-vercel-forwarded-for`). Afecta a `clientIpHash()`.
- **Testing:** pgTAP (`supabase test db`, aislado por `begin/rollback`) para RPC + RLS; stack local (`supabase start` + `db reset`) para integración con IDs únicos; Playwright contra local con truncate SQL en `globalSetup`. [Testing overview](https://supabase.com/docs/guides/local-development/testing/overview).
- **Protección de URL:** password integrado (plan **Pro+**) o **edge-function basic-auth** (cualquier plan). [Password Protection](https://docs.netlify.com/manage/security/secure-access-to-sites/password-protection/).

## Key Technical Decisions

- **SDK server-side + *secret key*, no `@supabase/ssr`.** Un solo cliente `server-only` singleton en `src/lib/supabase/server.ts`. **Ni la *secret key* ni la URL llevan prefijo `NEXT_PUBLIC_`**: usar `SUPABASE_URL` (no `NEXT_PUBLIC_SUPABASE_URL`) — el navegador no consulta Supabase, así que nada de Supabase debe inyectarse en el bundle (el `.env.local.example` ya tiene la convención "NEVER NEXT_PUBLIC_"). Esto preserva el invariante "el servidor es el único cliente de datos".
- **La frontera de seguridad primaria es el aislamiento de la *secret key*, NO la RLS.** Como el navegador nunca usa la anon key, la RLS **no aporta autorización** (no hay usuarios que gatear); el control real es "solo el servidor tiene la secret key y nunca se inyecta al cliente". La **RLS deny-by-default es defensa en profundidad** (protege si en el futuro se rompe el invariante "el servidor es el único cliente" — p. ej. alguien añade una feature client-side o se filtra URL+anon key). Decisión: `enable row level security` en las 10 tablas, **cero policies**. **Se omite `FORCE`** (no anula `BYPASSRLS`, solo restringe al rol *owner* que nada legítimo usa; es *cargo cult* del `0002_rls.sql` de la era auth). El aislamiento de la secret key debe tener un **test de primera clase** (grep del bundle + frontera `server-only`), no solo el chequeo de plataforma de Netlify.
- **Exposición de la Data API (consecuencia del SDK).** El SDK (`.from()`/`.rpc()`) habla con PostgREST en `https://<proj>.supabase.co/rest/v1/` → **obliga a mantener encendida la Data API pública**; la RLS deny-by-default es entonces lo único entre un poseedor de la anon key y la PII, de ahí el gate pgTAP de "enumerar 10 tablas". (La vía Drizzle-directa podría **apagar** la Data API por completo — ver Alternativas.)
- **Atomicidad: FKs reales primero, RPC después.** Postgres sí fuerza FKs (libSQL no), así que añadimos `on delete cascade`/`set null` y **eliminamos** las limpiezas manuales de 4 `db.batch`. Las 3 operaciones multi-statement con lógica (RSVP, crear/regenerar invitación) y el UPSERT del rate-limit pasan a **funciones Postgres** invocadas con `supabase.rpc()`.
- **`security invoker` (no `definer`) + `REVOKE EXECUTE FROM PUBLIC`.** El único llamador de las funciones es la secret key (`BYPASSRLS`); no hace falta `definer`. `set search_path = ''` + nombres `public.`-cualificados como hardening. **Crítico:** `CREATE FUNCTION` concede `EXECUTE` a `PUBLIC` por defecto y PostgREST expone toda función `public` en `/rest/v1/rpc/<name>` → hay que `REVOKE EXECUTE … FROM PUBLIC` y `GRANT EXECUTE … TO service_role` en las 4 funciones, o un poseedor de anon key podría invocarlas directamente saltándose la capa Next (incluido el rate-limit, que vive en la action). *(Nota de futuro: pasar a `definer` + `grant execute to anon` para un RSVP client-side **no es un toggle** — exige re-evaluar toda la defensa de capa de aplicación (honeypot, Zod, doble rate-limit, hashing de IP, CSP `form-action`); requiere una revisión de seguridad completa.)*
- **Lectura RSVP: proyección en `.select()` (app-layer), igual que hoy.** `getRsvpView` proyecta solo columnas en allowlist vía PostgREST embedding (`invite_tokens → token_guests → guests`, ahora con FKs). La propiedad "sin oráculo" (revocado/caducado/inexistente devuelven idéntico inválido) se mantiene en código. *(Opción de endurecer a una vista/función read-only si se quiere mover la proyección a la DB; no requerido.)*
- **Manejo de errores cambia de excepción a `{data,error}`.** `supabase-js` devuelve `{ data, error }` en vez de lanzar (como Drizzle). Cada call-site convierte `error` a la forma existente `{ ok:false, error }`. Es un cambio transversal pero mecánico.
- **Casing: `supabase-js` devuelve snake_case; hay que mapear a camelCase (cambio NO trivial).** Drizzle sintetizaba propiedades **camelCase** (`rsvpStatus`, `plusOne`, `eventDate`); `supabase-js` devuelve los **nombres de columna snake_case literales**. El código y los **13 client components** acceden en camelCase (`guest.plusOne`, `wedding.eventDate`, `payment.amountCents`…) — por tanto **NO** basta `Guest = Tables<'guests'>` ni "no tocar componentes". **Estrategia elegida:** mapear a camelCase en la **frontera de datos** (los módulos `data/` y las páginas devuelven filas re-caseadas), exponiendo tipos camelCase a mano (`type Guest = { rsvpStatus: RsvpStatus; plusOne: boolean; … }`) en vez de los generados crudos. Los **arrays de valores** de enum (`RSVP_STATUSES`, …) se mantienen a mano (los tipos generados los dan como `string`, sin la unión estrecha) y los campos de fila de enum se **narran por columna** (`rsvpStatus: RsvpStatus`, `status: VendorStatus`, `shape: TableShape`). Esto **infla U3–U6** respecto al borrador inicial; presupuestar el re-casing como trabajo real, no mecánico.
- **Timestamps: `timestamptz` vuelve como string ISO, no `Date`.** PostgREST devuelve `expires_at`/`event_date`/`created_at`/`updated_at` como strings ISO (Drizzle daba `Date`). **Crítico para seguridad:** `isInviteValid(tk.expiresAt > now)` (`src/lib/tokens.ts`) espera `Date` → hay que `new Date(row.expires_at)` antes de validar, o todo token con caducidad se evaluaría mal. Igual para render de fechas. Se trata explícitamente en U4/U6.
- **`due_date` permanece `text` `YYYY-MM-DD`.** Para cambio cero en `dates.ts` y formularios. *(Alternativa: tipo `date` nativo; PostgREST lo devuelve como string igual, pero se prefiere mínima superficie de cambio.)*
- **Netlify, no Vercel.** Runtime OpenNext; Node 22; `clientIpHash()` pasa a `x-nf-client-connection-ip`. No migraciones en runtime serverless (regla de AGENTS.md): `supabase db push` es un paso de deploy separado.
- **Protección de la app: obligatoria antes de producción (no opcional).** El back-office (`(host)/*`) expone toda la PII sin control de aplicación; un despliegue sin gate deja esos datos en abierto. Por eso el **gate basic-auth (edge-function) es un entregable requerido** de U8 (no "opcional"), con exclusión explícita de las rutas públicas de invitado, y la verificación "ruta de host → 401 sin credenciales" es criterio de cierre. El password integrado de Netlify (plan Pro) es una alternativa equivalente si el usuario lo tiene; la **elección entre ambos** es del usuario, pero **tener uno activo** no es negociable.

## Open Questions

### Resolved During Planning

- *¿RLS sin auth tiene sentido?* — Como **defensa en profundidad**, no como control primario (no hay usuarios que gatear). El control real es el aislamiento de la secret key. RLS deny-by-default cierra la Data API a la anon key por si el invariante "solo el servidor accede" se rompiera. (Ver KTD.)
- *¿`security definer` o `invoker`?* — `invoker` + `REVOKE EXECUTE FROM PUBLIC`; el único llamador es la secret key. `search_path=''` igualmente.
- *¿`@supabase/ssr`?* — No (sin auth/cookies).
- *¿Hace falta tocar la CSP / el SW?* — No; acceso server-side ⇒ el navegador no abre conexión a `*.supabase.co`. Solo **verificar** que `connect-src 'self'` sigue bastando y que el SW no cachea GET con PII.
- *¿Migración de datos?* — Por defecto **no** (base de dev asumida desechable), pero el runbook **confirma con el usuario** antes de retirar `local.db` (puede tener datos de boda reales → volcado puntual SQLite→Postgres).
- *¿snake_case vs camelCase?* — Mapear a camelCase en la frontera de datos (módulos `data/`+páginas); tipos camelCase a mano. (Ver KTD.)
- *¿Proteger todo el sitio o solo el back-office?* — Proteger el back-office; **excluir del gate** las rutas públicas de invitado (`/i/`, `/info`, `/~offline`) y los assets necesarios (`/_next/`, `/manifest.webmanifest`, `/sw.js`, `/favicon.ico`). Así el RSVP sigue accesible sin contraseña. (Ver U8.)

### Deferred to Implementation

- **Nombres/firmas exactas de las funciones RPC y sus parámetros** (`apply_rsvp`, `create_invitation`, `regenerate_invitation`, `touch_rate_limit`): se fijan al escribir el SQL y regenerar tipos.
- **Forma exacta de los `.select()` con embedding** (alias de relaciones PostgREST, p. ej. cómo nombra la relación `token_guests`↔`guests`): depende de los nombres de constraint FK; se ajusta al ver los tipos generados.
- **Disparador `updated_at`**: usar `extensions.moddatetime` por tabla; confirmar nombres al generar el esquema.
- **¿Conservar datos reales de dev?** Si el usuario los tiene, definir un volcado puntual; por defecto se asume que no.
- **Elección final de protección de URL** (password Pro vs edge-function): decisión de despliegue del usuario.

## High-Level Technical Design

> *Esto ilustra la dirección de la solución para revisión; no es especificación de implementación. El agente implementador debe tratarlo como contexto, no como código a reproducir.*

**Arquitectura de acceso a datos (después):**

```
Navegador ──HTTP──> Next (Netlify Node fn) ──secret key──> Supabase Postgres
   │  (nunca toca Supabase)        │                         │
   │                               ├─ .from('x').select/insert/update/delete   (CRUD simple)
   │                               └─ .rpc('apply_rsvp' | 'create_invitation'   (atómico, 1 txn)
   │                                        | 'regenerate_invitation'
   │                                        | 'touch_rate_limit')
   ▼
publishable/anon key  ──HTTP──>  Supabase Data API  ──RLS deny-by-default──>  ∅ (cero policies)
```

**Mapa de transformación por operación:**

| Hoy (Drizzle/libSQL) | Después (Supabase) |
|---|---|
| `db.batch` deleteGuest/Vendor/Category/Table (limpiar soft-refs + borrar) | FK `on delete cascade`/`set null` + `.delete().eq('id', id)` |
| `db.batch` `applyRsvp` (updates acotados + mensaje) | `supabase.rpc('apply_rsvp', { p_token, p_members, p_message })` |
| `db.batch` `createInvitation` / `regenerateInvitation` | `supabase.rpc('create_invitation' | 'regenerate_invitation', …)` |
| `onConflictDoUpdate` rate-limit (CASE + RETURNING) | `supabase.rpc('touch_rate_limit', { p_key, p_now, p_window_secs })` |
| `onConflictDoUpdate` saveConfig (singleton) | `.upsert(row, { onConflict: 'id' })` (id=1) |
| `db.select(...).where(...)` en páginas | `.from('x').select('cols').eq/order/...` |
| Drizzle lanza excepción | `{ data, error }` → mapear a `{ ok:false, error }` |
| `$inferSelect` / consts en `schema.ts` | `Database` generado + capa de compat de tipos/consts |

## Implementation Units

> Secuencia en 3 fases. La Fase 1 (DB) no depende de la app; la Fase 2 reescribe el acceso a datos sobre esa DB; la Fase 3 cubre testing, despliegue y docs. **Recomendado: trabajar en una rama** (`feat/supabase-migration`) — es un cambio transversal grande.
>
> **Gate de *vertical slice* (recomendado) tras U1–U2, antes del big-bang U4–U6:** portar **solo** el camino RSVP de punta a punta — `getRsvpView` + `apply_rsvp` + la página `/i/[token]` — y hacer un **draft deploy en Netlify** contra un proyecto Supabase real. Valida los dos mayores desconocidos (que `apply_rsvp` en plpgsql reproduce fielmente las garantías de `src/lib/data/rsvp.ts`, y que Server Actions + secret-scanning + secret key funcionan juntos en Netlify) **antes** de comprometer la reescritura de los 22 módulos. Si el slice descubre problemas, la alternativa más barata (mantener Drizzle) sigue sobre la mesa con casi todo el trabajo sin gastar.
>
> **Coexistencia Drizzle↔Supabase:** durante toda la Fase 2 ambas capas conviven; la app compila en cada borde. La retirada de Drizzle es **Unit 10** (limpieza final), nunca antes.

### Fase 1 — Base de datos (Supabase Postgres)

- [ ] **Unit 1: Scaffold Supabase + esquema Postgres (migración inicial)**

**Goal:** `supabase init` + un único `init_schema.sql` que crea las 10 tablas portadas a Postgres con FKs reales, CHECKs, índices, triggers `updated_at` y **RLS habilitada deny-by-default** (sin policies, sin `FORCE`).

**Requirements:** R1, R3, R4 (FKs).

**Dependencies:** Ninguna (es la base). Requiere Docker para `supabase start` en local.

**Files:**
- Create: `supabase/config.toml` (vía `supabase init`; referencia: `git show ca29e89^:supabase/config.toml`)
- Create: `supabase/migrations/<ts>_init_schema.sql`
- Create: `supabase/seed.sql` (opcional, datos de dev; nunca PII real)
- Create: `supabase/tests/rls.test.sql` (pgTAP, ver Test scenarios)
- Reference: `git show ca29e89^:supabase/migrations/0001_init.sql` y `0002_rls.sql`; `src/lib/db/schema.ts` (fuente del DDL)

**Approach:**
- Port de tipos (de `src/lib/db/schema.ts`): `text` id + `randomUUID()` → `uuid primary key default gen_random_uuid()`; `integer{boolean}` → `boolean not null default false`; `text({enum})`+`check` → `text` + `check (col in (...))` (idéntico idioma, fácil de evolucionar); singleton `wedding` → `id smallint primary key default 1 check (id = 1)`; `invite_tokens.token` → `text not null unique`; `due_date` → **`text`** (cambio cero); cents → `integer`.
- **Timestamps — respetar nullability/default por columna** (no aplicar una regla ciega): solo `created_at`/`updated_at` → `timestamptz not null default now()`. **`invite_tokens.expires_at` y `wedding.event_date` son NULLABLE sin default** (NULL en `expires_at` = "nunca caduca", *load-bearing* para `isInviteValid`) → `timestamptz` (null permitido, sin `default now()`). `rate_limits.window_start` → `timestamptz not null` (sin default; siempre se setea explícito).
- **FKs reales** (eliminan limpieza manual): `token_guests.token_id → invite_tokens(id) on delete cascade`; `token_guests.guest_id → guests(id) on delete cascade`; `payments.vendor_id → vendors(id) on delete set null`; `payments.category_id → budget_categories(id) on delete set null`; `guests.table_id → tables(id) on delete set null` ("mesa borrada = sin sentar").
- Índices: recrear `token_guests` unique `(token_id, guest_id)` + índices por `token_id` y `guest_id`.
- `updated_at`: `create extension if not exists moddatetime` + trigger `before update` por tabla con timestamp de actualización.
- RLS: `alter table … enable row level security;` para **cada** tabla, **sin crear ninguna policy** (deny-by-default). **Sin `FORCE`** (no anula `BYPASSRLS` de la secret key; solo restringe al owner que nada usa).
- Preservar todos los CHECKs actuales (rsvp_status, last_modified_source, vendors_status, amounts ≥ 0, party_size ≥ 1, etc.).

**Technical design:** *(directional)* DDL ancla para una tabla (ver `guests` en la investigación); el resto sigue el mismo patrón columna-a-columna desde `schema.ts`.

**Patterns to follow:** El idioma `text + check(col in (...))` que ya usa el proyecto; el patrón RLS de `git show ca29e89^:supabase/migrations/0002_rls.sql` (pero **sin** las policies de allowlist — aquí van cero policies).

**Test scenarios:** *(pgTAP en `supabase/tests/rls.test.sql`)*
- **Happy path (deny-by-default, SELECT):** `set role anon; select * from public.guests` → 0 filas (y análogo para las **10 tablas**, enumeradas, para detectar cualquier tabla sin RLS — gate del roadmap).
- **Security (deny-by-default, INSERT/UPDATE/DELETE):** `set role anon; insert into public.guests(...)` → **error de policy** (no éxito silencioso) para cada tabla; un `select` a 0 filas por sí solo no distingue "RLS activa" de "tabla vacía", así que el INSERT-denegado es el que prueba la frontera de escritura (R3 = "ni leer ni escribir"). Usar `throws_ok()`.
- **Edge (secret key pasa):** como `service_role`/owner con bypass, `select` **e** `insert` funcionan.
- **Integration (FK cascade/set null):** insertar `vendors`+`payments`(con vendor_id) → `delete vendors` → el `payments.vendor_id` queda `null`, el pago **no** se borra. `invite_tokens`+`token_guests` → `delete invite_tokens` → `token_guests` se borra en cascada. `tables`+`guests`(table_id) → `delete tables` → `guests.table_id` = null.
- **Edge (CHECKs):** insertar `guests.rsvp_status='xxx'` inválido → falla; `party_size=0` → falla; `amount_cents=-1` → falla; segundo `wedding` con `id=2` → falla (singleton).
- **Edge (unique):** dos `invite_tokens` con el mismo `token` → falla; dos `token_guests` con el mismo par → falla.

**Verification:** `supabase db reset` aplica la migración sin error; `supabase test db` verde; Security Advisor de Supabase no reporta "RLS disabled in public".

---

- [ ] **Unit 2: Funciones Postgres (RPC) para operaciones atómicas + pgTAP**

**Goal:** Implementar `apply_rsvp`, `create_invitation`, `regenerate_invitation`, `touch_rate_limit` como funciones Postgres (transacción implícita) y testearlas con pgTAP, preservando las garantías de seguridad del RSVP.

**Requirements:** R4, R5.

**Dependencies:** Unit 1 (tablas + FKs).

**Files:**
- Create: `supabase/migrations/<ts>_functions.sql`
- Create: `supabase/tests/rsvp.test.sql`, `supabase/tests/rate_limit.test.sql`, `supabase/tests/invitations.test.sql`
- Reference: `src/lib/data/rsvp.ts` (`applyRsvp`), `src/lib/data/invitations.ts` (`createInvitation`/`regenerateInvitation`), `src/lib/rate-limit.ts` (`checkRateLimit`)

**Approach:**
- Todas: `language plpgsql`, `security invoker`, `set search_path = ''`, nombres `public.`-cualificados.
- **Tras cada `CREATE FUNCTION`: `REVOKE EXECUTE ON FUNCTION public.<fn> FROM PUBLIC;` + `GRANT EXECUTE ON FUNCTION public.<fn> TO service_role;`** — PostgREST expone toda función `public` en `/rest/v1/rpc/<fn>`; sin el REVOKE, un poseedor de anon key podría invocar `apply_rsvp`/`touch_rate_limit`/`create_invitation`/`regenerate_invitation` directamente, saltándose la capa Next (en particular el rate-limit, que vive en la action, no en la función). `create_invitation`/`regenerate_invitation` son host-only y **no deben** estar en la superficie alcanzable por anon.
- **`apply_rsvp(p_token text, p_members jsonb, p_message text)`:** re-valida el token (`status='valido' and (expires_at is null or expires_at > now())`) → si no, `raise exception` (rollback total = abort); por cada miembro, comprueba pertenencia en `token_guests` (si alguno está fuera de alcance, `raise` → aborta **todo**); `update guests` escribiendo **solo** `rsvp_status`, `menu` (nullif trim), `plus_one_name` (solo si la fila es `plus_one`, leído de la DB; nunca escribe `plus_one`), `last_modified_source='guest'`; al final `update invite_tokens set message`. **Acepta `p_members` vacío** (mensaje-only; el loop no itera). Preserva el fix anti-clobber (solo se tocan miembros enviados).
- **`create_invitation(p_token, p_party_size, p_label, p_expires_at, p_guest_ids uuid[])`:** inserta el token y `insert into token_guests select <id>, unnest(p_guest_ids)`; devuelve el id/token.
- **`regenerate_invitation(p_id)`:** inserta token nuevo, re-apunta `token_guests` al nuevo, marca el viejo `status='revocado'`; atómico; devuelve el nuevo token.
- **`touch_rate_limit(p_key, p_now, p_window_secs)`:** **debe ser un único `INSERT … ON CONFLICT (key) DO UPDATE … RETURNING count`** (el CASE incrementa o resetea según ventana), **no** un SELECT-then-UPDATE en plpgsql — el cuerpo de la función ser una transacción **no serializa** transacciones concurrentes; solo la sentencia atómica única evita la carrera que el código actual ya garantiza. Devuelve `int`.
- El token de 256 bits se sigue generando en TS (`src/lib/tokens.ts`, `randomBytes(32)`) y se pasa a `create_invitation`/`regenerate_invitation` — **no** en la DB (mantener la fuente de entropía en Node).

**Execution note:** Implementar test-first con pgTAP: las funciones son la frontera de seguridad del RSVP; escribir primero los casos de abuso (fuera de alcance, escritura de campos prohibidos) y luego la función.

**Technical design:** *(directional)* Ver el cuerpo de `apply_rsvp` y `touch_rate_limit` en la investigación (sketch en SQL) — guía de dirección, no copiar literal.

**Patterns to follow:** La lógica exacta de `src/lib/data/rsvp.ts` `applyRsvp` (allowlist de claves, `plus_one` re-leído, abort por fuera de alcance) trasladada a SQL; el CASE de ventana de `src/lib/rate-limit.ts`.

**Test scenarios:** *(pgTAP)*
- **Happy path RSVP:** token válido + 2 miembros propios → sus `rsvp_status`/`menu`/`plus_one_name` se actualizan, `last_modified_source='guest'`, mensaje guardado.
- **Security RSVP (fuera de alcance):** un `guest_id` que no pertenece al token → la función `raise` y **ninguna** fila cambia (atomicidad: el miembro válido tampoco se escribe).
- **Security RSVP (campos prohibidos):** un payload que intente fijar `plus_one=true`/`notes`/`name` → la función solo escribe las columnas permitidas; `plus_one`/`notes`/`name` quedan intactos.
- **Security RSVP (plus_one no concedido):** miembro con `plus_one=false` envía `plus_one_name` → se ignora (queda null).
- **Edge RSVP (token caducado/revocado):** `expires_at < now()` o `status='revocado'` → `raise`, sin cambios.
- **Edge RSVP (mensaje-only):** `p_members = '[]'` + mensaje → solo se actualiza el mensaje; ninguna fila de `guests` cambia.
- **Happy path crear/regenerar:** `create_invitation` con N guests → 1 token + N filas puente; `regenerate_invitation` → token nuevo válido, puente re-apuntado, viejo `revocado`, todo o nada.
- **Rate-limit:** primera llamada → count=1; dentro de ventana → incrementa; pasada la ventana → resetea a 1; concurrencia simulada (dos inserts mismo key) → no se pierde conteo.
- **Security (EXECUTE revocado):** `set role anon; select public.apply_rsvp(...)` (y las otras 3) → **error de permiso** (no error de lógica de negocio); como `service_role` → ejecuta.

**Verification:** `supabase test db` verde; ninguna prueba de abuso logra escribir fuera de alcance o campos prohibidos; `anon` no puede ejecutar ninguna función.

---

### Fase 2 — Capa de datos de la aplicación

- [ ] **Unit 3: Cliente Supabase, tipos generados, capa de compatibilidad; retirar Drizzle**

**Goal:** Añadir `src/lib/supabase/server.ts` (cliente secret-key `server-only` singleton) + tipos generados + la **capa de compat de tipos/consts en camelCase**, **junto a** Drizzle (que sigue vivo hasta U6). La retirada de Drizzle es un paso de limpieza final (Unit 10), no aquí.

**Requirements:** R1, R6, R9.

**Dependencies:** Unit 1 (para `supabase gen types`).

> **Coexistencia (corrige el orden del borrador):** este unit **no borra** `src/lib/db/*` ni quita `drizzle-orm` — U4/U5/U6 aún los importan, así que borrarlos aquí dejaría ~21 ficheros sin compilar. Drizzle y Supabase **conviven** durante la Fase 2; todo lo que se elimina se difiere a Unit 10.

**Files:**
- Create: `src/lib/supabase/server.ts`, `src/lib/supabase/types.ts` (generado por `supabase gen types`)
- Create: `src/lib/types.ts` — capa de compat **camelCase a mano** (tipos de fila + consts de enum). Decidir un único path de import y aplicarlo consistentemente (nuevo `@/lib/types`, o re-export desde `@/lib/db/schema` mientras coexista).
- Modify: `package.json` (**añadir** `@supabase/supabase-js`; dev `supabase` CLI; **añadir** scripts `db:types`/`db:reset`/`db:push`/`db:start`; **dejar** drizzle/libsql hasta U10), `.env.local.example` (**añadir** `SUPABASE_URL`, `SUPABASE_SECRET_KEY` con la nota "NEVER NEXT_PUBLIC_"; las vars de Drizzle se quitan en U10), `vitest.config.ts` (mantener alias `server-only`)
- Reference: `git show ca29e89^:src/lib/supabase/server.ts`

**Approach:**
- `server.ts`: `import 'server-only'` + `createClient<Database>(SUPABASE_URL, SUPABASE_SECRET_KEY, { auth: { persistSession:false, autoRefreshToken:false } })` como singleton exportado (p. ej. `supabase`).
- **Tipos camelCase a mano (NO `Tables<'guests'>` crudo).** Los 13 client components y la lógica acceden en camelCase (`guest.plusOne`, `wedding.eventDate`, `payment.amountCents`), pero `supabase-js`/`gen types` dan snake_case. Por tanto la capa de compat define **tipos camelCase explícitos** (`type Guest = { id: string; rsvpStatus: RsvpStatus; plusOne: boolean; plusOneName: string | null; tableId: string | null; … }`) que coinciden con la forma que Drizzle sintetizaba — y el **mapeo snake→camel** se hace en la frontera de datos (U4/U6). Los tipos generados (`src/lib/supabase/types.ts`) se usan internamente para tipar el cliente, no se exponen a los componentes.
- **Enums:** mantener a mano los arrays `RSVP_STATUSES`, `VENDOR_STATUSES`, `PAYMENT_STATUSES`, `INVITE_STATUSES`, `TABLE_SHAPES` + derivados (`RsvpStatus = typeof RSVP_STATUSES[number]`). Los tipos generados dan estas columnas como `string` (porque el esquema usa `text`+CHECK, no enum nativo) → **narrar cada campo de fila** en los tipos de compat (`rsvpStatus: RsvpStatus`, `status: VendorStatus`, `shape: TableShape`) para que `guest-list.tsx`/`vendor-list.tsx`/`payment-list.tsx`/`seating-board.tsx` (que usan `Record<RsvpStatus,…>[status]`) sigan compilando.
- Scripts npm: `db:types` = `supabase gen types typescript --local > src/lib/supabase/types.ts`; documentar "regenerar tras cada migración".

**Patterns to follow:** El `server-only` singleton actual de `src/lib/db/index.ts`; los consts/tipos exportados de `src/lib/db/schema.ts` (preservar nombres exactos).

**Test scenarios:**
- **Integration (conectividad):** un smoke test confirma `supabase.from('wedding').select()` contra el stack local con el cliente secret-key.
- **Edge (compat de tipos):** `pnpm typecheck` verde con Drizzle **y** Supabase coexistiendo; los tipos camelCase de compat resuelven los nombres `Guest`/`RsvpStatus`/`RSVP_STATUSES`… que U4–U6 consumirán.
- *Test expectation: el grueso del comportamiento se valida en Units 4–6; aquí basta typecheck (coexistencia) + smoke de conexión.*

**Verification:** `pnpm typecheck` y `pnpm build` verdes con ambas capas presentes; el cliente Supabase conecta al stack local. *(La verificación "no quedan imports de drizzle" se traslada a Unit 10.)*

---

- [ ] **Unit 4: Reescribir módulos `data/` y `rate-limit.ts`**

**Goal:** Portar `data/rsvp.ts`, `data/invitations.ts`, `data/seating.ts` y `rate-limit.ts` al SDK + RPC, preservando garantías de seguridad y la inyección de dependencia para tests.

**Requirements:** R1, R4, R5.

**Dependencies:** Units 2, 3.

**Files:**
- Modify: `src/lib/data/rsvp.ts`, `src/lib/data/invitations.ts`, `src/lib/data/seating.ts`, `src/lib/rate-limit.ts`
- Test: `tests/unit/rsvp.test.ts`, `tests/unit/invitations.test.ts`, `tests/unit/seating.test.ts`, `tests/unit/rate-limit.test.ts` (migrar a integración local — ver Unit 7)

**Approach:**
- `getRsvpView`: `.from('invite_tokens').select('id, status, expires_at, message, token_guests(guests(id,name,rsvp_status,menu,plus_one,plus_one_name))')` (solo columnas en allowlist; PII nunca proyectada). El resultado viene **anidado** (`{ …, token_guests: [{ guests: {…} }] }`) → **aplanar** a la forma plana `members[]` actual y **re-casear** a camelCase (`rsvpStatus`, `plusOne`, `plusOneName`). Convertir `expires_at` (string ISO) a `Date` antes de `isInviteValid`. Validez computada con `isInviteValid` en TS; revocado/caducado/inexistente → idéntico `{state:'invalid'}` (sin oráculo). Mantener el cómputo de validez en TS (`tokens.ts`) para cerrar TOCTOU junto con la re-validación dentro de `apply_rsvp`.
- **Contrato de error de `getRsvpView`:** **cualquier `{error}`** del `.select()` (incluido un fallo de relación PostgREST por nombre de FK) debe mapearse a **`{state:'invalid'}`**, NUNCA a `{ok:false,error}` (tipo de otra familia de callers) — si no, `/i/[token]` *crashea* en vez de renderizar "invitación inválida". *(Regresión de seguridad de tipos vs Drizzle: el allowlist de columnas era compile-time; el string `.select()` es no tipado — un futuro `*` o columna nueva podría exponer `notes`/`phone`/`email`. Mitigar usando los tipos generados para validar el select y un test que afirme que esos campos no salen.)*
- `applyRsvp` → fina envoltura sobre `supabase.rpc('apply_rsvp', …)`; mapear `error` a `{ok:false, error}` genérico.
- `invitations.ts`: `createInvitation`/`regenerateInvitation` → `.rpc(...)`; `revokeInvitation` → `.update({status:'revocado'}).eq('id', id).select()`; `listInvitations` → dos `.select()` (o un embedding) + join en JS como hoy.
- `seating.ts`: `deleteTableCore` → `.from('tables').delete().eq('id', id).select()` (la FK `set null` desienta guests; eliminar el update manual); `setTablePositionCore` → `.update({pos_x,pos_y}).eq('id',id).select()` con clamp/round en TS; `assignGuestCore` → comprobar existencia de mesa (`.select('id')`) + `.update({table_id}).eq('id',guestId).select()`.
- `rate-limit.ts`: `checkRateLimit` → `.rpc('touch_rate_limit', {p_key, p_now: new Date().toISOString(), p_window_secs})`, compara `data <= limit`, **fail-open** si `error`; `pruneRateLimits` → `.from('rate_limits').delete().lt('window_start', cutoff)`.
- **Inyección de dependencia para tests:** mantener la firma `(input, client = supabase)` para poder pasar un cliente apuntando al Supabase local en tests.

**Patterns to follow:** Las garantías y forma actuales de `src/lib/data/rsvp.ts` (proyección, abort por alcance) — ahora repartidas entre el `.select()` (lectura) y la RPC (escritura).

**Test scenarios:** *(integración contra Supabase local; ver Unit 7)*
- **Security (getRsvpView):** token válido devuelve solo columnas permitidas; un `console`/inspección confirma que `notes`/`phone`/`email` **no** vienen en el payload.
- **Security (sin oráculo):** token inexistente, revocado y caducado → respuesta idéntica `invalid`.
- **Edge (fallo de embedding):** un `{error}` de PostgREST en el `.select()` → `getRsvpView` devuelve `{state:'invalid'}` (no lanza, no `{ok:false}`).
- **Edge (token con caducidad):** `expires_at` string ISO se convierte a `Date`; un token caducado hace 1s → `invalid`; uno válido 1h en el futuro → `valid` (regresión a vigilar tras el cambio `timestamptz`→string).
- **Happy/seguridad (applyRsvp):** delega en la RPC (cubierto por pgTAP); aquí, smoke de que un token válido + miembros propios persiste y que un `guest_id` ajeno devuelve `{ok:false}` sin cambios.
- **Seating:** crear mesa + sentar 2 guests + `deleteTableCore` → ambos guests quedan sin mesa (FK), la mesa desaparece; `assignGuestCore` con mesa inexistente → error controlado.
- **Invitations:** `createInvitation` con N guests → token + puente; `regenerateInvitation` → nuevo válido, viejo revocado, puente re-apuntado; `revokeInvitation` → `valido`→`revocado`.
- **Rate-limit:** umbral: a la (limit+1)-ésima llamada en ventana → `{ok:false}`; tras la ventana → vuelve a permitir; con `error` simulado → fail-open (`ok:true`).

**Verification:** Suite de integración verde contra `supabase start`; ningún campo PII se filtra en la lectura pública.

---

- [ ] **Unit 5: Reescribir Server Actions**

**Goal:** Portar las 6 actions de mutación + `rsvp.ts` al SDK, convertir el manejo de error a `{data,error}`, y actualizar `clientIpHash()` a la cabecera de IP de Netlify.

**Requirements:** R1, R2, R5, R6.

**Dependencies:** Units 3, 4.

**Files:**
- Modify: `src/lib/actions/configuracion.ts` (`.upsert(row,{onConflict:'id'})`), `invitados.ts` (CRUD + `deleteGuest` → `.delete()` con FK cascade de `token_guests`), `proveedores.ts` (`deleteVendor` → `.delete()` con FK set null), `presupuesto.ts` (`deleteCategory` → `.delete()` con FK set null), `tareas.ts`, `mesas.ts` (delega en `seating`), `rsvp.ts`
- Test: cubierto por e2e (Unit 7) + integración de `data/` (Unit 4)

**Approach:**
- Mantener el "Server Action recipe" de AGENTS.md: `'use server'` → `Schema.safeParse` → mutar vía `supabase` → `revalidatePath` → `redirect()` fuera de try/catch.
- Sustituir cada `db.insert/update/delete(...).returning()` por `.from(...).insert/update/delete(...).select()`; los `db.batch` de borrado por `.delete()` (FKs hacen la limpieza). **Re-casear a camelCase** las filas devueltas que fluyan a client components o a lógica existente. Conservar la detección de not-found: un update/delete sin match devuelve `[]` (no `error`), así que `data.length === 0` sigue siendo "no encontrado".
- Convertir el control de error: donde Drizzle lanzaba, ahora comprobar `error` del SDK y devolver/propagar como corresponde (los `redirect()` siguen fuera de try/catch).
- `rsvp.ts` (`submitRsvp`): mantener honeypot, `pruneRateLimits` oportunista, doble rate-limit (`Promise.all`), `JSON.parse`, Zod `.strict()`, `applyRsvp`, `revalidatePath('/invitados')`. **`clientIpHash()`**: leer **`x-nf-client-connection-ip`** (Netlify) como hop de confianza primario; mantener `x-real-ip` como fallback; documentar que `x-vercel-forwarded-for` ya no aplica (target = Netlify). Nunca el `x-forwarded-for` más a la izquierda. SHA-256 igual. **Evitar el fallback constante `'unknown'`** cuando no hay cabecera: `sha256('unknown')` es fijo → *todas* las peticiones sin cabecera de confianza (dev, Playwright, staging fuera del edge de Netlify) comparten el mismo bucket de rate-limit (no es *fail-open*, es *fail-shared*; agota 10/min en la propia suite de tests). En ausencia de cabecera **y** `NODE_ENV==='development'`, devolver un valor aleatorio/por-sesión en vez de `'unknown'`; en prod la cabecera de Netlify siempre está.

**Patterns to follow:** La receta de Server Action de `AGENTS.md`; el pipeline actual de `src/lib/actions/rsvp.ts`.

**Test scenarios:** *(e2e en Unit 7; aquí los invariantes a preservar)*
- **Happy path:** crear/editar/borrar invitado, proveedor, categoría, pago, tarea, mesa, config → persiste y `revalidatePath` refresca la UI.
- **Integration (FK):** borrar un proveedor con pagos asociados → los pagos quedan sin proveedor (no se borran); borrar un invitado con invitación → su fila puente desaparece (cascade) y la invitación sigue (con menos miembros).
- **Security (RSVP):** honeypot relleno → falso éxito sin escribir; exceso de envíos desde una IP → bloqueado; payload con clave desconocida → Zod rechaza.
- **Edge (IP header):** con `x-nf-client-connection-ip` presente, el rate-limit por IP usa ese valor (no el `x-forwarded-for` manipulable).

**Verification:** e2e de host (invitados/proveedores/presupuesto/tareas/mesas) y públicos (RSVP) verdes; `pnpm build` ok.

---

- [ ] **Unit 6: Reescribir los 12 page Server Components (lecturas)**

**Goal:** Portar todas las lecturas de página de `db.select(...)` a `.from(...).select(...)` con filtros/orden/embeddings de PostgREST, preservando conteos y filtros.

**Requirements:** R1, R2.

**Dependencies:** Units 3, 4.

**Files:**
- Modify: `src/app/(host)/page.tsx` (dashboard: counts), `(host)/configuracion/page.tsx`, `(host)/dia-b/page.tsx`, `(host)/invitaciones/page.tsx`, `(host)/invitados/page.tsx`, `(host)/mesas/page.tsx`, `(host)/pendientes/page.tsx`, `(host)/presupuesto/page.tsx`, `(host)/proveedores/page.tsx`, `(host)/tareas/page.tsx`, `(public)/i/[token]/page.tsx`, `(public)/info/page.tsx`

**Approach:**
- Mapear operadores Drizzle → PostgREST: `eq/and/or` → `.eq()/.or()/encadenado`; `asc/desc` → `.order(col, {ascending})`; `isNull/isNotNull` → `.is('col', null)`/`.not('col','is',null)`; `Promise.all([...])` de selects se mantiene.
- **Counts:** el total simple → `.select('*', { count: 'exact', head: true })`. Pero los **counts agrupados** (`dashboard/page.tsx` hace `groupBy(rsvpStatus) + count()`) **no** se expresan en una sola llamada: Supabase trae los **agregados de PostgREST desactivados por defecto** (`db-aggregates-enabled = false`). Decisión: traer `rsvp_status` de todos los guests y **tabular en JS** (trivial a escala de boda); aplica a cualquier rollup agrupado. *(No "o agregaciones" como decía el borrador.)*
- **Casing + fechas:** re-casear a camelCase las filas que pasan a componentes; `wedding.event_date` (string ISO) → `new Date(...)` donde se renderice. `wedding` → `.eq('id',1).maybeSingle()` (no crashear con null).
- Singleton `wedding`: `.from('wedding').select('*').eq('id',1).maybeSingle()`.
- Páginas públicas (`/i/[token]`, `/info`): leer **solo** las columnas de `wedding` que renderizan (proyección explícita), server-side por secret key (sin acceso anon).
- `dia-b/page.tsx`: mantener exclusión de declinados, guests sentados por mesa, proveedores con teléfono; ahora con embeddings/joins de PostgREST o selects separados + join en JS.
- Todas las páginas siguen `force-dynamic` (lecturas frescas; `fetch` de supabase-js es uncached por defecto en Next 16, pero fijar `force-dynamic`/`revalidate=0` para no servir DB stale).

**Patterns to follow:** Los filtros/counts actuales de `invitados/page.tsx`, `proveedores/page.tsx`, `tareas/page.tsx`; el `Promise.all` de `mesas/page.tsx`/`dia-b/page.tsx`.

**Test scenarios:** *(e2e en Unit 7)*
- **Happy path:** cada página renderiza los datos correctos (dashboard cuenta pagos pendientes/tareas; invitados/proveedores filtran por búsqueda/estado; mesas muestra ocupación; pendientes lista invitaciones; día-B muestra sentados + contactos).
- **Edge (vacío):** páginas sin datos muestran su empty-state (no crashea con `maybeSingle()` null en `wedding`).
- **Security (público):** `/i/[token]` y `/info` no exponen columnas PII no renderizadas (proyección).

**Verification:** Todas las páginas cargan en dev contra Supabase local; e2e de host/públicos verdes; sin errores de `count`/`order` de PostgREST.

---

### Fase 3 — Testing, despliegue y documentación

- [ ] **Unit 7: Migrar testing (pgTAP + integración local + Playwright)**

**Goal:** Reemplazar la infraestructura de test libSQL por: pgTAP (Units 1–2), integración de la capa de datos contra Supabase local, y Playwright contra `supabase start`; conservar money/dates.

**Requirements:** R8.

**Dependencies:** Units 1–6.

**Files:**
- Delete/Replace: `tests/unit/helpers/db.ts` (`makeTestDb` libSQL) → helper que construye un cliente Supabase apuntando al stack local (de `supabase status`)
- Modify: `tests/unit/rsvp.test.ts`, `invitations.test.ts`, `seating.test.ts`, `rate-limit.test.ts`, `smoke-db.test.ts` → integración local con **IDs únicos** por test (en vez de borrar todo); o trasladar la lógica de seguridad ya cubierta por pgTAP y dejar en Vitest solo las envolturas TS
- Keep: `tests/unit/money.test.ts`, `dates.test.ts`, `tests/unit/stubs/server-only.ts`
- Modify: `tests/e2e/host-plano.spec.ts`, `tests/e2e/host-dia-b.spec.ts` (el `beforeEach` que borra vía `@libsql/client` → truncate SQL contra el Postgres local, o vía cliente Supabase secret key)
- Create: `tests/e2e/global-setup.ts` (truncate/`supabase db reset` una vez por run) si se centraliza la limpieza
- Modify: `vitest.config.ts`, `playwright.config.ts`, `package.json` (scripts de test), `tests/e2e/README.md`

**Approach:**
- **Seguridad de la DB** (RLS deny-by-default, RPC abuse) → **pgTAP** (Units 1–2), rápido y aislado por transacción.
- **Capa de datos TS** → integración contra `supabase start`; usar `crypto.randomUUID()` por test para aislar sin reset costoso; reset una vez por suite si hace falta.
- **Playwright** → contra dev apuntando al Supabase local; limpieza de estado en `globalSetup` (truncate SQL: `psql` a `postgresql://postgres:postgres@127.0.0.1:54322/postgres`, o `supabase db reset`); portar el `beforeEach` de los 2 specs. Mantener `workers: 1` (single Postgres local).
- Considerar Vitest projects/workspaces para separar puros (instantáneos) de integración (bajo demanda/CI).
- **Coste reconocido (regresión de infra de test):** hoy `tests/unit/helpers/db.ts` usa libSQL `:memory:` — instantáneo, hermético, sin servicios, corre en cualquier CI (decisión deliberada en memoria `fase2-rsvp-decisions`). Al pasar al SDK se **pierde** ese test en-proceso: `supabase-js` habla HTTP/PostgREST, así que **no** hay equivalente in-process (pglite no sirve a `supabase-js` sin levantar PostgREST). Las suites `rsvp/invitations/seating/rate-limit` pasan a **integración contra un Supabase local (Docker)** o pgTAP. Consecuencia: todo contribuidor/CI necesita **Docker Desktop + `supabase` CLI + contenedor Postgres**, y `pnpm test` deja de ser instantáneo. Mantener money/dates puros en el proyecto Vitest rápido para no perder el ciclo corto.

**Execution note:** Caracterizar antes de cambiar: las suites de seguridad RSVP/seating/rate-limit ya pasan hoy; reescribirlas hacia pgTAP/integración manteniendo **los mismos casos de abuso** como red de seguridad.

**Test scenarios:** *(meta-unidad; los casos concretos están en Units 1, 2, 4, 5, 6)*
- pgTAP cubre: deny-by-default por tabla, FKs, CHECKs, abuso de `apply_rsvp`, rate-limit.
- Integración cubre: las envolturas TS de `data/` (proyección, mapeo de error).
- e2e cubre: flujos host + RSVP público end-to-end con estado limpio entre runs.
- Pure: money/dates sin cambios, instantáneos.

**Verification:** `supabase test db` + Vitest + Playwright verdes localmente; el conteo de garantías de seguridad cubiertas no baja respecto a hoy (36 Vitest + 20 Playwright como línea base de cobertura conceptual).

---

- [ ] **Unit 8: Configuración y runbook de despliegue en Netlify**

**Goal:** Dejar la app desplegable a mano en Netlify con la *secret key* protegida, y documentar el runbook (deploy + migraciones Supabase como pasos separados) y la opción de protección de la URL.

**Requirements:** R6, R7.

**Dependencies:** Units 3–6 (la app compila contra Supabase).

**Files:**
- Create: `netlify.toml` (build `next build`, publish `.next`, plugin `@netlify/plugin-nextjs`, `NODE_VERSION=22`), `.nvmrc` (`22`)
- Create: `docs/deploy-netlify.md` (runbook)
- **Create (requerido, no opcional): `netlify/edge-functions/basic-auth.ts`** — gate del back-office (ver Approach). Es el único control de acceso para PII; debe existir aunque el usuario acabe usando el password de Netlify Pro.
- Modify: `.env.local.example` (`SUPABASE_URL` + `SUPABASE_SECRET_KEY`, nota "NEVER NEXT_PUBLIC_"; + nota de Netlify), `next.config.ts` (revisar `images.remotePatterns` solo si se sirven imágenes desde Supabase Storage — no es el caso ahora)

**Approach:**
- `netlify.toml` mínimo (ver investigación); no fijar build command/publish a mano más allá de lo necesario (el runtime reescribe `.next`). Pin Node 22.
- Env en Netlify: **`SUPABASE_URL`** (NO `NEXT_PUBLIC_SUPABASE_URL` — el navegador no llama a Supabase; el prefijo público inyectaría la URL/project-ref en el bundle) en Builds+Functions; `SUPABASE_SECRET_KEY` marcada **`--secret`**, scopes Functions+Builds, **sin** `NEXT_PUBLIC_`. Confiar en el secret-scanning de Netlify como red de seguridad.
- Mantener el SDK secret-key **solo** en Server Components/Actions/route handlers (Node); nunca en `middleware.ts`/edge/cliente.
- Runbook (`docs/deploy-netlify.md`): (1) `supabase link --project-ref` + `supabase db push` (aplicar migraciones al proyecto remoto, paso separado); (2) `supabase gen types --linked` si se quiere; (3) `netlify link`/`init`, `netlify env:set …`, `netlify deploy --build` (draft) → `--prod`. Recordar la regla AGENTS.md: **nunca** migrar dentro del runtime serverless.
- **Protección de URL (entregable requerido):** el edge-function `basic-auth.ts` gatea por `Authorization` contra una env var. **Lógica de exclusión exacta** (resuelta aquí, no diferida): dejar pasar sin credenciales `/i/`, `/info`, `/~offline`, `/_next/`, `/manifest.webmanifest`, `/sw.js`, `/favicon.ico`; **todo lo demás** (back-office) exige `Authorization`. Así el RSVP sigue accesible sin contraseña y el back-office queda cerrado. Si el gate cubriera `/i/*` por error, los invitados verían un challenge de Basic Auth antes de cargar; si excluyera de más, el back-office quedaría abierto — ambos fallos son binarios y rompen la boda, de ahí la lista explícita. El password integrado de Netlify (Pro) es alternativa equivalente (cubre todas las rutas, incluidas funciones) **pero** no permite excluir el RSVP → si se usa, hay que decidir compartir la contraseña con invitados o mantener el RSVP en otra superficie; por eso el edge-function (excluible) es el camino por defecto.
- **Coste / ciclo de vida (avisar al usuario):** el **free-tier de Supabase pausa el proyecto tras ~7 días de inactividad** → modo de fallo el **día de la boda** (la pareja abre la vista día-B y la DB está pausada). Mitigar: tier de pago, un *keep-alive ping* programado, o aceptar el *resume* manual sabiéndolo. El password integrado de Netlify exige **plan Pro** (de pago); el edge-function es gratis. Tabular esto en el runbook.

**Test scenarios:**
- **Integration (build):** `netlify deploy --build` (draft) produce funciones Node y la app responde; las Server Actions funcionan en el draft.
- **Security (secret no filtrada):** el secret-scanning de Netlify no falla (la key no aparece en el bundle); inspección del bundle cliente confirma que `SUPABASE_SECRET_KEY` no está.
- **Security (gate obligatorio, criterio de cierre):** una ruta de host (`/`, `/invitados`) sin credenciales → **401**; con credenciales → 200. Una ruta pública de invitado (`/i/<token>`, `/info`) **sin** credenciales → 200 (no challenge). Esto es requisito para considerar la unidad terminada y para "go live".
- *Test expectation: validación manual en el draft deploy; sin tests automatizados de plataforma.*

**Verification:** Deploy draft funcional contra el Supabase remoto; runbook reproducible; secret-scanning verde; **el back-office responde 401 sin credenciales y el RSVP sigue abierto** antes de declarar producción.

---

- [ ] **Unit 9: Documentación (README, AGENTS.md, runbook Supabase)**

**Goal:** Actualizar la documentación para reflejar Supabase como capa de datos y Netlify como target.

**Requirements:** R7 (parcial), coherencia del repo.

**Dependencies:** Units 1–8.

**Files:**
- Modify: `README.md` (stack, tablas de fase, "Arquitectura", "Puesta en marcha", "Producción", scripts, "Estructura"), `AGENTS.md` (secciones "Data layer" y "Local dev": Supabase en vez de Drizzle/libSQL; `supabase` CLI; "no migraciones en runtime")
- Create: `docs/supabase-setup.md` (runbook local recuperado/reescrito de `git show ca29e89^:docs/supabase-setup.md`, adaptado a app abierta + secret key + deny-by-default; nota región UE por RGPD para la PII restante)

**Approach:**
- README: reemplazar las menciones Drizzle/libSQL/Turso (líneas de stack, setup `db:*`, prod env, estructura `lib/db/`) por el flujo Supabase. Quitar/ajustar la nota histórica que decía "replanteado como app abierta sobre Drizzle/libSQL" (ahora se vuelve a Supabase, manteniendo app abierta).
- AGENTS.md: reescribir reglas de capa de datos (un cliente `server-only`, `text+check`, ahora `gen types`; **ni la secret key ni `SUPABASE_URL` con `NEXT_PUBLIC_`**; **el control primario es el aislamiento de la secret key**, RLS deny-by-default `enable` sin policies como defensa en profundidad — sin `FORCE`; FKs reales; RPC con `REVOKE EXECUTE FROM PUBLIC` para atomicidad). Mantener: posture abierta/no-auth, split `(host)`/`(public)`, receta de Server Action, copy es-DO, "no migraciones en serverless runtime".
- **Escaneo de secretos en dev (mitiga fuga de la secret key por git):** documentar `.gitignore` de `.env.local` **y** un hook/herramienta (p. ej. `git-secrets` o el pre-commit del secrets-controller) que impida commitear `sb_secret_…`. La secret key da `BYPASSRLS` + acceso total al proyecto; una fuga es el incidente de mayor impacto.
- `docs/supabase-setup.md`: stack local, mapeo de keys (publishable/secret), invariantes de seguridad (secret server-only como control primario + deny-by-default como defensa en profundidad), región UE.

**Test scenarios:** *Test expectation: none — documentación. Verificar que ninguna instrucción de setup quede obsoleta (no quedan `pnpm db:migrate`/Drizzle en los docs).*

**Verification:** README/AGENTS coherentes con el código; un lector nuevo puede levantar el proyecto (local Supabase) y desplegar (Netlify) siguiendo solo los docs.

---

- [ ] **Unit 10: Retirar Drizzle/libSQL (limpieza final)**

**Goal:** Eliminar la capa Drizzle/libSQL una vez que toda la app (U4–U6) ya usa Supabase, dejando un único stack.

**Requirements:** R1 (cierre).

**Dependencies:** Units 4, 5, 6 (todos los consumidores migrados) — **debe ir al final**; hacerlo antes deja ~21 ficheros sin compilar (corrige la contradicción de orden del borrador).

**Files:**
- Delete: `src/lib/db/index.ts`, `src/lib/db/schema.ts` (tras confirmar que los consts/tipos viven en la capa de compat), `src/lib/db/migrations/**`, `drizzle.config.ts`
- Modify: `package.json` (quitar `@libsql/client`, `drizzle-orm`, `drizzle-kit`; quitar scripts `db:generate/migrate/studio` ya muertos), `next.config.ts` (quitar `@libsql/client`/`libsql` de `serverExternalPackages`), `.env.local.example` (quitar `DATABASE_URL`/`DATABASE_AUTH_TOKEN`), `vitest.config.ts` (quitar `env.DATABASE_URL`)

**Approach:** Borrado mecánico + `grep` de verificación. Cualquier import superviviente de `drizzle-orm`/`@libsql/client`/`@/lib/db` es un consumidor no migrado → volver a la unidad correspondiente.

**Test scenarios:**
- **Verification (grep limpio):** `grep -r "drizzle-orm\|@libsql/client\|@/lib/db" src tests` → 0 resultados (salvo la capa de compat si reusa el path).
- *Test expectation: none — es retirada de dependencias; la cobertura la dan U1–U9. El gate es typecheck/build/tests verdes tras el borrado.*

**Verification:** `pnpm typecheck`, `pnpm build`, toda la suite de tests y `pnpm dev` verdes **sin** Drizzle/libSQL en el árbol; `package.json` sin esas dependencias.

## System-Wide Impact

- **Interaction graph:** Las 22 rutas/módulos que leían/escribían vía Drizzle pasan al cliente Supabase; `revalidatePath` se mantiene en cada action. Las funciones RPC concentran la lógica atómica (antes dispersa en `db.batch`).
- **Error propagation:** Cambio transversal — `supabase-js` devuelve `{data,error}` en vez de lanzar. Cada call-site debe comprobar `error` y convertirlo a la forma `{ok:false, error}` existente. Riesgo de "errores silenciosos" si algún sitio ignora `error`; revisar exhaustivamente.
- **State lifecycle:** Las **FKs reales** cambian quién garantiza la integridad referencial: antes el código (`db.batch`), ahora la DB (`cascade`/`set null`). Comportamiento observable equivalente, pero ahora atómico e imposible de saltar. Verificar que el orden de borrado ya no importa.
- **API surface parity:** Los tipos/consts que consumen 13 client components **deben** preservarse con su forma **camelCase** (Unit 3) — y, como `supabase-js` devuelve snake_case, hace falta además **mapear cada fila en la frontera de datos** (U4–U6), no solo re-tipar. Si la capa de compat o el mapeo fallan, rompen todos los formularios/listas a la vez (typecheck **y** runtime).
- **Control de seguridad primario y su test:** la frontera real es "solo el servidor tiene la secret key, nunca `NEXT_PUBLIC_`". Debe tener verificación de primera clase (grep del bundle por la key + frontera `server-only`), no quedar solo implícita en el secret-scanning de Netlify. La RLS deny-by-default es defensa en profundidad, no el control primario.
- **Integration coverage:** La frontera de seguridad se mueve parcialmente a la DB (RLS + RPC) → necesita **pgTAP** (no solo mocks). El roadmap ya advertía: testear la frontera con integración real, incluyendo enumerar todas las tablas para FORCE RLS.
- **Unchanged invariants:** App abierta/no-auth; split `(host)`/`(public)`; cliente único `server-only`; receta de Server Action; copy es-DO; **CSP actual** (`'unsafe-inline'` + React escaping; `connect-src 'self'`); **SW** (`public/sw.js`, excluye cross-origin/no-GET); sin alergias; token de 256 bits generado en Node; rate-limit por IP+token; sin oráculo en lecturas públicas.

## Risks & Dependencies

| Riesgo | Mitigación |
|--------|-----------|
| **Pérdida de garantías de seguridad del RSVP** al mover lógica a SQL/SDK | Trasladar caso-a-caso con pgTAP test-first reproduciendo cada caso de abuso (fuera de alcance, campos prohibidos, sin oráculo) antes de reescribir; la suite de seguridad existente es la línea base |
| **`error` ignorado** en algún call-site (Drizzle lanzaba, SDK no) | Revisión exhaustiva + tipos generados; e2e que provoquen fallos (FK, CHECK) y comprueben el mensaje de error de la UI |
| **Secret key filtrada al cliente** | `server.ts` con `import 'server-only'`; nunca `NEXT_PUBLIC_`; secret-scanning de Netlify como red de seguridad de plataforma |
| **RLS habilitada pero alguna tabla olvidada** (queda abierta a anon) | pgTAP que **enumera las 10 tablas** y asegura 0 filas como `anon`; Security Advisor de Supabase |
| **snake_case → camelCase**: `supabase-js` devuelve snake_case; código y 13 componentes usan camelCase | Tipos de compat camelCase a mano + mapeo en la frontera de datos (U3–U6); `pnpm typecheck` como gate; presupuestar como trabajo real, no mecánico |
| **`timestamptz` vuelve como string** → `isInviteValid` y fechas mal | Convertir a `Date` antes de validar/renderizar (`expires_at`, `event_date`); columnas nullable sin `default now()` (U1); test de token con caducidad |
| **Atomicidad rota** si una RPC no abortara correctamente | `raise exception` dentro de la función (rollback de la transacción implícita); `touch_rate_limit` como único `INSERT … ON CONFLICT`; pgTAP que verifica "todo o nada" y la concurrencia |
| **RPC alcanzable por anon vía PostgREST** (`/rest/v1/rpc/...`), saltando el rate-limit de la action | `REVOKE EXECUTE FROM PUBLIC` + `GRANT … TO service_role`; pgTAP que afirma "anon no puede ejecutar"; `security invoker`+RLS como backstop |
| **Despliegue sin gate** → back-office con PII en abierto | Gate edge-function basic-auth como entregable **requerido** (U8); verificación "host → 401 sin credenciales" como criterio de "go live" |
| **Fuga de la secret key por git** (impacto máximo: `BYPASSRLS` + acceso total) | `.gitignore` de `.env.local` + hook/escaneo de secretos en dev (U9); nunca `NEXT_PUBLIC_`; `--secret` en Netlify + secret-scanning |
| **Pausa del free-tier de Supabase (~7 días inactividad)** → fallo el día de la boda | Tier de pago, keep-alive ping programado, o resume manual sabiéndolo; documentado en el runbook (U8) |
| **Testing más pesado/lento** (Docker, Postgres local; se pierde el test hermético en-proceso) | pgTAP (aislado por txn, rápido) para lo crítico; IDs únicos en vez de reset por test; money/dates puros sin DB; coste reconocido en U7 |
| **`x-nf-client-connection-ip` ausente en local/dev** (bucket de rate-limit compartido) | Fallback aleatorio/por-sesión en dev (no `'unknown'` constante); en prod la cabecera de Netlify siempre está; token de 256 bits como defensa primaria |
| **Coste/región Supabase (RGPD)** para PII de invitados | Proyecto en región UE; sin alergias (ya eliminadas); aviso de privacidad existente |
| **Migración grande de una sola vez** (descarta código recién validado) | Rama dedicada; *vertical slice* RSVP + draft Netlify antes del big-bang; Drizzle coexiste hasta U10; commits por unidad |

## Alternative Approaches Considered

- **Mantener Drizzle y solo cambiar el driver a Postgres (`drizzle-orm/postgres-js` contra Supabase).** *Mucho* menos trabajo: el esquema se reescribe a `pg-core` pero **todas** las queries y la arquitectura (acceso server-only, inyección de dependencia en tests, error por excepción, **propiedades camelCase**) se mantienen; `db.batch` → `db.transaction()`; los tests Vitest siguen hermético con `pglite` (Postgres en proceso, **sin Docker**). **No elegido** porque el usuario seleccionó explícitamente "Migrar al SDK de Supabase (+RLS)". Se documenta como la opción de menor riesgo/coste por si se reconsidera.
  - **Corrección importante (la premisa del usuario puede estar equivocada):** **RLS deny-by-default está disponible en *ambas* vías** — es propiedad de la DB + la Data API, no del cliente. Con Drizzle-directo se corre el mismo `init_schema.sql` con `enable row level security` y se conecta por *connection string* como rol `postgres` (owner, sin `FORCE` → bypass), idéntica postura de seguridad **sin** reescribir 22 ficheros, sin plpgsql, sin pgTAP. **Más aún:** el SDK *obliga* a mantener encendida la Data API pública de PostgREST (con RLS como único muro ante un poseedor de anon key); la vía Drizzle-directa puede **apagar la Data API por completo** (Settings → API) → superficie de ataque estrictamente menor. El gate pgTAP de "enumerar 10 tablas" existe *porque* el SDK fuerza la Data API encendida. **Si la decisión del SDK se tomó pensando "RLS solo se consigue con el SDK", conviene re-confirmarla con la premisa corregida.**
  - **Beneficio legítimo del SDK (para una comparación honesta en ambos sentidos):** el SDK habla con Supabase por **HTTP/PostgREST sin estado** → en funciones serverless de Netlify **no hay agotamiento del pool de conexiones**. La vía Drizzle-`postgres-js` conectaría directo a Postgres desde serverless y **debe** ir por el *transaction pooler* (pgBouncer) de Supabase con *prepared statements* desactivados — un *gotcha* operacional real. Este, y no el incorrecto "RLS solo con el SDK", es el argumento más fuerte a favor del SDK en esta plataforma.
- **SDK en el navegador con anon key + RLS permisiva.** Rechazado: sin auth, RLS no puede gatear por usuario, así que habría que permitir todo a `anon` → expondría PII (invitados, presupuesto, contratos) a cualquiera que extraiga la anon key del bundle. Incompatible con una app abierta con datos sensibles.
- **Funciones `security definer`** para todo. Innecesario: el único llamador es la secret key (`BYPASSRLS`); `security invoker` basta. Se mantiene `search_path=''` por si en el futuro se expone alguna RPC a `anon`.
- **Mantener el split `wedding_public`/`wedding_private`** del diseño original. Innecesario sin auth: con deny-by-default + acceso server-side por secret key y proyección en las páginas públicas, una sola tabla `wedding` basta.

## Documentation / Operational Notes

- **Despliegue en dos pasos independientes:** (1) migraciones Supabase (`supabase db push` al proyecto enlazado) — **nunca** en el runtime serverless; (2) deploy del front (`netlify deploy --build --prod`). Documentado en `docs/deploy-netlify.md`.
- **Rotación/seguridad de la secret key:** vive solo en env de Netlify (Functions+Builds, `--secret`) y en `.env.local` (gitignored). Nunca en el repo ni con prefijo público.
- **Región UE** para el proyecto Supabase (PII de invitados; RGPD).
- **Protección de la URL: obligatoria antes de producción.** El gate edge-function basic-auth (entregable requerido) protege el back-office y **excluye** `/i/`, `/info`, `/~offline` + assets. El password Pro de Netlify es alternativa equivalente pero no excluye el RSVP. La *elección* del mecanismo es del usuario; **tener uno activo** es criterio de "go live".
- **Pausa del free-tier de Supabase** (~7 días de inactividad): riesgo el día del evento. Recomendar tier de pago o keep-alive si la fecha está próxima.
- **Escaneo de secretos en dev** para impedir commitear la secret key (`.gitignore` + hook).

## Sources & References

- **Mapa de superficie:** `src/lib/db/schema.ts`, `src/lib/db/index.ts`, `src/lib/data/*`, `src/lib/actions/*`, `src/lib/rate-limit.ts`, `src/app/(host)/**`, `src/app/(public)/**`, `tests/**`, `drizzle.config.ts`, `package.json`, `next.config.ts`, `vitest.config.ts`, `playwright.config.ts`, `AGENTS.md`, `README.md`.
- **Diseño Supabase previo (referencia):** commit `ca29e89` (pivote); recuperar de `ca29e89^`: `supabase/migrations/0001_init.sql`, `0002_rls.sql`, `supabase/config.toml`, `src/lib/supabase/server.ts`, `docs/supabase-setup.md`. Roadmap `docs/plans/2026-06-22-001-feat-boda-app-roadmap-plan.md` (KTD Supabase/RLS). Brainstorm `docs/brainstorms/2026-06-22-boda-app-requirements.md` (R14, R4, RGPD).
- **Learnings:** `docs/solutions/2026-06-23-fase0-security-headers.md`, `docs/solutions/2026-06-23-pwa-serwist-turbopack-spike.md`.
- **Supabase:** [API keys](https://supabase.com/docs/guides/getting-started/api-keys), [SSR client](https://supabase.com/docs/guides/auth/server-side/creating-a-client), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [Database Functions](https://supabase.com/docs/guides/database/functions), [Migrations](https://supabase.com/docs/guides/deployment/database-migrations), [Testing/pgTAP](https://supabase.com/docs/guides/local-development/testing/overview), [CLI](https://github.com/supabase/cli).
- **PostgreSQL:** [§5.9 Row Security Policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html), [RLS footguns](https://www.bytebase.com/blog/postgres-row-level-security-footguns/).
- **Netlify:** [Next 16 en Netlify](https://www.netlify.com/changelog/next-js-16-deploy-on-netlify/), [Next docs](https://docs.netlify.com/build/frameworks/framework-setup-guides/nextjs/overview/), [Secrets Controller](https://docs.netlify.com/build/environment-variables/secrets-controller/), [Password Protection](https://docs.netlify.com/manage/security/secure-access-to-sites/password-protection/), [CLI deploy](https://cli.netlify.com/commands/deploy/), `@netlify/plugin-nextjs@5.15.12`.
