'use client'

import { useRef } from 'react'
import { useInView } from 'framer-motion'
import type { AudioBlock as AudioBlockType } from '@/lib/story/types'
import { AudioPlayer } from '../AudioPlayer'

export function AudioBlock({ block, voiceLabel, ownWords, readAlong }: { block: AudioBlockType; voiceLabel: string; ownWords: string; readAlong: string }) {
  const ref = useRef<HTMLElement>(null)
  const inView = useInView(ref, { amount: 0.5 })

  return (
    <section ref={ref} className="flex min-h-[100svh] w-full items-center justify-center px-6 py-24 md:px-24" style={{ background: 'var(--paper)' }}>
      <div className="flex w-full max-w-[600px] flex-col gap-8">
        <div className="flex flex-col gap-3">
          {ownWords && (
            <span className="text-[13px] uppercase tracking-[0.2em] md:text-[14px]" style={{ color: 'var(--accent)' }}>
              {ownWords}
            </span>
          )}
          {block.heading && (
            <h3 className="story-serif m-0 text-[40px] font-medium leading-[1.05] md:text-[56px]" style={{ color: 'var(--ink)' }}>
              {block.heading}
            </h3>
          )}
        </div>
        <AudioPlayer audio={block.audio} label={voiceLabel} active={inView} />
        {block.audio.transcript && (
          <div className="flex flex-col gap-3 border-t pt-6" style={{ borderColor: 'var(--line)' }}>
            {readAlong && (
              <span className="text-[12px] uppercase tracking-[0.14em] md:text-[13px]" style={{ color: 'var(--ink-3)' }}>
                {readAlong}
              </span>
            )}
            <p className="story-serif m-0 whitespace-pre-line text-[20px] italic leading-[1.45] md:text-[25px]" style={{ color: 'var(--ink)' }}>
              {block.audio.transcript}
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
