import { describe, it, expect } from 'vitest'
import sharp from 'sharp'
import { autoColorCorrect } from './color'

describe('autoColorCorrect', () => {
  it('reduces a blue color cast (channel means converge)', async () => {
    // Grayish image pushed blue: R<G<B.
    const img = await sharp({ create: { width: 100, height: 100, channels: 3, background: { r: 120, g: 140, b: 180 } } }).png().toBuffer()
    const before = (await sharp(img).stats()).channels
    const out = await autoColorCorrect(img)
    const after = (await sharp(out).stats()).channels
    const spread = (c: any[]) => Math.max(c[0].mean, c[1].mean, c[2].mean) - Math.min(c[0].mean, c[1].mean, c[2].mean)
    expect(spread(after)).toBeLessThan(spread(before))
  })
})
