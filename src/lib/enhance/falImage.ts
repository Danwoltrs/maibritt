import { fal } from '@fal-ai/client'

/**
 * Shared plumbing for the opt-in fal image steps (AI dewarp, AI flatten):
 * upload the in-pipeline Buffer to fal storage, run an image model, fetch the
 * result back as a Buffer. Returns the INPUT unchanged on any failure (no
 * FAL_KEY, network error, empty result) — these steps must never fail the enhance.
 */
export async function runFalImageEdit(
  input: Buffer,
  model: string,
  buildInput: (imageUrl: string) => Record<string, unknown>,
  pickUrl: (result: any) => string | undefined,
): Promise<Buffer> {
  if (!process.env.FAL_KEY) return input
  try {
    fal.config({ credentials: process.env.FAL_KEY })
    const uploadUrl: string = await fal.storage.upload(new Blob([new Uint8Array(input)], { type: 'image/png' }))
    const result: any = await fal.subscribe(model, { input: buildInput(uploadUrl), logs: false })
    const url = pickUrl(result)
    if (!url) return input
    const resp = await fetch(url)
    return Buffer.from(await resp.arrayBuffer())
  } catch (e) {
    console.error(`fal image edit (${model}) failed; returning input unchanged`, e)
    return input
  }
}
