import type { Pt, Quad } from './types'

export type Corner = keyof Quad // 'tl' | 'tr' | 'br' | 'bl'
export const CORNERS: Corner[] = ['tl', 'tr', 'br', 'bl']

const clamp01 = (v: number) => Math.max(0, Math.min(1, v))

/** Corner list in clockwise order (TL, TR, BR, BL) — handy for warping/area. */
export function quadPoints(q: Quad): Pt[] {
  return [q.tl, q.tr, q.br, q.bl]
}

/** A centred axis-aligned quad covering `frac` of the image (normalized). */
export function fullFrameQuad(frac = 1): Quad {
  const lo = (1 - frac) / 2
  const hi = 1 - lo
  return { tl: { x: lo, y: lo }, tr: { x: hi, y: lo }, br: { x: hi, y: hi }, bl: { x: lo, y: hi } }
}

/** Move one corner to an absolute normalized position (clamped to the image). */
export function setCorner(q: Quad, c: Corner, x: number, y: number): Quad {
  return { ...q, [c]: { x: clamp01(x), y: clamp01(y) } }
}

/** Translate the whole quad, clamping the shift so no corner leaves the image. */
export function moveQuad(q: Quad, dx: number, dy: number): Quad {
  const pts = quadPoints(q)
  const minX = Math.min(...pts.map((p) => p.x)), maxX = Math.max(...pts.map((p) => p.x))
  const minY = Math.min(...pts.map((p) => p.y)), maxY = Math.max(...pts.map((p) => p.y))
  const sx = Math.max(-minX, Math.min(dx, 1 - maxX))
  const sy = Math.max(-minY, Math.min(dy, 1 - maxY))
  return {
    tl: { x: q.tl.x + sx, y: q.tl.y + sy },
    tr: { x: q.tr.x + sx, y: q.tr.y + sy },
    br: { x: q.br.x + sx, y: q.br.y + sy },
    bl: { x: q.bl.x + sx, y: q.bl.y + sy },
  }
}

/** Unsigned area (shoelace magnitude) of the quad in normalized units. */
export function quadArea(q: Quad): number {
  const p = quadPoints(q)
  let a = 0
  for (let i = 0; i < 4; i++) {
    const j = (i + 1) % 4
    a += p[i].x * p[j].y - p[j].x * p[i].y
  }
  return Math.abs(a) / 2
}

/**
 * A quad is usable if it is non-degenerate (reasonable area), convex, its corners
 * are distinct, and they sit in the expected TL/TR/BR/BL arrangement (which also
 * rejects the >45°-rotation case where auto-detect mislabels the corners). When
 * this returns false, callers fall back to a near-full quad the artist can edit.
 */
export function isValidQuad(q: Quad, minAreaFrac = 0.15): boolean {
  const p = quadPoints(q)
  if (p.some((pt) => !Number.isFinite(pt.x) || !Number.isFinite(pt.y))) return false
  if (quadArea(q) < minAreaFrac) return false

  // No two corners may coincide (kills a degenerate triangle masquerading as a quad).
  const eps = 1e-3
  for (let i = 0; i < 4; i++) {
    for (let j = i + 1; j < 4; j++) {
      if (Math.hypot(p[i].x - p[j].x, p[i].y - p[j].y) < eps) return false
    }
  }

  // Expected arrangement: left corners left of right corners, top corners above bottom.
  if (!(q.tl.x < q.tr.x && q.bl.x < q.br.x && q.tl.y < q.bl.y && q.tr.y < q.br.y)) return false

  // Convexity: all cross-products of consecutive edges share one sign.
  let sign = 0
  for (let i = 0; i < 4; i++) {
    const a = p[i], b = p[(i + 1) % 4], c = p[(i + 2) % 4]
    const cross = (b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x)
    if (Math.abs(cross) < 1e-9) continue
    const s = Math.sign(cross)
    if (sign === 0) sign = s
    else if (s !== sign) return false
  }
  return true
}
