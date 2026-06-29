import { fal } from '@fal-ai/client'

/**
 * Optional AI de-warp (DocRes) — straightens the geometric undulation of a slack
 * canvas by RESAMPLING (moving) pixels. It does not repaint, so colours stay
 * faithful; but the predicted warp is unreliable on a near-uniform / textureless
 * field (the net is trained on documents), so it can bend real brush content.
 * Therefore it is OPT-IN and judged per-image by the artist in the before/after.
 *
 * The pipeline holds a Buffer at this stage, so we upload it to fal storage to get
 * a URL the model can read. Any failure (no FAL_KEY, network, empty result) falls
 * back to the input unchanged — de-warp must never fail the whole enhance.
 */
export async function dewarpDocRes(input: Buffer): Promise<Buffer> {
  if (!process.env.FAL_KEY) return input
  const model = process.env.ENHANCE_DEWARP_MODEL ?? 'fal-ai/docres/dewarp'
  try {
    fal.config({ credentials: process.env.FAL_KEY })
    const uploadUrl: string = await fal.storage.upload(new Blob([new Uint8Array(input)], { type: 'image/png' }))
    const result: any = await fal.subscribe(model, { input: { image_url: uploadUrl }, logs: false })
    const url = result?.data?.image?.url ?? result?.image?.url
    if (!url) return input
    const resp = await fetch(url)
    return Buffer.from(await resp.arrayBuffer())
  } catch (e) {
    console.error('dewarpDocRes failed; returning un-dewarped image', e)
    return input
  }
}
