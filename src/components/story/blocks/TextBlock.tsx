'use client'

import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import type { TextBlock as TextBlockType } from '@/lib/story/types'
import { Arranged } from '../Arranged'

export function paragraphs(body: string): string[] {
  return body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
}

function Reveal({ delay = 0, children }: { delay?: number; children: ReactNode }) {
  const reduce = useReducedMotion()
  return (
    <motion.div initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 1.2, delay, ease: 'easeOut' }}>
      {children}
    </motion.div>
  )
}

export function ChapterLabel({ text, onDark = false }: { text: string; onDark?: boolean }) {
  if (!text) return null
  if (onDark) return <span className="block text-[12px] uppercase tracking-[0.16em] md:text-[13px]" style={{ color: 'rgba(251,249,245,0.72)' }}>{text}</span>
  return (
    <span className="inline-flex items-center gap-4">
      <span className="h-px w-10" style={{ background: 'var(--accent)' }} />
      <span className="text-[13px] uppercase tracking-[0.2em] md:text-[14px]" style={{ color: 'var(--accent)' }}>{text}</span>
    </span>
  )
}

export function Heading({ text }: { text: string }) {
  if (!text) return null
  return <h2 className="story-serif m-0 text-[44px] font-medium leading-[1.02] md:text-[76px]" style={{ color: 'var(--ink)', letterSpacing: '-0.01em' }}>{text}</h2>
}

export function Body({ text }: { text: string }) {
  return (
    <div className="flex flex-col gap-5 text-[19px] leading-[1.65] md:text-[21px]" style={{ color: 'var(--ink)' }}>
      {paragraphs(text).map((p, i) => (
        <p key={i} className="m-0">{p}</p>
      ))}
    </div>
  )
}

export function textTiles(block: TextBlockType, chapterLabel: string): Record<string, ReactNode> {
  return {
    label: chapterLabel ? <Reveal><ChapterLabel text={chapterLabel} /></Reveal> : null,
    heading: block.heading ? <Reveal><Heading text={block.heading} /></Reveal> : null,
    body: <Reveal delay={0.3}><Body text={block.body} /></Reveal>,
  }
}

export function TextBlock({ block, chapterLabel }: { block: TextBlockType; chapterLabel: string }) {
  const tiles = textTiles(block, chapterLabel)
  return (
    <section className={`relative w-full ${block.layout ? 'min-h-[100svh]' : 'flex min-h-[100svh] items-center justify-center px-6 py-24 md:px-24'}`} style={{ background: 'var(--paper)' }}>
      <Arranged layout={block.layout} tiles={tiles}>
        <div className="flex w-full max-w-[680px] flex-col gap-7 md:gap-8">
          {tiles.label}
          {block.heading && tiles.heading}
          {tiles.body}
        </div>
      </Arranged>
    </section>
  )
}
