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
  // BiRefNet tends to under-segment a frame-filling canvas, which would crop into
  // the painting. Expand the quad outward a little, and snap it to the photo border
  // when the canvas already bleeds to the edge. Both tunable via env.
  const margin = Number(process.env.ENHANCE_DETECT_MARGIN ?? 0.03)
  const snap = Number(process.env.ENHANCE_DETECT_SNAP ?? 0.04)
  const quad = maskToQuad(data, info.width, info.height, 127, margin, snap)
  return { quad, maskWidth: info.width, maskHeight: info.height }
}
