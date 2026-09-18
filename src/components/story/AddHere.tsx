'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { BlockKind } from '@/lib/story/types'
import { BLOCK_KIND_LABEL } from '@/components/story-editor/screens'
import { Icon } from '@/components/story-editor/ui'

const KINDS: { kind: BlockKind; icon: 'text' | 'photo' | 'gallery' | 'slides' | 'video' | 'mic' }[] = [
  { kind: 'text', icon: 'text' },
  { kind: 'photo', icon: 'photo' },
  { kind: 'gallery', icon: 'gallery' },
  { kind: 'slideshow', icon: 'slides' },
  { kind: 'video', icon: 'video' },
  { kind: 'audio', icon: 'mic' },
]

/** Where the new thing goes: before a block, or at the end of a chapter. */
export type AddTarget = { before: string } | { end: string }

export function addHref(target: AddTarget, kind: BlockKind): string {
  const where = 'before' in target ? `before=${encodeURIComponent(target.before)}` : `end=${encodeURIComponent(target.end)}`
  return `/story/edit?${where}&kind=${kind}`
}

/**
 * A quiet "+ Add something here" on the seam between two sections, shown only
 * to her. Hovering (or tapping) opens the six kinds; choosing one goes straight
 * to that screen of the editor, at this spot.
 */
export function AddHere({ target }: { target: AddTarget }) {
  const [open, setOpen] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const router = useRouter()

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])

  const show = () => {
    if (timer.current) clearTimeout(timer.current)
    setOpen(true)
  }
  const hideSoon = () => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setOpen(false), 260)
  }

  return (
    <div className="relative z-40 h-0">
      <div
        className="absolute left-1/2 top-0 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
        onMouseEnter={show}
        onMouseLeave={hideSoon}
      >
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label="Add something here"
          aria-expanded={open}
          className="inline-flex h-14 items-center gap-2.5 rounded-full px-6 text-[18px] font-semibold backdrop-blur-sm transition-opacity"
          style={{
            border: '2px solid var(--accent)',
            background: open ? 'var(--accent)' : 'var(--white)',
            color: open ? 'var(--accent-text)' : 'var(--accent)',
            opacity: open ? 1 : 0.85,
          }}
        >
          <Icon name="plus" size={20} />
          <span>Add something here</span>
        </button>

        {open && (
          <div
            className="absolute top-full mt-2 flex w-[260px] flex-col gap-1 rounded-[14px] p-2 shadow-lg"
            style={{ border: '2px solid var(--line)', background: 'var(--white)' }}
          >
            {KINDS.map((k) => (
              <button
                key={k.kind}
                type="button"
                onClick={() => router.push(addHref(target, k.kind))}
                className="flex min-h-[52px] items-center gap-3 rounded-[10px] px-4 text-left text-[19px] transition-colors hover:bg-[var(--accent-soft)]"
                style={{ color: 'var(--ink)' }}
              >
                <span style={{ color: 'var(--accent-2)' }}><Icon name={k.icon} size={22} /></span>
                <span>{BLOCK_KIND_LABEL[k.kind]}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
