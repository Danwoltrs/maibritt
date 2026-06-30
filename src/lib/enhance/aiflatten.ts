import sharp from 'sharp'
import { runFalImageEdit } from './falImage'
import { recompositeLowFreq } from './recomposite'

// Strong preserve-prompt: the goal is to make the canvas LOOK taut and evenly lit
// while changing the artwork as little as possible. This is the higher-risk tier —
// the model re-synthesizes pixels, so it CAN drift (desaturate, soften brushwork).
const FLATTEN_PROMPT =
  'Retouch this photograph of a painting so the canvas looks perfectly flat and taut, ' +
  'lit evenly and frontally, with the wavy undulations, ripples and uneven shadows of the ' +
  'loose canvas removed. Preserve the artwork exactly: keep every colour, hue, tone and ' +
  'brushstroke identical to the original; do not repaint, recolour, restyle, add or remove anything.'

const FLATTEN_NEG =
  'recoloured, desaturated, washed out, hue shift, brighter, new shapes, added objects, ' +
  'distorted drawing, smoothed brushwork, painterly filter, illustration, text, watermark, frame, border'

/**
 * Optional GENERATIVE AI flatten (Qwen-Image-Edit) — re-renders the painting to look
 * taut and evenly lit. It RE-SYNTHESIZES pixels, so it may slightly alter the artwork
 * (a little invented texture, softened detail). OFF by default, labelled "may repaint",
 * judged per-image. We pass `image_size` = the original's dimensions so the output keeps
 * the same framing (no zoom/reframe).
 *
 * `guidance_scale` trades prompt-adherence against faithfulness; lower = subtler/more
 * faithful. The low-freq recomposite (keep original detail, adopt only the AI's lighting)
 * is OPT-IN via ENHANCE_FLATTEN_RECOMPOSITE — on real paintings it can ring/halo around
 * high-contrast shapes, so the default is the raw model output. All env-overridable.
 * Falls back to the input unchanged on any model failure.
 */
export async function aiFlattenGenerative(input: Buffer): Promise<Buffer> {
  const model = process.env.ENHANCE_FLATTEN_MODEL ?? 'fal-ai/qwen-image-edit-2511'
  const guidance = Number(process.env.ENHANCE_FLATTEN_GUIDANCE ?? 2.5)
  const meta = await sharp(input).metadata().catch(() => null)
  const edited = await runFalImageEdit(
    input,
    model,
    (imageUrl) => ({
      image_urls: [imageUrl],
      prompt: FLATTEN_PROMPT,
      negative_prompt: FLATTEN_NEG,
      guidance_scale: guidance,
      num_images: 1,
      output_format: 'png',
      ...(meta?.width && meta?.height ? { image_size: { width: meta.width, height: meta.height } } : {}),
    }),
    (r) => r?.data?.images?.[0]?.url ?? r?.images?.[0]?.url,
  )
  if (edited === input) return input // model no-op'd / failed
  if (process.env.ENHANCE_FLATTEN_RECOMPOSITE === '1') {
    try {
      const sigmaFrac = Number(process.env.ENHANCE_FLATTEN_DETAIL_SIGMA ?? 0.025)
      return await recompositeLowFreq(input, edited, sigmaFrac)
    } catch (e) {
      console.error('recomposite failed; returning the raw AI flatten', e)
      return edited
    }
  }
  return edited
}
