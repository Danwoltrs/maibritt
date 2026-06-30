import sharp from 'sharp'

export async function makeSolid(w: number, h: number, rgb: [number, number, number]): Promise<Buffer> {
  return sharp({ create: { width: w, height: h, channels: 3, background: { r: rgb[0], g: rgb[1], b: rgb[2] } } })
    .png().toBuffer()
}

/** Mid-gray image darkened linearly from top (shadow) to bottom — simulates slack-canvas shading. */
export async function makeVerticalGradient(w: number, h: number): Promise<Buffer> {
  const raw = Buffer.alloc(w * h * 3)
  for (let y = 0; y < h; y++) {
    const v = Math.round(80 + (120 * y) / h) // 80..200
    for (let x = 0; x < w; x++) {
      const p = (y * w + x) * 3
      raw[p] = v; raw[p + 1] = v; raw[p + 2] = v
    }
  }
  return sharp(raw, { raw: { width: w, height: h, channels: 3 } }).png().toBuffer()
}

/** Single-channel mask (Uint8) with a filled rectangle of given size, centered, rotated by angleDeg. */
export function makeTiltedRectMask(
  w: number, h: number, rectW: number, rectH: number, angleDeg: number
): Uint8Array {
  const mask = new Uint8Array(w * h)
  const cx = w / 2, cy = h / 2
  const a = (angleDeg * Math.PI) / 180
  const cos = Math.cos(a), sin = Math.sin(a)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dx = x - cx, dy = y - cy
      const u = dx * cos + dy * sin
      const v = -dx * sin + dy * cos
      if (Math.abs(u) <= rectW / 2 && Math.abs(v) <= rectH / 2) mask[y * w + x] = 255
    }
  }
  return mask
}

/** Filled centred rect PLUS an extra filled box [x0,x1)×[y0,y1) — simulates BiRefNet
 * also grabbing a bright wall strip / detached blob beside the canvas. */
export function makeRectWithExtra(
  w: number, h: number, rectW: number, rectH: number,
  extra: { x0: number; x1: number; y0: number; y1: number },
): Uint8Array {
  const mask = makeTiltedRectMask(w, h, rectW, rectH, 0)
  for (let y = Math.max(0, extra.y0); y < Math.min(h, extra.y1); y++)
    for (let x = Math.max(0, extra.x0); x < Math.min(w, extra.x1); x++)
      mask[y * w + x] = 255
  return mask
}

export async function rawStats(buf: Buffer) {
  return sharp(buf).stats()
}
