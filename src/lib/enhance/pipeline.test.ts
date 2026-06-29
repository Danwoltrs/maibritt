import { describe, it, expect } from 'vitest'
import sharp from 'sharp'
import { enhanceToFramed } from './pipeline'

async function paintingPhoto(w: number, h: number) {
  // Coloured rectangle with a brightness gradient (fake shadow), on white margin.
  const raw = Buffer.alloc(w * h * 3, 255)
  for (let y = 20; y < h - 20; y++) for (let x = 20; x < w - 20; x++) {
    const k = 0.6 + 0.4 * (y / h), p = (y * w + x) * 3
    raw[p] = Math.round(60 * k); raw[p + 1] = Math.round(140 * k); raw[p + 2] = Math.round(90 * k)
  }
  return sharp(raw, { raw: { width: w, height: h, channels: 3 } }).png().toBuffer()
}

describe('enhanceToFramed', () => {
  it('produces a bare enhanced image and a larger framed image', async () => {
    const photo = await paintingPhoto(320, 240)
    // The painting occupies x∈[20,300], y∈[20,220] → normalized quad of that region.
    const { enhanced, framed } = await enhanceToFramed(
      photo,
      {
        tl: { x: 20 / 320, y: 20 / 240 }, tr: { x: 300 / 320, y: 20 / 240 },
        br: { x: 300 / 320, y: 220 / 240 }, bl: { x: 20 / 320, y: 220 / 240 },
      },
      'oak-floater',
    )
    const em = await sharp(enhanced).metadata()
    const fm = await sharp(framed).metadata()
    expect(em.width!).toBeGreaterThan(200)
    expect(fm.width!).toBeGreaterThan(em.width!) // frame adds margin
    expect(em.format).toBe('png')
  })

  it('default run is geometry-only; the flatten flag (not the default) flattens shading', async () => {
    const photo = await paintingPhoto(400, 400) // has a baked-in vertical brightness gradient
    const quad = {
      tl: { x: 20 / 400, y: 20 / 400 }, tr: { x: 380 / 400, y: 20 / 400 },
      br: { x: 380 / 400, y: 380 / 400 }, bl: { x: 20 / 400, y: 380 / 400 },
    }
    const shadingStdev = async (buf: Buffer) => {
      const c = (await sharp(buf).stats()).channels
      return (c[0].stdev + c[1].stdev + c[2].stdev) / 3
    }
    const def = await enhanceToFramed(photo, quad, 'oak-floater')                    // default: no flatten
    const flat = await enhanceToFramed(photo, quad, 'oak-floater', { flatten: true }) // opt-in flatten
    expect(await shadingStdev(flat.enhanced)).toBeLessThan(await shadingStdev(def.enhanced))
  })
})
