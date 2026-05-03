import { describe, it, expect, beforeEach } from 'vitest'
import { saveDraft, loadDraft, clearDraft, DRAFT_KEY } from './draftStorage'
import type { ArtworkDetails, CommonMetadata, ApplyToAll } from './types'

const sampleDetails: Record<number, ArtworkDetails> = {
  0: {
    titlePt: 'Obra Um', titleEn: 'Work One',
    mediumPt: '', mediumEn: '', dimensions: '',
    descriptionPt: '', descriptionEn: '', featured: false,
  },
}
const sampleCommon: CommonMetadata = { year: 2026, category: 'painting' }
const sampleApply: ApplyToAll = { category: true, year: true }

describe('draftStorage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('round-trips a saved draft', () => {
    saveDraft({
      commonMeta: sampleCommon,
      applyToAll: sampleApply,
      artworkDetails: sampleDetails,
      fileHints: [{ name: 'a.jpg', size: 100 }],
    })
    const loaded = loadDraft()
    expect(loaded).not.toBeNull()
    expect(loaded?.artworkDetails[0].titleEn).toBe('Work One')
    expect(loaded?.fileHints[0].name).toBe('a.jpg')
  })

  it('returns null when no draft exists', () => {
    expect(loadDraft()).toBeNull()
  })

  it('returns null when draft is older than 7 days', () => {
    const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
    localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({
        savedAt: eightDaysAgo,
        commonMeta: sampleCommon,
        applyToAll: sampleApply,
        artworkDetails: sampleDetails,
        fileHints: [],
      })
    )
    expect(loadDraft()).toBeNull()
  })

  it('clearDraft removes the entry', () => {
    saveDraft({
      commonMeta: sampleCommon,
      applyToAll: sampleApply,
      artworkDetails: sampleDetails,
      fileHints: [],
    })
    clearDraft()
    expect(loadDraft()).toBeNull()
  })

  it('returns null when stored JSON is corrupt', () => {
    localStorage.setItem(DRAFT_KEY, '{not json')
    expect(loadDraft()).toBeNull()
  })
})

describe('draftHasContent', () => {
  it('returns false for null', async () => {
    const { draftHasContent } = await import('./draftStorage')
    expect(draftHasContent(null)).toBe(false)
  })

  it('returns true when at least one artwork has a title', async () => {
    const { draftHasContent } = await import('./draftStorage')
    expect(
      draftHasContent({
        savedAt: new Date().toISOString(),
        commonMeta: {},
        applyToAll: { category: false, year: false },
        artworkDetails: {
          0: {
            titlePt: '', titleEn: 'Hello',
            mediumPt: '', mediumEn: '', dimensions: '',
            descriptionPt: '', descriptionEn: '', featured: false,
          },
        },
        fileHints: [],
      })
    ).toBe(true)
  })

  it('returns false when all artworks are empty', async () => {
    const { draftHasContent } = await import('./draftStorage')
    expect(
      draftHasContent({
        savedAt: new Date().toISOString(),
        commonMeta: {},
        applyToAll: { category: false, year: false },
        artworkDetails: {
          0: {
            titlePt: '', titleEn: '',
            mediumPt: '', mediumEn: '', dimensions: '',
            descriptionPt: '', descriptionEn: '', featured: false,
          },
        },
        fileHints: [],
      })
    ).toBe(false)
  })
})
