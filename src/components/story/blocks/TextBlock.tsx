'use client'

import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import type { RichText, TextBlock as TextBlockType } from '@/lib/story/types'
import { INDENT_STEP } from '@/lib/story/rich'
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
  if (onDark) return <span className="piece piece-label-dark block uppercase tracking-[0.16em]" style={{ color: 'rgba(251,249,245,0.72)' }}>{text}</span>
  return (
    <span className="inline-flex items-center gap-4">
      <span className="h-px w-10" style={{ background: 'var(--accent)' }} />
      <span className="piece piece-label uppercase tracking-[0.2em]" style={{ color: 'var(--accent)' }}>{text}</span>
    </span>
  )
}

export function Heading({ text }: { text: string }) {
  if (!text) return null
  return <h2 className="piece piece-heading story-serif m-0 font-medium leading-[1.02]" style={{ color: 'var(--ink)', letterSpacing: '-0.01em' }}>{text}</h2>
}

function Marked({ run }: { run: RichText[number]['runs'][number] }) {
  let node: ReactNode = run.text
  // Nested so the marks compose; the order matches richToHtml.
  if (run.marks?.includes('underline')) node = <u>{node}</u>
  if (run.marks?.includes('italic')) node = <em>{node}</em>
  if (run.marks?.includes('bold')) node = <strong>{node}</strong>
  return <>{node}</>
}

/** Rich text is rendered as React elements, never as raw html. */
export function Body({ text, rich }: { text: string; rich?: RichText }) {
  const paras: RichText = rich ?? paragraphs(text).map((p) => ({ runs: [{ text: p }] }))
  return (
    <div className="piece piece-body flex flex-col gap-5 leading-[1.65]" style={{ color: 'var(--ink)' }}>
      {paras.map((p, i) => (
        <p key={i} className="m-0" style={{ textAlign: p.align, paddingLeft: p.indent ? p.indent * INDENT_STEP : undefined }}>
          {p.runs.map((run, j) => (
            <Marked key={j} run={run} />
          ))}
        </p>
      ))}
    </div>
  )
}

export function textTiles(block: TextBlockType, chapterLabel: string): Record<string, ReactNode> {
  return {
    label: chapterLabel ? <Reveal><ChapterLabel text={chapterLabel} /></Reveal> : null,
    heading: block.heading ? <Reveal><Heading text={block.heading} /></Reveal> : null,
    body: <Reveal delay={0.3}><Body text={block.body} rich={block.rich} /></Reveal>,
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
