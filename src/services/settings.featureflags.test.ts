import { describe, it, expect, vi, beforeEach } from 'vitest'

const state = vi.hoisted(() => ({
  rows: [] as { key: string; value: unknown }[],
  selectError: null as unknown,
  upserts: [] as { key: string; value: unknown }[],
}))

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        in: async () => ({ data: state.rows, error: state.selectError }),
      }),
      upsert: async (row: { key: string; value: unknown }) => {
        state.upserts.push(row)
        return { error: null }
      },
    }),
  },
  supabaseAdmin: null,
}))

const { SettingsService } = await import('./settings.service')

beforeEach(() => {
  state.rows = []
  state.selectError = null
  state.upserts = []
})

describe('getFeatureFlags', () => {
  it('returns defaults when no rows exist (ar on, posts off)', async () => {
    expect(await SettingsService.getFeatureFlags()).toEqual({
      arEnabled: true,
      userPostsEnabled: false,
    })
  })
  it('parses stored booleans and string booleans', async () => {
    state.rows = [
      { key: 'ar_enabled', value: false },
      { key: 'user_posts_enabled', value: 'true' },
    ]
    expect(await SettingsService.getFeatureFlags()).toEqual({
      arEnabled: false,
      userPostsEnabled: true,
    })
  })
  it('returns defaults on query error (fail-open)', async () => {
    state.selectError = { message: 'boom' }
    expect(await SettingsService.getFeatureFlags()).toEqual({
      arEnabled: true,
      userPostsEnabled: false,
    })
  })
})

describe('updateFeatureFlags', () => {
  it('upserts only the provided fields', async () => {
    await SettingsService.updateFeatureFlags({ arEnabled: false })
    expect(state.upserts).toEqual([{ key: 'ar_enabled', value: false }])
  })
  it('upserts both fields when both provided', async () => {
    await SettingsService.updateFeatureFlags({ arEnabled: true, userPostsEnabled: true })
    expect(state.upserts).toEqual([
      { key: 'ar_enabled', value: true },
      { key: 'user_posts_enabled', value: true },
    ])
  })
})
