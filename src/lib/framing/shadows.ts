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
