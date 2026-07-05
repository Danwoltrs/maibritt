import { describe, it, expect } from 'vitest'
import sharp from 'sharp'
import { makeShadow } from './shadows'

describe('shadow helpers', () => {
  it('makeShadow produces a blurred RGBA larger than the rect', async () => {
    const { buffer, margin } = await makeShadow(100, 80, 8, 0.4)
    const meta = await sharp(buffer).metadata()
    expect(margin).toBeGreaterThan(0)
    expect(meta.width!).toBe(100 + margin * 2)
    expect(meta.hasAlpha).toBe(true)
  })
})
