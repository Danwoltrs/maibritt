'use client'

import { motion, useReducedMotion } from 'framer-motion'
import type { TextBlock as TextBlockType } from '@/lib/story/types'

export function paragraphs(body: string): string[] {
  return body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
}

export function TextBlock({ block, chapterLabel }: { block: TextBlockType; chapterLabel: string }) {
  const reduce = useReducedMotion()
  const reveal = {
    initial: reduce ? { opacity: 0 } : { opacity: 0, y: 16 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.3 },
    transition: { duration: 1.2, ease: 'easeOut' as const },
  }
  return (
    <section className="relative flex min-h-[100svh] w-full items-center justify-center px-6 py-24 md:px-24" style={{ background: 'var(--paper)' }}>
      <div className="flex w-full max-w-[680px] flex-col gap-7 md:gap-8">
        <motion.div {...reveal} className="flex items-center gap-4">
          <span className="h-px w-10" style={{ background: 'var(--accent)' }} />
          <span className="text-[13px] uppercase tracking-[0.2em] md:text-[14px]" style={{ color: 'var(--accent)' }}>
            {chapterLabel}
          </span>
        </motion.div>
        {block.heading && (
          <motion.h2 {...reveal} className="story-serif m-0 text-[44px] font-medium leading-[1.02] md:text-[76px]" style={{ color: 'var(--ink)', letterSpacing: '-0.01em' }}>
            {block.heading}
          </motion.h2>
        )}
        <motion.div {...reveal} transition={{ ...reveal.transition, delay: 0.3 }} className="flex flex-col gap-5 text-[19px] leading-[1.65] md:text-[21px]" style={{ color: 'var(--ink)' }}>
          {paragraphs(block.body).map((p, i) => (
            <p key={i} className="m-0">
              {p}
            </p>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
