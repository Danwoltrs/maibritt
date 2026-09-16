'use client'

import { useRef, useState } from 'react'
import { useRecorder } from './recorder/useRecorder'
import { StoryService } from '@/services/story.service'
import { readAudioDuration } from '@/lib/story/media'
import { formatTime } from '@/lib/story/timing'
import type { AudioRef } from '@/lib/story/types'
import { EButton, Field, Icon, TextArea } from './ui'

function Bars({ levels, active }: { levels: number[]; active: boolean }) {
  return (
    <div className="flex h-14 items-center gap-1">
      {levels.map((l, i) => (
        <div key={i} className="w-1 rounded-sm" style={{ height: 8 + l * 48, background: active ? 'var(--accent)' : 'var(--line)' }} />
      ))}
    </div>
  )
}

export function Recorder({ onKeep, onCancel, initialTranscript = '' }: { onKeep: (audio: AudioRef) => void; onCancel: () => void; initialTranscript?: string }) {
  const rec = useRecorder()
  const [transcript, setTranscript] = useState(initialTranscript)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)
  const preview = useRef<HTMLAudioElement>(null)

  const keep = async () => {
    if (!rec.result) return
    setUploading(true)
    setError(null)
    try {
      const audio = await StoryService.uploadAudio(rec.result.mp3, 'mp3', rec.result.durationSec)
      onKeep({ ...audio, transcript: transcript.trim() })
    } catch {
      setError('The recording could not be saved. Check your internet and try again.')
      setUploading(false)
    }
  }

  const useFile = async (file: File) => {
    setUploading(true)
    setError(null)
    let duration: number
    try {
      duration = await readAudioDuration(file)
    } catch {
      duration = 0
    }
    if (!Number.isFinite(duration) || duration <= 0) {
      setError('We could not read that file. Try an mp3, m4a or wav.')
      setUploading(false)
      return
    }
    try {
      const ext = (file.name.split('.').pop() || 'mp3').toLowerCase()
      const audio = await StoryService.uploadAudio(file, ext, duration)
      onKeep({ ...audio, transcript: transcript.trim() })
    } catch {
      setError('That file could not be used. Try an mp3, m4a or wav file.')
      setUploading(false)
    }
  }

  const uploadButton = (
    <>
      <input ref={fileInput} type="file" accept="audio/*,.mp3,.m4a,.wav,.aac" className="hidden" onChange={(e) => e.target.files?.[0] && useFile(e.target.files[0])} />
      <EButton icon={<Icon name="upload" />} onClick={() => fileInput.current?.click()} disabled={uploading}>Use a recording I already have</EButton>
    </>
  )

  if (rec.state === 'done' && rec.result) {
    return (
      <div className="flex w-full flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-2 text-center">
          <h2 className="story-serif m-0 text-[40px] font-medium md:text-[46px]" style={{ color: 'var(--ink)' }}>Here is your recording</h2>
          <span className="text-[20px]" style={{ color: 'var(--ink-2)' }}>{formatTime(rec.result.durationSec)}</span>
        </div>
        <audio ref={preview} src={rec.result.url} controls className="w-full max-w-[760px]" />
        <div className="flex flex-wrap justify-center gap-4">
          <EButton icon={<Icon name="play" />} onClick={() => preview.current?.play()}>Listen back</EButton>
          <EButton icon={<Icon name="mic" />} onClick={rec.reset} disabled={uploading}>Record again</EButton>
          <EButton variant="primary" icon={<Icon name="check" />} onClick={keep} disabled={uploading}>{uploading ? 'Saving…' : 'Keep it'}</EButton>
        </div>
        {error && <p className="text-[18px]" style={{ color: 'var(--red)' }}>{error}</p>}
        <div className="w-full max-w-[760px]">
          <Field label="Write down what you said" hint="Optional — for people who would rather read along">
            <TextArea rows={4} value={transcript} onChange={(e) => setTranscript(e.target.value)} />
          </Field>
        </div>
      </div>
    )
  }

  const recording = rec.state === 'recording'
  return (
    <div className="flex w-full flex-col items-center gap-9 text-center">
      <div className="flex flex-col items-center gap-2.5">
        <div className="flex items-center gap-2.5 text-[19px]" style={{ color: recording ? 'var(--red)' : 'var(--ink-2)' }}>
          {recording && <span className="h-3 w-3 rounded-full" style={{ background: 'var(--red)' }} />}
          <span>{rec.state === 'processing' ? 'One moment…' : recording ? 'Recording' : rec.state === 'requesting' ? 'Waiting for the microphone…' : 'Ready when you are'}</span>
        </div>
        <span className="story-serif story-tabular text-[80px] font-medium leading-none md:text-[96px]" style={{ color: 'var(--ink)' }}>{formatTime(rec.seconds)}</span>
      </div>
      <Bars levels={rec.levels} active={recording} />
      {rec.state !== 'unsupported' && (
        <button
          type="button"
          aria-label={recording ? 'Stop recording' : 'Start recording'}
          onClick={recording ? rec.stop : rec.start}
          disabled={rec.state === 'requesting' || rec.state === 'processing'}
          className="relative flex h-[168px] w-[168px] items-center justify-center rounded-full disabled:opacity-60"
          style={{ background: 'var(--red)', boxShadow: '0 16px 36px -14px rgba(196,61,51,0.7)' }}
        >
          {recording && <span className="absolute inset-0 animate-ping rounded-full opacity-40" style={{ background: 'var(--red)' }} />}
          {recording ? <span className="relative h-[52px] w-[52px] rounded-[10px]" style={{ background: 'var(--white)' }} /> : <span className="relative" style={{ color: 'var(--white)' }}><Icon name="mic" size={64} /></span>}
        </button>
      )}
      <span className="text-[24px] font-semibold" style={{ color: 'var(--ink)' }}>
        {rec.state === 'unsupported' ? 'This browser cannot record, but you can add a recording you already have.' : recording ? 'Press the red button when you are finished' : 'Press the red button to start'}
      </span>
      {rec.state === 'denied' && <p className="max-w-[520px] text-[19px]" style={{ color: 'var(--red)' }}>Your browser did not allow the microphone. You can still add a recording you already have.</p>}
      {rec.state === 'error' && <p className="max-w-[520px] text-[19px]" style={{ color: 'var(--red)' }}>Something went wrong with the recording. Please try again.</p>}
      {!recording && <p className="max-w-[520px] text-[19px] leading-relaxed" style={{ color: 'var(--ink-2)' }}>Take your time. If you make a mistake, just keep going — you can record it again afterwards.</p>}
      {error && <p className="text-[18px]" style={{ color: 'var(--red)' }}>{error}</p>}
      <div className="flex flex-wrap justify-center gap-3.5">
        {uploadButton}
        <EButton variant="quiet" onClick={onCancel}>Cancel</EButton>
      </div>
    </div>
  )
}
