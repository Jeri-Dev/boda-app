import { test, expect } from '@playwright/test'

/**
 * U0.5 — security headers + CSP.
 *
 * Runs against the dev server, so the CSP is the dev (permissive script-src)
 * variant. We assert the directives that are STABLE across dev/prod (the strict
 * ones that don't need a nonce) plus the non-CSP headers, which are identical
 * in both environments.
 */

test.describe('Security headers', () => {
  test('document responses carry the hardening headers', async ({ request }) => {
    const res = await request.get('/login')
    const h = res.headers()

    expect(h['x-content-type-options']).toBe('nosniff')
    expect(h['x-frame-options']).toBe('DENY')
    expect(h['referrer-policy']).toBe('no-referrer')
    expect(h['permissions-policy']).toBeTruthy()
    expect(h['strict-transport-security']).toContain('max-age=')

    const csp = h['content-security-policy']
    expect(csp).toBeTruthy()
    expect(csp).toContain("default-src 'self'")
    expect(csp).toContain("object-src 'none'")
    expect(csp).toContain("base-uri 'self'")
    expect(csp).toContain("frame-ancestors 'none'")
    expect(csp).toContain("form-action 'self'")
  })

  test('the X-Powered-By fingerprint header is stripped', async ({ request }) => {
    const res = await request.get('/login')
    expect(res.headers()['x-powered-by']).toBeUndefined()
  })

  test('the service worker is served uncached with a JS content-type', async ({
    request,
  }) => {
    const res = await request.get('/sw.js')
    expect(res.status()).toBe(200)
    const h = res.headers()
    expect(h['content-type']).toContain('javascript')
    expect(h['cache-control']).toContain('no-store')
  })
})
