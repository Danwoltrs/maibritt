import { describe, it, expect } from 'vitest'
import sharp from 'sharp'
import { solveHomography, applyHomography, outputSize, warpToRect } from './warp'
import { fullFrameQuad } from './quad'
import type { Pt, Quad } from './types'

describe('solveHomography / applyHomography', () => {
  it('maps each source corner exactly onto its destination', () => {
    const from: Pt[] = [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }, { x: 0, y: 10 }]
    const to: Pt[] = [{ x: 2, y: 1 }, { x: 9, y: 0 }, { x: 11, y: 8 }, { x: 1, y: 9 }] // a trapezoid
    const H = solveHomography(from, to)
    for (let i = 0; i < 4; i++) {
      const p = applyHomography(H, from[i].x, from[i].y)
      expect(p.x).toBeCloseTo(to[i].x, 4)
      expect(p.y).toBeCloseTo(to[i].y, 4)
    }
  })
})

describe('outputSize', () => {
  it('uses the longer of opposing edges', () => {
    const corners: Pt[] = [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 120, y: 60 }, { x: 0, y: 50 }]
    const { w, h } = outputSize(corners)
    // top edge=100, bottom edge=120 → w=120; left edge=50, right edge=hypot(20,60)=63 → h=63
    expect(w).toBe(120)
    expect(h).toBe(63)
  })
})

async function twoToneLR(w: number, h: number): Promise<Buffer> {
  const raw = Buffer.alloc(w * h * 3)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const p = (y * w + x) * 3
      if (x < w / 2) { raw[p] = 200; raw[p + 1] = 0; raw[p + 2] = 0 }      // left red
      else { raw[p] = 0; raw[p + 1] = 0; raw[p + 2] = 200 }               // right blue
    }
  }
  return sharp(raw, { raw: { width: w, height: h, channels: 3 } }).png().toBuffer()
}

describe('warpToRect', () => {
  it('identity full-frame quad reproduces the image size', async () => {
    const img = await twoToneLR(80, 60)
    const out = await warpToRect(img, fullFrameQuad(1))
    const m = await sharp(out).metadata()
    expect(m.width).toBe(80)
    expect(m.height).toBe(60)
  })

  it('cropping to the left half yields only the red region', async () => {
    const img = await twoToneLR(100, 100)
    const leftHalf: Quad = { tl: { x: 0, y: 0 }, tr: { x: 0.5, y: 0 }, br: { x: 0.5, y: 1 }, bl: { x: 0, y: 1 } }
    const out = await warpToRect(img, leftHalf)
    const { data, info } = await sharp(out).removeAlpha().raw().toBuffer({ resolveWithObject: true })
    // Sample the centre pixel — should be red, not blue.
    const cx = Math.floor(info.width / 2), cy = Math.floor(info.height / 2)
    const p = (cy * info.width + cx) * 3
    expect(data[p]).toBeGreaterThan(120)      // R high
    expect(data[p + 2]).toBeLessThan(80)      // B low
    expect(info.width).toBeCloseTo(50, -1)    // ~half width
  })
})
