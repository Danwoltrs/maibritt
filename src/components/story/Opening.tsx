'use client'

import { motion, useReducedMotion } from 'framer-motion'
import type { StoryOpening, WordKey } from '@/lib/story/types'

export function Opening({ opening, words, onBegin }: { opening: StoryOpening; words: Record<WordKey, string>; onBegin: () => void }) {
  const reduce = useReducedMotion()
  const rise = (delay: number) => ({
    initial: reduce ? { opacity: 0 } : { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 1.2, delay, ease: 'easeOut' as const },
  })

  return (
    <section className="story-grain relative flex h-[100svh] w-full items-center justify-center overflow-hidden" style={{ background: '#1e1712' }}>
      {opening.cover && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={opening.cover.url} alt="" className="story-photo absolute inset-[-4%] h-[108%] w-[108%] object-cover opacity-55" />
      )}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(20,14,10,0.25) 0%, rgba(20,14,10,0.15) 45%, rgba(20,14,10,0.7) 100%)' }} />
      <div className="relative z-10 flex flex-col items-center gap-7 px-7 text-center md:px-[120px]">
        {opening.portrait && (
          <motion.div {...rise(0)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={opening.portrait.url} alt={opening.name} className="story-photo h-[132px] w-[132px] rounded-full object-cover md:h-[172px] md:w-[172px]" style={{ border: '1.5px solid rgba(251,249,245,0.6)' }} />
          </motion.div>
        )}
        <motion.div {...rise(0.35)} className="flex flex-col items-center gap-4">
          {words.eyebrow && (
            <span className="text-[12px] uppercase tracking-[0.22em] md:text-[14px]" style={{ color: 'rgba(251,249,245,0.78)' }}>
              {words.eyebrow}
            </span>
          )}
          <h1 className="story-serif m-0 text-[54px] font-medium leading-none md:text-[104px]" style={{ color: 'var(--white)', letterSpacing: '-0.01em' }}>
            {opening.name}
          </h1>
          {opening.title && (
            <p className="story-serif m-0 text-[24px] italic leading-tight md:text-[36px]" style={{ color: 'rgba(251,249,245,0.9)' }}>
              {opening.title}
            </p>
          )}
        </motion.div>
        <motion.div {...rise(0.7)} className="mt-2 flex flex-col items-center gap-4">
          <button
            type="button"
            onClick={onBegin}
            className="flex h-[60px] items-center justify-center rounded-full px-9 text-[19px] font-semibold md:h-16 md:px-11 md:text-[21px]"
            style={{ background: 'var(--accent)', color: 'var(--white)' }}
          >
            {words.begin}
          </button>
          {words.soundNote && (
            <span className="text-[14px] md:text-[15px]" style={{ color: 'rgba(251,249,245,0.7)' }}>
              {words.soundNote}
            </span>
          )}
        </motion.div>
      </div>
    </section>
  )
}
