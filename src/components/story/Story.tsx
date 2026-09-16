'use client'

import { useCallback, useRef } from 'react'
import type { Block, StoryDocument, WordKey } from '@/lib/story/types'
import { chapterLabel, voiceLabel, wordsFor } from '@/lib/story/words'
import { SoundProvider, useSound } from './SoundProvider'
import { StoryChrome } from './StoryChrome'
import { StoryTheme } from './StoryTheme'
import { Opening } from './Opening'
import { TextBlock } from './blocks/TextBlock'
import { PhotoBlock } from './blocks/PhotoBlock'
import { GalleryBlock } from './blocks/GalleryBlock'
import { AudioBlock } from './blocks/AudioBlock'
import { SlideshowBlock } from './blocks/SlideshowBlock'
import { VideoBlock } from './blocks/VideoBlock'

type Words = Record<WordKey, string>

function renderBlock(block: Block, label: string, voice: string, words: Words) {
  switch (block.kind) {
    case 'text':
      return <TextBlock key={block.id} block={block} chapterLabel={label} />
    case 'photo':
      return <PhotoBlock key={block.id} block={block} chapterLabel={label} />
    case 'gallery':
      return <GalleryBlock key={block.id} block={block} />
    case 'audio':
      return <AudioBlock key={block.id} block={block} voiceLabel={voice} ownWords={words.ownWords} readAlong={words.readAlong} />
    case 'slideshow':
      return <SlideshowBlock key={block.id} block={block} chapterLabel={label} voiceLabel={voice} />
    case 'video':
      return <VideoBlock key={block.id} block={block} chapterLabel={label} />
    default:
      return null
  }
}

function StoryBody({ document, preview }: { document: StoryDocument; preview: boolean }) {
  const { begin } = useSound()
  const firstChapter = useRef<HTMLDivElement>(null)
  const words = wordsFor(document.look)
  const voice = voiceLabel(document.opening.name, words.voiceLabel)

  const onBegin = useCallback(() => {
    begin()
    firstChapter.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [begin])

  return (
    <StoryTheme look={document.look}>
      <StoryChrome onDark={false} preview={preview} soundOn={words.soundOn} soundOff={words.soundOff} />
      <Opening opening={document.opening} words={words} onBegin={onBegin} />
      {document.chapters.map((chapter, i) => (
        <div key={chapter.id} ref={i === 0 ? firstChapter : undefined}>
          {chapter.blocks.map((block) => renderBlock(block, chapterLabel(i, chapter.title, words.chapterWord), voice, words))}
        </div>
      ))}
    </StoryTheme>
  )
}

export function Story({ document, preview = false }: { document: StoryDocument; preview?: boolean }) {
  return (
    <SoundProvider>
      {preview && (
        <div className="sticky top-0 z-[60] flex h-[72px] items-center justify-between px-6 md:px-12" style={{ background: 'var(--ink)', color: 'var(--white)' }}>
          <span className="text-[18px] md:text-[20px]">This is exactly what visitors will see</span>
          <a href="/story/edit" className="se-btn se-btn-secondary se-btn-small" style={{ background: 'transparent', color: 'var(--white)', borderColor: 'var(--white)' }}>
            Back to editing
          </a>
        </div>
      )}
      <StoryBody document={document} preview={preview} />
    </SoundProvider>
  )
}
