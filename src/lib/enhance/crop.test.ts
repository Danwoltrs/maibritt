import { describe, it, expect } from 'vitest'
import sharp from 'sharp'
import { cropStraighten } from './crop'

/** White tilted rectangle on black — analogous to a painting tilted in frame. */
async function tiltedWhiteRect(w: number, h: number, rw: number, rh: number, angleDeg: number) {
  const a = (angleDeg * Math.PI) / 180, cos = Math.cos(a), sin = Math.sin(a)
  const raw = Buffer.alloc(w * h * 3)
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const dx = x - w / 2, dy = y - h / 2
    const u = dx * cos + dy * sin, v = -dx * sin + dy * cos
    if (Math.abs(u) <= rw / 2 && Math.abs(v) <= rh / 2) {
      const p = (y * w + x) * 3; raw[p] = 255; raw[p + 1] = 255; raw[p + 2] = 255
    }
  }
  return sharp(raw, { raw: { width: w, height: h, channels: 3 } }).png().toBuffer()
}

describe('cropStraighten', () => {
  it('recovers an upright crop close to the rect aspect ratio', async () => {
    const img = await tiltedWhiteRect(240, 240, 140, 90, 12)
    const out = await cropStraighten(img, { cx: 120, cy: 120, width: 140, height: 90, angleDeg: 12 }, 0.02)
    const meta = await sharp(out).metadata()
    expect((meta.width! / meta.height!)).toBeCloseTo(140 / 90, 1)
    // The crop should be mostly white (the painting), not black background.
    const { channels } = await sharp(out).stats()
    expect(channels[0].mean).toBeGreaterThan(180)
  })
})
