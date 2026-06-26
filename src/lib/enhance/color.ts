import sharp from 'sharp'
import type { ColorOptions } from './types'

/** Gray-world white balance (clamped) + gentle contrast normalise. Deterministic. */
export async function autoColorCorrect(input: Buffer, opts: ColorOptions = {}): Promise<Buffer> {
  const minGain = opts.minGain ?? 0.8
  const maxGain = opts.maxGain ?? 1.25

  const stats = await sharp(input).stats()
  const [r, g, b] = stats.channels
  const meanGray = (r.mean + g.mean + b.mean) / 3
  const clamp = (x: number) => Math.min(maxGain, Math.max(minGain, x))
  const gains = [clamp(meanGray / (r.mean || 1)), clamp(meanGray / (g.mean || 1)), clamp(meanGray / (b.mean || 1))]

  return sharp(input, { failOn: 'none' })
    .keepIccProfile()
    .linear(gains, [0, 0, 0])
    .normalise({ lower: 0.5, upper: 99.5 })
    .png()
    .toBuffer()
}
