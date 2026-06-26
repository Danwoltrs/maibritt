import type { RotatedRect } from './types'

export function maskToRotatedRect(
  mask: Uint8Array | Buffer,
  w: number,
  h: number,
  threshold = 127,
): RotatedRect {
  let n = 0, sx = 0, sy = 0
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (mask[y * w + x] > threshold) { n++; sx += x; sy += y }
    }
  }
  if (n === 0) return { cx: w / 2, cy: h / 2, width: w, height: h, angleDeg: 0 }

  const cx = sx / n, cy = sy / n
  let sxx = 0, syy = 0, sxy = 0
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (mask[y * w + x] > threshold) {
        const dx = x - cx, dy = y - cy
        sxx += dx * dx; syy += dy * dy; sxy += dx * dy
      }
    }
  }
  sxx /= n; syy /= n; sxy /= n
  const angle = 0.5 * Math.atan2(2 * sxy, sxx - syy)

  const cos = Math.cos(angle), sin = Math.sin(angle)
  let minU = Infinity, maxU = -Infinity, minV = Infinity, maxV = -Infinity
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (mask[y * w + x] > threshold) {
        const dx = x - cx, dy = y - cy
        const u = dx * cos + dy * sin
        const v = -dx * sin + dy * cos
        if (u < minU) minU = u
        if (u > maxU) maxU = u
        if (v < minV) minV = v
        if (v > maxV) maxV = v
      }
    }
  }
  return {
    cx,
    cy,
    width: maxU - minU,
    height: maxV - minV,
    angleDeg: (angle * 180) / Math.PI,
  }
}
