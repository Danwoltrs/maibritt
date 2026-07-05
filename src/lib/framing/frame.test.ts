import { describe, it, expect } from 'vitest'
import sharp from 'sharp'
import { composeFrame } from './frame'
import { FRAME_PRESETS } from './presets'

async function redPainting(w: number, h: number) {
  return sharp({ create: { width: w, height: h, channels: 3, background: { r: 200, g: 30, b: 30 } } }).png().toBuffer()
}

describe('composeFrame', () => {
  it('floater output is larger than the painting and preserves the centre pixel', async () => {
    const art = await redPainting(300, 200)
    const out = await composeFrame(art, FRAME_PRESETS['oak-floater'])
    const meta = await sharp(out).metadata()
    expect(meta.width!).toBeGreaterThan(300)
    expect(meta.height!).toBeGreaterThan(200)
    // Centre of the composite must still be the painting's red (face untouched).
    const { data } = await sharp(out).extract({
      left: Math.floor(meta.width! / 2), top: Math.floor(meta.height! / 2), width: 1, height: 1,
    }).raw().toBuffer({ resolveWithObject: true })
    expect(data[0]).toBeGreaterThan(150) // R
    expect(data[1]).toBeLessThan(80)     // G
  })

  it('matted output centres the art inside a lighter mat', async () => {
    const art = await redPainting(200, 260)
    const out = await composeFrame(art, FRAME_PRESETS['oak-mat'])
    const meta = await sharp(out).metadata()
    expect(meta.width!).toBeGreaterThan(200 + 40) // mat + frame added
  })

  it('is deterministic and preserves painting pixels exactly (floater)', async () => {
    const art = await redPainting(320, 240)
    const out1 = await composeFrame(art, FRAME_PRESETS['walnut-floater'])
    const out2 = await composeFrame(art, FRAME_PRESETS['walnut-floater'])
    expect(Buffer.compare(out1, out2)).toBe(0)
    // Pixels just inside the painting bounds must be the exact source red —
    // no bevel/vignette/tint may ever touch the artwork.
    const meta = await sharp(out1).metadata()
    const raw = await sharp(out1).raw().toBuffer()
    const W = meta.width!, ch = meta.channels!
    const ox = (W - 320) / 2, oy = (meta.height! - 240) / 2 // painting is centred
    const at = (x: number, y: number) =>
      [raw[(y * W + x) * ch], raw[(y * W + x) * ch + 1], raw[(y * W + x) * ch + 2]]
    for (const [x, y] of [[ox + 1, oy + 1], [ox + 318, oy + 238], [ox + 160, oy + 120]] as const) {
      expect(at(Math.round(x), Math.round(y))).toEqual([200, 30, 30])
    }
  })

  it('handles extreme landscape aspect', async () => {
    const art = await redPainting(600, 150)
    const meta = await sharp(await composeFrame(art, FRAME_PRESETS['black-floater'])).metadata()
    expect(meta.width!).toBeGreaterThan(600)
    expect(meta.height!).toBeGreaterThan(150)
  })
})
