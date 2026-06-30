import sharp from 'sharp'

/**
 * Transfer ONLY the low-frequency change from `edited` onto `original`, keeping the
 * original's high-frequency detail (brushwork, signature, sharp edges) intact:
 *
 *   result = original + lowpass(edited − original)
 *
 * This makes a generative flatten faithful. A model like Qwen-Image-Edit evens the
 * lighting and removes the wavy look (a LOW-frequency improvement) but also
 * hallucinates fine texture ("scratches") and erases real detail (a signature) —
 * both HIGH-frequency. By transferring only the smooth (blurred) difference, we
 * adopt the taut, evenly-lit look while discarding the model's invented texture and
 * restoring detail it destroyed. `edited` is resized to the original's dimensions
 * first so the pixels line up.
 */
export async function recompositeLowFreq(original: Buffer, edited: Buffer, sigmaFrac = 0.025): Promise<Buffer> {
  const meta = await sharp(original).metadata()
  const w = meta.width!, h = meta.height!
  const sigma = Math.max(Math.max(w, h) * sigmaFrac, 3)

  const origRgb = await sharp(original, { failOn: 'none' }).removeAlpha().raw().toBuffer()
  const blurOrig = await sharp(original, { failOn: 'none' }).removeAlpha().blur(sigma).raw().toBuffer()
  const blurEdit = await sharp(edited, { failOn: 'none' })
    .removeAlpha().resize(w, h, { fit: 'fill' }).blur(sigma).raw().toBuffer()

  const out = Buffer.alloc(origRgb.length)
  for (let i = 0; i < origRgb.length; i++) {
    const v = origRgb[i] + (blurEdit[i] - blurOrig[i]) // original detail + AI's smooth illumination change
    out[i] = v > 255 ? 255 : v < 0 ? 0 : v
  }

  return sharp(out, { raw: { width: w, height: h, channels: 3 }, failOn: 'none' })
    .keepIccProfile()
    .png()
    .toBuffer()
}
