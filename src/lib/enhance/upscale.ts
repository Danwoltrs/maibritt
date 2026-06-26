import { fal } from '@fal-ai/client'

/** Optional, non-generative crisp upscale. Off unless ENHANCE_UPSCALE=1. */
export async function maybeUpscale(input: Buffer, imageUrl?: string): Promise<Buffer> {
  if (process.env.ENHANCE_UPSCALE !== '1' || !imageUrl) return input
  fal.config({ credentials: process.env.FAL_KEY })
  const result: any = await fal.subscribe('fal-ai/recraft/upscale/crisp', {
    input: { image_url: imageUrl },
    logs: false,
  })
  const url = result?.data?.image?.url ?? result?.image?.url
  if (!url) return input
  const resp = await fetch(url)
  return Buffer.from(await resp.arrayBuffer())
}
