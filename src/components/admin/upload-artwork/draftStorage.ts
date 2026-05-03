import type { ArtworkDetails, CommonMetadata, ApplyToAll } from './types'

export const DRAFT_KEY = 'mbw-upload-draft-v1'
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000

export interface FileHint {
  name: string
  size: number
}

export interface DraftPayload {
  commonMeta: CommonMetadata
  applyToAll: ApplyToAll
  artworkDetails: Record<number, ArtworkDetails>
  fileHints: FileHint[]
}

interface StoredDraft extends DraftPayload {
  savedAt: string
}

export function saveDraft(payload: DraftPayload): void {
  if (typeof window === 'undefined') return
  const stored: StoredDraft = { ...payload, savedAt: new Date().toISOString() }
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(stored))
  } catch {
    // localStorage full or disabled — silently ignore
  }
}

export function loadDraft(): StoredDraft | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(DRAFT_KEY)
  if (!raw) return null
  let parsed: StoredDraft
  try {
    parsed = JSON.parse(raw) as StoredDraft
  } catch {
    return null
  }
  if (!parsed.savedAt) return null
  const age = Date.now() - new Date(parsed.savedAt).getTime()
  if (Number.isNaN(age) || age > MAX_AGE_MS) return null
  return parsed
}

export function clearDraft(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(DRAFT_KEY)
}

export function draftHasContent(draft: StoredDraft | null): boolean {
  if (!draft) return false
  return Object.values(draft.artworkDetails).some(
    (d) =>
      (d.titlePt || '').trim() ||
      (d.titleEn || '').trim() ||
      (d.descriptionPt || '').trim() ||
      (d.descriptionEn || '').trim()
  )
}
