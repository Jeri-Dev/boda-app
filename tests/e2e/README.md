# E2E tests

Playwright suite for the Fase 0 foundation. Currently covers the security
headers + CSP (`security-headers.spec.ts`).

## Setup

```bash
pnpm test:e2e:install   # install browsers, once per machine
```

## Running

```bash
pnpm test:e2e
```

`webServer` boots `pnpm dev` automatically. The suite is **serial**
(`workers: 1`). Optional: `PLAYWRIGHT_BASE_URL` to target a running server
instead of spawning one.
