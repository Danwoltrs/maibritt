import { describe, it, expect } from 'vitest'
import sharp from 'sharp'
import { enhanceToFramed } from './pipeline'
import { colorDelta } from './colorstats'

// Realistic studio photo: a saturated multi-hue canvas on a bright near-white wall,
// with a horizontal wave ripple — the case the feature exists for.
async function studioPhoto(W = 500, H = 380): Promise<Buffer> {
  const raw = Buffer.alloc(W * H * 3)
  const mx = Math.floor(W * 0.16), my = Math.floor(H * 0.16)
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const p = (y * W + x) * 3
    const inCanvas = x >= mx && x < W - mx && y >= my && y < H - my
    if (!inCanvas) { raw[p] = 251; raw[p + 1] = 250; raw[p + 2] = 248; continue }
    const fx = (x - mx) / (W - 2 * mx)
    let r = 40, g = 150, b = 45
    if (fx > 0.3 && fx < 0.45) { r = 190; g = 40; b = 40 }
    if (fx > 0.6 && fx < 0.75) { r = 40; g = 60; b = 180 }
    const wave = 1 + 0.18 * Math.sin((x / W) * Math.PI * 2 * 12)
    raw[p] = Math.min(255, r * wave); raw[p + 1] = Math.min(255, g * wave); raw[p + 2] = Math.min(255, b * wave)
  }
  return sharp(raw, { raw: { width: W, height: H, channels: 3 } }).png().toBuffer()
}

// The default "AI Stretch": 4-corner warp + colour-safe de-wave (route sends flatten:true).
describe('default enhance acceptance (crop + de-wave)', () => {
  it('keeps saturation <2% and per-channel mean <3 levels vs the geometry-only crop', async () => {
    const photo = await studioPhoto()
    // A slightly keystoned crop onto the canvas (mimics the corner tool).
    const quad = {
      tl: { x: 0.17, y: 0.17 }, tr: { x: 0.84, y: 0.155 },
      br: { x: 0.845, y: 0.85 }, bl: { x: 0.16, y: 0.84 },
    }
    const { enhanced, cropped } = await enhanceToFramed(photo, quad, 'oak-floater', { flatten: true })
    // Compare de-wave output to the geometry-only crop so crop/framing is held constant;
    // the delta is purely the de-wave's colour effect.
    const d = await colorDelta(cropped, enhanced)
    expect(Math.abs(d.satPct)).toBeLessThan(2)
    expect(Math.max(...d.meanDeltas.map(Math.abs))).toBeLessThan(3)
  })

  it('produces opaque RGB (no alpha) so no white margin can ever enter', async () => {
    const photo = await studioPhoto()
    const quad = { tl: { x: 0.17, y: 0.17 }, tr: { x: 0.84, y: 0.16 }, br: { x: 0.84, y: 0.84 }, bl: { x: 0.16, y: 0.84 } }
    const { enhanced, cropped } = await enhanceToFramed(photo, quad, 'oak-floater', { flatten: true })
    expect((await sharp(enhanced).metadata()).channels).toBe(3)
    expect((await sharp(cropped).metadata()).channels).toBe(3)
  })

  it('is not a passthrough — the de-wave changes the pixels', async () => {
    const photo = await studioPhoto()
    const quad = { tl: { x: 0.17, y: 0.17 }, tr: { x: 0.84, y: 0.16 }, br: { x: 0.84, y: 0.84 }, bl: { x: 0.16, y: 0.84 } }
    const { enhanced, cropped } = await enhanceToFramed(photo, quad, 'oak-floater', { flatten: true })
    expect(enhanced.equals(cropped)).toBe(false)
  })
})
