import type { RotatedRect } from './types'

/** The eight drag handles of a crop box, named by compass direction. */
export type Handle = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'

// Which local axes each handle controls: hu drives width (±1 = east/west side),
// hv drives height (±1 = south/north side). 0 means that dimension is locked.
const HU: Record<Handle, number> = { w: -1, e: 1, n: 0, s: 0, nw: -1, ne: 1, sw: -1, se: 1 }
const HV: Record<Handle, number> = { n: -1, s: 1, e: 0, w: 0, nw: -1, ne: -1, sw: 1, se: 1 }

/** Translate the whole box. dxN/dyN are in natural (image) pixels. */
export function moveRect(r: RotatedRect, dxN: number, dyN: number): RotatedRect {
  return { ...r, cx: r.cx + dxN, cy: r.cy + dyN }
}

/**
 * Resize the box by dragging one handle, keeping the opposite edge/corner fixed.
 * The drag delta (dxN, dyN, natural px) is projected onto the box's own rotated
 * axes, so resizing feels natural even when the box is tilted.
 */
export function resizeRect(
  r: RotatedRect,
  handle: Handle,
  dxN: number,
  dyN: number,
  minSize = 24,
): RotatedRect {
  const a = (r.angleDeg * Math.PI) / 180
  const cos = Math.cos(a), sin = Math.sin(a)

  // Project the screen-space delta onto the box's local u (width) / v (height) axes.
  const dU = dxN * cos + dyN * sin
  const dV = -dxN * sin + dyN * cos

  const hu = HU[handle], hv = HV[handle]
  let width = r.width, height = r.height
  let shiftU = 0, shiftV = 0

  if (hu !== 0) {
    width = Math.max(minSize, r.width + hu * dU)
    shiftU = (hu * (width - r.width)) / 2
  }
  if (hv !== 0) {
    height = Math.max(minSize, r.height + hv * dV)
    shiftV = (hv * (height - r.height)) / 2
  }

  // Convert the local-frame centre shift back to image coordinates.
  const cx = r.cx + shiftU * cos - shiftV * sin
  const cy = r.cy + shiftU * sin + shiftV * cos
  return { ...r, cx, cy, width, height }
}

/** A centred box covering `frac` of the image — the safe fallback / "fit" default. */
export function fullFrameRect(imageW: number, imageH: number, frac = 1): RotatedRect {
  return { cx: imageW / 2, cy: imageH / 2, width: imageW * frac, height: imageH * frac, angleDeg: 0 }
}
