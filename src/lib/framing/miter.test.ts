import { describe, it, expect } from 'vitest'
import path from 'path'
import sharp from 'sharp'
import { miteredFrame } from './miter'

const TEX = path.join(process.cwd(), 'public/frames/real-oak.jpg')

describe('miteredFrame', () => {
  it('renders an opaque ring with a transparent centre at exact size', async () => {
    const buf = await miteredFrame(TEX, 400, 300, 24)
    const meta = await sharp(buf).metadata()
    expect(meta.width).toBe(400)
    expect(meta.height).toBe(300)
    const raw = await sharp(buf).raw().toBuffer()
    const alpha = (x: number, y: number) => raw[(y * 400 + x) * 4 + 3]
    expect(alpha(200, 150)).toBe(0)    // centre transparent
    expect(alpha(200, 6)).toBe(255)    // top rail opaque
    expect(alpha(6, 150)).toBe(255)    // left rail opaque
    expect(alpha(200, 293)).toBe(255)  // bottom rail opaque
  })

  it('is deterministic (two runs byte-identical)', async () => {
    const a = await miteredFrame(TEX, 300, 220, 16)
    const b = await miteredFrame(TEX, 300, 220, 16)
    expect(Buffer.compare(a, b)).toBe(0)
  })

  it('handles landscape, portrait and tiny thickness', async () => {
    for (const [w, h, t] of [[500, 200, 12], [200, 500, 12], [120, 120, 4]] as const) {
      const meta = await sharp(await miteredFrame(TEX, w, h, t)).metadata()
      expect(meta.width).toBe(w)
      expect(meta.height).toBe(h)
    }
  })
})
