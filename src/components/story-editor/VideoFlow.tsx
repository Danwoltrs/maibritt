'use client'

import { useCallback, useRef, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { useEditorStore } from './store'
import { findBlock, insertBlock, newId, updateBlock } from '@/lib/story/document'
import { parseVideoLink } from '@/lib/story/videoLinks'
import { StoryService } from '@/services/story.service'
import type { Screen } from './screens'
import { EButton, Field, Icon, PageTop, TextInput } from './ui'
import type { VideoBlock, VideoSource } from '@/lib/story/types'

const ACCEPT = { 'video/mp4': ['.mp4', '.m4v'], 'video/quicktime': ['.mov'], 'video/webm': ['.webm'] }

export function VideoFlow({ screen, onBack }: { screen: Extract<Screen, { kind: 'video' }>; onBack: () => void }) {
  const document = useEditorStore((s) => s.document)!
  const apply = useEditorStore((s) => s.apply)
  const existing = screen.blockId ? (findBlock(document, screen.blockId)?.block as VideoBlock | undefined) : undefined
  const [source, setSource] = useState<VideoSource | null>(existing?.source ?? null)
  const [caption, setCaption] = useState(existing?.caption ?? '')
  const [link, setLink] = useState(existing?.source.type === 'link' ? existing.source.url : '')
  const [linkError, setLinkError] = useState<string | null>(null)
  const [progress, setProgress] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const uploading = useRef(false)

  const onDrop = useCallback(async (files: File[]) => {
    const file = files[0]
    if (!file || uploading.current) return
    uploading.current = true
    setError(null)
    setProgress(0)
    try {
      const { url, durationSec, poster } = await StoryService.uploadVideo(file, setProgress)
      setSource({ type: 'upload', url, durationSec, poster })
    } catch {
      setError('The video could not be uploaded. Check your internet and try again.')
    } finally {
      setProgress(null)
      uploading.current = false
    }
  }, [])

  const { getRootProps, getInputProps, open, isDragActive } = useDropzone({ onDrop, accept: ACCEPT, multiple: false, noClick: true, disabled: progress !== null })

  const useLink = () => {
    const parsed = parseVideoLink(link)
    if (!parsed) {
      setLinkError('That doesn’t look like a YouTube or Vimeo link.')
      return
    }
    setLinkError(null)
    setSource(parsed)
  }

  const save = () => {
    if (!source) return
    const block: VideoBlock = { id: existing?.id ?? newId(), kind: 'video', source, caption: caption.trim() }
    if (existing) apply((d) => updateBlock(d, screen.chapterId, existing.id, block))
    else apply((d) => insertBlock(d, screen.chapterId, screen.insertIndex, block))
    onBack()
  }

  return (
    <div className="min-h-[100svh]">
      <PageTop title="Add a video" onBack={onBack} />
      <div className="mx-auto flex w-full max-w-[800px] flex-col gap-8 px-6 py-10 md:px-0">
        {source ? (
          <div className="flex flex-wrap items-center gap-5 rounded-2xl border p-5" style={{ borderColor: 'var(--line)', background: 'var(--white)' }}>
            {source.type === 'upload' ? (
              <video src={source.url} poster={source.poster?.url} controls playsInline className="max-h-[300px] w-full max-w-[480px] rounded-md bg-black" />
            ) : (
              <span className="flex items-center gap-3 text-[20px]" style={{ color: 'var(--ink)' }}><Icon name="link" /><span>Video from {source.provider === 'youtube' ? 'YouTube' : 'Vimeo'}</span></span>
            )}
            <EButton small variant="quiet" icon={<Icon name="trash" size={18} />} onClick={() => setSource(null)}>Use a different video</EButton>
          </div>
        ) : (
          <>
            <div {...getRootProps()} className="flex flex-col items-center gap-4 rounded-[20px] px-6 py-10 text-center md:px-10 md:py-11" style={{ border: '3px dashed var(--accent)', background: isDragActive ? 'var(--accent)' : 'var(--accent-soft)', color: isDragActive ? 'var(--white)' : 'var(--ink)' }}>
              <input {...getInputProps()} />
              <span style={{ color: isDragActive ? 'var(--white)' : 'var(--accent-2)' }}><Icon name="video" size={48} /></span>
              <span className="story-serif text-[30px] font-medium md:text-[34px]">Drag your video here</span>
              <span className="text-[18px]" style={{ color: isDragActive ? 'var(--white)' : 'var(--ink-2)' }}>or</span>
              <EButton icon={<Icon name="upload" />} onClick={open} disabled={progress !== null}>Choose a video from my phone or computer</EButton>
              <span className="text-[18px]" style={{ color: isDragActive ? 'var(--white)' : 'var(--ink-2)' }}>Films up to about 10 minutes work best.</span>
            </div>
            {progress !== null && (
              <div className="flex flex-col gap-2">
                <span className="text-[18px]" style={{ color: 'var(--ink-2)' }}>{progress < 100 ? `Uploading… ${progress}%` : 'Almost done…'}</span>
                <div className="h-2 w-full rounded-full" style={{ background: 'var(--line)' }}><div className="h-2 rounded-full" style={{ width: `${progress}%`, background: 'var(--accent)' }} /></div>
              </div>
            )}
            {error && <p className="text-[18px]" style={{ color: 'var(--red)' }}>{error}</p>}
            <div className="flex items-center gap-4"><div className="h-px flex-grow" style={{ background: 'var(--line)' }} /><span className="text-[18px]" style={{ color: 'var(--ink-2)' }}>or, if the video is already online</span><div className="h-px flex-grow" style={{ background: 'var(--line)' }} /></div>
            <Field label="Paste the link here">
              <div className="flex flex-wrap items-center gap-3">
                <TextInput className="min-w-[240px] flex-grow" value={link} onChange={(e) => setLink(e.target.value)} placeholder="youtube.com/… or vimeo.com/…" onKeyDown={(e) => e.key === 'Enter' && useLink()} />
                <EButton onClick={useLink} disabled={!link.trim()}>Use this link</EButton>
              </div>
            </Field>
            {linkError && <p className="text-[18px]" style={{ color: 'var(--red)' }}>{linkError}</p>}
          </>
        )}

        <Field label="A few words about it" hint="Optional">
          <TextInput value={caption} onChange={(e) => setCaption(e.target.value)} />
        </Field>

        <div className="flex justify-center gap-4">
          <EButton icon={<Icon name="chevronLeft" />} onClick={onBack}>Back</EButton>
          <EButton variant="primary" icon={<Icon name="check" />} disabled={!source} onClick={save}>Add this video to my story</EButton>
        </div>
      </div>
    </div>
  )
}
