import { fal } from '@fal-ai/client'
import sharp from 'sharp'
import { maskToRotatedRect } from './geometry'
import { fullFrameRect } from './cropEdit'
import type { RotatedRect } from './types'

/**
 * BiRefNet does *salient-object* segmentation. For a painting that fills the
 * frame it often locks onto a shape *inside* the artwork, yielding a tiny,
 * off-centre box. When the detected rect is implausibly small for a canvas,
 * fall back to a centred near-full box — a far better starting point that the
 * artist can then nudge. (The crop box is fully editable in the UI.)
 */
function sanitizeRect(rect: RotatedRect, w: number, h: number): RotatedRect {
  const areaFrac = (rect.width * rect.height) / (w * h)
  const tooSmall = areaFrac < 0.2 || rect.width < 0.25 * w || rect.height < 0.25 * h
  return tooSmall ? fullFrameRect(w, h, 0.92) : rect
}

let configured = false
function ensureConfigured() {
  if (!configured) {
    fal.config({ credentials: process.env.FAL_KEY })
    configured = true
  }
}

export async function detectPainting(
  imageUrl: string,
): Promise<{ rect: RotatedRect; maskWidth: number; maskHeight: number }> {
  ensureConfigured()
  const result: any = await fal.subscribe('fal-ai/birefnet/v2', {
    input: { image_url: imageUrl, mask_only: true },
    logs: false,
  })
  const maskUrl = result?.data?.image?.url ?? result?.image?.url
  if (!maskUrl) throw new Error('fal BiRefNet returned no mask URL')

  const resp = await fetch(maskUrl)
  const maskBuf = Buffer.from(await resp.arrayBuffer())
  const { data, info } = await sharp(maskBuf).greyscale().raw().toBuffer({ resolveWithObject: true })
  const raw = maskToRotatedRect(data, info.width, info.height, 127)
  const rect = sanitizeRect(raw, info.width, info.height)
  return { rect, maskWidth: info.width, maskHeight: info.height }
}
