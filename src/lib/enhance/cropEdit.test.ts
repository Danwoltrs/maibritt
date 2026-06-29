import { describe, it, expect } from 'vitest'
import { moveRect, resizeRect, fullFrameRect } from './cropEdit'
import type { RotatedRect } from './types'

const base: RotatedRect = { cx: 100, cy: 100, width: 80, height: 60, angleDeg: 0 }

describe('moveRect', () => {
  it('translates the centre, leaving size/angle untouched', () => {
    const r = moveRect(base, 10, -5)
    expect(r.cx).toBe(110)
    expect(r.cy).toBe(95)
    expect(r.width).toBe(80)
    expect(r.height).toBe(60)
    expect(r.angleDeg).toBe(0)
  })
})

describe('resizeRect (axis-aligned)', () => {
  it('east handle grows width and keeps the west edge fixed', () => {
    const westBefore = base.cx - base.width / 2
    const r = resizeRect(base, 'e', 20, 0)
    expect(r.width).toBe(100)
    expect(r.cx - r.width / 2).toBeCloseTo(westBefore, 6) // west edge unmoved
    expect(r.height).toBe(60) // height locked for an edge handle
  })

  it('west handle dragged left grows width and keeps the east edge fixed', () => {
    const eastBefore = base.cx + base.width / 2
    const r = resizeRect(base, 'w', -20, 0)
    expect(r.width).toBe(100)
    expect(r.cx + r.width / 2).toBeCloseTo(eastBefore, 6)
  })

  it('corner handle changes both dimensions and keeps the opposite corner fixed', () => {
    const oppX = base.cx - base.width / 2 // sw corner x for an 'se' drag
    const oppY = base.cy - base.height / 2
    const r = resizeRect(base, 'se', 20, 10)
    expect(r.width).toBe(100)
    expect(r.height).toBe(70)
    expect(r.cx - r.width / 2).toBeCloseTo(oppX, 6)
    expect(r.cy - r.height / 2).toBeCloseTo(oppY, 6)
  })

  it('clamps to the minimum size and never inverts', () => {
    const r = resizeRect(base, 'e', -200, 0, 24)
    expect(r.width).toBe(24)
    expect(r.width).toBeGreaterThan(0)
  })
})

describe('resizeRect (rotated)', () => {
  it('keeps the opposite corner fixed even when tilted', () => {
    const tilted: RotatedRect = { ...base, angleDeg: 30 }
    const a = (30 * Math.PI) / 180
    const cos = Math.cos(a), sin = Math.sin(a)
    // World coords of the NW corner (opposite to an 'se' drag): local (-w/2, -h/2)
    const lu = -tilted.width / 2, lv = -tilted.height / 2
    const oppX = tilted.cx + lu * cos - lv * sin
    const oppY = tilted.cy + lu * sin + lv * cos

    const r = resizeRect(tilted, 'se', 15, 8)
    const lu2 = -r.width / 2, lv2 = -r.height / 2
    const oppX2 = r.cx + lu2 * cos - lv2 * sin
    const oppY2 = r.cy + lu2 * sin + lv2 * cos

    expect(oppX2).toBeCloseTo(oppX, 4)
    expect(oppY2).toBeCloseTo(oppY, 4)
  })
})

describe('fullFrameRect', () => {
  it('centres a box of the requested coverage', () => {
    const r = fullFrameRect(400, 300, 0.9)
    expect(r.cx).toBe(200)
    expect(r.cy).toBe(150)
    expect(r.width).toBe(360)
    expect(r.height).toBe(270)
    expect(r.angleDeg).toBe(0)
  })
})
