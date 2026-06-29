import { describe, it, expect } from 'vitest'
import sharp, { type Stats } from 'sharp'
import { flattenToTaut } from './deshadow'

function lumStd(stats: Stats): number {
  // Average per-channel stdev as a proxy for shading variation.
  return (stats.channels[0].stdev + stats.channels[1].stdev + stats.channels[2].stdev) / 3
}

/** Solid red tone (180,70,60) modulated by a vertical sinusoid — a fake canvas wave. */
async function rippledField(w: number, h: number, periodPx: number, amp: number) {
  const raw = Buffer.alloc(w * h * 3)
  for (let y = 0; y < h; y++) {
    const k = 1 + amp * Math.sin((2 * Math.PI * y) / periodPx)
    for (let x = 0; x < w; x++) {
      const p = (y * w + x) * 3
      raw[p] = Math.min(255, Math.round(180 * k))
      raw[p + 1] = Math.min(255, Math.round(70 * k))
      raw[p + 2] = Math.min(255, Math.round(60 * k))
    }
  }
  return sharp(raw, { raw: { width: w, height: h, channels: 3 } }).png().toBuffer()
}

describe('flattenToTaut (homomorphic, luminance-only)', () => {
  it('removes mid-frequency wave shading', async () => {
    const w = 400, h = 400
    const img = await rippledField(w, h, h * 0.08, 0.18) // wave period = 8% of the edge
    const before = lumStd(await sharp(img).stats())
    const out = await flattenToTaut(img)
    const after = lumStd(await sharp(out).stats())
    expect(after).toBeLessThan(before * 0.6) // wave bands substantially removed
  })

  it('preserves hue and saturation (per-pixel scalar gain)', async () => {
    const img = await rippledField(300, 300, 300 * 0.08, 0.18)
    const out = await flattenToTaut(img)
    const s = (await sharp(out).stats()).channels
    // Original tone 180:70:60 — a scalar per-pixel gain keeps both ratios exactly.
    expect(s[0].mean / s[1].mean).toBeCloseTo(180 / 70, 1)
    expect(s[1].mean / s[2].mean).toBeCloseTo(70 / 60, 1)
  })

  it('preserves the broad intentional tonal arc (does not flatten a low-frequency gradient)', async () => {
    const w = 400, h = 400, raw = Buffer.alloc(w * h * 3)
    for (let y = 0; y < h; y++) {
      const k = 0.7 + 0.3 * (y / h) // smooth full-height ramp = deliberate tonal arc
      for (let x = 0; x < w; x++) {
        const p = (y * w + x) * 3
        raw[p] = Math.round(180 * k); raw[p + 1] = Math.round(70 * k); raw[p + 2] = Math.round(60 * k)
      }
    }
    const img = await sharp(raw, { raw: { width: w, height: h, channels: 3 } }).png().toBuffer()
    const before = lumStd(await sharp(img).stats())
    const out = await flattenToTaut(img)
    const after = lumStd(await sharp(out).stats())
    expect(after).toBeGreaterThan(before * 0.7) // arc largely preserved, not flattened away
  })
})
