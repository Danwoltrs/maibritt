import { describe, it, expect } from 'vitest'
import sharp from 'sharp'
import { prepareTexture } from './texture'

describe('prepareTexture', () => {
  it('emits a JPEG capped at 2048px from an oversized PNG with alpha', async () => {
    const src = await sharp({
      create: { width: 3000, height: 1500, channels: 4, background: { r: 200, g: 30, b: 30, alpha: 0.5 } },
    }).png().toBuffer()
    const out = await prepareTexture(src)
    const meta = await sharp(Buffer.from(out)).metadata()
    expect(meta.format).toBe('jpeg')
    expect(Math.max(meta.width!, meta.height!)).toBeLessThanOrEqual(2048)
    expect(meta.hasAlpha).toBe(false)
  })
  it('leaves small images unscaled', async () => {
    const src = await sharp({
      create: { width: 640, height: 480, channels: 3, background: { r: 10, g: 120, b: 60 } },
    }).jpeg().toBuffer()
    const out = await prepareTexture(src)
    const meta = await sharp(Buffer.from(out)).metadata()
    expect(meta.width).toBe(640)
    expect(meta.height).toBe(480)
  })
})
