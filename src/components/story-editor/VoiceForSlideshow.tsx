'use client'

import { useState } from 'react'
import { Recorder } from './Recorder'
import { EButton, Icon } from './ui'
import { formatTime } from '@/lib/story/timing'
import type { AudioRef } from '@/lib/story/types'

export function VoiceForSlideshow({ audio, onChange }: { audio: AudioRef | null; onChange: (a: AudioRef | null) => void }) {
  const [recording, setRecording] = useState(false)
  if (recording) {
    return (
      <div className="rounded-2xl border p-6" style={{ borderColor: 'var(--line)', background: 'var(--white)' }} onClick={(e) => e.stopPropagation()}>
        <Recorder onKeep={(a) => { onChange(a); setRecording(false) }} onCancel={() => setRecording(false)} />
      </div>
    )
  }
  return (
    <div className="flex flex-wrap items-center gap-4" onClick={(e) => e.stopPropagation()}>
      {audio ? (
        <>
          <audio src={audio.url} controls className="max-w-full" />
          <span className="text-[18px]" style={{ color: 'var(--ink-2)' }}>{formatTime(audio.durationSec)}</span>
          <EButton small icon={<Icon name="mic" size={18} />} onClick={() => setRecording(true)}>Record again</EButton>
          <EButton small variant="quiet" icon={<Icon name="trash" size={18} />} onClick={() => onChange(null)}>Remove</EButton>
        </>
      ) : (
        <EButton icon={<Icon name="mic" />} onClick={() => setRecording(true)}>Record my voice for these photos</EButton>
      )}
    </div>
  )
}
