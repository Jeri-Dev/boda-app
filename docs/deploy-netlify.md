# Despliegue manual: Supabase Postgres + Netlify

Runbook reproducible para desplegar boda-app. Dos pasos **independientes**: (1)
la base de datos (Supabase) y (2) el front (Netlify). Las migraciones se aplican
**fuera del runtime** — nunca desde la función serverless.

La app es **abierta** (sin login). La protección del back-office (que expone toda
la PII) es el gate Basic-Auth en el edge (`netlify/edge-functions/basic-auth.ts`)
— **entregable obligatorio**, no opcional.

---

## 1. Base de datos (Supabase)

1. **Crear el proyecto** en [supabase.com](https://supabase.com) — **región UE**
   (la PII de invitados cae bajo RGPD). Guarda la contraseña de la base.

2. **Apagar la Data API pública.** Project → Settings → API → **Data API**:
   desactívala (o restringe el schema expuesto a ninguno). El navegador nunca
   habla con Supabase, así que PostgREST no hace falta y apagarlo reduce la
   superficie de ataque a cero (la `anon` key deja de poder tocar nada). La RLS
   deny-by-default de la migración queda como defensa en profundidad por si se
   reactivara.

3. **Cadenas de conexión** — Project → **Connect**:
   - **Transaction pooler** (`…pooler.supabase.com:6543`) → para Netlify
     (serverless). El cliente ya fija `prepare: false`.
   - **Direct / Session pooler** (`:5432`) → para aplicar migraciones y para
     `pnpm dev`.

4. **Aplicar la migración** (crea las 10 tablas, FKs, CHECKs, índices y habilita
   RLS). Usa la conexión **directa/session** (no la transaction pooler, que no va
   bien con DDL):

   ```bash
   # .env.local con DATABASE_URL = conexión directa/session, luego:
   pnpm db:migrate
   ```

   > Usa `db:migrate` (ejecuta el fichero `src/lib/db/migrations/*.sql`, que
   > incluye los `ENABLE ROW LEVEL SECURITY`). **No** uses `db:push`: diffea
   > desde el esquema Drizzle y se saltaría la RLS.

   Verifica en el SQL editor: `select relrowsecurity from pg_class where
   relname = 'guests';` → `t`.

---

## 2. Front (Netlify)

1. **Conectar el repo** en Netlify (o `netlify init` con la CLI). El
   `netlify.toml` ya declara el plugin `@netlify/plugin-nextjs` y Node 22.

2. **Variables de entorno** (Site configuration → Environment variables):

   | Variable | Valor | Scope | Notas |
   |---|---|---|---|
   | `DATABASE_URL` | cadena del **transaction pooler** (6543) | Functions + Builds | Márcala **secret**. Sin `NEXT_PUBLIC_`. |
   | `BASIC_AUTH_USER` | usuario del back-office | Functions | — |
   | `BASIC_AUTH_PASSWORD` | contraseña del back-office | Functions | Secret. |
   | `NEXT_PUBLIC_SITE_URL` | `https://<tu-sitio>.netlify.app` | Builds | Origen canónico. |

   El **secret-scanning** de Netlify bloquea el build si `DATABASE_URL` acaba en
   el bundle del cliente — es la red de seguridad de que la key no se filtró.

3. **Deploy de prueba (draft) y luego producción:**

   ```bash
   netlify deploy --build            # draft: valida build + Server Actions
   netlify deploy --build --prod     # producción
   ```

---

## 3. Verificación de "go live" (criterio de cierre)

Contra el deploy (draft o prod):

- [ ] Una ruta de host **sin credenciales** responde **401**:
      `curl -I https://<sitio>/` y `…/invitados` → `401` + `WWW-Authenticate`.
- [ ] La misma ruta **con credenciales** responde 200:
      `curl -u user:pass https://<sitio>/invitados` → 200.
- [ ] El RSVP público **sin credenciales** responde 200 (no challenge):
      `https://<sitio>/i/<token>`, `…/info` → 200.
- [ ] Crear/editar/borrar un invitado persiste (Server Action contra Postgres).
- [ ] Inspección del bundle cliente: `DATABASE_URL` **no** aparece.

---

## Avisos operativos

- **Pausa del free-tier de Supabase (~7 días de inactividad).** El proyecto se
  suspende y la primera petición tras la pausa falla hasta reanudarlo — riesgo
  **el día de la boda** (la pareja abre la vista día-B y la DB está pausada).
  Mitiga con: tier de pago, un keep-alive programado, o reanudación manual
  sabiéndolo. Si la fecha está cerca, tier de pago.
- **Migraciones nunca en el runtime serverless** — siempre `pnpm db:migrate`
  como paso aparte (regla de AGENTS.md).
- **La secret key vive solo** en env de Netlify (Functions, secret) y en
  `.env.local` (gitignored). Nunca en el repo ni con prefijo `NEXT_PUBLIC_`.
- **Alternativa de protección:** el password integrado de Netlify (plan Pro)
  cubre todo el sitio pero **no** puede excluir `/i/…` → los invitados verían el
  challenge. Por eso el edge-function (excluible) es el camino por defecto.
