import sharp from 'sharp'
import type { DeshadowOptions } from './types'

/**
 * Flat-field correction: divide out a low-frequency illumination map so the slack
 * canvas's soft shadows flatten while brushwork (high-freq) and hue (equal per-channel
 * gain) are preserved. Deterministic, no model.
 */
export async function flattenToTaut(input: Buffer, opts: DeshadowOptions = {}): Promise<Buffer> {
  const meta = await sharp(input).metadata()
  const width = meta.width!, height = meta.height!
  const long = Math.max(width, height)
  const sigma = opts.blurSigma ?? Math.max(long * 0.06, 10)
  const minGain = opts.minGain ?? 0.6
  const maxGain = opts.maxGain ?? 1.8

  const rgb = await sharp(input, { failOn: 'none' }).removeAlpha().raw().toBuffer()
  const blur = await sharp(input, { failOn: 'none' }).removeAlpha().greyscale().blur(sigma).raw().toBuffer()

  let sum = 0
  for (let i = 0; i < blur.length; i++) sum += blur[i]
  const meanB = sum / blur.length

  const out = Buffer.alloc(rgb.length)
  for (let q = 0, p = 0; q < blur.length; q++, p += 3) {
    const b = blur[q] || 1
    let gain = meanB / b
    if (gain < minGain) gain = minGain
    if (gain > maxGain) gain = maxGain
    for (let c = 0; c < 3; c++) {
      const v = rgb[p + c] * gain
      out[p + c] = v > 255 ? 255 : v < 0 ? 0 : v
    }
  }

  return sharp(out, { raw: { width, height, channels: 3 }, failOn: 'none' })
    .keepIccProfile()
    .png()
    .toBuffer()
}
