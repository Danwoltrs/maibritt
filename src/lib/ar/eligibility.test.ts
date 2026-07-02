import { describe, it, expect } from 'vitest'
import { qualifiesForAr, arModelHash } from './eligibility'

const base = {
  category: 'painting',
  height_cm: '185.0',
  width_cm: 285,
  images: [{ original: 'o.jpg', display: 'd.webp', thumbnail: 't.webp', enhanced: 'e.png', framePreset: 'walnut-floater' }],
}

describe('qualifiesForAr', () => {
  it('accepts a flat artwork with numeric dimensions, preferring the enhanced image', () => {
    const q = qualifiesForAr(base)
    expect(q).toMatchObject({ ok: true, heightCm: 185, widthCm: 285, imageUrl: 'e.png', presetKey: 'walnut-floater' })
  })
  it('falls back to display and default preset', () => {
    const q = qualifiesForAr({ ...base, images: [{ original: 'o.jpg', display: 'd.webp', thumbnail: 't.webp' }] })
    expect(q).toMatchObject({ ok: true, imageUrl: 'd.webp', presetKey: 'oak-floater' })
  })
  it('rejects missing dimensions, wrong category, no image', () => {
    expect(qualifiesForAr({ ...base, height_cm: null }).ok).toBe(false)
    expect(qualifiesForAr({ ...base, category: 'sculpture' }).ok).toBe(false)
    expect(qualifiesForAr({ ...base, images: [] }).ok).toBe(false)
  })
})

describe('arModelHash', () => {
  const input = { imageUrl: 'e.png', heightCm: 185, widthCm: 285, presetKey: 'oak-floater' }
  it('is 16 hex chars and stable', () => {
    expect(arModelHash(input)).toMatch(/^[0-9a-f]{16}$/)
    expect(arModelHash(input)).toBe(arModelHash({ ...input }))
  })
  it('changes when any input changes', () => {
    expect(arModelHash({ ...input, widthCm: 286 })).not.toBe(arModelHash(input))
    expect(arModelHash({ ...input, imageUrl: 'e2.png' })).not.toBe(arModelHash(input))
  })
})
