'use client'

import { useRef, type ReactNode } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import type { PhotoBlock as PhotoBlockType } from '@/lib/story/types'
import { Arranged } from '../Arranged'
import { ChapterLabel } from './TextBlock'

const CAPTION_SIZE = { large: 'text-[24px] md:text-[34px]', video: 'text-[22px] md:text-[30px]', small: 'text-[22px] md:text-[26px]' }

export function DarkCaption({ text, size = 'large' }: { text: string; size?: keyof typeof CAPTION_SIZE }) {
  if (!text) return null
  const cls = CAPTION_SIZE[size]
  return <p className={`story-serif m-0 italic leading-tight ${cls}`} style={{ color: 'var(--on-backdrop)' }}>{text}</p>
}

export function photoTiles(block: PhotoBlockType, chapterLabel: string): Record<string, ReactNode> {
  return {
    label: chapterLabel ? <ChapterLabel text={chapterLabel} onDark /> : null,
    caption: block.caption ? <DarkCaption text={block.caption} /> : null,
  }
}

export function PhotoBlock({ block, chapterLabel }: { block: PhotoBlockType; chapterLabel: string }) {
  const ref = useRef<HTMLElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], ['-6%', '6%'])
  const tiles = photoTiles(block, chapterLabel)

  return (
    <section ref={ref} className={`story-grain story-vignette relative w-full overflow-hidden ${block.layout ? 'min-h-[100svh]' : 'h-[100svh]'}`} style={{ background: 'var(--backdrop)' }}>
      <motion.img src={block.image.url} alt={block.caption} className="story-photo absolute left-0 top-[-6%] h-[112%] w-full object-cover" style={reduce ? undefined : { y }} />
      <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(20,14,10,0.12) 0%, rgba(20,14,10,0) 40%, rgba(20,14,10,0.62) 100%)' }} />
      <Arranged layout={block.layout} tiles={tiles} stackJustify="end">
        <div className="absolute left-6 top-8 z-10 md:left-10">{tiles.label}</div>
        {block.caption && (
          <motion.div
            initial={{ opacity: 0, y: reduce ? 0 : 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            className="absolute bottom-12 left-6 right-6 z-10 flex max-w-[720px] flex-col gap-2 md:bottom-[88px] md:left-24"
          >
            {tiles.caption}
          </motion.div>
        )}
      </Arranged>
    </section>
  )
}
