import { describe, it, expect, vi, beforeEach } from 'vitest'

const state = vi.hoisted(() => ({
  response: { data: null as { value: unknown } | null, error: null as unknown },
  reject: false,
  calls: 0,
}))

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => {
            state.calls++
            if (state.reject) throw new Error('network down')
            return state.response
          },
        }),
      }),
    }),
  },
  supabaseAdmin: null,
}))

const { getArEnabled, _resetArEnabledCache } = await import('./flags')

beforeEach(() => {
  _resetArEnabledCache()
  state.response = { data: null, error: null }
  state.reject = false
  state.calls = 0
})

describe('getArEnabled', () => {
  it('true when the stored value is true or "true"', async () => {
    state.response = { data: { value: true }, error: null }
    expect(await getArEnabled()).toBe(true)
    _resetArEnabledCache()
    state.response = { data: { value: 'true' }, error: null }
    expect(await getArEnabled()).toBe(true)
  })
  it('false when the stored value is false', async () => {
    state.response = { data: { value: false }, error: null }
    expect(await getArEnabled()).toBe(false)
  })
  it('false when the stored value is a garbage non-boolean string', async () => {
    state.response = { data: { value: 'yes' }, error: null }
    expect(await getArEnabled()).toBe(false)
  })
  it('true when the key is missing (PGRST116-style error)', async () => {
    state.response = { data: null, error: { code: 'PGRST116' } }
    expect(await getArEnabled()).toBe(true)
  })
  it('true when the query rejects (fail-open)', async () => {
    state.reject = true
    expect(await getArEnabled()).toBe(true)
  })
  it('caches: repeated calls hit supabase once', async () => {
    state.response = { data: { value: false }, error: null }
    await Promise.all([getArEnabled(), getArEnabled(), getArEnabled()])
    expect(state.calls).toBe(1)
  })
})
