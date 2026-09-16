'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Block } from '@/lib/story/types'
import { BLOCK_KIND_LABEL } from './screens'
import { EButton, Icon } from './ui'
import { formatTime } from '@/lib/story/timing'

function Thumbs({ urls }: { urls: string[] }) {
  return (
    <div className="flex flex-wrap gap-2.5">
      {urls.slice(0, 6).map((u, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={i} src={u} alt="" className="story-photo h-[96px] w-[96px] rounded-md object-cover" />
      ))}
      {urls.length > 6 && <span className="self-center text-[18px]" style={{ color: 'var(--ink-2)' }}>and {urls.length - 6} more</span>}
    </div>
  )
}

function Preview({ block }: { block: Block }) {
  switch (block.kind) {
    case 'text':
      return (
        <p className="story-serif m-0 line-clamp-2 text-[24px] leading-[1.35]" style={{ color: 'var(--ink)' }}>
          {block.heading || block.body.slice(0, 160) || 'Nothing written yet'}
        </p>
      )
    case 'photo':
      return (
        <div className="flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={block.image.thumbnailUrl} alt="" className="story-photo h-[130px] w-[200px] rounded-md object-cover" />
          {block.caption && <p className="story-serif m-0 text-[20px] italic" style={{ color: 'var(--ink-2)' }}>“{block.caption}”</p>}
        </div>
      )
    case 'gallery':
    case 'slideshow':
      return <Thumbs urls={block.images.map((i) => i.thumbnailUrl)} />
    case 'audio':
      return (
        <div className="flex items-center gap-4 text-[18px]" style={{ color: 'var(--ink-2)' }}>
          <span className="flex h-[52px] w-[52px] items-center justify-center rounded-full" style={{ background: 'var(--ink)', color: 'var(--white)' }}><Icon name="play" /></span>
          <span>{block.heading || 'Your voice'} · {formatTime(block.audio.durationSec)}</span>
        </div>
      )
    case 'video':
      return (
        <div className="flex items-center gap-4">
          {block.source.type === 'upload' && block.source.poster ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={block.source.poster.thumbnailUrl} alt="" className="story-photo h-[130px] w-[200px] rounded-md object-cover" />
          ) : (
            <span className="flex h-[130px] w-[200px] items-center justify-center rounded-md" style={{ background: 'var(--paper-2)', color: 'var(--ink-2)' }}><Icon name="video" size={40} /></span>
          )}
          <p className="story-serif m-0 text-[20px] italic" style={{ color: 'var(--ink-2)' }}>{block.caption || (block.source.type === 'link' ? `From ${block.source.provider === 'youtube' ? 'YouTube' : 'Vimeo'}` : 'Your video')}</p>
        </div>
      )
  }
}

function kindDetail(block: Block): string {
  if (block.kind === 'gallery') return 'Photo gallery · slides sideways'
  if (block.kind === 'slideshow') return block.timing.mode === 'audio' ? 'Slideshow · follows your voice' : `Slideshow · every ${block.timing.seconds} seconds`
  if (block.kind === 'audio') return `Voice recording · ${formatTime(block.audio.durationSec)}`
  return BLOCK_KIND_LABEL[block.kind]
}

const CHANGE_LABEL: Record<Block['kind'], string> = {
  text: 'Change the words',
  photo: 'Change the photo',
  gallery: 'Change the photos',
  slideshow: 'Change the photos',
  audio: 'Record again',
  video: 'Change the video',
}

const ICON: Record<Block['kind'], 'text' | 'photo' | 'gallery' | 'slides' | 'mic' | 'video'> = {
  text: 'text',
  photo: 'photo',
  gallery: 'gallery',
  slideshow: 'slides',
  audio: 'mic',
  video: 'video',
}

type Props = {
  block: Block
  isFirst: boolean
  isLast: boolean
  onChange: () => void
  onRemove: (label: string) => void
  onMove: (delta: -1 | 1) => void
  onArrange?: () => void
}

export function BlockCard({ block, isFirst, isLast, onChange, onRemove, onMove, onArrange }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.6 : 1 }

  return (
    <div ref={setNodeRef} style={{ ...style, borderColor: 'var(--line)', background: 'var(--white)' }} className="flex gap-5 rounded-2xl border p-6 md:gap-7 md:p-7">
      <button type="button" aria-label="Drag to move" className="hidden cursor-grab items-center md:flex" style={{ color: 'var(--ink-3)' }} {...attributes} {...listeners}>
        <Icon name="grip" />
      </button>
      <div className="flex min-w-0 flex-grow flex-col gap-4">
        <div className="flex items-center gap-2.5" style={{ color: 'var(--ink-2)' }}>
          <Icon name={ICON[block.kind]} size={20} />
          <span className="text-[18px] uppercase tracking-[0.08em]">{kindDetail(block)}</span>
          {block.layout && <span className="text-[18px]" style={{ color: 'var(--accent-2)' }}>· Arranged by you</span>}
        </div>
        <Preview block={block} />
        <div className="flex flex-wrap gap-3">
          <EButton small icon={<Icon name="pencil" size={20} />} onClick={onChange}>{CHANGE_LABEL[block.kind]}</EButton>
          {onArrange && <EButton small icon={<Icon name="grid" size={20} />} onClick={onArrange}>Move things around</EButton>}
          <EButton small variant="quiet" icon={<Icon name="trash" size={20} />} onClick={() => onRemove(BLOCK_KIND_LABEL[block.kind])}>Remove</EButton>
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-center gap-2">
        <button type="button" aria-label="Move up" disabled={isFirst} onClick={() => onMove(-1)} className="flex h-14 w-14 items-center justify-center rounded-[10px] disabled:opacity-40" style={{ border: '2px solid var(--line)', background: 'var(--white)', color: 'var(--ink)' }}><Icon name="up" size={26} /></button>
        <span className="text-[18px]" style={{ color: 'var(--ink-2)' }}>Move</span>
        <button type="button" aria-label="Move down" disabled={isLast} onClick={() => onMove(1)} className="flex h-14 w-14 items-center justify-center rounded-[10px] disabled:opacity-40" style={{ border: '2px solid var(--line)', background: 'var(--white)', color: 'var(--ink)' }}><Icon name="down" size={26} /></button>
      </div>
    </div>
  )
}
