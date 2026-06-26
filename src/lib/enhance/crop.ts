import sharp from 'sharp'
import type { RotatedRect } from './types'

export async function cropStraighten(input: Buffer, rect: RotatedRect, inset = 0.01): Promise<Buffer> {
  const meta = await sharp(input).metadata()
  const W = meta.width!, H = meta.height!

  const rbuf = await sharp(input, { failOn: 'none' })
    .keepIccProfile()
    .rotate(-rect.angleDeg, { background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png()
    .toBuffer()

  const rmeta = await sharp(rbuf).metadata()
  const RW = rmeta.width!, RH = rmeta.height!

  // Map the rect centre from original coords into the rotated (expanded) image.
  const a = (-rect.angleDeg * Math.PI) / 180
  const cos = Math.cos(a), sin = Math.sin(a)
  const ox = rect.cx - W / 2, oy = rect.cy - H / 2
  const rx = ox * cos - oy * sin + RW / 2
  const ry = ox * sin + oy * cos + RH / 2

  const insetPx = Math.round(Math.min(rect.width, rect.height) * inset)
  let left = Math.round(rx - rect.width / 2) + insetPx
  let top = Math.round(ry - rect.height / 2) + insetPx
  let w = Math.round(rect.width) - 2 * insetPx
  let h = Math.round(rect.height) - 2 * insetPx

  left = Math.max(0, Math.min(left, RW - 1))
  top = Math.max(0, Math.min(top, RH - 1))
  w = Math.max(1, Math.min(w, RW - left))
  h = Math.max(1, Math.min(h, RH - top))

  return sharp(rbuf, { failOn: 'none' })
    .keepIccProfile()
    .extract({ left, top, width: w, height: h })
    .png()
    .toBuffer()
}
