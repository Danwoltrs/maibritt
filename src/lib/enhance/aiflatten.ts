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
 * taut and evenly lit. The model evens the lighting and removes the wavy look, but it
 * RE-SYNTHESIZES pixels, so it also hallucinates fine texture ("scratches") and erases
 * real detail (e.g. a signature). To keep it faithful we transfer only the model's
 * LOW-frequency change (the flattening) back onto the original's high-frequency detail
 * via recompositeLowFreq — adopting the taut look while discarding invented texture and
 * restoring erased detail.
 *
 * OFF by default, labelled "may repaint", judged per-image. `guidance_scale` trades
 * prompt-adherence against faithfulness; model id + guidance + the recomposite cutoff
 * are env-overridable for prod tuning. Falls back to the input unchanged on any failure
 * (and skips the recomposite when the model call no-ops).
 */
export async function aiFlattenGenerative(input: Buffer): Promise<Buffer> {
  const model = process.env.ENHANCE_FLATTEN_MODEL ?? 'fal-ai/qwen-image-edit-2511'
  const guidance = Number(process.env.ENHANCE_FLATTEN_GUIDANCE ?? 2.5)
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
    }),
    (r) => r?.data?.images?.[0]?.url ?? r?.images?.[0]?.url,
  )
  if (edited === input) return input // model no-op'd / failed → nothing to recomposite
  const sigmaFrac = Number(process.env.ENHANCE_FLATTEN_DETAIL_SIGMA ?? 0.025)
  try {
    return await recompositeLowFreq(input, edited, sigmaFrac)
  } catch (e) {
    console.error('recomposite failed; returning the raw AI flatten', e)
    return edited
  }
}
