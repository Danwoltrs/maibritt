import { describe, it, expect } from 'vitest'
import {
  buildArtworkModel, hexToLinearRgb,
  CANVAS_DEPTH_M, FRAME_DEPTH_M, GAP_FRAC,
} from './geometry'

function bounds(positions: number[]) {
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity]
  for (let i = 0; i < positions.length; i += 3) {
    for (let a = 0; a < 3; a++) {
      min[a] = Math.min(min[a], positions[i + a])
      max[a] = Math.max(max[a], positions[i + a])
    }
  }
  return { min, max }
}

describe('buildArtworkModel', () => {
  // 185 cm tall x 285 cm wide painting
  const m = buildArtworkModel(285, 185)
  const longEdge = 2.85

  it('sizes the painting face to true meters', () => {
    const { min, max } = bounds(m.painting.positions)
    expect(max[0] - min[0]).toBeCloseTo(2.85, 3)  // width along X
    expect(max[1] - min[1]).toBeCloseTo(1.85, 3)  // height along Y
    expect(m.painting.quadCount).toBe(1)
    expect(m.painting.uvs).toHaveLength(8)
  })

  it('painting face sits at the canvas front, recessed inside the frame', () => {
    const { min, max } = bounds(m.painting.positions)
    expect(min[2]).toBeCloseTo(CANVAS_DEPTH_M, 4)
    expect(max[2]).toBeCloseTo(CANVAS_DEPTH_M, 4)
    expect(CANVAS_DEPTH_M).toBeLessThan(FRAME_DEPTH_M)
  })

  it('outer frame adds gap + frame width on every side', () => {
    const fw = 0.022 * longEdge, gap = GAP_FRAC * longEdge
    expect(m.outerWidthM).toBeCloseTo(2.85 + 2 * (gap + fw), 3)
    expect(m.outerHeightM).toBeCloseTo(1.85 + 2 * (gap + fw), 3)
    const { min, max } = bounds(m.frame.positions)
    expect(max[0] - min[0]).toBeCloseTo(m.outerWidthM, 3)
    expect(min[2]).toBeCloseTo(0, 4)          // back flush with the wall
    expect(max[2]).toBeCloseTo(FRAME_DEPTH_M, 4)
  })

  it('mesh data is consistent quad soup', () => {
    for (const mesh of [m.painting, m.canvas, m.frame]) {
      expect(mesh.positions.length).toBe(mesh.quadCount * 4 * 3)
      expect(mesh.normals.length).toBe(mesh.positions.length)
      // normals are unit length
      for (let i = 0; i < mesh.normals.length; i += 3) {
        const len = Math.hypot(mesh.normals[i], mesh.normals[i + 1], mesh.normals[i + 2])
        expect(len).toBeCloseTo(1, 5)
      }
    }
    expect(m.canvas.quadCount).toBe(5)   // box minus front face
    expect(m.frame.quadCount).toBe(24)   // 4 strips x 6 faces
  })
})

describe('hexToLinearRgb', () => {
  it('converts black/white exactly and midtones monotonically', () => {
    expect(hexToLinearRgb('#000000')).toEqual([0, 0, 0])
    expect(hexToLinearRgb('#FFFFFF').every(v => Math.abs(v - 1) < 1e-6)).toBe(true)
    const [r] = hexToLinearRgb('#C6A678')
    expect(r).toBeGreaterThan(0.3)
    expect(r).toBeLessThan(0.7)
  })
})
