'use client'

import type { ReactNode } from 'react'
import type { StoryDocument } from '@/lib/story/types'
import type { ArrangeTarget, SectionKind } from '@/lib/story/layout'
import { chapterLabel, voiceLabel, wordsFor } from '@/lib/story/words'
import { openingTiles } from '@/components/story/Opening'
import { textTiles, ChapterLabel } from '@/components/story/blocks/TextBlock'
import { photoTiles, DarkCaption } from '@/components/story/blocks/PhotoBlock'
import { audioTiles } from '@/components/story/blocks/AudioBlock'
import { videoTiles } from '@/components/story/blocks/VideoBlock'
import { AudioPlayer } from '@/components/story/AudioPlayer'

export type SectionContent = { kind: SectionKind; tiles: Record<string, ReactNode>; backdrop: { image: string | null; dark: boolean } }

/** The real content of one section, keyed by tile, plus what sits behind it on the canvas. */
export function sectionTiles(doc: StoryDocument, target: ArrangeTarget): SectionContent | null {
  const words = wordsFor(doc.look)
  if (target.type === 'opening') {
    return { kind: 'opening', tiles: openingTiles(doc.opening, words, () => {}), backdrop: { image: doc.opening.cover?.url ?? null, dark: true } }
  }
  const chapterIndex = doc.chapters.findIndex((c) => c.id === target.chapterId)
  const chapter = doc.chapters[chapterIndex]
  const block = chapter?.blocks.find((b) => b.id === target.blockId)
  if (!chapter || !block) return null
  const label = chapterLabel(chapterIndex, chapter.title, words.chapterWord)
  const voice = voiceLabel(doc.opening.name, words.voiceLabel)
  switch (block.kind) {
    case 'text':
      return { kind: 'text', tiles: textTiles(block, label), backdrop: { image: null, dark: false } }
    case 'photo':
      return { kind: 'photo', tiles: photoTiles(block, label), backdrop: { image: block.image.url, dark: true } }
    case 'audio':
      return { kind: 'audio', tiles: audioTiles(block, voice, words.ownWords, words.readAlong, false), backdrop: { image: null, dark: false } }
    case 'video':
      return { kind: 'video', tiles: videoTiles(block, label), backdrop: { image: block.source.type === 'upload' ? block.source.poster?.url ?? null : null, dark: true } }
    case 'slideshow':
      return {
        kind: 'slideshow',
        tiles: {
          label: <ChapterLabel text={label} onDark />,
          player: block.audio ? <AudioPlayer audio={block.audio} label={voice} onDark active={false} /> : null,
          caption: <DarkCaption text={block.images[0]?.caption ?? ''} size="small" />,
        },
        backdrop: { image: block.images[0]?.url ?? null, dark: true },
      }
    case 'gallery':
      return null
  }
}
