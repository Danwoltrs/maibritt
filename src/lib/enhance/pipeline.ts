import sharp from 'sharp'
import type { Quad } from './types'
import { warpToRect } from './warp'
import { dewarpDocRes } from './dewarp'
import { aiFlattenGenerative } from './aiflatten'
import { flattenToTaut } from './deshadow'
import { autoColorCorrect } from './color'
import { maybeUpscale } from './upscale'
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
  // dewarp / flatten / colour / aiFlatten are all OPT-IN. The default enhance is
  // geometry-only (4-corner warp + crop + straighten + optional frame) so the
  // artist's colours stay faithful.
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
  // Flat-field lighting correction — only when the artist enables it (a slack
  // canvas photographed under uneven light); hue-preserving, brightness only.
  if (opts.flatten) cleaned = await flattenToTaut(cleaned)
  // Hue-preserving exposure lift — only when the artist enables "Auto colour".
  if (opts.color) cleaned = await autoColorCorrect(cleaned)
  // Generative AI flatten — strongest, may repaint. Last cleanup before framing.
  if (opts.aiFlatten) cleaned = await aiFlattenGenerative(cleaned)
  const enhanced = await maybeUpscale(cleaned)

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
