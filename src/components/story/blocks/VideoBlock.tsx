'use client'

import { useEffect, useRef, useState } from 'react'
import type { VideoBlock as VideoBlockType } from '@/lib/story/types'
import { embedUrl } from '@/lib/story/videoLinks'
import { formatTime } from '@/lib/story/timing'
import { useSound } from '../SoundProvider'

function PlayButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Play the video"
      className="absolute left-1/2 top-1/2 z-10 flex h-[88px] w-[88px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full md:h-28 md:w-28"
      style={{ background: 'rgba(251,249,245,0.92)', color: 'var(--ink)', boxShadow: '0 20px 50px -20px rgba(0,0,0,0.6)' }}
    >
      <svg width="52" height="52" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13l10-6.5z" /></svg>
    </button>
  )
}

export function VideoBlock({ block, chapterLabel }: { block: VideoBlockType; chapterLabel: string }) {
  const { register, play, begun, muted } = useSound()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [started, setStarted] = useState(false)
  const [time, setTime] = useState(0)
  const source = block.source

  useEffect(() => {
    const el = videoRef.current
    if (!el) return
    return register(el)
  }, [register])

  const caption = (
    <div className="absolute bottom-10 left-6 right-6 z-10 flex flex-col gap-2 md:bottom-[72px] md:left-24 md:right-24 md:flex-row md:items-end md:justify-between">
      <div className="flex max-w-[720px] flex-col gap-2">
        {block.caption && (
          <p className="story-serif m-0 text-[22px] italic leading-tight md:text-[30px]" style={{ color: 'var(--on-backdrop)' }}>
            {block.caption}
          </p>
        )}
        {source.type === 'upload' && source.durationSec > 0 && (
          <span className="story-tabular text-[14px] uppercase tracking-[0.1em] md:text-[15px]" style={{ color: 'rgba(251,249,245,0.72)' }}>
            {formatTime(time)} / {formatTime(source.durationSec)}
          </span>
        )}
      </div>
    </div>
  )

  if (source.type === 'link') {
    return (
      <section className="story-grain relative h-[100svh] w-full overflow-hidden" style={{ background: 'var(--backdrop)' }}>
        <div className="absolute left-6 top-8 z-10 text-[12px] uppercase tracking-[0.16em] md:left-10 md:text-[13px]" style={{ color: 'rgba(251,249,245,0.72)' }}>{chapterLabel}</div>
        {started ? (
          <iframe
            src={embedUrl(source, true)}
            title={block.caption || 'Video'}
            className="absolute inset-0 h-full w-full"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <>
            <div className="absolute inset-0" style={{ background: 'var(--backdrop)' }} />
            <PlayButton onClick={() => setStarted(true)} />
            {caption}
          </>
        )}
      </section>
    )
  }

  return (
    <section className="story-grain story-vignette relative h-[100svh] w-full overflow-hidden" style={{ background: 'var(--backdrop)' }}>
      <video
        ref={videoRef}
        src={source.url}
        poster={source.poster?.url}
        preload="metadata"
        playsInline
        crossOrigin="anonymous"
        controls={started}
        muted={muted}
        className={`absolute inset-0 h-full w-full object-cover ${started ? '' : 'story-photo'}`}
        onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
        onPlay={(e) => {
          // "Begin the story" nudges every element once to unlock playback.
          // That is not the visitor pressing play, so keep the poster.
          if (e.currentTarget.dataset.unlocking) return
          setStarted(true)
        }}
      />
      {!started && <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(20,14,10,0.15) 0%, rgba(20,14,10,0) 40%, rgba(20,14,10,0.68) 100%)' }} />}
      <div className="absolute left-6 top-8 z-10 text-[12px] uppercase tracking-[0.16em] md:left-10 md:text-[13px]" style={{ color: 'rgba(251,249,245,0.72)' }}>{chapterLabel}</div>
      {!started && (
        <PlayButton
          onClick={() => {
            const el = videoRef.current
            if (!el) return
            if (begun) void play(el)
            else void el.play().catch(() => {})
          }}
        />
      )}
      {!started && caption}
    </section>
  )
}
