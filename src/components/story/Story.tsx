'use client'

import { useCallback, useRef } from 'react'
import type { Block, StoryDocument } from '@/lib/story/types'
import { SoundProvider, useSound } from './SoundProvider'
import { StoryChrome } from './StoryChrome'
import { Opening } from './Opening'
import { TextBlock } from './blocks/TextBlock'

export function chapterLabel(index: number, title: string): string {
  const words = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve']
  const n = words[index] ?? String(index + 1)
  return title ? `Chapter ${n} · ${title}` : `Chapter ${n}`
}

function renderBlock(block: Block, label: string) {
  switch (block.kind) {
    case 'text':
      return <TextBlock key={block.id} block={block} chapterLabel={label} />
    default:
      return null
  }
}

function StoryBody({ document }: { document: StoryDocument }) {
  const { begin } = useSound()
  const firstChapter = useRef<HTMLDivElement>(null)

  const onBegin = useCallback(() => {
    begin()
    firstChapter.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [begin])

  return (
    <div className="story-theme">
      <StoryChrome onDark={false} />
      <Opening opening={document.opening} onBegin={onBegin} />
      {document.chapters.map((chapter, i) => (
        <div key={chapter.id} ref={i === 0 ? firstChapter : undefined}>
          {chapter.blocks.map((block) => renderBlock(block, chapterLabel(i, chapter.title)))}
        </div>
      ))}
    </div>
  )
}

export function Story({ document }: { document: StoryDocument }) {
  return (
    <SoundProvider>
      <StoryBody document={document} />
    </SoundProvider>
  )
}
