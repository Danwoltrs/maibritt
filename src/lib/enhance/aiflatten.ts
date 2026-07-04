import sharp from 'sharp'
import { runFalImageEdit } from './falImage'
import { recompositeLowFreq } from './recomposite'
import { matchColors } from './colormatch'
import { padToSquare, cropFromSquare } from './squarepad'

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
 * judged per-image.
 *
 * The model reframes/clips non-square inputs (see squarepad.ts), so unless
 * ENHANCE_FLATTEN_SQUAREPAD=0 we pad the painting out to a square, edit that, and
 * crop the painting back out — any reframe lands in the throwaway margin.
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

  // Pad to a square so the model can't reframe the artwork off its long edge.
  const padded = process.env.ENHANCE_FLATTEN_SQUAREPAD === '0' ? null : await padToSquare(input)
  const modelInput = padded?.buffer ?? input
  const size = padded
    ? { width: padded.pad.side, height: padded.pad.side }
    : await sharp(input).metadata().then(m => (m.width && m.height ? { width: m.width, height: m.height } : null)).catch(() => null)

  const edited = await runFalImageEdit(
    modelInput,
    model,
    (imageUrl) => ({
      image_urls: [imageUrl],
      prompt: FLATTEN_PROMPT,
      negative_prompt: FLATTEN_NEG,
      guidance_scale: guidance,
      num_images: 1,
      output_format: 'png',
      ...(size ? { image_size: size } : {}),
    }),
    (r) => r?.data?.images?.[0]?.url ?? r?.images?.[0]?.url,
  )
  if (edited === modelInput) return input // model no-op'd / failed
  // Crop the painting back out of the square model output (restores framing).
  let result = padded ? await cropFromSquare(edited, padded.pad) : edited
  if (process.env.ENHANCE_FLATTEN_RECOMPOSITE === '1') {
    try {
      const sigmaFrac = Number(process.env.ENHANCE_FLATTEN_DETAIL_SIGMA ?? 0.025)
      // Recomposite against `result` (cropped back to the original framing), not
      // the padded square model output — both buffers must share dimensions.
      result = await recompositeLowFreq(input, result, sigmaFrac)
    } catch (e) {
      console.error('recomposite failed; returning the raw AI flatten', e)
    }
  }
  // Lock the palette back to the pre-AI image: even with the preserve prompt
  // Qwen drifts colours, and the artist's colours are non-negotiable. A global
  // histogram match restores them without touching the flattening (it has no
  // spatial component, so the removed waves cannot come back). Set
  // ENHANCE_FLATTEN_COLORMATCH=0 to disable.
  if (process.env.ENHANCE_FLATTEN_COLORMATCH !== '0') {
    result = await matchColors(input, result)
  }
  return result
}
