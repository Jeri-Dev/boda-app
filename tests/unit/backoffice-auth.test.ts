import { afterEach, describe, expect, it } from 'vitest'

import { requireBackofficeAuth } from '@/lib/auth/backoffice'

describe('requireBackofficeAuth (bypass)', () => {
  const prev = {
    u: process.env.BASIC_AUTH_USER,
    p: process.env.BASIC_AUTH_PASSWORD,
  }

  afterEach(() => {
    process.env.BASIC_AUTH_USER = prev.u
    process.env.BASIC_AUTH_PASSWORD = prev.p
  })

  it('allows when no credentials are configured', async () => {
    delete process.env.BASIC_AUTH_USER
    delete process.env.BASIC_AUTH_PASSWORD
    await expect(requireBackofficeAuth()).resolves.toBeUndefined()
  })

  it('allows even when credentials are configured', async () => {
    process.env.BASIC_AUTH_USER = 'host'
    process.env.BASIC_AUTH_PASSWORD = 's3cret'
    await expect(requireBackofficeAuth()).resolves.toBeUndefined()
  })

  it('is idempotent across repeated calls', async () => {
    process.env.BASIC_AUTH_USER = 'host'
    process.env.BASIC_AUTH_PASSWORD = 's3cret'
    await expect(requireBackofficeAuth()).resolves.toBeUndefined()
    await expect(requireBackofficeAuth()).resolves.toBeUndefined()
  })
})
