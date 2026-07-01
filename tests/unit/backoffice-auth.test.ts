import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Mutable auth header the mocked next/headers returns.
const hdr = vi.hoisted(() => ({ auth: null as string | null }))
vi.mock('next/headers', () => ({
  headers: async () => ({
    get: (k: string) => (k.toLowerCase() === 'authorization' ? hdr.auth : null),
  }),
}))

import { requireBackofficeAuth, UnauthorizedError } from '@/lib/auth/backoffice'

const basic = (u: string, p: string) =>
  `Basic ${Buffer.from(`${u}:${p}`).toString('base64')}`

describe('requireBackofficeAuth', () => {
  const prev = {
    u: process.env.BASIC_AUTH_USER,
    p: process.env.BASIC_AUTH_PASSWORD,
  }
  beforeEach(() => {
    hdr.auth = null
  })
  afterEach(() => {
    process.env.BASIC_AUTH_USER = prev.u
    process.env.BASIC_AUTH_PASSWORD = prev.p
  })

  it('allows when no credentials are configured (dev/test)', async () => {
    delete process.env.BASIC_AUTH_USER
    delete process.env.BASIC_AUTH_PASSWORD
    hdr.auth = null // even with no header
    await expect(requireBackofficeAuth()).resolves.toBeUndefined()
  })

  it('denies (fail closed) when configured but no auth header', async () => {
    process.env.BASIC_AUTH_USER = 'host'
    process.env.BASIC_AUTH_PASSWORD = 's3cret'
    hdr.auth = null
    await expect(requireBackofficeAuth()).rejects.toBeInstanceOf(
      UnauthorizedError,
    )
  })

  it('denies wrong credentials', async () => {
    process.env.BASIC_AUTH_USER = 'host'
    process.env.BASIC_AUTH_PASSWORD = 's3cret'
    hdr.auth = basic('host', 'wrong')
    await expect(requireBackofficeAuth()).rejects.toBeInstanceOf(
      UnauthorizedError,
    )
  })

  it('denies a malformed / non-Basic header', async () => {
    process.env.BASIC_AUTH_USER = 'host'
    process.env.BASIC_AUTH_PASSWORD = 's3cret'
    hdr.auth = 'Bearer abc'
    await expect(requireBackofficeAuth()).rejects.toBeInstanceOf(
      UnauthorizedError,
    )
  })

  it('allows the correct credentials', async () => {
    process.env.BASIC_AUTH_USER = 'host'
    process.env.BASIC_AUTH_PASSWORD = 's3cret'
    hdr.auth = basic('host', 's3cret')
    await expect(requireBackofficeAuth()).resolves.toBeUndefined()
  })
})
