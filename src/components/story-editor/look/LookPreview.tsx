'use client'

import { useEffect, useRef, useState } from 'react'
import { MotionConfig } from 'framer-motion'
import type { StoryDocument, StoryLook, TextBlock as TextBlockType } from '@/lib/story/types'
import { chapterLabel, wordsFor } from '@/lib/story/words'
import { StoryTheme } from '@/components/story/StoryTheme'
import { SoundProvider } from '@/components/story/SoundProvider'
import { Opening } from '@/components/story/Opening'
import { TextBlock } from '@/components/story/blocks/TextBlock'

const FRAME_WIDTH = 1280
const SCREEN_HEIGHT = 800

const SAMPLE: TextBlockType = {
  id: 'sample',
  kind: 'text',
  heading: 'How it all began',
  body: 'This is a sample of your reading text. Um dia de sol em Santos, et lille hus i Danmark.\n\nAdd a chapter with some words and it will appear here instead.',
}

export function LookPreview({ document, look }: { document: StoryDocument; look: StoryLook }) {
  const box = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0.3)
  useEffect(() => {
    const el = box.current
    if (!el) return
    const update = () => setScale(el.clientWidth / FRAME_WIDTH)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const words = wordsFor(look)
  const firstChapter = document.chapters[0]
  const firstText = firstChapter?.blocks.find((b): b is TextBlockType => b.kind === 'text')
  const block = firstText ?? SAMPLE
  const label = chapterLabel(0, firstChapter?.title ?? 'Sample', words.chapterWord)
  const opening = document.opening.name ? document.opening : { ...document.opening, name: 'Your name' }

  return (
    <div ref={box} className="max-h-[240px] w-full overflow-hidden rounded-[14px] md:max-h-none" style={{ border: '2px solid var(--line)', height: SCREEN_HEIGHT * 2 * scale, pointerEvents: 'none' }} aria-hidden="true">
      <div style={{ width: FRAME_WIDTH, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        <MotionConfig reducedMotion="always">
          <SoundProvider>
            <StoryTheme look={look}>
              <div style={{ height: SCREEN_HEIGHT, overflow: 'hidden' }}>
                <Opening opening={opening} words={words} onBegin={() => {}} />
              </div>
              <div style={{ height: SCREEN_HEIGHT, overflow: 'hidden' }}>
                <TextBlock block={block} chapterLabel={label} />
              </div>
            </StoryTheme>
          </SoundProvider>
        </MotionConfig>
      </div>
    </div>
  )
}
