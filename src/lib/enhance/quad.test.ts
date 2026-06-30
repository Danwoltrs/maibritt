import { describe, it, expect } from 'vitest'
import { fullFrameQuad, setCorner, moveQuad, quadArea, isValidQuad, quadPoints, expandQuad } from './quad'
import type { Quad } from './types'

const unit: Quad = { tl: { x: 0, y: 0 }, tr: { x: 1, y: 0 }, br: { x: 1, y: 1 }, bl: { x: 0, y: 1 } }

describe('expandQuad', () => {
  it('scales the quad outward from its centroid', () => {
    const e = expandQuad(fullFrameQuad(0.5), 0.2) // corners 0.25..0.75 → 0.2..0.8
    expect(e.tl.x).toBeCloseTo(0.2, 6)
    expect(e.tl.y).toBeCloseTo(0.2, 6)
    expect(e.br.x).toBeCloseTo(0.8, 6)
    expect(e.br.y).toBeCloseTo(0.8, 6)
  })
  it('clamps to the image bounds', () => {
    const e = expandQuad(fullFrameQuad(0.98), 0.5) // corners 0.01..0.99 → clamp
    expect(e.tl.x).toBe(0)
    expect(e.br.x).toBe(1)
  })
})

describe('fullFrameQuad', () => {
  it('returns the whole image at frac=1', () => {
    expect(fullFrameQuad(1)).toEqual(unit)
  })
  it('insets symmetrically', () => {
    const q = fullFrameQuad(0.8)
    expect(q.tl.x).toBeCloseTo(0.1, 6)
    expect(q.tl.y).toBeCloseTo(0.1, 6)
    expect(q.br.x).toBeCloseTo(0.9, 6)
    expect(q.br.y).toBeCloseTo(0.9, 6)
  })
})

describe('setCorner', () => {
  it('moves one corner and clamps to [0,1]', () => {
    const q = setCorner(unit, 'tl', -0.5, 0.3)
    expect(q.tl).toEqual({ x: 0, y: 0.3 })
    expect(q.tr).toEqual(unit.tr) // others untouched
  })
})

describe('moveQuad', () => {
  it('translates all corners', () => {
    const q = moveQuad(fullFrameQuad(0.5), 0.1, -0.1)
    expect(q.tl).toEqual({ x: 0.35, y: 0.15 })
  })
  it('clamps the shift so no corner leaves the image', () => {
    const q = moveQuad(unit, 0.5, 0.5) // already at edges → no movement possible
    expect(q).toEqual(unit)
  })
})

describe('quadArea', () => {
  it('is 1 for the unit square and 0.25 for a half-size quad', () => {
    expect(quadArea(unit)).toBeCloseTo(1, 6)
    expect(quadArea(fullFrameQuad(0.5))).toBeCloseTo(0.25, 6)
  })
})

describe('isValidQuad', () => {
  it('accepts a convex, reasonably-sized quad', () => {
    expect(isValidQuad(unit)).toBe(true)
    // mild perspective trapezoid
    const trap: Quad = { tl: { x: 0.2, y: 0.1 }, tr: { x: 0.8, y: 0.1 }, br: { x: 0.95, y: 0.9 }, bl: { x: 0.05, y: 0.9 } }
    expect(isValidQuad(trap)).toBe(true)
  })
  it('rejects a tiny quad', () => {
    expect(isValidQuad(fullFrameQuad(0.2))).toBe(false) // area 0.04 < 0.15
  })
  it('rejects a self-intersecting (non-convex) quad', () => {
    const bowtie: Quad = { tl: { x: 0, y: 0 }, tr: { x: 1, y: 1 }, br: { x: 1, y: 0 }, bl: { x: 0, y: 1 } }
    expect(isValidQuad(bowtie, 0.01)).toBe(false)
  })
  it('rejects a degenerate triangle (two coincident corners)', () => {
    const tri: Quad = { tl: { x: 0.1, y: 0.1 }, tr: { x: 0.1, y: 0.1 }, br: { x: 0.9, y: 0.9 }, bl: { x: 0.1, y: 0.9 } }
    expect(isValidQuad(tri, 0.01)).toBe(false)
  })
  it('rejects a mislabeled quad (tl right of tr — e.g. a >45° rotation)', () => {
    const rotated: Quad = { tl: { x: 0.8, y: 0.1 }, tr: { x: 0.2, y: 0.1 }, br: { x: 0.9, y: 0.9 }, bl: { x: 0.1, y: 0.9 } }
    expect(isValidQuad(rotated, 0.01)).toBe(false)
  })
})

describe('quadPoints', () => {
  it('lists corners clockwise from TL', () => {
    expect(quadPoints(unit)).toEqual([unit.tl, unit.tr, unit.br, unit.bl])
  })
})
