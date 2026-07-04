import sharp from 'sharp'

/**
 * Qwen-Image-Edit re-frames / zooms / clips the painting when its input is not
 * roughly square — it re-composes toward centre and shears content off the long
 * edges (observed: a shape clipped at the right edge of a landscape crop).
 * `image_size` only sets the output canvas; it does NOT stop the reframe.
 *
 * Work around it by making the model see a SQUARE image: pad the painting out to
 * a square with a mirrored border (a seamless-looking extension the model leaves
 * alone), run the edit, then crop the exact painting region back out. Any reframe
 * the model still applies lands in the throwaway margin, not the artwork.
 */

export interface Pad {
  side: number      // padded square edge, px
  left: number      // painting offset inside the square
  top: number
  width: number     // original painting size
  height: number
}

/** Pad `input` to a centered square with a mirrored border. Returns the padded
 *  buffer and the geometry needed to crop the painting back out. `null` when the
 *  image is already square (or metadata is unreadable) — caller sends it as-is. */
export async function padToSquare(input: Buffer): Promise<{ buffer: Buffer; pad: Pad } | null> {
  const meta = await sharp(input).metadata().catch(() => null)
  if (!meta?.width || !meta?.height || meta.width === meta.height) return null
  const side = Math.max(meta.width, meta.height)
  const left = Math.floor((side - meta.width) / 2)
  const top = Math.floor((side - meta.height) / 2)
  const buffer = await sharp(input)
    .extend({
      top,
      bottom: side - meta.height - top,
      left,
      right: side - meta.width - left,
      extendWith: 'mirror',
    })
    .png()
    .toBuffer()
  return { buffer, pad: { side, left, top, width: meta.width, height: meta.height } }
}

/** Crop the painting region back out of the model's (square) output. The model
 *  may not honour the requested pixel size, so normalise to `side`×`side` first,
 *  then extract. Returns `edited` unchanged on any failure. */
export async function cropFromSquare(edited: Buffer, pad: Pad): Promise<Buffer> {
  try {
    return await sharp(edited)
      .resize(pad.side, pad.side, { fit: 'fill' })
      .extract({ left: pad.left, top: pad.top, width: pad.width, height: pad.height })
      .png()
      .toBuffer()
  } catch (e) {
    console.error('square-pad crop-back failed; returning the model output as-is', e)
    return edited
  }
}
