import { describe, it, expect } from 'vitest'
import { contentBoundsFromRaw, clampQuadToBounds } from './content'
import { fullFrameQuad } from './quad'

/** Raw RGB buffer: a solid `rgb` rectangle [x0,x1)×[y0,y1) on a white background. */
function rectOnWhite(
  w: number, h: number, x0: number, x1: number, y0: number, y1: number, rgb: [number, number, number],
): Uint8Array {
  const data = new Uint8Array(w * h * 3).fill(255) // white wall
  for (let y = y0; y < y1; y++)
    for (let x = x0; x < x1; x++) {
      const i = (y * w + x) * 3
      data[i] = rgb[0]; data[i + 1] = rgb[1]; data[i + 2] = rgb[2]
    }
  return data
}

describe('contentBoundsFromRaw', () => {
  it('trims the white wall down to the painting on all sides', () => {
    const data = rectOnWhite(100, 100, 20, 80, 15, 85, [200, 20, 30]) // vivid red canvas
    const b = contentBoundsFromRaw(data, 100, 100, 3)
    expect(b.left).toBeCloseTo(0.2, 2)
    expect(b.right).toBeCloseTo(0.8, 2)
    expect(b.top).toBeCloseTo(0.15, 2)
    expect(b.bottom).toBeCloseTo(0.85, 2)
  })

  it('trims only the side that actually has a wall (right)', () => {
    // Canvas fills left/top/bottom to the edge, white wall only on the right (x≥82).
    const data = rectOnWhite(100, 100, 0, 82, 0, 100, [180, 30, 40])
    const b = contentBoundsFromRaw(data, 100, 100, 3)
    expect(b.left).toBe(0)
    expect(b.top).toBe(0)
    expect(b.bottom).toBe(1)
    expect(b.right).toBeCloseTo(0.82, 2)
  })

  it('does not trim a frame-filling vivid painting', () => {
    const data = rectOnWhite(60, 60, 0, 60, 0, 60, [150, 40, 60]) // no wall anywhere
    const b = contentBoundsFromRaw(data, 60, 60, 3)
    expect(b).toEqual({ left: 0, right: 1, top: 0, bottom: 1 })
  })

  it('caps the trim and leaves a tiny off-centre subject untouched on the capped sides', () => {
    // Mostly white with a small dot: every border line reads as wall, so each side
    // scans to the 30% cap and is left untrimmed rather than collapsing the box.
    const data = rectOnWhite(100, 100, 48, 52, 48, 52, [10, 200, 30])
    const b = contentBoundsFromRaw(data, 100, 100, 3)
    expect(b).toEqual({ left: 0, right: 1, top: 0, bottom: 1 })
  })

  it('does not mistake a pale-but-saturated colour for wall', () => {
    // Pale salmon (high lightness, moderate saturation) is artwork, not wall.
    const data = rectOnWhite(100, 100, 25, 75, 25, 75, [245, 170, 165])
    const b = contentBoundsFromRaw(data, 100, 100, 3)
    expect(b.left).toBeCloseTo(0.25, 2)
    expect(b.right).toBeCloseTo(0.75, 2)
  })
})

describe('clampQuadToBounds', () => {
  it('pulls overshooting corners onto the content box, keeps inner corners', () => {
    const full = fullFrameQuad(1) // corners at 0/1
    const b = { left: 0.05, right: 0.8, top: 0, bottom: 1 }
    const q = clampQuadToBounds(full, b)
    expect(q.tr.x).toBeCloseTo(0.8, 5) // pulled in from 1.0
    expect(q.br.x).toBeCloseTo(0.8, 5)
    expect(q.tl.x).toBeCloseTo(0.05, 5) // pulled in from 0
    expect(q.tl.y).toBe(0) // top bound is the edge → unchanged
  })
})
