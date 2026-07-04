import { describe, it, expect } from 'vitest'
import sharp from 'sharp'
import { colorStats, colorDelta } from './colorstats'
import { matchColors } from './colormatch'

const solid = (r: number, g: number, b: number, w = 32, h = 32) =>
  sharp({ create: { width: w, height: h, channels: 3, background: { r, g, b } } }).png().toBuffer()

// A saturated multi-band field (so saturation is meaningfully > 0 and driftable).
async function field(w = 64, h = 64): Promise<Buffer> {
  const raw = Buffer.alloc(w * h * 3)
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const p = (y * w + x) * 3
    const band = Math.floor((x / w) * 3)
    const [r, g, b] = band === 0 ? [40, 160, 50] : band === 1 ? [190, 40, 40] : [40, 60, 180]
    raw[p] = r; raw[p + 1] = g; raw[p + 2] = b
  }
  return sharp(raw, { raw: { width: w, height: h, channels: 3 } }).png().toBuffer()
}

describe('colorStats', () => {
  it('reports per-channel means and mean saturation of a solid colour', async () => {
    const s = await colorStats(await solid(200, 100, 50))
    expect(s.means[0]).toBeCloseTo(200, 0)
    expect(s.means[1]).toBeCloseTo(100, 0)
    expect(s.means[2]).toBeCloseTo(50, 0)
    // sat = (max-min)/max = (200-50)/200 = 0.75
    expect(s.sat).toBeCloseTo(0.75, 2)
  })
})

describe('colorDelta', () => {
  it('reports ~zero drift and withinTolerance for an identical image', async () => {
    const img = await field()
    const d = await colorDelta(img, img)
    expect(d.satPct).toBeCloseTo(0, 1)
    expect(Math.max(...d.meanDeltas.map(Math.abs))).toBeLessThan(0.5)
    expect(d.withinTolerance).toBe(true)
  })

  it('flags a desaturated / channel-collapsed image as OUT of tolerance', async () => {
    const ref = await field()
    const { data, info } = await sharp(ref).removeAlpha().raw().toBuffer({ resolveWithObject: true })
    const drift = Buffer.from(data)
    for (let i = 0; i < drift.length; i += info.channels) {
      const lum = 0.3 * drift[i] + 0.59 * drift[i + 1] + 0.11 * drift[i + 2]
      drift[i] = Math.min(255, drift[i] * 0.8 + lum * 0.2)
      drift[i + 1] = Math.min(255, drift[i + 1] * 0.55 + lum * 0.3) // collapse green
      drift[i + 2] = Math.min(255, drift[i + 2] * 0.8 + lum * 0.2)
    }
    const driftBuf = await sharp(drift, { raw: { width: info.width, height: info.height, channels: info.channels as 3 } }).png().toBuffer()
    const d = await colorDelta(ref, driftBuf)
    expect(d.withinTolerance).toBe(false)
  })

  it('confirms matchColors brings a drifted image BACK within tolerance (verifies the colour lock)', async () => {
    const ref = await field()
    const { data, info } = await sharp(ref).removeAlpha().raw().toBuffer({ resolveWithObject: true })
    const drift = Buffer.from(data)
    for (let i = 0; i < drift.length; i += info.channels) {
      const lum = 0.3 * drift[i] + 0.59 * drift[i + 1] + 0.11 * drift[i + 2]
      drift[i] = Math.min(255, drift[i] * 0.8 + lum * 0.2)
      drift[i + 1] = Math.min(255, drift[i + 1] * 0.55 + lum * 0.3)
      drift[i + 2] = Math.min(255, drift[i + 2] * 0.8 + lum * 0.2)
    }
    const driftBuf = await sharp(drift, { raw: { width: info.width, height: info.height, channels: info.channels as 3 } }).png().toBuffer()
    const locked = await matchColors(ref, driftBuf)
    const d = await colorDelta(ref, locked)
    expect(d.withinTolerance).toBe(true)
  })
})
