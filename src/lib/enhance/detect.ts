import { fal } from '@fal-ai/client'
import sharp from 'sharp'
import { maskToQuad } from './geometry'
import { detectContentBounds, clampQuadToBounds } from './content'
import { isValidQuad } from './quad'
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
  const margin = Number(process.env.ENHANCE_DETECT_MARGIN ?? 0.015)
  const snap = Number(process.env.ENHANCE_DETECT_SNAP ?? 0)
  let quad = maskToQuad(data, info.width, info.height, 127, margin, snap)

  // Content trim — independent of BiRefNet. A vivid painting on a near-white wall:
  // clamp the quad to the photo's saturated content so the box hugs the canvas even
  // when the mask swallowed the wall or fell back to the full frame. Capped so it can
  // never eat into the art; falls through to the raw quad on any failure or if the
  // clamp would degenerate it. Off via ENHANCE_CONTENT_TRIM=0.
  if (process.env.ENHANCE_CONTENT_TRIM !== '0') {
    try {
      const origBuf = Buffer.from(await (await fetch(imageUrl)).arrayBuffer())
      const bounds = await detectContentBounds(origBuf)
      const trimmed = clampQuadToBounds(quad, bounds)
      if (isValidQuad(trimmed, 0.02)) quad = trimmed
    } catch (e) {
      console.error('content trim failed; using the mask quad', e)
    }
  }
  return { quad, maskWidth: info.width, maskHeight: info.height }
}
