import crypto from 'node:crypto'
import { defaultPresetForCategory, FRAME_PRESETS } from '@/lib/framing/presets'
import { AR_MODEL_VERSION, AR_CATEGORIES } from './constants'

export { AR_MODEL_VERSION, AR_CATEGORIES }

export type ArQualification =
  | { ok: true; heightCm: number; widthCm: number; imageUrl: string; presetKey: string }
  | { ok: false; reason: string }

/** row = raw artworks DB shape: { category, height_cm, width_cm, images }. */
export function qualifiesForAr(row: {
  category?: string
  height_cm?: unknown
  width_cm?: unknown
  images?: { original?: string; thumbnail?: string; display?: string; enhanced?: string; framePreset?: string }[]
}): ArQualification {
  if (!row.category || !(AR_CATEGORIES as readonly string[]).includes(row.category)) {
    return { ok: false, reason: 'category_not_flat' }
  }
  const heightCm = row.height_cm != null ? Number(row.height_cm) : NaN
  const widthCm = row.width_cm != null ? Number(row.width_cm) : NaN
  if (!Number.isFinite(heightCm) || !Number.isFinite(widthCm) || heightCm <= 0 || widthCm <= 0) {
    return { ok: false, reason: 'missing_dimensions' }
  }
  const img = row.images?.[0]
  // framed is never used here: its baked-in wall margin is wrong in real AR.
  const imageUrl = img?.enhanced || img?.display
  if (!imageUrl) return { ok: false, reason: 'no_image' }
  const presetKey = img?.framePreset && FRAME_PRESETS[img.framePreset]
    ? img.framePreset
    : defaultPresetForCategory(row.category)
  return { ok: true, heightCm, widthCm, imageUrl, presetKey }
}

export function arModelHash(input: {
  imageUrl: string
  heightCm: number
  widthCm: number
  presetKey: string
}): string {
  return crypto.createHash('sha256')
    .update([AR_MODEL_VERSION, input.imageUrl, input.heightCm, input.widthCm, input.presetKey].join('|'))
    .digest('hex')
    .slice(0, 16)
}
