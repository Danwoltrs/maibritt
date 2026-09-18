'use client'

import { useRef, type ReactNode } from 'react'
import { useInView } from 'framer-motion'
import type { AudioBlock as AudioBlockType } from '@/lib/story/types'
import { AudioPlayer } from '../AudioPlayer'
import { Arranged } from '../Arranged'

export function SmallLine({ text }: { text: string }) {
  if (!text) return null
  return <span className="piece piece-voice-line block uppercase tracking-[0.2em]" style={{ color: 'var(--piece-color, var(--accent))' }}>{text}</span>
}

export function VoiceHeading({ text }: { text: string }) {
  if (!text) return null
  return <h3 className="piece piece-voice-heading story-serif m-0 font-medium leading-[1.05]" style={{ color: 'var(--piece-color, var(--ink))' }}>{text}</h3>
}

export function Transcript({ text, readAlong }: { text: string; readAlong: string }) {
  if (!text) return null
  return (
    <div className="flex flex-col gap-3 border-t pt-6" style={{ borderColor: 'var(--line)' }}>
      {readAlong && <span className="piece piece-read-along uppercase tracking-[0.14em]" style={{ color: 'var(--piece-color, var(--ink-3))' }}>{readAlong}</span>}
      <p className="piece piece-transcript story-serif m-0 whitespace-pre-line italic leading-[1.45]" style={{ color: 'var(--piece-color, var(--ink))' }}>{text}</p>
    </div>
  )
}

export function audioTiles(block: AudioBlockType, voiceLabel: string, ownWords: string, readAlong: string, active: boolean): Record<string, ReactNode> {
  return {
    label: ownWords ? <SmallLine text={ownWords} /> : null,
    heading: block.heading ? <VoiceHeading text={block.heading} /> : null,
    player: <AudioPlayer audio={block.audio} label={voiceLabel} active={active} />,
    transcript: block.audio.transcript ? <Transcript text={block.audio.transcript} readAlong={readAlong} /> : null,
  }
}

export function AudioBlock({ block, voiceLabel, ownWords, readAlong }: { block: AudioBlockType; voiceLabel: string; ownWords: string; readAlong: string }) {
  const ref = useRef<HTMLElement>(null)
  const inView = useInView(ref, { amount: 0.5 })
  const tiles = audioTiles(block, voiceLabel, ownWords, readAlong, inView)

  return (
    <section ref={ref} className={`relative w-full ${block.layout ? 'min-h-[100svh]' : 'flex min-h-[100svh] items-center justify-center px-6 py-24 md:px-24'}`} style={{ background: 'var(--paper)' }}>
      <Arranged layout={block.layout} tiles={tiles}>
        <div className="flex w-full max-w-[600px] flex-col gap-8">
          <div className="flex flex-col gap-3">
            {tiles.label}
            {tiles.heading}
          </div>
          {tiles.player}
          {tiles.transcript}
        </div>
      </Arranged>
    </section>
  )
}
