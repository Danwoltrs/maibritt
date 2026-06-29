import type { RotatedRect } from './types'

interface Pt { x: number; y: number }

/** Convex hull (counter-clockwise) via Andrew's monotone chain. */
function convexHull(points: Pt[]): Pt[] {
  const pts = points.slice().sort((a, b) => a.x - b.x || a.y - b.y)
  if (pts.length <= 2) return pts
  const cross = (o: Pt, a: Pt, b: Pt) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x)
  const lower: Pt[] = []
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop()
    lower.push(p)
  }
  const upper: Pt[] = []
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i]
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop()
    upper.push(p)
  }
  lower.pop(); upper.pop()
  return lower.concat(upper)
}

/** Reduce an angle (deg) to (-90, 90]. */
function reduce90(d: number): number {
  let a = d
  while (a <= -90) a += 180
  while (a > 90) a -= 180
  return a
}

/**
 * Smallest-area enclosing rectangle of a convex hull (rotating calipers).
 * Reports it as a RotatedRect whose `width` lies along the near-horizontal axis
 * and whose `angleDeg` is the minimal straightening angle in (-45, 45].
 */
function minAreaRect(hull: Pt[]): RotatedRect | null {
  if (hull.length < 3) return null
  let best: { area: number; cx: number; cy: number; w: number; h: number; theta: number } | null = null

  for (let i = 0; i < hull.length; i++) {
    const a = hull[i], b = hull[(i + 1) % hull.length]
    const len = Math.hypot(b.x - a.x, b.y - a.y) || 1
    const ux = (b.x - a.x) / len, uy = (b.y - a.y) / len // edge direction (u axis)

    let minU = Infinity, maxU = -Infinity, minV = Infinity, maxV = -Infinity
    for (const p of hull) {
      const u = p.x * ux + p.y * uy
      const v = -p.x * uy + p.y * ux
      if (u < minU) minU = u
      if (u > maxU) maxU = u
      if (v < minV) minV = v
      if (v > maxV) maxV = v
    }
    const w = maxU - minU, h = maxV - minV
    const area = w * h
    if (!best || area < best.area) {
      const cu = (minU + maxU) / 2, cv = (minV + maxV) / 2
      // Invert the rotation: (x,y) = u*û + v*n̂, with n̂ = (-uy, ux).
      best = { area, cx: cu * ux - cv * uy, cy: cu * uy + cv * ux, w, h, theta: Math.atan2(uy, ux) }
    }
  }
  if (!best) return null

  // Choose the axis closest to horizontal as `width`, so angleDeg is a small tilt.
  const aU = reduce90((best.theta * 180) / Math.PI)
  const aV = reduce90((best.theta * 180) / Math.PI + 90)
  if (Math.abs(aU) <= 45) {
    return { cx: best.cx, cy: best.cy, width: best.w, height: best.h, angleDeg: aU }
  }
  return { cx: best.cx, cy: best.cy, width: best.h, height: best.w, angleDeg: aV }
}

/**
 * Fit a (possibly tilted) rectangle to a foreground mask.
 *
 * Earlier this used PCA on the bright-pixel spread, which an abstract painting's
 * interior shapes could skew. We now fit the *tightest enclosing rectangle*
 * around the mask's outline (convex hull → rotating calipers), reading the tilt
 * directly off the canvas edge. Far more robust to what is painted inside.
 */
export function maskToRotatedRect(
  mask: Uint8Array | Buffer,
  w: number,
  h: number,
  threshold = 127,
): RotatedRect {
  // Per-row left/right extremes: every convex-hull vertex is the leftmost or
  // rightmost foreground pixel in its own row, so this captures the full hull
  // in O(w·h) without materialising every foreground pixel.
  const pts: Pt[] = []
  let n = 0
  for (let y = 0; y < h; y++) {
    let lo = -1, hi = -1
    const row = y * w
    for (let x = 0; x < w; x++) {
      if (mask[row + x] > threshold) {
        if (lo < 0) lo = x
        hi = x
        n++
      }
    }
    if (lo >= 0) { pts.push({ x: lo, y }); pts.push({ x: hi, y }) }
  }
  if (n === 0) return { cx: w / 2, cy: h / 2, width: w, height: h, angleDeg: 0 }

  const rect = minAreaRect(convexHull(pts))
  return rect ?? { cx: w / 2, cy: h / 2, width: w, height: h, angleDeg: 0 }
}
