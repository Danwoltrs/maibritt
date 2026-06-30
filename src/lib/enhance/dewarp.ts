import { runFalImageEdit } from './falImage'

/**
 * Optional AI de-warp (DocRes) — straightens the geometric undulation of a slack
 * canvas by RESAMPLING (moving) pixels. It does not repaint, so colours stay
 * faithful; but the predicted warp is unreliable on a near-uniform / textureless
 * field (the net is trained on documents), so it can do little — or occasionally
 * bend real brush content. Therefore it is OPT-IN and judged per-image.
 * Falls back to the input unchanged on any failure.
 */
export async function dewarpDocRes(input: Buffer): Promise<Buffer> {
  const model = process.env.ENHANCE_DEWARP_MODEL ?? 'fal-ai/docres/dewarp'
  return runFalImageEdit(
    input,
    model,
    (imageUrl) => ({ image_url: imageUrl }),
    (r) => r?.data?.image?.url ?? r?.image?.url,
  )
}
