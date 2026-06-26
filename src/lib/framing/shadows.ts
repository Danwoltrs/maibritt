import sharp from 'sharp'

/** A soft black rounded-rect shadow on transparency. Returns the buffer and the
 *  transparent margin added on each side (so callers can offset it correctly). */
export async function makeShadow(w: number, h: number, sigma: number, opacity: number): Promise<{ buffer: Buffer; margin: number }> {
  const margin = Math.ceil(sigma * 3)
  const W = w + margin * 2, H = h + margin * 2
  const rx = Math.max(2, Math.round(Math.min(w, h) * 0.01))
  const svg = Buffer.from(
    `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">` +
    `<rect x="${margin}" y="${margin}" width="${w}" height="${h}" rx="${rx}" ` +
    `fill="black" fill-opacity="${opacity}"/></svg>`
  )
  const buffer = await sharp(svg).blur(sigma).png().toBuffer()
  return { buffer, margin }
}

/** Four gradient strips implying light from the upper-left: light top/left, dark bottom/right. */
export function bevelSvg(w: number, h: number, t: number): Buffer {
  return Buffer.from(
    `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">` +
    `<rect x="0" y="0" width="${w}" height="${t}" fill="white" fill-opacity="0.30"/>` +
    `<rect x="0" y="0" width="${t}" height="${h}" fill="white" fill-opacity="0.18"/>` +
    `<rect x="0" y="${h - t}" width="${w}" height="${t}" fill="black" fill-opacity="0.32"/>` +
    `<rect x="${w - t}" y="0" width="${t}" height="${h}" fill="black" fill-opacity="0.22"/>` +
    `<rect x="0.5" y="0.5" width="${w - 1}" height="${h - 1}" fill="none" stroke="black" stroke-opacity="0.5" stroke-width="1"/>` +
    `</svg>`
  )
}
