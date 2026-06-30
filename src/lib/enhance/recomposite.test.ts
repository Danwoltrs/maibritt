import { describe, it, expect } from 'vitest'
import sharp from 'sharp'
import { recompositeLowFreq } from './recomposite'

describe('recompositeLowFreq', () => {
  it('keeps original high-frequency detail (signature) but adopts the edited low-frequency look', async () => {
    const w = 200, h = 200

    // Original: a red field with a broad vertical brightness gradient (low-freq) and
    // a sharp bright dot at (150,150) standing in for the artist's signature (high-freq).
    const orig = Buffer.alloc(w * h * 3)
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const p = (y * w + x) * 3, k = 0.7 + 0.3 * (y / h)
      orig[p] = Math.round(180 * k); orig[p + 1] = Math.round(40 * k); orig[p + 2] = Math.round(40 * k)
    }
    for (let y = 146; y <= 154; y++) for (let x = 146; x <= 154; x++) {
      const p = (y * w + x) * 3; orig[p] = 255; orig[p + 1] = 255; orig[p + 2] = 255
    }
    const origImg = await sharp(orig, { raw: { width: w, height: h, channels: 3 } }).png().toBuffer()

    // "Edited": a perfectly FLAT red field — the gradient evened out (the taut look) and
    // the signature dot erased (what the generative model did).
    const flat = Buffer.alloc(w * h * 3)
    for (let i = 0; i < flat.length; i += 3) { flat[i] = 160; flat[i + 1] = 35; flat[i + 2] = 35 }
    const editImg = await sharp(flat, { raw: { width: w, height: h, channels: 3 } }).png().toBuffer()

    const out = await recompositeLowFreq(origImg, editImg)
    const outRaw = await sharp(out).removeAlpha().raw().toBuffer()

    // High-freq preserved: the dot still stands out strongly vs. the field on its row.
    const dot = outRaw[(150 * w + 150) * 3]
    const field = outRaw[(150 * w + 100) * 3]
    expect(dot - field).toBeGreaterThan(40)

    // Low-freq adopted: the broad gradient is flattened toward the edited (flat) look.
    const blurStd = async (b: Buffer) => (await sharp(b).blur(20).stats()).channels[0].stdev
    expect(await blurStd(out)).toBeLessThan(await blurStd(origImg))
  })
})
