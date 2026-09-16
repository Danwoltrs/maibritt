'use client'

import { useEffect, useRef, useState } from 'react'
import { useInView } from 'framer-motion'
import type { SlideshowBlock as SlideshowBlockType } from '@/lib/story/types'
import { slideIndexForTime, slideshowIntervalMs } from '@/lib/story/timing'
import { AudioPlayer } from '../AudioPlayer'
import { Arranged } from '../Arranged'
import { ChapterLabel } from './TextBlock'
import { DarkCaption } from './PhotoBlock'

export function SlideshowBlock({ block, chapterLabel, voiceLabel }: { block: SlideshowBlockType; chapterLabel: string; voiceLabel: string }) {
  const ref = useRef<HTMLElement>(null)
  const inView = useInView(ref, { amount: 0.5 })
  const [active, setActive] = useState(0)
  const [voicePlaying, setVoicePlaying] = useState(false)
  const count = block.images.length
  const followsAudio = block.timing.mode === 'audio' && !!block.audio && block.audio.durationSec > 0

  useEffect(() => {
    // The recording drives the photos only while it is actually playing. With
    // the sound off, or before the visitor taps Begin, the timer keeps them
    // moving at the same pace the recording would have set.
    if ((followsAudio && voicePlaying) || !inView || count < 2) return
    const id = window.setInterval(() => setActive((a) => (a + 1) % count), slideshowIntervalMs(block))
    return () => window.clearInterval(id)
  }, [block, count, followsAudio, voicePlaying, inView])

  if (count === 0) return null
  const caption = block.images[active]?.caption ?? ''

  const dots = (
    <div className="flex items-center gap-2.5">
      {block.images.map((_, i) => (
        <span key={i} className="rounded-full" style={{ width: i === active ? 8 : 6, height: i === active ? 8 : 6, background: i === active ? 'var(--on-backdrop)' : 'rgba(251,249,245,0.45)' }} />
      ))}
    </div>
  )
  const player = block.audio ? (
    <AudioPlayer
      audio={block.audio}
      label={voiceLabel}
      onDark
      active={inView}
      className="md:max-w-[460px]"
      onTime={followsAudio ? (t) => setActive(slideIndexForTime(t, block.audio!.durationSec, count)) : undefined}
      onPlayingChange={setVoicePlaying}
    />
  ) : null
  const tiles = {
    label: chapterLabel ? <ChapterLabel text={chapterLabel} onDark /> : null,
    player,
    caption: (
      <div className="flex flex-col items-[inherit] gap-4">
        <DarkCaption text={caption} size="small" />
        {dots}
      </div>
    ),
  }

  return (
    <section ref={ref} className={`story-grain story-vignette relative w-full overflow-hidden ${block.layout ? 'min-h-[100svh]' : 'h-[100svh]'}`} style={{ background: 'var(--backdrop)' }}>
      {block.images.map((img, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={i} src={img.url} alt={img.caption} className="story-photo absolute inset-0 h-full w-full object-cover transition-opacity duration-[1400ms] ease-in-out" style={{ opacity: i === active ? 1 : 0 }} />
      ))}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(20,14,10,0.1) 0%, rgba(20,14,10,0) 40%, rgba(20,14,10,0.7) 100%)' }} />
      <Arranged layout={block.layout} tiles={tiles} stackJustify="end">
        <div className="absolute left-6 top-8 z-10 md:left-10">{tiles.label}</div>
        <div className="absolute bottom-10 left-6 right-6 z-10 flex flex-col gap-6 md:bottom-[72px] md:left-24 md:right-24 md:flex-row md:items-end md:justify-between md:gap-[60px]">
          {player ?? <span />}
          <div className="flex flex-col gap-4 md:max-w-[520px] md:items-end md:text-right">{tiles.caption}</div>
        </div>
      </Arranged>
    </section>
  )
}
