import { runFalImageEdit } from './falImage'

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
 * taut and evenly lit. This is the strongest tier and the most likely to actually
 * remove BOTH the wave shading and the apparent bowing in one shot — but it
 * RE-SYNTHESIZES pixels, so it may slightly alter the artwork (desaturate the red,
 * soften strokes). OFF by default, labelled "may repaint", judged per-image.
 *
 * `guidance_scale` trades prompt-adherence against faithfulness; keep it low for a
 * subtle edit. Model id + guidance are overridable via env for prod tuning without
 * a redeploy. Falls back to the input unchanged on any failure.
 */
export async function aiFlattenGenerative(input: Buffer): Promise<Buffer> {
  const model = process.env.ENHANCE_FLATTEN_MODEL ?? 'fal-ai/qwen-image-edit-2511'
  const guidance = Number(process.env.ENHANCE_FLATTEN_GUIDANCE ?? 2.5)
  return runFalImageEdit(
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
}
