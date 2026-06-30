import { describe, it, expect } from 'vitest'
import { maskToRotatedRect, maskToQuad } from './geometry'
import { makeTiltedRectMask, makeRectWithExtra } from '../../test/images'

describe('maskToRotatedRect', () => {
  it('finds an upright rectangle', () => {
    const mask = makeTiltedRectMask(200, 200, 120, 80, 0)
    const r = maskToRotatedRect(mask, 200, 200)
    expect(r.cx).toBeCloseTo(100, 0)
    expect(r.cy).toBeCloseTo(100, 0)
    expect(Math.abs(r.angleDeg)).toBeLessThan(1)
    expect(r.width).toBeGreaterThan(110)
    expect(r.height).toBeGreaterThan(72)
  })
  it('recovers a tilt angle', () => {
    const mask = makeTiltedRectMask(240, 240, 140, 90, 12)
    const r = maskToRotatedRect(mask, 240, 240)
    // PCA major axis aligns with the long side; angle magnitude near 12
    expect(Math.abs(Math.abs(r.angleDeg) - 12)).toBeLessThan(3)
  })
  it('returns full frame for an empty mask', () => {
    const r = maskToRotatedRect(new Uint8Array(100 * 100), 100, 100)
    expect(r.width).toBe(100)
    expect(r.height).toBe(100)
  })

  it('fits the canvas edges tightly, not the interior spread', () => {
    // Filled rect 160x100 — the tight box should recover those extents closely.
    const mask = makeTiltedRectMask(260, 200, 160, 100, 0)
    const r = maskToRotatedRect(mask, 260, 200)
    expect(r.cx).toBeCloseTo(130, 0)
    expect(r.cy).toBeCloseTo(100, 0)
    expect(r.width).toBeGreaterThan(150)
    expect(r.width).toBeLessThan(170)
    expect(r.height).toBeGreaterThan(92)
    expect(r.height).toBeLessThan(108)
  })

  it('reports tilt as a minimal straightening angle in (-45, 45]', () => {
    const mask = makeTiltedRectMask(300, 300, 180, 70, 35)
    const r = maskToRotatedRect(mask, 300, 300)
    expect(Math.abs(r.angleDeg)).toBeLessThanOrEqual(45)
    expect(Math.abs(Math.abs(r.angleDeg) - 35)).toBeLessThan(3)
    // Long edge stays the width after normalisation.
    expect(r.width).toBeGreaterThan(r.height)
  })
})

describe('maskToQuad', () => {
  it('returns the four canvas corners as normalized fractions', () => {
    // 160x100 rect centred in 260x200 → corners at x∈[50,210], y∈[50,150].
    const mask = makeTiltedRectMask(260, 200, 160, 100, 0)
    const q = maskToQuad(mask, 260, 200, 127, 0) // no expansion → raw corners
    expect(q.tl.x).toBeCloseTo(50 / 260, 1)
    expect(q.tl.y).toBeCloseTo(50 / 200, 1)
    expect(q.br.x).toBeCloseTo(210 / 260, 1)
    expect(q.br.y).toBeCloseTo(150 / 200, 1)
  })

  it('expands outward by default so the auto-crop does not eat into the canvas', () => {
    const mask = makeTiltedRectMask(260, 200, 160, 100, 0)
    const q = maskToQuad(mask, 260, 200) // default margin
    expect(q.tl.x).toBeLessThan(50 / 260)   // pushed left of the detected edge
    expect(q.tl.y).toBeLessThan(50 / 200)   // pushed above
    expect(q.br.x).toBeGreaterThan(210 / 260) // pushed right
    expect(q.br.y).toBeGreaterThan(150 / 200) // pushed below
  })

  it('snaps a frame-filling canvas to the full frame (no needless crop)', () => {
    const mask = makeTiltedRectMask(200, 200, 196, 196, 0) // canvas bleeds to the edges
    const q = maskToQuad(mask, 200, 200) // default expand + snap
    expect(q.tl.x).toBe(0); expect(q.tl.y).toBe(0)
    expect(q.br.x).toBe(1); expect(q.br.y).toBe(1)
  })

  it('falls back to a near-full quad when the mask is empty', () => {
    const q = maskToQuad(new Uint8Array(100 * 100), 100, 100)
    expect(q.tl.x).toBeCloseTo(0.005, 2) // fullFrameQuad(0.99) — minimal crop
    expect(q.br.x).toBeCloseTo(0.995, 2)
  })

  it('falls back when BiRefNet grabs a tiny interior shape', () => {
    const mask = makeTiltedRectMask(300, 300, 30, 20, 0) // ~0.7% area → degenerate
    const q = maskToQuad(mask, 300, 300)
    expect(q.tl.x).toBeCloseTo(0.005, 2)
    expect(q.br.x).toBeCloseTo(0.995, 2)
  })

  it('ignores a detached wall blob instead of stretching the crop to the image edge', () => {
    // 160x100 canvas centred in 260x200 → real right edge at x=210. A detached bright
    // blob sits in the right margin near the image edge (x∈[235,255]); the naive
    // single-extreme corner pick would slam tr/br out to ~x=255 (≈0.98 → snaps to 1).
    const mask = makeRectWithExtra(260, 200, 160, 100, { x0: 235, x1: 255, y0: 80, y1: 120 })
    const q = maskToQuad(mask, 260, 200, 127, 0) // no expand → isolate the corner pick
    expect(q.tr.x).toBeLessThan(0.85) // hugs the canvas (210/260≈0.81), not the blob
    expect(q.br.x).toBeLessThan(0.85)
    expect(q.tr.x).toBeCloseTo(210 / 260, 1)
  })

  it('ignores scattered mask speckle near the margins', () => {
    // Realistic BiRefNet speckle: a few isolated foreground pixels out in the right /
    // bottom margins. The naive extreme-vertex pick would let the outermost speck
    // define a corner; dropping all but the largest component removes them.
    const mask = makeTiltedRectMask(260, 200, 160, 100, 0) // canvas x∈[50,210]
    for (const [x, y] of [[252, 18], [248, 22], [255, 100], [240, 188]] as const) mask[y * 260 + x] = 255
    const q = maskToQuad(mask, 260, 200, 127, 0)
    expect(q.tr.x).toBeLessThan(0.85)
    expect(q.br.x).toBeLessThan(0.85)
    expect(q.br.y).toBeLessThan(0.9) // bottom speck at y=188 (≈0.94) does not pull br down
  })
})
