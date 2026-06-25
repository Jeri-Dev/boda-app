---
title: "Security headers + CSP model (U0.5)"
date: 2026-06-23
phase: 0
unit: U0.5
tags: [security, csp, headers, nonce, next16, xss]
---

# Fase 0 security headers + the CSP model decision

## Headers shipped (`next.config.ts` → `headers()`)

Applied to every response: `Content-Security-Policy`, `Strict-Transport-Security`
(HSTS), `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`,
`Referrer-Policy: no-referrer` (tokens travel in guest URLs — never leak via
`Referer`), `Permissions-Policy` (camera/mic/geo/topics off), and
`X-DNS-Prefetch-Control: off`. `poweredByHeader: false` drops `X-Powered-By`.

`/sw.js` additionally gets `Cache-Control: no-store` + a JS MIME (U0.4).

## CSP model — the deferred decision, resolved

The roadmap left "nonce vs hash vs `style-src` tolerated by Tailwind" to be
decided at Fase 0 implementation. Decision:

**Enforce every strict directive that does NOT need a per-request nonce; accept
`'unsafe-inline'` on `script-src`/`style-src` as a documented, Fase-2-gated gap.**

Enforced now: `default-src 'self'`, `object-src 'none'`, `base-uri 'self'`,
`frame-ancestors 'none'`, `form-action 'self'`, and tight `img/font/connect/
worker/manifest` allowlists. Dev relaxes `script-src` with `'unsafe-eval'` and
widens `connect-src` to localhost websockets for Turbopack HMR.

### Why not nonce-strict now

1. A nonce + `'strict-dynamic'` CSP forces **every page into dynamic rendering**
   (Next applies the nonce only during SSR) and needs a per-request edge/proxy
   layer to mint the nonce — infrastructure we don't add in Fase 0.
2. It directly fights the **public-page caching** the roadmap wants for the Fase
   2 invitation surface (the plan calls this tension out explicitly).
3. Fase 0 renders **no untrusted user content**. The stored-XSS surface (guest
   RSVP free text rendered in the privileged back-office) does not exist until
   Fase 2. The marginal protection of nonce-strict `script-src` today is low.

### Fase 2 hard gate — RESOLVED (overtaken by the no-auth pivot)

The roadmap mandated upgrading `script-src` to `'self' 'nonce-<n>'
'strict-dynamic'` before the public invitation/RSVP surface shipped, as
defense-in-depth against stored XSS in a **privileged back-office session**.

That justification no longer holds: the project pivoted to an **open app** (no
Supabase, no auth, no login) — there is no privileged session to protect, and
the back-office holds no session secrets an XSS could exfiltrate. Reintroducing
a per-request nonce would force every page into dynamic rendering, re-add a
proxy layer we deleted, and fight the public-page caching the invitation surface
wants — all to protect a session that doesn't exist.

**Decision (U2.2):** keep `'unsafe-inline'` on `script-src`; rely on **React
output escaping** as the XSS defense for the public surface (all guest/host
free-text — invitation message, names, RSVP message — is rendered as escaped
children, never `dangerouslySetInnerHTML`). If a privileged surface is ever
reintroduced, revisit nonce-strict then.

## Verified by

`tests/e2e/security-headers.spec.ts` — asserts the stable directives + non-CSP
headers on a document response, the stripped `X-Powered-By`, and the SW
`no-store` + JS MIME.
