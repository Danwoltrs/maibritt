import type { BlockKind } from '@/lib/story/types'

export type Screen =
  | { kind: 'overview' }
  | { kind: 'opening' }
  | { kind: 'name-chapter'; chapterId?: string }
  | { kind: 'text'; chapterId: string; insertIndex: number; blockId?: string }
  | { kind: 'photos'; mode: 'photo' | 'gallery' | 'slideshow'; chapterId: string; insertIndex: number; blockId?: string }
  | { kind: 'record'; chapterId: string; insertIndex: number; blockId?: string }
  | { kind: 'video'; chapterId: string; insertIndex: number; blockId?: string }

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
