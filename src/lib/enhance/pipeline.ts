import sharp from 'sharp'
import type { RotatedRect } from './types'
import { cropStraighten } from './crop'
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
  rect: RotatedRect,
  presetKey: string,
  opts: { workingMax?: number } = {},
): Promise<{ enhanced: Buffer; framed: Buffer }> {
  const preset = FRAME_PRESETS[presetKey] ?? FRAME_PRESETS['oak-floater']
  const workingMax = opts.workingMax ?? 2000

  const working = await toWorking(original, workingMax)
  const cropped = await cropStraighten(working, rect)
  const flattened = await flattenToTaut(cropped)
  const colored = await autoColorCorrect(flattened)
  const enhanced = await maybeUpscale(colored)
  const framed = await composeFrame(enhanced, preset)
  return { enhanced, framed }
}
