import type { Block, Chapter, StoryDocument, StoryLook, WordKey } from './types'
import { DEFAULT_LOOK, cloneLook, isHex } from './look'
import { WORD_KEYS } from './words'

export function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

export function createEmptyDocument(): StoryDocument {
  return { version: 2, opening: { name: '', title: '', portrait: null, cover: null }, chapters: [], look: cloneLook(DEFAULT_LOOK) }
}

type Loose = {
  opening?: Partial<StoryDocument['opening']>
  chapters?: unknown
  look?: { fonts?: Partial<StoryLook['fonts']>; colors?: Partial<StoryLook['colors']>; words?: Record<string, unknown> }
}

/** Accepts whatever the database holds (null, version 1, a partial version 2) and returns a complete version-2 document. */
export function normalizeDocument(raw: unknown): StoryDocument {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Loose
  const base = createEmptyDocument()
  const colors = { ...base.look.colors }
  for (const key of Object.keys(colors) as (keyof typeof colors)[]) {
    const value = r.look?.colors?.[key]
    if (isHex(value)) colors[key] = value.toLowerCase()
  }
  const fonts = { ...base.look.fonts }
  if (typeof r.look?.fonts?.heading === 'string') fonts.heading = r.look.fonts.heading
  if (typeof r.look?.fonts?.body === 'string') fonts.body = r.look.fonts.body
  const words: Partial<Record<WordKey, string>> = {}
  for (const key of WORD_KEYS) {
    const value = r.look?.words?.[key]
    if (typeof value === 'string') words[key] = value
  }
  return {
    version: 2,
    opening: { ...base.opening, ...(r.opening ?? {}) },
    chapters: Array.isArray(r.chapters) ? (r.chapters as Chapter[]) : [],
    look: { fonts, colors, words },
  }
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function mapChapter(doc: StoryDocument, chapterId: string, fn: (c: Chapter) => Chapter): StoryDocument {
  return { ...doc, chapters: doc.chapters.map((c) => (c.id === chapterId ? fn(clone(c)) : c)) }
}

function clampedMove<T>(items: T[], from: number, delta: number): T[] {
  const to = Math.max(0, Math.min(items.length - 1, from + delta))
  if (from < 0 || to === from) return items
  const next = items.slice()
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

export function addChapter(doc: StoryDocument, title: string): { doc: StoryDocument; chapterId: string } {
  const chapterId = newId()
  return { doc: { ...doc, chapters: [...doc.chapters, { id: chapterId, title, blocks: [] }] }, chapterId }
}

export function renameChapter(doc: StoryDocument, chapterId: string, title: string): StoryDocument {
  return mapChapter(doc, chapterId, (c) => ({ ...c, title }))
}

export function removeChapter(doc: StoryDocument, chapterId: string): StoryDocument {
  return { ...doc, chapters: doc.chapters.filter((c) => c.id !== chapterId) }
}

export function moveChapter(doc: StoryDocument, chapterId: string, delta: number): StoryDocument {
  const from = doc.chapters.findIndex((c) => c.id === chapterId)
  return { ...doc, chapters: clampedMove(doc.chapters, from, delta) }
}

export function insertBlock(doc: StoryDocument, chapterId: string, index: number, block: Block): StoryDocument {
  return mapChapter(doc, chapterId, (c) => {
    const blocks = c.blocks.slice()
    blocks.splice(Math.max(0, Math.min(blocks.length, index)), 0, clone(block))
    return { ...c, blocks }
  })
}

export function updateBlock(doc: StoryDocument, chapterId: string, blockId: string, block: Block): StoryDocument {
  return mapChapter(doc, chapterId, (c) => ({
    ...c,
    blocks: c.blocks.map((b) => (b.id === blockId ? clone({ ...block, id: blockId }) : b)),
  }))
}

export function removeBlock(doc: StoryDocument, chapterId: string, blockId: string): StoryDocument {
  return mapChapter(doc, chapterId, (c) => ({ ...c, blocks: c.blocks.filter((b) => b.id !== blockId) }))
}

export function moveBlock(doc: StoryDocument, chapterId: string, blockId: string, delta: number): StoryDocument {
  return mapChapter(doc, chapterId, (c) => {
    const from = c.blocks.findIndex((b) => b.id === blockId)
    return { ...c, blocks: clampedMove(c.blocks, from, delta) }
  })
}

export function reorderBlocks(doc: StoryDocument, chapterId: string, orderedIds: string[]): StoryDocument {
  return mapChapter(doc, chapterId, (c) => {
    const byId = new Map(c.blocks.map((b) => [b.id, b]))
    const ordered = orderedIds.map((id) => byId.get(id)).filter((b): b is Block => Boolean(b))
    const missing = c.blocks.filter((b) => !orderedIds.includes(b.id))
    return { ...c, blocks: [...ordered, ...missing] }
  })
}

export function findBlock(
  doc: StoryDocument,
  blockId: string
): { chapterId: string; index: number; block: Block } | null {
  for (const chapter of doc.chapters) {
    const index = chapter.blocks.findIndex((b) => b.id === blockId)
    if (index >= 0) return { chapterId: chapter.id, index, block: chapter.blocks[index] }
  }
  return null
}
