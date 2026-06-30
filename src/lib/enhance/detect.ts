import { fal } from '@fal-ai/client'
import sharp from 'sharp'
import { maskToQuad } from './geometry'
import type { Quad } from './types'

let configured = false
function ensureConfigured() {
  if (!configured) {
    fal.config({ credentials: process.env.FAL_KEY })
    configured = true
  }
}

/**
 * Detect the canvas as a normalized quadrilateral. BiRefNet gives a foreground
 * mask; maskToQuad fits the four corners (and falls back to a near-full quad
 * when the mask is degenerate — e.g. a painting that fills the frame, where
 * BiRefNet can lock onto an interior shape).
 */
export async function detectPainting(
  imageUrl: string,
): Promise<{ quad: Quad; maskWidth: number; maskHeight: number }> {
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
  // BiRefNet tends to under-segment, which would crop into the painting. Expand the
  // quad outward a little so the auto-box errs toward including a sliver of
  // background (the artist drags in to trim) rather than cutting the art. Snapping
  // to the photo border is OFF by default — it over-extends when the painting has a
  // wall margin. Both tunable via env.
  const margin = Number(process.env.ENHANCE_DETECT_MARGIN ?? 0.04)
  const snap = Number(process.env.ENHANCE_DETECT_SNAP ?? 0)
  const quad = maskToQuad(data, info.width, info.height, 127, margin, snap)
  return { quad, maskWidth: info.width, maskHeight: info.height }
}
