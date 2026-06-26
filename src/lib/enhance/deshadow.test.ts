import { describe, it, expect } from 'vitest'
import sharp from 'sharp'
import { flattenToTaut } from './deshadow'
import { makeVerticalGradient } from '../../test/images'

function lumStd(stats: sharp.Stats): number {
  // Average per-channel stdev as a proxy for shading variation.
  return (stats.channels[0].stdev + stats.channels[1].stdev + stats.channels[2].stdev) / 3
}

describe('flattenToTaut', () => {
  it('reduces shading variation across a gradient', async () => {
    const img = await makeVerticalGradient(300, 300)
    const before = lumStd(await sharp(img).stats())
    const out = await flattenToTaut(img)
    const after = lumStd(await sharp(out).stats())
    expect(after).toBeLessThan(before * 0.6) // shading flattened
  })

  it('preserves hue of a tinted region (channel ratios stay close)', async () => {
    // Solid warm tone with a brightness gradient baked in.
    const w = 200, h = 200, raw = Buffer.alloc(w * h * 3)
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const k = 0.5 + 0.5 * (y / h)
      const p = (y * w + x) * 3
      raw[p] = Math.round(200 * k); raw[p + 1] = Math.round(120 * k); raw[p + 2] = Math.round(60 * k)
    }
    const img = await sharp(raw, { raw: { width: w, height: h, channels: 3 } }).png().toBuffer()
    const out = await flattenToTaut(img)
    const s = (await sharp(out).stats()).channels
    // R:G ratio of the original tone is 200:120 ≈ 1.667; should be preserved within tolerance.
    expect(s[0].mean / s[1].mean).toBeCloseTo(200 / 120, 1)
  })
})
