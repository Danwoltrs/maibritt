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

  // A mid-tone source with NO pure-black and NO pure-white pixels, so any 0 or 255
  // in the output must have been INJECTED by an out-of-bounds sample (the failure mode).
  async function midToneGradient(w: number, h: number): Promise<Buffer> {
    const raw = Buffer.alloc(w * h * 3)
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const p = (y * w + x) * 3
        raw[p] = 50 + Math.round((x / w) * 150)      // 50..200
        raw[p + 1] = 60 + Math.round((y / h) * 140)  // 60..200
        raw[p + 2] = 90
      }
    }
    return sharp(raw, { raw: { width: w, height: h, channels: 3 } }).png().toBuffer()
  }

  it('outputs opaque RGB (no alpha channel) so framing cannot composite transparency to white', async () => {
    const img = await midToneGradient(80, 80)
    const out = await warpToRect(img, fullFrameQuad(1))
    const m = await sharp(out).metadata()
    expect(m.channels).toBe(3) // no alpha — a transparent/white pixel is impossible by construction
  })

  it('a degenerate/non-convex quad injects NO white or black (clamps samples to the image edge)', async () => {
    const img = await midToneGradient(80, 80)
    // Bowtie: TL dragged right of TR. Interior maps partly outside [0,1]² — the old
    // code emitted transparent(=white/black); the fix clamps to the nearest edge pixel.
    const bowtie: Quad = { tl: { x: 0.7, y: 0.2 }, tr: { x: 0.3, y: 0.2 }, br: { x: 0.8, y: 0.8 }, bl: { x: 0.2, y: 0.8 } }
    const out = await warpToRect(img, bowtie)
    const { data, info } = await sharp(out).removeAlpha().raw().toBuffer({ resolveWithObject: true })
    let injected = 0
    for (let i = 0; i < data.length; i += info.channels) {
      const r = data[i], g = data[i + 1], b = data[i + 2]
      const isWhite = r >= 250 && g >= 250 && b >= 250
      const isBlack = r <= 5 && g <= 5 && b <= 5 // source min is 50 — pure black can only be injected
      if (isWhite || isBlack) injected++
    }
    expect(injected).toBe(0)
  })
})
