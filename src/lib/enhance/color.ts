import sharp from 'sharp'
import type { ColorOptions } from './types'

/**
 * Hue-preserving gentle exposure normalisation. Computes a single scalar gain
 * from the image's luminance and applies it equally to R, G and B, so colour
 * ratios (hue and saturation) are preserved exactly — only overall brightness
 * shifts. This is the opt-in "Auto colour" step; the default pipeline does NOT
 * colour-correct (fidelity invariant: never repaint the artist's colours).
 *
 * Replaces the previous gray-world white balance + per-channel `normalise`,
 * which hue-shifted saturated/monochromatic paintings — a red canvas was read as
 * a colour cast and "corrected" toward neutral (pink→lilac, salmon→greenish).
 */
export async function autoColorCorrect(input: Buffer, opts: ColorOptions = {}): Promise<Buffer> {
  const minGain = opts.minGain ?? 0.9
  const maxGain = opts.maxGain ?? 1.15
  const targetHigh = opts.targetHigh ?? 245

  // Robust bright point of the luminance channel (mean + 2σ ≈ top of the tonal
  // range without chasing specular outliers). A single scalar gain keeps hue.
  const lum = (await sharp(input).greyscale().stats()).channels[0]
  const brightPoint = Math.min(255, lum.mean + 2 * lum.stdev) || 1
  const gain = Math.min(maxGain, Math.max(minGain, targetHigh / brightPoint))

  return sharp(input, { failOn: 'none' })
    .keepIccProfile()
    .linear([gain, gain, gain], [0, 0, 0])
    .png()
    .toBuffer()
}
