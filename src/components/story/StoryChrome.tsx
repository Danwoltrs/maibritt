'use client'

import { motion, useScroll } from 'framer-motion'
import { useSound } from './SoundProvider'

function SpeakerIcon({ off }: { off: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5H4z" />
      {off ? (
        <>
          <path d="M16 9.5l5 5" />
          <path d="M21 9.5l-5 5" />
        </>
      ) : (
        <>
          <path d="M15.5 9.5a3.5 3.5 0 0 1 0 5" />
          <path d="M18 7a7 7 0 0 1 0 10" />
        </>
      )}
    </svg>
  )
}

export function StoryChrome({ onDark, preview = false, soundOn, soundOff }: { onDark: boolean; preview?: boolean; soundOn: string; soundOff: string }) {
  const { scrollYProgress } = useScroll()
  const { muted, toggleMuted, begun } = useSound()
  const label = begun ? (muted ? soundOff : soundOn) : soundOff

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50 h-[3px]" style={{ background: onDark ? 'rgba(255,255,255,0.18)' : 'rgba(42,37,33,0.10)' }}>
        <motion.div className="h-[3px] origin-left" style={{ scaleX: scrollYProgress, background: 'var(--accent)' }} />
      </div>
      <button
        type="button"
        onClick={toggleMuted}
        aria-label={label}
        className={`fixed z-50 flex items-center gap-3 right-5 md:right-8 ${preview ? 'top-[96px] md:top-[100px]' : 'top-6 md:top-7'}`}
      >
        <span className="hidden md:inline text-[13px] tracking-[0.14em] uppercase" style={{ color: onDark ? 'rgba(251,249,245,0.78)' : 'var(--ink-2)' }}>
          {label}
        </span>
        <span
          className="flex h-12 w-12 items-center justify-center rounded-full backdrop-blur-sm"
          style={{
            border: `1px solid ${onDark ? 'rgba(251,249,245,0.45)' : 'var(--line)'}`,
            background: onDark ? 'rgba(20,14,10,0.35)' : 'var(--white)',
            color: onDark ? 'var(--white)' : 'var(--ink)',
          }}
        >
          <SpeakerIcon off={muted || !begun} />
        </span>
      </button>
    </>
  )
}
