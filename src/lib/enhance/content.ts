import sharp from 'sharp'
import type { Pt, Quad } from './types'

export interface Bounds { left: number; right: number; top: number; bottom: number }

/**
 * Tight content bounding box of the painting inside a photo that may carry a plain
 * wall margin. The wall is near-neutral and bright; the painting is saturated. We mark
 * a border row/column as "wall" when almost all of its pixels are low-saturation AND
 * bright, scan inward from each edge while the border stays wall, and stop at the first
 * content row/column. Only ever TRIMS (returns a sub-box of [0,1]²); each side is capped
 * so it can never eat into the artwork, and a side that scans to the cap without finding
 * content is left untrimmed (detection distrusted). Independent of the BiRefNet mask, so
 * it corrects an over-reaching auto-crop whether the mask swallowed the wall or fell back
 * to the full frame.
 */
export function contentBoundsFromRaw(
  data: Uint8Array | Buffer, w: number, h: number, channels: number,
  opts: { satMax?: number; litMin?: number; wallFrac?: number; maxTrim?: number } = {},
): Bounds {
  const satMax = opts.satMax ?? 0.12     // wall saturation ceiling (0..1)
  const litMin = opts.litMin ?? 0.72     // wall brightness floor (max channel, 0..1)
  const wallFrac = opts.wallFrac ?? 0.92 // a line is "wall" when ≥ this fraction is wall-like
  const maxTrim = opts.maxTrim ?? 0.30   // never trim more than this fraction from one side

  const isWallPixel = (i: number): boolean => {
    const r = data[i] / 255
    const g = channels >= 3 ? data[i + 1] / 255 : r
    const b = channels >= 3 ? data[i + 2] / 255 : r
    const max = Math.max(r, g, b), min = Math.min(r, g, b)
    const sat = max <= 0 ? 0 : (max - min) / max
    return sat <= satMax && max >= litMin
  }
  const colIsWall = (x: number): boolean => {
    let wall = 0
    for (let y = 0; y < h; y++) if (isWallPixel((y * w + x) * channels)) wall++
    return wall >= wallFrac * h
  }
  const rowIsWall = (y: number): boolean => {
    let wall = 0
    const row = y * w
    for (let x = 0; x < w; x++) if (isWallPixel((row + x) * channels)) wall++
    return wall >= wallFrac * w
  }
  // Scan `n` lines inward from one edge while they read as wall, capped at `limit`.
  // Returns the trim count, or 0 if it reached the cap (treat as "no confident wall").
  const scan = (isWall: (i: number) => boolean, n: number, limit: number, fromEnd: boolean): number => {
    let t = 0
    while (t < limit && isWall(fromEnd ? n - 1 - t : t)) t++
    return t >= limit ? 0 : t
  }

  const limX = Math.max(1, Math.floor(maxTrim * w))
  const limY = Math.max(1, Math.floor(maxTrim * h))
  const left = scan(colIsWall, w, limX, false)
  const right = w - scan(colIsWall, w, limX, true)
  const top = scan(rowIsWall, h, limY, false)
  const bottom = h - scan(rowIsWall, h, limY, true)

  if (right <= left || bottom <= top) return { left: 0, right: 1, top: 0, bottom: 1 }
  return { left: left / w, right: right / w, top: top / h, bottom: bottom / h }
}

/** Pull any quad corner that overshoots the content box back onto it (never outward). */
export function clampQuadToBounds(q: Quad, b: Bounds): Quad {
  const cx = (x: number) => Math.min(Math.max(x, b.left), b.right)
  const cy = (y: number) => Math.min(Math.max(y, b.top), b.bottom)
  const c = (p: Pt): Pt => ({ x: cx(p.x), y: cy(p.y) })
  return { tl: c(q.tl), tr: c(q.tr), br: c(q.br), bl: c(q.bl) }
}

/** Downscale the photo and read its content bounds (the wall-trimmed painting box). */
export async function detectContentBounds(imageBuf: Buffer, maxDim = 256): Promise<Bounds> {
  const { data, info } = await sharp(imageBuf, { failOn: 'none' })
    .resize({ width: maxDim, height: maxDim, fit: 'inside' })
    .removeAlpha().raw().toBuffer({ resolveWithObject: true })
  return contentBoundsFromRaw(data, info.width, info.height, info.channels)
}
