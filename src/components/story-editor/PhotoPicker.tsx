'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { StoryService } from '@/services/story.service'
import type { CaptionedImage, ImageRef } from '@/lib/story/types'
import { EButton, Field, Icon, TextInput } from './ui'

const ACCEPT = { 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'], 'image/webp': ['.webp'] }

type Props = {
  value: CaptionedImage[]
  onChange: (images: CaptionedImage[]) => void
  multiple: boolean
  withCaptions?: boolean
}

export function PhotoPicker({ value, onChange, multiple, withCaptions = true }: Props) {
  const [progress, setProgress] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const onDrop = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return
      setError(null)
      setProgress(0)
      try {
        const refs = await StoryService.uploadPhotos(multiple ? files : files.slice(0, 1), setProgress)
        const added = refs.map((r) => ({ ...r, caption: '' }))
        onChange(multiple ? [...value, ...added] : added)
      } catch {
        setError('This photo could not be uploaded. Try again.')
      } finally {
        setProgress(null)
      }
    },
    [multiple, onChange, value]
  )

  const { getRootProps, getInputProps, open, isDragActive } = useDropzone({ onDrop, accept: ACCEPT, multiple, noClick: true })

  return (
    <div className="flex w-full flex-col gap-7">
      <div
        {...getRootProps()}
        className="flex flex-col items-center gap-4 rounded-[20px] px-6 py-10 text-center md:px-10 md:py-12"
        style={{ border: '3px dashed var(--accent)', background: isDragActive ? 'var(--accent)' : 'var(--accent-soft)', color: isDragActive ? 'var(--white)' : 'var(--ink)' }}
      >
        <input {...getInputProps()} />
        <span style={{ color: isDragActive ? 'var(--white)' : 'var(--accent-2)' }}><Icon name="upload" size={48} /></span>
        <span className="story-serif text-[30px] font-medium md:text-[34px]">{multiple ? 'Drag your photos here' : 'Drag a photo here'}</span>
        <span className="text-[18px]" style={{ color: isDragActive ? 'var(--white)' : 'var(--ink-2)' }}>or</span>
        <EButton icon={<Icon name="photo" />} onClick={open} disabled={progress !== null}>
          {multiple ? 'Choose photos from my computer' : 'Choose a photo from my computer'}
        </EButton>
        {multiple && <span className="text-[18px]" style={{ color: isDragActive ? 'var(--white)' : 'var(--ink-2)' }}>You can pick several at once.</span>}
      </div>

      {progress !== null && (
        <div className="flex flex-col gap-2">
          <span className="text-[18px]" style={{ color: 'var(--ink-2)' }}>Uploading… {progress}%</span>
          <div className="h-2 w-full rounded-full" style={{ background: 'var(--line)' }}><div className="h-2 rounded-full" style={{ width: `${progress}%`, background: 'var(--accent)' }} /></div>
        </div>
      )}
      {error && <p className="text-[18px]" style={{ color: 'var(--red)' }}>{error}</p>}

      {value.length > 0 && (
        <div className="flex flex-col gap-3.5">
          <div className="flex items-baseline justify-between">
            <span className="text-[20px] font-semibold" style={{ color: 'var(--ink)' }}>{multiple ? 'Chosen so far' : 'Your photo'}</span>
            {multiple && <span className="text-[18px]" style={{ color: 'var(--ink-2)' }}>{value.length} {value.length === 1 ? 'photo' : 'photos'}</span>}
          </div>
          <ul className="m-0 flex list-none flex-col gap-3 p-0">
            {value.map((img, i) => (
              <li key={img.url} className="flex flex-wrap items-center gap-4 rounded-xl border p-3" style={{ borderColor: 'var(--line)', background: 'var(--white)' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.thumbnailUrl} alt="" className="story-photo h-[96px] w-[96px] rounded-md object-cover" />
                {withCaptions && (
                  <div className="min-w-[240px] flex-grow">
                    <TextInput placeholder="A few words about this photo (optional)" value={img.caption} onChange={(e) => onChange(value.map((v, j) => (j === i ? { ...v, caption: e.target.value } : v)))} style={{ fontSize: 19, padding: '12px 16px' }} />
                  </div>
                )}
                {multiple && (
                  <div className="flex gap-1">
                    <button type="button" aria-label="Move earlier" disabled={i === 0} onClick={() => onChange(swap(value, i, i - 1))} className="flex h-14 w-14 items-center justify-center rounded-[10px] disabled:opacity-40" style={{ border: '2px solid var(--line)' }}><Icon name="up" /></button>
                    <button type="button" aria-label="Move later" disabled={i === value.length - 1} onClick={() => onChange(swap(value, i, i + 1))} className="flex h-14 w-14 items-center justify-center rounded-[10px] disabled:opacity-40" style={{ border: '2px solid var(--line)' }}><Icon name="down" /></button>
                  </div>
                )}
                <EButton small variant="quiet" icon={<Icon name="trash" size={18} />} onClick={() => onChange(value.filter((_, j) => j !== i))}>Remove</EButton>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function swap<T>(items: T[], a: number, b: number): T[] {
  const next = items.slice()
  ;[next[a], next[b]] = [next[b], next[a]]
  return next
}

export function PickOnePhoto({ label, hint, value, onChange, round = false }: { label: string; hint?: string; value: ImageRef | null; onChange: (v: ImageRef | null) => void; round?: boolean }) {
  return (
    <Field label={label} hint={hint}>
      {value ? (
        <div className="flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value.thumbnailUrl} alt="" className={`story-photo h-[120px] w-[120px] object-cover ${round ? 'rounded-full' : 'rounded-md'}`} />
          <EButton small variant="quiet" icon={<Icon name="trash" size={18} />} onClick={() => onChange(null)}>Remove</EButton>
        </div>
      ) : (
        <PhotoPicker multiple={false} withCaptions={false} value={[]} onChange={(imgs) => onChange(imgs[0] ? { url: imgs[0].url, thumbnailUrl: imgs[0].thumbnailUrl, width: imgs[0].width, height: imgs[0].height } : null)} />
      )}
    </Field>
  )
}
