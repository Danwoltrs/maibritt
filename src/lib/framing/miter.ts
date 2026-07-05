import sharp from 'sharp'

type Side = 'top' | 'bottom' | 'left' | 'right'
const SIDES: Side[] = ['top', 'bottom', 'left', 'right']

/** Fixed per-side crop offsets so the four rails show different grain (deterministic). */
const GRAIN_OFFSET: Record<Side, number> = { top: 0.05, right: 0.30, bottom: 0.55, left: 0.78 }

/** Slight per-side luminance (anisotropic reflection) — this is what sells the miter. */
const SIDE_LUM: Record<Side, number> = { top: 1.05, left: 1.0, right: 0.955, bottom: 0.915 }

/** A wood strip (length × t) with grain running along its length.
 *  Baked textures have vertical grain, so rotate 90° to get it horizontal. */
async function woodStrip(texPath: string, length: number, t: number, side: Side): Promise<Buffer> {
  const meta = await sharp(texPath).metadata()
  const w = meta.height!, h = meta.width! // dimensions after rotate(90)
  const sliceH = Math.max(1, Math.min(h, Math.max(Math.round(h * 0.16), Math.round(t * (w / length)))))
  const top = Math.max(0, Math.min(h - sliceH, Math.round(h * GRAIN_OFFSET[side])))
  return sharp(texPath).rotate(90)
    .extract({ left: 0, top, width: w, height: sliceH })
    .resize(length, t, { fit: 'fill' })
    .toBuffer()
}

/** Moulding profile across the strip: outer arris → sheen → flat face → lip highlight → rebate. */
function profileSvg(length: number, t: number, side: Side): Buffer {
  const dir = {
    top: { x1: 0, y1: 0, x2: 0, y2: 1 }, bottom: { x1: 0, y1: 1, x2: 0, y2: 0 },
    left: { x1: 0, y1: 0, x2: 1, y2: 0 }, right: { x1: 1, y1: 0, x2: 0, y2: 0 },
  }[side]
  const vertical = side === 'left' || side === 'right'
  const w = vertical ? t : length
  const h = vertical ? length : t
  return Buffer.from(
    `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg"><defs>` +
    `<linearGradient id="g" x1="${dir.x1}" y1="${dir.y1}" x2="${dir.x2}" y2="${dir.y2}">` +
    `<stop offset="0" stop-color="black" stop-opacity="0.30"/>` +
    `<stop offset="0.06" stop-color="white" stop-opacity="0.09"/>` +
    `<stop offset="0.20" stop-color="black" stop-opacity="0.05"/>` +
    `<stop offset="0.62" stop-color="black" stop-opacity="0"/>` +
    `<stop offset="0.86" stop-color="white" stop-opacity="0.14"/>` +
    `<stop offset="1" stop-color="black" stop-opacity="0.38"/>` +
    `</linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/></svg>`)
}

/** Trapezoid alpha mask (45° miter cuts) for one side, on the full frame rect. */
function miterMask(frameW: number, frameH: number, t: number, side: Side): Buffer {
  const pts = {
    top: `0,0 ${frameW},0 ${frameW - t},${t} ${t},${t}`,
    bottom: `0,${frameH} ${frameW},${frameH} ${frameW - t},${frameH - t} ${t},${frameH - t}`,
    left: `0,0 ${t},${t} ${t},${frameH - t} 0,${frameH}`,
    right: `${frameW},0 ${frameW},${frameH} ${frameW - t},${frameH - t} ${frameW - t},${t}`,
  }[side]
  return Buffer.from(
    `<svg width="${frameW}" height="${frameH}" xmlns="http://www.w3.org/2000/svg">` +
    `<polygon points="${pts}" fill="white"/></svg>`)
}

/** Fine 45° joint lines corner→corner plus a crisp outer arris outline. */
function seamsSvg(frameW: number, frameH: number, t: number): Buffer {
  const outer = ['0,0', `${frameW},0`, `${frameW},${frameH}`, `0,${frameH}`]
  const inner = [`${t},${t}`, `${frameW - t},${t}`, `${frameW - t},${frameH - t}`, `${t},${frameH - t}`]
  const lines = outer.map((o, i) => {
    const [ox, oy] = o.split(','), [ix, iy] = inner[i].split(',')
    return `<line x1="${ox}" y1="${oy}" x2="${ix}" y2="${iy}" stroke="black" stroke-opacity="0.28" stroke-width="1.2"/>` +
           `<line x1="${ox}" y1="${oy}" x2="${ix}" y2="${iy}" stroke="white" stroke-opacity="0.10" stroke-width="0.6" transform="translate(0.8,0)"/>`
  }).join('')
  return Buffer.from(
    `<svg width="${frameW}" height="${frameH}" xmlns="http://www.w3.org/2000/svg">${lines}` +
    `<rect x="0.5" y="0.5" width="${frameW - 1}" height="${frameH - 1}" fill="none" stroke="black" stroke-opacity="0.35" stroke-width="1"/></svg>`)
}

/** The full mitered frame ring (transparent centre) as one frameW×frameH RGBA layer. */
export async function miteredFrame(texPath: string, frameW: number, frameH: number, t: number): Promise<Buffer> {
  const blank = { create: { width: frameW, height: frameH, channels: 4 as const, background: { r: 0, g: 0, b: 0, alpha: 0 } } }
  const layers: sharp.OverlayOptions[] = []
  for (const side of SIDES) {
    const vertical = side === 'left' || side === 'right'
    const len = vertical ? frameH : frameW
    let strip = await woodStrip(texPath, len, t, side)
    if (side === 'left') strip = await sharp(strip).rotate(90).toBuffer()
    if (side === 'right') strip = await sharp(strip).rotate(270).toBuffer()
    strip = await sharp(strip)
      .composite([{ input: profileSvg(len, t, side) }])
      .modulate({ brightness: SIDE_LUM[side] })
      .toBuffer()
    const pos = {
      top: { left: 0, top: 0 }, bottom: { left: 0, top: frameH - t },
      left: { left: 0, top: 0 }, right: { left: frameW - t, top: 0 },
    }[side]
    const onCanvas = await sharp(blank)
      .composite([{ input: strip, left: pos.left, top: pos.top }])
      .png().toBuffer()
    const masked = await sharp(onCanvas)
      .composite([{ input: miterMask(frameW, frameH, t, side), blend: 'dest-in' }])
      .png().toBuffer()
    layers.push({ input: masked, left: 0, top: 0 })
  }
  layers.push({ input: seamsSvg(frameW, frameH, t), left: 0, top: 0 })
  return sharp(blank).composite(layers).png().toBuffer()
}
