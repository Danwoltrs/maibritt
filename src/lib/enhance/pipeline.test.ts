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
    const { enhanced, framed } = await enhanceToFramed(
      photo,
      { cx: 160, cy: 120, width: 260, height: 180, angleDeg: 0 },
      'oak-floater',
    )
    const em = await sharp(enhanced).metadata()
    const fm = await sharp(framed).metadata()
    expect(em.width!).toBeGreaterThan(200)
    expect(fm.width!).toBeGreaterThan(em.width!) // frame adds margin
    expect(em.format).toBe('png')
  })
})
