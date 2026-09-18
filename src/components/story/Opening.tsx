'use client'

import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import type { StoryOpening, WordKey } from '@/lib/story/types'
import { Arranged } from './Arranged'

type Words = Record<WordKey, string>

function Rise({ delay, children }: { delay: number; children: ReactNode }) {
  const reduce = useReducedMotion()
  return (
    <motion.div initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.2, delay, ease: 'easeOut' }}>
      {children}
    </motion.div>
  )
}

export function Portrait({ opening }: { opening: StoryOpening }) {
  if (!opening.portrait) return null
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={opening.portrait.url} alt={opening.name} className="story-photo h-[132px] w-[132px] rounded-full object-cover md:h-[172px] md:w-[172px]" style={{ border: '1.5px solid rgba(251,249,245,0.6)' }} />
}

export function Eyebrow({ text }: { text: string }) {
  if (!text) return null
  return <span className="piece piece-eyebrow block uppercase tracking-[0.22em]" style={{ color: 'rgba(251,249,245,0.78)' }}>{text}</span>
}

export function Name({ text }: { text: string }) {
  return <h1 className="piece piece-name story-serif m-0 font-medium leading-none" style={{ color: 'var(--on-backdrop)', letterSpacing: '-0.01em' }}>{text}</h1>
}

export function Title({ text }: { text: string }) {
  if (!text) return null
  return <p className="piece piece-title story-serif m-0 italic leading-tight" style={{ color: 'rgba(251,249,245,0.9)' }}>{text}</p>
}

export function Begin({ words, onBegin }: { words: Words; onBegin: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <button type="button" onClick={onBegin} className="piece piece-begin flex h-[60px] items-center justify-center px-9 font-semibold md:h-16 md:px-11" style={{ background: 'var(--accent)', color: 'var(--accent-text)', borderRadius: 'var(--begin-radius, 999px)' }}>
        {words.begin}
      </button>
      {words.soundNote && <span className="piece piece-sound-note" style={{ color: 'rgba(251,249,245,0.7)' }}>{words.soundNote}</span>}
    </div>
  )
}

export function openingTiles(opening: StoryOpening, words: Words, onBegin: () => void): Record<string, ReactNode> {
  return {
    portrait: opening.portrait ? <Portrait opening={opening} /> : null,
    eyebrow: words.eyebrow ? <Eyebrow text={words.eyebrow} /> : null,
    name: <Name text={opening.name} />,
    title: opening.title ? <Title text={opening.title} /> : null,
    begin: <Begin words={words} onBegin={onBegin} />,
  }
}

export function Opening({ opening, words, onBegin }: { opening: StoryOpening; words: Words; onBegin: () => void }) {
  const tiles = openingTiles(opening, words, onBegin)
  const risen = Object.fromEntries(Object.entries(tiles).map(([k, node], i) => [k, node ? <Rise key={k} delay={0.15 * i}>{node}</Rise> : null]))
  return (
    <section className={`story-grain relative w-full overflow-hidden ${opening.layout ? 'min-h-[100svh]' : 'flex h-[100svh] items-center justify-center'}`} style={{ background: 'var(--backdrop)' }}>
      {opening.cover && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={opening.cover.url} alt="" className="story-photo absolute inset-[-4%] h-[108%] w-[108%] object-cover opacity-55" />
      )}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(20,14,10,0.25) 0%, rgba(20,14,10,0.15) 45%, rgba(20,14,10,0.7) 100%)' }} />
      <Arranged layout={opening.layout} tiles={risen}>
        <div className="relative z-10 flex flex-col items-center gap-7 px-7 text-center md:px-[120px]">
          {opening.portrait && <Rise delay={0}>{tiles.portrait}</Rise>}
          <Rise delay={0.35}>
            <div className="flex flex-col items-center gap-4">
              {tiles.eyebrow}
              {tiles.name}
              {tiles.title}
            </div>
          </Rise>
          <Rise delay={0.7}>
            <div className="mt-2">{tiles.begin}</div>
          </Rise>
        </div>
      </Arranged>
    </section>
  )
}
