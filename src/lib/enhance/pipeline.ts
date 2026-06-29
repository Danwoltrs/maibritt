import sharp from 'sharp'
import type { Quad } from './types'
import { warpToRect } from './warp'
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
  opts: { workingMax?: number } = {},
): Promise<{ enhanced: Buffer; framed: Buffer }> {
  const preset = FRAME_PRESETS[presetKey] ?? FRAME_PRESETS['oak-floater']
  const workingMax = opts.workingMax ?? 2000

  const working = await toWorking(original, workingMax)
  // De-keystone: warp the canvas quad to a straight rectangle (crop + straighten
  // + perspective correction in one geometric resample).
  const dewarped = await warpToRect(working, quad)
  const flattened = await flattenToTaut(dewarped)
  const colored = await autoColorCorrect(flattened)
  const enhanced = await maybeUpscale(colored)

  // Framing is optional downstream; never let it fail the whole enhance.
  let framed = enhanced
  try {
    framed = await composeFrame(enhanced, preset)
  } catch (e) {
    console.error('composeFrame failed; returning unframed enhanced image', e)
  }
  return { enhanced, framed }
}
