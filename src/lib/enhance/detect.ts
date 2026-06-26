import { fal } from '@fal-ai/client'
import sharp from 'sharp'
import { maskToRotatedRect } from './geometry'
import type { RotatedRect } from './types'

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
  const rect = maskToRotatedRect(data, info.width, info.height, 127)
  return { rect, maskWidth: info.width, maskHeight: info.height }
}
