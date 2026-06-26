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
})
