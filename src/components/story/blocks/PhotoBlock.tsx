'use client'

import { useRef } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import type { PhotoBlock as PhotoBlockType } from '@/lib/story/types'

export function PhotoBlock({ block, chapterLabel }: { block: PhotoBlockType; chapterLabel: string }) {
  const ref = useRef<HTMLElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], ['-6%', '6%'])

  return (
    <section ref={ref} className="story-grain story-vignette relative h-[100svh] w-full overflow-hidden" style={{ background: '#1e1712' }}>
      <motion.img
        src={block.image.url}
        alt={block.caption}
        className="story-photo absolute left-0 top-[-6%] h-[112%] w-full object-cover"
        style={reduce ? undefined : { y }}
      />
      <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(20,14,10,0.12) 0%, rgba(20,14,10,0) 40%, rgba(20,14,10,0.62) 100%)' }} />
      <div className="absolute left-6 top-8 z-10 text-[12px] uppercase tracking-[0.16em] md:left-10 md:text-[13px]" style={{ color: 'rgba(251,249,245,0.72)' }}>
        {chapterLabel}
      </div>
      {block.caption && (
        <motion.div
          initial={{ opacity: 0, y: reduce ? 0 : 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          className="absolute bottom-12 left-6 right-6 z-10 flex max-w-[720px] flex-col gap-2 md:bottom-[88px] md:left-24"
        >
          <p className="story-serif m-0 text-[24px] italic leading-tight md:text-[34px]" style={{ color: 'var(--white)' }}>
            {block.caption}
          </p>
        </motion.div>
      )}
    </section>
  )
}
