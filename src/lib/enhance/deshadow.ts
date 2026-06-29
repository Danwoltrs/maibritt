import sharp from 'sharp'
import type { DeshadowOptions } from './types'

/**
 * Homomorphic, luminance-only flat-field correction that removes the MID-frequency
 * shading of a slack-canvas wave while preserving (a) the painting's broad
 * intentional tonal arc and (b) hue + saturation exactly.
 *
 * How it works — estimate illumination at TWO scales of the luminance channel:
 *   blurHigh (sigmaHigh ≈ 1.2% of the long edge): keeps the wave band, drops brushwork
 *   blurLow  (sigmaLow  ≈ 15%  of the long edge): keeps only the broad tonal arc
 * The wave band ≈ blurHigh / blurLow. We divide it out with a per-pixel SCALAR
 * gain = (blurLow / blurHigh)^strength applied equally to R, G and B — so colour
 * ratios (hue) and the max:min spread (saturation) are mathematically unchanged;
 * only lightness moves. Brushwork (finer than sigmaHigh) is in neither blur, so the
 * ratio leaves it alone. The broad arc is in BOTH blurs, so it cancels and survives.
 *
 * NOTE: this only corrects the SHADING of the waves. It cannot move pixels, so the
 * geometric *bowing* of a 3D-undulating canvas is unchanged by design — that needs
 * a warp, not lighting math.
 *
 * The previous single-blur-at-6% divide failed for a precise reason: 6% of the long
 * edge low-pass-filters the waves (period ~3–12%) OUT of the illumination map, so
 * they survived and the step only stretched the broad gradient → "looked like contrast".
 */
export async function flattenToTaut(input: Buffer, opts: DeshadowOptions = {}): Promise<Buffer> {
  const meta = await sharp(input).metadata()
  const width = meta.width!, height = meta.height!
  const long = Math.max(width, height)
  const sigmaHigh = opts.sigmaHigh ?? Math.max(long * 0.012, 3)
  const sigmaLow = opts.sigmaLow ?? Math.max(long * 0.15, 24)
  const strength = opts.strength ?? 1.0
  const minGain = opts.minGain ?? 0.7
  const maxGain = opts.maxGain ?? 1.4

  const rgb = await sharp(input, { failOn: 'none' }).removeAlpha().raw().toBuffer()
  // Single-channel luminance, blurred at the two scales. sharp may hand the raw
  // blur back as 1- or 3-channel (greyscale re-expanded to sRGB), so index by the
  // ACTUAL stride rather than assuming 1.
  const grey = await sharp(input, { failOn: 'none' }).removeAlpha().greyscale().toColourspace('b-w').raw().toBuffer()
  const blurHigh = await sharp(grey, { raw: { width, height, channels: 1 }, failOn: 'none' }).blur(sigmaHigh).raw().toBuffer()
  const blurLow = await sharp(grey, { raw: { width, height, channels: 1 }, failOn: 'none' }).blur(sigmaLow).raw().toBuffer()

  const n = width * height
  const sH = Math.max(1, Math.round(blurHigh.length / n)) // bytes per pixel in the blur buffer
  const sL = Math.max(1, Math.round(blurLow.length / n))
  const usePow = strength !== 1
  const out = Buffer.alloc(rgb.length)
  for (let q = 0, p = 0; q < n; q++, p += 3) {
    const hi = blurHigh[q * sH] + 1 // +1 epsilon: avoid divide-by-zero on pure black
    const lo = blurLow[q * sL] + 1
    let gain = lo / hi
    if (usePow) gain = Math.pow(gain, strength)
    if (gain < minGain) gain = minGain
    else if (gain > maxGain) gain = maxGain
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
