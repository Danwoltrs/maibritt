import type { Pt, Quad, RotatedRect } from './types'
import { fullFrameQuad, isValidQuad, expandQuad, snapQuadToBorder } from './quad'

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
 * Convex hull of the foreground mask. Per-row left/right extremes capture every
 * hull vertex (each is the leftmost or rightmost foreground pixel in its row),
 * so we get the full hull in O(w·h) without materialising every pixel.
 */
function maskHull(mask: Uint8Array | Buffer, w: number, h: number, threshold: number): { hull: Pt[]; n: number } {
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
  return { hull: n === 0 ? [] : convexHull(pts), n }
}

/**
 * Fit a (possibly tilted) rectangle to a foreground mask — the tightest
 * enclosing rectangle around the outline (convex hull → rotating calipers),
 * reading the tilt directly off the canvas edge. Robust to interior shapes.
 */
export function maskToRotatedRect(
  mask: Uint8Array | Buffer,
  w: number,
  h: number,
  threshold = 127,
): RotatedRect {
  const { hull, n } = maskHull(mask, w, h, threshold)
  if (n === 0) return { cx: w / 2, cy: h / 2, width: w, height: h, angleDeg: 0 }
  const rect = minAreaRect(hull)
  return rect ?? { cx: w / 2, cy: h / 2, width: w, height: h, angleDeg: 0 }
}

/**
 * Fit the canvas as a general quadrilateral (so it can be a perspective
 * trapezoid, not just a tilted rectangle). The four corners are the hull points
 * extreme along the two diagonals — robust for roughly-upright canvas photos.
 * Returns normalized [0,1] corners, expanded outward by `expandFrac` (recovers a
 * slightly under-segmented mask) and snapped to the image border within `snapFrac`
 * (so a frame-filling canvas isn't cropped at all). Falls back to a centred near-full
 * quad when the mask is empty or degenerate. Corners remain fully editable in the UI.
 */
export function maskToQuad(
  mask: Uint8Array | Buffer, w: number, h: number, threshold = 127, expandFrac = 0.03, snapFrac = 0.04,
): Quad {
  const { hull, n } = maskHull(mask, w, h, threshold)
  if (n === 0 || hull.length < 3) return fullFrameQuad(0.99)

  let tl = hull[0], tr = hull[0], br = hull[0], bl = hull[0]
  for (const p of hull) {
    if (p.x + p.y < tl.x + tl.y) tl = p        // top-left  : min(x+y)
    if (p.x + p.y > br.x + br.y) br = p        // bottom-right: max(x+y)
    if (p.x - p.y > tr.x - tr.y) tr = p        // top-right : max(x−y)
    if (p.x - p.y < bl.x - bl.y) bl = p        // bottom-left: min(x−y)
  }
  const norm = (p: Pt): Pt => ({ x: p.x / w, y: p.y / h })
  const quad: Quad = { tl: norm(tl), tr: norm(tr), br: norm(br), bl: norm(bl) }
  if (!isValidQuad(quad)) return fullFrameQuad(0.99)
  let out = expandFrac > 0 ? expandQuad(quad, expandFrac) : quad
  if (snapFrac > 0) out = snapQuadToBorder(out, snapFrac)
  return out
}
