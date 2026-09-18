'use client'

import type { Block, SectionLayout, StoryDocument } from '@/lib/story/types'
import type { ArrangeTarget } from '@/lib/story/layout'
import { chapterLabel, voiceLabel, wordsFor } from '@/lib/story/words'
import { Opening } from '@/components/story/Opening'
import { TextBlock } from '@/components/story/blocks/TextBlock'
import { PhotoBlock } from '@/components/story/blocks/PhotoBlock'
import { SlideshowBlock } from '@/components/story/blocks/SlideshowBlock'
import { AudioBlock } from '@/components/story/blocks/AudioBlock'
import { VideoBlock } from '@/components/story/blocks/VideoBlock'
import { GalleryBlock } from '@/components/story/blocks/GalleryBlock'

export type Section =
  | { kind: 'opening' }
  | { kind: 'block'; block: Block; chapterIndex: number; chapterTitle: string }

export function findSection(doc: StoryDocument, target: ArrangeTarget): Section | null {
  if (target.type === 'opening') return { kind: 'opening' }
  const chapterIndex = doc.chapters.findIndex((c) => c.id === target.chapterId)
  const chapter = doc.chapters[chapterIndex]
  const block = chapter?.blocks.find((b) => b.id === target.blockId)
  if (!chapter || !block) return null
  return { kind: 'block', block, chapterIndex, chapterTitle: chapter.title }
}

export function sectionName(section: Section): string {
  if (section.kind === 'opening') return 'Opening screen'
  const labels: Record<Block['kind'], string> = {
    text: 'Words',
    photo: 'Photo',
    gallery: 'Photo gallery',
    slideshow: 'Slideshow',
    audio: 'Voice recording',
    video: 'Video',
  }
  return labels[section.block.kind]
}

/**
 * The real thing: the same components the published page renders, with the
 * layout she is working on. Nothing here is a stand-in, so what she designs is
 * what a visitor gets.
 */
export function SectionRender({ doc, section, layout }: { doc: StoryDocument; section: Section; layout?: SectionLayout }) {
  const words = wordsFor(doc.look)

  if (section.kind === 'opening') {
    return <Opening opening={{ ...doc.opening, layout }} words={words} onBegin={() => {}} />
  }

  const block = { ...section.block, layout } as Block
  const label = chapterLabel(section.chapterIndex, section.chapterTitle, words.chapterWord)
  const voice = voiceLabel(doc.opening.name, words.voiceLabel)

  switch (block.kind) {
    case 'text':
      return <TextBlock block={block} chapterLabel={label} />
    case 'photo':
      return <PhotoBlock block={block} chapterLabel={label} />
    case 'slideshow':
      return <SlideshowBlock block={block} chapterLabel={label} voiceLabel={voice} />
    case 'audio':
      return <AudioBlock block={block} voiceLabel={voice} ownWords={words.ownWords} readAlong={words.readAlong} />
    case 'video':
      return <VideoBlock block={block} chapterLabel={label} />
    case 'gallery':
      return <GalleryBlock block={block} />
  }
}
