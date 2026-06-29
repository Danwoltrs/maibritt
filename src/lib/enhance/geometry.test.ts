import { describe, it, expect } from 'vitest'
import { maskToRotatedRect } from './geometry'
import { makeTiltedRectMask } from '../../test/images'

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
