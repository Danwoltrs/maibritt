import { describe, it, expect } from 'vitest'
import sharp from 'sharp'
import { autoColorCorrect } from './color'

/** R:G and G:B mean ratios — a proxy for hue. */
function ratios(channels: { mean: number }[]): [number, number] {
  return [channels[0].mean / channels[1].mean, channels[1].mean / channels[2].mean]
}

describe('autoColorCorrect (hue-preserving exposure)', () => {
  it('preserves channel ratios (hue) on a saturated painting', async () => {
    // Strongly red canvas: R >> G,B. Gray-world WB would read this as a cast and
    // desaturate it — the exact bug we are fixing. We must NOT shift its hue.
    const img = await sharp({ create: { width: 100, height: 100, channels: 3, background: { r: 180, g: 70, b: 60 } } }).png().toBuffer()
    const [rgBefore, gbBefore] = ratios((await sharp(img).stats()).channels)
    const out = await autoColorCorrect(img)
    const [rgAfter, gbAfter] = ratios((await sharp(out).stats()).channels)
    expect(rgAfter).toBeCloseTo(rgBefore, 1) // R:G unchanged → hue preserved
    expect(gbAfter).toBeCloseTo(gbBefore, 1) // G:B unchanged
  })

  it('gently lifts exposure of a dark image, clamped to maxGain', async () => {
    const img = await sharp({ create: { width: 100, height: 100, channels: 3, background: { r: 80, g: 60, b: 40 } } }).png().toBuffer()
    const before = (await sharp(img).stats()).channels[0].mean
    const out = await autoColorCorrect(img, { maxGain: 1.15 })
    const after = (await sharp(out).stats()).channels[0].mean
    const lift = after / before
    expect(lift).toBeGreaterThan(1.0)        // brightened
    expect(lift).toBeLessThanOrEqual(1.16)   // but gently, within maxGain (+rounding)
  })
})
