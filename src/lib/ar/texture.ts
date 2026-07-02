import sharp from 'sharp'

const MAX_EDGE = 2048

/** Prepare the painting image as an AR texture: EXIF-rotated, alpha flattened,
 *  capped at 2048px, plain sRGB JPEG (AR viewers assume sRGB). */
export async function prepareTexture(src: Buffer | Uint8Array): Promise<Uint8Array> {
  const buf = await sharp(Buffer.from(src), { failOn: 'none' })
    .rotate()                                  // honor EXIF orientation
    .flatten({ background: '#ffffff' })        // drop alpha (JPEG has none)
    .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toBuffer()
  return new Uint8Array(buf)
}
