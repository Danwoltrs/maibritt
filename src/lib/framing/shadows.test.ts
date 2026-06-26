import { describe, it, expect } from 'vitest'
import sharp from 'sharp'
import { makeShadow, bevelSvg } from './shadows'

describe('shadow/bevel helpers', () => {
  it('makeShadow produces a blurred RGBA larger than the rect', async () => {
    const { buffer, margin } = await makeShadow(100, 80, 8, 0.4)
    const meta = await sharp(buffer).metadata()
    expect(margin).toBeGreaterThan(0)
    expect(meta.width!).toBe(100 + margin * 2)
    expect(meta.hasAlpha).toBe(true)
  })
  it('bevelSvg renders to the exact size', async () => {
    const svg = bevelSvg(120, 90, 3)
    const meta = await sharp(svg).metadata()
    expect(meta.width).toBe(120)
    expect(meta.height).toBe(90)
  })
})
