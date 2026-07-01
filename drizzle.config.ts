import { defineConfig } from 'drizzle-kit'

/**
 * drizzle-kit config (generate / migrate / push / studio) for Supabase Postgres.
 *
 * `drizzle-kit generate` is OFFLINE (schema → SQL diff) and needs no DB. Only
 * `push`/`migrate`/`studio` connect, and those read `DATABASE_URL` via the
 * `db:*` scripts (`node --env-file=.env.local …` in package.json), pointing at
 * the linked Supabase project.
 *
 * Migrations are applied out-of-band (a deploy step or the Supabase CLI), never
 * from the serverless runtime.
 */
export default defineConfig({
  schema: './src/lib/db/schema.ts',
  out: './src/lib/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? '',
  },
  strict: true,
  verbose: true,
})
