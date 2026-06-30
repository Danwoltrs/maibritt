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
 * Keep only the largest 4-connected foreground component of a binarized mask.
 * BiRefNet sometimes labels a bright wall strip or stray speckle beside the canvas
 * as foreground; those detached blobs would otherwise drag a corner out to the image
 * edge. Iterative flood fill over a flat stack — O(w·h), no recursion.
 */
function largestComponent(mask: Uint8Array | Buffer, w: number, h: number, threshold: number): Uint8Array {
  const N = w * h
  const bin = new Uint8Array(N)
  for (let i = 0; i < N; i++) bin[i] = mask[i] > threshold ? 1 : 0

  const label = new Int32Array(N).fill(-1)
  const stack = new Int32Array(N)
  let bestLabel = -1, bestSize = 0, cur = 0
  for (let s = 0; s < N; s++) {
    if (bin[s] === 0 || label[s] !== -1) continue
    let sp = 0, size = 0
    stack[sp++] = s; label[s] = cur
    while (sp > 0) {
      const p = stack[--sp]; size++
      const x = p % w, y = (p - x) / w
      if (x > 0 && bin[p - 1] && label[p - 1] === -1) { label[p - 1] = cur; stack[sp++] = p - 1 }
      if (x < w - 1 && bin[p + 1] && label[p + 1] === -1) { label[p + 1] = cur; stack[sp++] = p + 1 }
      if (y > 0 && bin[p - w] && label[p - w] === -1) { label[p - w] = cur; stack[sp++] = p - w }
      if (y < h - 1 && bin[p + w] && label[p + w] === -1) { label[p + w] = cur; stack[sp++] = p + w }
    }
    if (size > bestSize) { bestSize = size; bestLabel = cur }
    cur++
  }
  const out = new Uint8Array(N)
  if (bestLabel >= 0) for (let i = 0; i < N; i++) if (label[i] === bestLabel) out[i] = 1
  return out
}

/**
 * Fit the canvas as a general quadrilateral (so it can be a perspective
 * trapezoid, not just a tilted rectangle). The mask is first reduced to its largest
 * connected component (drops detached wall/speckle), then each corner is taken at a
 * low percentile of the diagonal-projection extremes rather than the single most-extreme
 * hull vertex — so one stray edge pixel can't slam a corner to the image border. (With a
 * clean, small hull the percentile coincides with the extreme.)
 * Returns normalized [0,1] corners, expanded outward by `expandFrac` (recovers a
 * slightly under-segmented mask) and snapped to the image border within `snapFrac`
 * (so a frame-filling canvas isn't cropped at all). Falls back to a centred near-full
 * quad when the mask is empty or degenerate. Corners remain fully editable in the UI.
 */
export function maskToQuad(
  mask: Uint8Array | Buffer, w: number, h: number, threshold = 127, expandFrac = 0.015, snapFrac = 0.04,
): Quad {
  const clean = largestComponent(mask, w, h, threshold)
  const { hull, n } = maskHull(clean, w, h, 0) // already binarized 0/1
  if (n === 0 || hull.length < 3) return fullFrameQuad(0.99)

  // Corner = the hull vertex at a low percentile of its diagonal projection, so a lone
  // outlier vertex no longer defines the corner. Small hulls collapse to the extreme.
  const pick = (key: (p: Pt) => number, low: boolean): Pt => {
    const sorted = hull.slice().sort((a, b) => key(a) - key(b))
    const idx = Math.round((low ? 0.02 : 0.98) * (sorted.length - 1))
    return sorted[idx]
  }
  const tl = pick((p) => p.x + p.y, true)   // top-left    : min(x+y)
  const br = pick((p) => p.x + p.y, false)  // bottom-right : max(x+y)
  const tr = pick((p) => p.x - p.y, false)  // top-right   : max(x−y)
  const bl = pick((p) => p.x - p.y, true)   // bottom-left : min(x−y)

  const norm = (p: Pt): Pt => ({ x: p.x / w, y: p.y / h })
  const quad: Quad = { tl: norm(tl), tr: norm(tr), br: norm(br), bl: norm(bl) }
  if (!isValidQuad(quad)) return fullFrameQuad(0.99)
  let out = expandFrac > 0 ? expandQuad(quad, expandFrac) : quad
  if (snapFrac > 0) out = snapQuadToBorder(out, snapFrac)
  return out
}
