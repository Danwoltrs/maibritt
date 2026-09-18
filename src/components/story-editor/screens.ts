import type { BlockKind, StoryDocument } from '@/lib/story/types'
import { findBlock } from '@/lib/story/document'
import type { ArrangeTarget } from '@/lib/story/layout'

export type Screen =
  | { kind: 'overview' }
  | { kind: 'opening' }
  | { kind: 'name-chapter'; chapterId?: string }
  | { kind: 'text'; chapterId: string; insertIndex: number; blockId?: string }
  | { kind: 'photos'; mode: 'photo' | 'gallery' | 'slideshow'; chapterId: string; insertIndex: number; blockId?: string }
  | { kind: 'record'; chapterId: string; insertIndex: number; blockId?: string }
  | { kind: 'video'; chapterId: string; insertIndex: number; blockId?: string }
  | { kind: 'look' }
  | { kind: 'arrange'; target: ArrangeTarget }

export const BLOCK_KIND_LABEL: Record<BlockKind, string> = {
  text: 'Text',
  photo: 'Photo',
  gallery: 'Photo gallery',
  slideshow: 'Slideshow',
  audio: 'Voice recording',
  video: 'Video',
}

export function screenForKind(kind: BlockKind, chapterId: string, insertIndex: number, blockId?: string): Screen {
  switch (kind) {
    case 'text':
      return { kind: 'text', chapterId, insertIndex, blockId }
    case 'photo':
    case 'gallery':
    case 'slideshow':
      return { kind: 'photos', mode: kind, chapterId, insertIndex, blockId }
    case 'audio':
      return { kind: 'record', chapterId, insertIndex, blockId }
    case 'video':
      return { kind: 'video', chapterId, insertIndex, blockId }
  }
}

const KINDS: BlockKind[] = ['text', 'photo', 'gallery', 'slideshow', 'audio', 'video']

/**
 * Turns a deep link from the public story ("+ Add something here") into the
 * screen to open. `before=<blockId>` inserts at that block's place, `end=<chapterId>`
 * appends to that chapter, `new=chapter` starts a chapter. Anything that no longer
 * resolves against the draft returns null, so the editor just opens its overview.
 */
export function screenFromParams(params: URLSearchParams, doc: StoryDocument): Screen | null {
  if (params.get('new') === 'chapter') return { kind: 'name-chapter' }

  const kind = params.get('kind') as BlockKind | null
  if (!kind || !KINDS.includes(kind)) return null

  const before = params.get('before')
  if (before) {
    const found = findBlock(doc, before)
    return found ? screenForKind(kind, found.chapterId, found.index) : null
  }

  const end = params.get('end')
  if (end) {
    const chapter = doc.chapters.find((c) => c.id === end)
    return chapter ? screenForKind(kind, chapter.id, chapter.blocks.length) : null
  }

  return null
}
