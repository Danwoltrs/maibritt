'use client'

import type { ReactNode } from 'react'
import { Icon } from './ui'
import { secondsToSpeed, speedToSeconds, type Speed } from '@/lib/story/timing'
import type { AudioRef, CaptionedImage, SlideshowTiming } from '@/lib/story/types'

export type PhotoStyle = 'gallery' | 'slideshow'

function ChoiceCard({ selected, onClick, title, desc, illo }: { selected: boolean; onClick: () => void; title: string; desc: string; illo: ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="relative flex w-full flex-col gap-4 rounded-[18px] p-7 text-left" style={{ border: `${selected ? 3 : 2}px solid ${selected ? 'var(--accent)' : 'var(--line)'}`, background: selected ? 'var(--accent-soft)' : 'var(--white)' }}>
      {selected && <span className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full" style={{ background: 'var(--accent)', color: 'var(--white)' }}><Icon name="check" size={18} /></span>}
      <div className="h-[88px] overflow-hidden">{illo}</div>
      <span className="text-[23px] font-semibold" style={{ color: 'var(--ink)' }}>{title}</span>
      <span className="text-[18px] leading-relaxed" style={{ color: 'var(--ink-2)' }}>{desc}</span>
    </button>
  )
}

function OptionRow({ selected, onClick, title, desc, children }: { selected: boolean; onClick: () => void; title: string; desc?: string; children?: ReactNode }) {
  return (
    <div role="button" tabIndex={0} onClick={onClick} onKeyDown={(e) => e.key === 'Enter' && onClick()} className="flex flex-wrap items-center gap-5 rounded-[14px] px-6 py-5" style={{ border: `${selected ? 3 : 2}px solid ${selected ? 'var(--accent)' : 'var(--line)'}`, background: selected ? 'var(--accent-soft)' : 'var(--white)', cursor: 'pointer' }}>
      <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full" style={{ border: `2.5px solid ${selected ? 'var(--accent)' : 'var(--ink-3)'}`, background: selected ? 'var(--accent)' : 'transparent', color: 'var(--white)' }}>{selected && <Icon name="check" size={16} />}</span>
      <span className="flex min-w-[200px] flex-grow flex-col gap-1">
        <span className="text-[21px] font-semibold" style={{ color: 'var(--ink)' }}>{title}</span>
        {desc && <span className="text-[18px]" style={{ color: 'var(--ink-2)' }}>{desc}</span>}
      </span>
      {children}
    </div>
  )
}

type Props = {
  images: CaptionedImage[]
  style: PhotoStyle
  onStyle: (s: PhotoStyle) => void
  timing: SlideshowTiming
  onTiming: (t: SlideshowTiming) => void
  audio: AudioRef | null
  voiceControl: ReactNode
}

export function PhotoStyleChooser({ images, style, onStyle, timing, onTiming, audio, voiceControl }: Props) {
  const speed: Speed = timing.mode === 'interval' ? secondsToSpeed(timing.seconds) : 'medium'
  const thumbs = images.slice(0, 4)
  return (
    <div className="flex w-full flex-col gap-8">
      <h2 className="story-serif m-0 text-center text-[36px] font-medium md:text-[40px]" style={{ color: 'var(--ink)' }}>How should these photos appear?</h2>
      <div className="grid gap-6 md:grid-cols-2">
        <ChoiceCard
          selected={style === 'gallery'}
          onClick={() => onStyle('gallery')}
          title="Slide sideways as people scroll"
          desc="The photos line up in a row and glide past as the reader scrolls down."
          illo={<div className="flex gap-2.5">{thumbs.map((t) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={t.url} src={t.thumbnailUrl} alt="" className="story-photo h-20 w-[120px] shrink-0 rounded-md object-cover" />
          ))}</div>}
        />
        <ChoiceCard
          selected={style === 'slideshow'}
          onClick={() => onStyle('slideshow')}
          title="Fade one into another"
          desc="The photos stay in one place and gently change, like a slideshow."
          illo={<div className="relative h-[88px]">{thumbs.slice(0, 2).map((t, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={t.url} src={t.thumbnailUrl} alt="" className="story-photo absolute top-0 h-20 w-[200px] rounded-md object-cover" style={{ left: 60 + i * 20, top: i * 6, opacity: i === 0 ? 0.35 : 1 }} />
          ))}</div>}
        />
      </div>

      {style === 'slideshow' && (
        <div className="flex flex-col gap-3.5">
          <span className="text-[20px] font-semibold" style={{ color: 'var(--ink)' }}>How quickly should they change?</span>
          <OptionRow
            selected={timing.mode === 'audio'}
            onClick={() => onTiming({ mode: 'audio' })}
            title="Match my voice recording"
            desc={audio ? `The photos will spread evenly across your ${Math.round(audio.durationSec)} second recording` : 'Record or add your voice and the photos will follow it'}
          >
            {timing.mode === 'audio' && <div className="w-full pt-2">{voiceControl}</div>}
          </OptionRow>
          <OptionRow selected={timing.mode === 'interval'} onClick={() => onTiming({ mode: 'interval', seconds: speedToSeconds(speed) })} title="Choose a speed">
            <div className="flex w-[300px] shrink-0 flex-col gap-2.5">
              <input
                type="range"
                min={0}
                max={2}
                step={1}
                value={['slow', 'medium', 'fast'].indexOf(speed)}
                onChange={(e) => onTiming({ mode: 'interval', seconds: speedToSeconds((['slow', 'medium', 'fast'] as Speed[])[Number(e.target.value)]) })}
                aria-label="Speed"
                className="h-2 w-full accent-[var(--accent)]"
              />
              <div className="flex justify-between text-[18px]" style={{ color: 'var(--ink-2)' }}><span>Slow</span><span>Medium</span><span>Fast</span></div>
            </div>
          </OptionRow>
        </div>
      )}
    </div>
  )
}
