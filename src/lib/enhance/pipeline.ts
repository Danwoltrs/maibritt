import sharp from 'sharp'
import type { Quad } from './types'
import { warpToRect } from './warp'
import { dewarpDocRes } from './dewarp'
import { aiFlattenGenerative } from './aiflatten'
import { flattenToTaut } from './deshadow'
import { autoColorCorrect } from './color'
import { colorDelta, formatColorDelta } from './colorstats'
import { composeFrame } from '../framing/frame'
import { FRAME_PRESETS } from '../framing/presets'

async function toWorking(buf: Buffer, workingMax: number): Promise<Buffer> {
  const m = await sharp(buf).metadata()
  if (Math.max(m.width!, m.height!) <= workingMax) return buf
  return sharp(buf, { failOn: 'none' }).keepIccProfile()
    .resize({ width: workingMax, height: workingMax, fit: 'inside' }).png().toBuffer()
}

export async function enhanceToFramed(
  original: Buffer,
  quad: Quad,
  presetKey: string,
  // The default enhance = 4-corner warp (crop/straighten/de-keystone) + the
  // colour-safe de-wave (`flatten`, defaulted ON by the route). `dewarp`, `color`
  // and the generative `aiFlatten` are strictly opt-in. Calling this directly with
  // no `flatten` is geometry-only; the route supplies the default-on de-wave.
  opts: { workingMax?: number; dewarp?: boolean; flatten?: boolean; color?: boolean; aiFlatten?: boolean } = {},
): Promise<{ enhanced: Buffer; framed: Buffer; cropped: Buffer }> {
  const preset = FRAME_PRESETS[presetKey] ?? FRAME_PRESETS['oak-floater']
  const workingMax = opts.workingMax ?? 2000

  const working = await toWorking(original, workingMax)
  // De-keystone: warp the canvas quad to a straight rectangle (crop + straighten
  // + perspective correction in one geometric resample).
  const dewarped = await warpToRect(working, quad)
  let cleaned = dewarped
  // AI de-warp — only when the artist enables it. Moves pixels to straighten the
  // canvas undulation (geometry-only, paid); falls back to input on any failure.
  if (opts.dewarp) cleaned = await dewarpDocRes(cleaned)
  // De-wave: a band-stop flat-field correction that softens the wave SHADING. Hue
  // and saturation are mathematically untouched (per-pixel scalar gain) and the
  // overall brightness is mean-preserved, so NO colour changes; only local LIGHTNESS
  // moves, tightly clamped. This is ON by DEFAULT (the route defaults `flatten` true)
  // — it is the "make the canvas look taut" work, colour-safe by construction. All
  // dials are env-tunable (no redeploy). Toggling it off in the preview = pure crop.
  if (opts.flatten) {
    const preDewave = cleaned
    cleaned = await flattenToTaut(cleaned, {
      strength: Number(process.env.ENHANCE_DEWAVE_STRENGTH ?? 0.6),
      minGain: Number(process.env.ENHANCE_DEWAVE_MINGAIN ?? 0.9),
      maxGain: Number(process.env.ENHANCE_DEWAVE_MAXGAIN ?? 1.12),
    })
    // Verify (don't assume) the de-wave stayed colour-safe; surface the numbers.
    try {
      const d = await colorDelta(preDewave, cleaned)
      console.log(formatColorDelta('de-wave', d))
    } catch { /* logging must never fail the enhance */ }
  }
  // Hue-preserving exposure lift — only when the artist enables "Auto colour".
  if (opts.color) cleaned = await autoColorCorrect(cleaned)
  // Generative AI flatten — strongest, may repaint. Last cleanup before framing.
  if (opts.aiFlatten) cleaned = await aiFlattenGenerative(cleaned)
  const enhanced = cleaned

  // Framing is optional downstream; never let it fail the whole enhance.
  let framed = enhanced
  try {
    framed = await composeFrame(enhanced, preset)
  } catch (e) {
    console.error('composeFrame failed; returning unframed enhanced image', e)
  }
  // `dewarped` is the geometry-only result (warp = crop + straighten + perspective,
  // no AI/flatten/colour). Surface it as `cropped` so the preview can show crop-vs-AI
  // side by side — letting the artist tell whether the crop or the AI flatten changed
  // the framing.
  return { enhanced, framed, cropped: dewarped }
}
