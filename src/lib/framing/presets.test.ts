import { describe, it, expect } from 'vitest'
import { FRAME_PRESETS, defaultPresetForCategory, isEnhanceable } from './presets'

describe('frame presets', () => {
  it('defaults painting to the oak floater', () => {
    expect(defaultPresetForCategory('painting')).toBe('oak-floater')
  })
  it('defaults engraving to the oak mat', () => {
    expect(defaultPresetForCategory('engraving')).toBe('oak-mat')
  })
  it('every default key exists in FRAME_PRESETS', () => {
    for (const cat of ['painting', 'engraving', 'mixed-media']) {
      expect(FRAME_PRESETS[defaultPresetForCategory(cat)]).toBeDefined()
    }
  })
  it('hides enhance for non-flat media', () => {
    expect(isEnhanceable('painting')).toBe(true)
    expect(isEnhanceable('sculpture')).toBe(false)
    expect(isEnhanceable('video')).toBe(false)
  })
})
