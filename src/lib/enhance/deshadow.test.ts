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

  it('default de-wave keeps saturation <2% and per-channel mean <3 levels (colour-safe by construction)', async () => {
    // A realistic case: saturated multi-hue canvas inside a BRIGHT near-white wall
    // margin, with a horizontal wave ripple. The bright margin is what pushes the
    // flat-field mean off (the failing condition E4 measured ~5 levels).
    const W = 400, H = 300, raw = Buffer.alloc(W * H * 3)
    const mx = Math.floor(W * 0.15), my = Math.floor(H * 0.15)
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const p = (y * W + x) * 3
      const inCanvas = x >= mx && x < W - mx && y >= my && y < H - my
      if (!inCanvas) { raw[p] = 250; raw[p + 1] = 249; raw[p + 2] = 248; continue }
      const fx = (x - mx) / (W - 2 * mx)
      let r = 40, g = 150, b = 45
      if (fx > 0.3 && fx < 0.45) { r = 190; g = 40; b = 40 }
      if (fx > 0.6 && fx < 0.75) { r = 40; g = 60; b = 180 }
      const wave = 1 + 0.18 * Math.sin((x / W) * Math.PI * 2 * 12)
      raw[p] = Math.min(255, r * wave); raw[p + 1] = Math.min(255, g * wave); raw[p + 2] = Math.min(255, b * wave)
    }
    const img = await sharp(raw, { raw: { width: W, height: H, channels: 3 } }).png().toBuffer()
    // The pipeline's default de-wave dials (see pipeline.ts).
    const out = await flattenToTaut(img, { strength: 0.6, minGain: 0.9, maxGain: 1.12 })

    const stat = async (buf: Buffer) => {
      const { data, info } = await sharp(buf).removeAlpha().raw().toBuffer({ resolveWithObject: true })
      let means = [0, 0, 0], satSum = 0
      const n = info.width * info.height
      for (let i = 0; i < data.length; i += info.channels) {
        const r = data[i], g = data[i + 1], b = data[i + 2]
        means[0] += r; means[1] += g; means[2] += b
        const max = Math.max(r, g, b), min = Math.min(r, g, b)
        satSum += max === 0 ? 0 : (max - min) / max
      }
      return { means: means.map(m => m / n), sat: satSum / n }
    }

    const before = await stat(img), after = await stat(out)
    const satPct = Math.abs(after.sat - before.sat) / before.sat * 100
    expect(satPct).toBeLessThan(2)
    for (let c = 0; c < 3; c++) {
      expect(Math.abs(after.means[c] - before.means[c])).toBeLessThan(3)
    }
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
