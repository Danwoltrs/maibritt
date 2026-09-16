'use client'

import { useEffect, useRef, useState } from 'react'
import type { AudioRef } from '@/lib/story/types'
import { formatTime } from '@/lib/story/timing'
import { useSound } from './SoundProvider'

type Props = {
  audio: AudioRef
  label: string
  onDark?: boolean
  active: boolean
  onTime?: (sec: number) => void
  onPlayingChange?: (playing: boolean) => void
  className?: string
}

export function AudioPlayer({ audio, label, onDark = false, active, onTime, onPlayingChange, className }: Props) {
  const ref = useRef<HTMLAudioElement>(null)
  const { register, play, stop, begun, muted } = useSound()
  const [playing, setPlaying] = useState(false)
  const [time, setTime] = useState(0)
  const duration = audio.durationSec || 0
  const pct = duration ? Math.min(100, (time / duration) * 100) : 0

  useEffect(() => {
    const el = ref.current
    if (!el) return
    return register(el)
  }, [register])

  useEffect(() => {
    onPlayingChange?.(playing)
  }, [playing, onPlayingChange])

  useEffect(() => {
    const el = ref.current
    if (!el || !begun) return
    if (active && !muted) void play(el)
    else stop(el)
  }, [active, begun, muted, play, stop])

  const fg = onDark ? 'var(--white)' : 'var(--ink)'
  const sub = onDark ? 'rgba(251,249,245,0.72)' : 'var(--ink-2)'
  const track = onDark ? 'rgba(251,249,245,0.28)' : 'var(--line)'

  return (
    <div className={`flex w-full flex-col gap-3 ${className ?? ''}`}>
      <audio
        ref={ref}
        src={audio.url}
        preload="metadata"
        crossOrigin="anonymous"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onTimeUpdate={(e) => {
          const t = e.currentTarget.currentTime
          setTime(t)
          onTime?.(t)
        }}
      />
      <span className="text-[13px] uppercase tracking-[0.14em]" style={{ color: sub }}>
        {label}
      </span>
      <div className="flex items-center gap-4">
        <button
          type="button"
          aria-label={playing ? 'Pause' : 'Play'}
          onClick={() => {
            const el = ref.current
            if (!el) return
            if (playing) el.pause()
            else void play(el)
          }}
          className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full"
          style={{ background: onDark ? 'var(--white)' : 'var(--ink)', color: onDark ? 'var(--ink)' : 'var(--white)' }}
        >
          {playing ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="7" y="5" width="3.5" height="14" rx="0.5" /><rect x="13.5" y="5" width="3.5" height="14" rx="0.5" /></svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13l10-6.5z" /></svg>
          )}
        </button>
        <div className="flex flex-grow flex-col gap-2">
          <div
            className="relative h-[2px] cursor-pointer"
            style={{ background: track }}
            onClick={(e) => {
              const el = ref.current
              if (!el || !duration) return
              const rect = e.currentTarget.getBoundingClientRect()
              el.currentTime = ((e.clientX - rect.left) / rect.width) * duration
            }}
          >
            <div className="h-[2px]" style={{ width: `${pct}%`, background: 'var(--accent)' }} />
            <div className="absolute top-[-4px] h-[10px] w-[10px] -translate-x-1/2 rounded-full" style={{ left: `${pct}%`, background: 'var(--accent)' }} />
          </div>
          <div className="story-tabular flex justify-between text-[15px]" style={{ color: sub }}>
            <span>{formatTime(time)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
        <button
          type="button"
          aria-label="Play again from the start"
          onClick={() => {
            const el = ref.current
            if (!el) return
            el.currentTime = 0
            void play(el)
          }}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
          style={{ border: `1px solid ${track}`, color: fg }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3" /><path d="M4.5 4.5v4.2h4.2" /></svg>
        </button>
      </div>
    </div>
  )
}
