/**
 * Static site/brand constants.
 *
 * The wedding's *content* (couple names, date, venue, dress code) lives in the
 * `wedding_public` / `wedding_private` tables and is edited from the back-office
 * — this module only holds app-level identity + locale that never changes per
 * deploy. Read `NEXT_PUBLIC_SITE_URL` for absolute URL resolution.
 */
export const site = {
  /** App name shown in the title bar / PWA manifest before the couple configures theirs. */
  name: "Nuestra Boda",
  locale: "es-DO",
  /** Canonical origin used by metadataBase + OG/manifest absolute URLs. */
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
} as const;

export type Site = typeof site;
