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
})
