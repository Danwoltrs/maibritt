import { describe, it, expect } from 'vitest'
import { shouldShowQuickUploadFab } from './quickUploadFab.logic'

const base = {
  isAuthenticated: true,
  loading: false,
  pathname: '/artworks',
  dialogOpen: false,
  suppressed: false,
}

describe('shouldShowQuickUploadFab', () => {
  it('shows when authenticated, not loading, dialog closed, off the login page', () => {
    expect(shouldShowQuickUploadFab(base)).toBe(true)
  })

  it('is hidden while auth is still loading', () => {
    expect(shouldShowQuickUploadFab({ ...base, loading: true })).toBe(false)
  })

  it('is hidden when not authenticated', () => {
    expect(shouldShowQuickUploadFab({ ...base, isAuthenticated: false })).toBe(false)
  })

  it('is hidden on the login page', () => {
    expect(shouldShowQuickUploadFab({ ...base, pathname: '/login' })).toBe(false)
  })

  it('is hidden while the upload dialog is open', () => {
    expect(shouldShowQuickUploadFab({ ...base, dialogOpen: true })).toBe(false)
  })

  it('tolerates a null pathname', () => {
    expect(shouldShowQuickUploadFab({ ...base, pathname: null })).toBe(true)
  })

  it('is hidden while suppressed (e.g. bulk-action bar showing)', () => {
    expect(shouldShowQuickUploadFab({ ...base, suppressed: true })).toBe(false)
  })
})
