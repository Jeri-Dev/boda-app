import type { NextConfig } from "next";

// Derive the Supabase hostname + full origin at config-eval time. `next/image`
// needs the hostname allowlist before the server starts; the CSP needs the full
// origin (scheme + port) so the browser can reach the API/Storage. Both fall
// back to empty on a fresh clone so `pnpm build` still succeeds. Mirrors
// my-app/next.config.ts.
const supabaseHost = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").hostname;
  } catch {
    return "";
  }
})();

const supabaseOrigin = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").origin;
  } catch {
    return "";
  }
})();

const supabaseWsOrigin = supabaseOrigin.replace(/^http/, "ws");

const isDev = process.env.NODE_ENV !== "production";

/**
 * Content-Security-Policy (U0.5).
 *
 * DESIGN DECISION (Fase 0): every strict directive that does NOT require a
 * per-request nonce is enforced — `default-src 'self'`, `object-src 'none'`,
 * `base-uri 'self'`, `frame-ancestors 'none'`, `form-action 'self'`. We accept
 * `'unsafe-inline'` on `script-src`/`style-src` here because:
 *   1. The strict alternative (nonce + 'strict-dynamic') forces ALL pages into
 *      dynamic rendering and must be threaded through the auth proxy — risk we
 *      don't take against the gate in Fase 0.
 *   2. Fase 0 renders NO untrusted user content (the stored-XSS surface — guest
 *      RSVP messages — arrives in Fase 2). The marginal value now is low.
 *
 * FASE 2 HARD GATE: before the public invitation/RSVP surface ships, upgrade
 * `script-src` to `'self' 'nonce-<n>' 'strict-dynamic'` via the proxy (Next 16
 * mechanism: node_modules/next/dist/docs/01-app/02-guides/content-security-
 * policy.md) and reconcile with public-page caching. Tracked in
 * docs/solutions/2026-06-23-fase0-security-headers.md.
 *
 * Dev relaxes script-src with `'unsafe-eval'` (Turbopack HMR) and widens
 * connect-src to localhost websockets.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' blob: data:${supabaseOrigin ? ` ${supabaseOrigin}` : ""}`,
  "font-src 'self' data:",
  `connect-src 'self'${supabaseOrigin ? ` ${supabaseOrigin} ${supabaseWsOrigin}` : ""}${
    isDev ? " ws://127.0.0.1:* ws://localhost:* http://127.0.0.1:* http://localhost:*" : ""
  }`,
  "worker-src 'self'",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

/** Security headers applied to every response (U0.5). */
const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  // HSTS only acts over HTTPS (ignored on http://localhost) — safe to always send.
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Belt-and-suspenders with CSP frame-ancestors for older browsers.
  { key: "X-Frame-Options", value: "DENY" },
  // Tokens travel in guest URLs (/i/[token]) → never leak them via Referer.
  { key: "Referrer-Policy", value: "no-referrer" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  { key: "X-DNS-Prefetch-Control", value: "off" },
];

const nextConfig: NextConfig = {
  // Drop the `X-Powered-By: Next.js` fingerprint header.
  poweredByHeader: false,
  // Already the default for `next start`; set explicitly so this file answers
  // the "are responses compressed?" checklist question without a doc dive.
  compress: true,
  turbopack: {
    // Pin the workspace root to this project. A stray lockfile in $HOME
    // otherwise makes Next infer the wrong root (see build warning).
    root: import.meta.dirname,
  },
  images: {
    remotePatterns: supabaseHost
      ? [
          {
            protocol: "https",
            hostname: supabaseHost,
            pathname: "/storage/v1/object/public/**",
          },
        ]
      : [],
  },
  async headers() {
    return [
      // Service worker: correct MIME + never cache, so updates ship immediately
      // (Next 16 PWA guide). `Service-Worker-Allowed` widens the SW scope to /.
      {
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
      // Global security headers.
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
