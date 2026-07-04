import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

/**
 * Structural guardrail (security review, U5): every exported back-office Server
 * Action MUST call `requireBackofficeAuth()`. The Netlify edge gate keys on the
 * route, but Server Actions dispatch by action-ID, so the path gate alone is
 * bypassable — the in-action check is the real control. `submitRsvp` is the one
 * intentional exemption (the public RSVP write).
 *
 * A static source check (not a runtime mock) so it covers current AND future
 * actions without per-unit reminders.
 */
const ACTIONS_DIR = join(process.cwd(), 'src/lib/actions')
const EXEMPT = new Set(['submitRsvp'])

describe('back-office Server Actions gate auth', () => {
  const files = readdirSync(ACTIONS_DIR).filter((f) => f.endsWith('.ts'))

  it('has action files to check', () => {
    expect(files.length).toBeGreaterThan(0)
  })

  for (const file of files) {
    it(`${file}: every exported action calls requireBackofficeAuth()`, () => {
      const src = readFileSync(join(ACTIONS_DIR, file), 'utf8')
      // Each segment is one exported async function body (up to the next export).
      const segments = src.split('export async function ').slice(1)
      for (const seg of segments) {
        const name = seg.slice(0, seg.search(/[^A-Za-z0-9_]/))
        if (EXEMPT.has(name)) continue
        expect(
          seg.includes('requireBackofficeAuth'),
          `${file} → ${name}() must call requireBackofficeAuth()`,
        ).toBe(true)
      }
    })
  }
})
