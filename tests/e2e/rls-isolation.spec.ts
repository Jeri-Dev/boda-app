import { test, expect } from '@playwright/test'

import {
  getAnonClient,
  getHostClient,
  getNonHostClient,
  getServiceClient,
} from './fixtures/supabase'

/**
 * U0.2 — RLS public/private boundary (R14).
 *
 * Pure API-level integration tests against the real local Supabase stack (no
 * browser). They prove the isolation guarantee with REAL roles, not mocks:
 *   - anon can read the PUBLIC config, but NOT the private config or allowlist.
 *   - anon cannot write the private config.
 *   - the host CAN reach private data, and reading the allowlist does not
 *     recurse (the bug class my-app hit).
 *
 * Depends on global-setup having provisioned the host + allowlist row.
 */

test.describe('RLS — public/private isolation', () => {
  test('anon CAN read wedding_public (public projection)', async () => {
    const anon = getAnonClient()
    const { data, error } = await anon
      .from('wedding_public')
      .select('*')
    expect(error).toBeNull()
    expect(data && data.length).toBeGreaterThanOrEqual(1)
  })

  test('anon CANNOT read wedding_private (returns zero rows)', async () => {
    const anon = getAnonClient()
    const { data, error } = await anon.from('wedding_private').select('*')
    // RLS with no matching policy yields an empty set (not an error) for SELECT.
    expect(error).toBeNull()
    expect(data ?? []).toHaveLength(0)
  })

  test('anon CANNOT read host_allowlist (returns zero rows)', async () => {
    const anon = getAnonClient()
    const { data, error } = await anon.from('host_allowlist').select('*')
    expect(error).toBeNull()
    expect(data ?? []).toHaveLength(0)
  })

  test('anon CANNOT insert into wedding_private', async () => {
    const anon = getAnonClient()
    const { error } = await anon
      .from('wedding_private')
      .insert({ planning_notes: 'intruso' })
    // No anon INSERT policy → RLS rejects with an error.
    expect(error).not.toBeNull()
  })

  test('anon CANNOT update wedding_private', async () => {
    const anon = getAnonClient()
    const { data, error } = await anon
      .from('wedding_private')
      .update({ planning_notes: 'intruso' })
      .eq('id', 1)
      .select()
    // RLS UPDATE with no policy: no error, but zero rows are affected.
    expect(error).toBeNull()
    expect(data ?? []).toHaveLength(0)
  })
})

test.describe('RLS — authenticated non-host (membership is the gate)', () => {
  // The realistic attacker with signup open: a signed-in user who is NOT in the
  // allowlist. These lock the invariant that `authenticated` ≠ authorized — a
  // regression to `auth.role() = 'authenticated'` would turn them red.
  test('non-host CANNOT read wedding_private', async () => {
    const nonHost = await getNonHostClient()
    const { data, error } = await nonHost.from('wedding_private').select('*')
    expect(error).toBeNull()
    expect(data ?? []).toHaveLength(0)
  })

  test('non-host CANNOT read host_allowlist', async () => {
    const nonHost = await getNonHostClient()
    const { data, error } = await nonHost.from('host_allowlist').select('*')
    // Self-row policy returns only the caller's own row — they have none.
    expect(error).toBeNull()
    expect(data ?? []).toHaveLength(0)
  })

  test('non-host CANNOT insert into wedding_private', async () => {
    const nonHost = await getNonHostClient()
    const { error } = await nonHost
      .from('wedding_private')
      .insert({ planning_notes: 'intruso autenticado' })
    expect(error).not.toBeNull()
  })

  test('non-host CANNOT update wedding_private', async () => {
    const nonHost = await getNonHostClient()
    const { data, error } = await nonHost
      .from('wedding_private')
      .update({ planning_notes: 'intruso autenticado' })
      .eq('id', 1)
      .select()
    expect(error).toBeNull()
    expect(data ?? []).toHaveLength(0)
  })
})

test.describe('RLS — host access', () => {
  test('host CAN read wedding_private', async () => {
    const host = await getHostClient()
    const { data, error } = await host.from('wedding_private').select('*')
    expect(error).toBeNull()
    expect(data && data.length).toBeGreaterThanOrEqual(1)
  })

  test('host CAN read only their OWN host_allowlist row without recursion', async () => {
    const host = await getHostClient()
    const { data, error } = await host.from('host_allowlist').select('user_id')
    // A recursive policy would surface "infinite recursion detected in policy".
    expect(error).toBeNull()
    expect(data ?? []).toHaveLength(1)
  })

  test('host CAN update wedding_private', async () => {
    const host = await getHostClient()
    const note = `actualizado en test ${Date.now()}`
    const { data, error } = await host
      .from('wedding_private')
      .update({ planning_notes: note })
      .eq('id', 1)
      .select()
    expect(error).toBeNull()
    expect(data ?? []).toHaveLength(1)
    expect(data?.[0]?.planning_notes).toBe(note)
  })

  test.afterAll(async () => {
    // Reset the note so reruns start clean.
    const service = getServiceClient()
    await service
      .from('wedding_private')
      .update({ planning_notes: null })
      .eq('id', 1)
  })
})
