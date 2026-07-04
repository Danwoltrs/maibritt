import sharp from 'sharp'

/**
 * Per-channel histogram specification: remap `target`'s RGB so each channel's
 * tonal distribution matches `reference`'s. The mapping is a global monotone
 * LUT — no spatial component — so it restores the reference palette exactly
 * (in distribution) without reintroducing the local wave shading the AI
 * flatten removed. Needs no pixel alignment, so it survives the model
 * reframing slightly. Returns `target` unchanged on any failure.
 */

// Histograms are about distributions, not detail — a bounded downsample is
// plenty and keeps the pass cheap on 2000px working images.
const HIST_MAX = 512

async function rawRgb(buf: Buffer, max?: number) {
  let img = sharp(buf).removeAlpha()
  if (max) img = img.resize({ width: max, height: max, fit: 'inside', withoutEnlargement: true })
  return img.raw().toBuffer({ resolveWithObject: true })
}

function cdf256(data: Buffer, channels: number, channel: number): Float64Array {
  const hist = new Float64Array(256)
  for (let i = channel; i < data.length; i += channels) hist[data[i]]++
  const cdf = new Float64Array(256)
  const total = data.length / channels
  let acc = 0
  for (let v = 0; v < 256; v++) {
    acc += hist[v]
    cdf[v] = acc / total
  }
  return cdf
}

/** Classic histogram specification: v -> smallest r with cdfRef[r] >= cdfTgt[v]. */
function buildLut(cdfTgt: Float64Array, cdfRef: Float64Array): Uint8Array {
  const lut = new Uint8Array(256)
  let r = 0
  for (let v = 0; v < 256; v++) {
    while (r < 255 && cdfRef[r] < cdfTgt[v]) r++
    lut[v] = r
  }
  return lut
}

export async function matchColors(reference: Buffer, target: Buffer): Promise<Buffer> {
  try {
    const [ref, tgt, full] = await Promise.all([
      rawRgb(reference, HIST_MAX),
      rawRgb(target, HIST_MAX),
      rawRgb(target),
    ])
    const luts = [0, 1, 2].map(c =>
      buildLut(cdf256(tgt.data, tgt.info.channels, c), cdf256(ref.data, ref.info.channels, c)),
    )
    const { data, info } = full
    for (let i = 0; i < data.length; i += info.channels) {
      data[i] = luts[0][data[i]]
      data[i + 1] = luts[1][data[i + 1]]
      data[i + 2] = luts[2][data[i + 2]]
    }
    return await sharp(data, {
      raw: { width: info.width, height: info.height, channels: info.channels as 3 },
    }).png().toBuffer()
  } catch (e) {
    console.error('colour match failed; returning the AI output unmatched', e)
    return target
  }
}
