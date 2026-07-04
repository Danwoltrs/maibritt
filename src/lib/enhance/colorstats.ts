import sharp from 'sharp'

/**
 * Cheap colour-fidelity measurement, shared by the de-wave and the generative
 * AI-flatten paths so we can VERIFY (not assume) that a step didn't shift the
 * artist's colours. `sat` is the mean per-pixel HSV saturation; `means` are the
 * per-channel byte means. Both are read on a bounded downsample — colour
 * distribution, not detail, so a small sample is plenty and keeps it fast.
 */
export interface ColorStats {
  means: [number, number, number]
  sat: number
}

export async function colorStats(buf: Buffer, max = 512): Promise<ColorStats> {
  let img = sharp(buf, { failOn: 'none' }).removeAlpha()
  if (max) img = img.resize({ width: max, height: max, fit: 'inside', withoutEnlargement: true })
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true })
  const ch = info.channels
  const m = [0, 0, 0]
  let satSum = 0
  const n = info.width * info.height
  for (let i = 0; i < data.length; i += ch) {
    const r = data[i], g = data[i + 1], b = data[i + 2]
    m[0] += r; m[1] += g; m[2] += b
    const max2 = Math.max(r, g, b), min2 = Math.min(r, g, b)
    satSum += max2 === 0 ? 0 : (max2 - min2) / max2
  }
  return { means: [m[0] / n, m[1] / n, m[2] / n], sat: satSum / n }
}

export interface ColorDelta {
  /** Signed % change in mean saturation (reference → result). */
  satPct: number
  /** Signed per-channel mean change in byte levels (reference → result). */
  meanDeltas: [number, number, number]
  /** True when |satPct| < satTol AND every |meanDelta| < meanTol. */
  withinTolerance: boolean
  reference: ColorStats
  result: ColorStats
}

/**
 * Measure how far `result` drifted from `reference` in saturation and per-channel
 * mean. Default tolerance matches the pipeline's colour-safety contract
 * (saturation < 2%, per-channel mean < 3 levels).
 */
export async function colorDelta(
  reference: Buffer,
  result: Buffer,
  tol: { satPct?: number; meanLevels?: number } = {},
): Promise<ColorDelta> {
  const satTol = tol.satPct ?? 2
  const meanTol = tol.meanLevels ?? 3
  const [ref, res] = await Promise.all([colorStats(reference), colorStats(result)])
  const satPct = ref.sat === 0 ? 0 : ((res.sat - ref.sat) / ref.sat) * 100
  const meanDeltas = [0, 1, 2].map((c) => res.means[c] - ref.means[c]) as [number, number, number]
  const withinTolerance = Math.abs(satPct) < satTol && meanDeltas.every((d) => Math.abs(d) < meanTol)
  return { satPct, meanDeltas, withinTolerance, reference: ref, result: res }
}

/** Compact one-line summary for server logs (so the artist can see the numbers). */
export function formatColorDelta(label: string, d: ColorDelta): string {
  const md = d.meanDeltas.map((x) => x.toFixed(1)).join('/')
  return `[colour ${label}] sat ${d.satPct >= 0 ? '+' : ''}${d.satPct.toFixed(2)}%  meanΔ ${md}  ${d.withinTolerance ? 'OK' : 'OUT-OF-TOLERANCE'}`
}
