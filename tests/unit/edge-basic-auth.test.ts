import { describe, expect, it, vi } from 'vitest'

import basicAuth from '../../netlify/edge-functions/basic-auth'

describe('edge basicAuth (bypass)', () => {
  it('allows back-office paths without challenge', async () => {
    const next = vi.fn(() => new Response('ok', { status: 200 }))
    const response = await basicAuth(
      new Request('https://boda.test/invitados'),
      { next } as unknown as Parameters<typeof basicAuth>[1],
    )

    expect(next).toHaveBeenCalledOnce()
    expect(response.status).toBe(200)
  })

  it('keeps allowing public guest paths', async () => {
    const next = vi.fn(() => new Response('ok', { status: 200 }))
    const response = await basicAuth(
      new Request('https://boda.test/i/token-publico'),
      { next } as unknown as Parameters<typeof basicAuth>[1],
    )

    expect(next).toHaveBeenCalledOnce()
    expect(response.status).toBe(200)
  })
})
