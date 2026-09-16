'use client'

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import type { BlockKind } from '@/lib/story/types'
import { EButton, Icon } from './ui'

const CHOICES: { kind: BlockKind; icon: 'text' | 'photo' | 'gallery' | 'slides' | 'video' | 'mic'; name: string; desc: string }[] = [
  { kind: 'text', icon: 'text', name: 'Text', desc: 'A heading and a few paragraphs' },
  { kind: 'photo', icon: 'photo', name: 'Photo', desc: 'One big photo, with a caption if you like' },
  { kind: 'gallery', icon: 'gallery', name: 'Photo gallery', desc: 'Several photos, side by side' },
  { kind: 'slideshow', icon: 'slides', name: 'Slideshow', desc: 'Photos that fade one into another' },
  { kind: 'video', icon: 'video', name: 'Video', desc: 'A film clip from your phone or computer, or a link to one online' },
  { kind: 'audio', icon: 'mic', name: 'Voice recording', desc: 'Tell this part of the story in your own voice' },
]

export function AddMenu({ open, onClose, onChoose }: { open: boolean; onClose: () => void; onChoose: (kind: BlockKind) => void }) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="story-theme max-w-[640px] rounded-[22px] border-0 p-8 [&>button]:hidden" style={{ background: 'var(--paper)' }}>
        <DialogTitle className="story-serif text-[34px] font-medium md:text-[38px]" style={{ color: 'var(--ink)' }}>
          What would you like to add?
        </DialogTitle>
        <div className="flex flex-col gap-3">
          {CHOICES.map((c) => (
            <button
              key={c.kind}
              type="button"
              onClick={() => onChoose(c.kind)}
              className="flex min-h-[92px] items-center gap-5 rounded-[14px] px-6 text-left transition-colors hover:bg-[var(--accent-soft)]"
              style={{ border: '2px solid var(--line)', background: 'var(--white)' }}
            >
              <span className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-xl" style={{ background: 'var(--accent-soft)', color: 'var(--accent-2)' }}><Icon name={c.icon} size={26} /></span>
              <span className="flex flex-col gap-0.5">
                <span className="text-[23px] font-semibold" style={{ color: 'var(--ink)' }}>{c.name}</span>
                <span className="text-[18px]" style={{ color: 'var(--ink-2)' }}>{c.desc}</span>
              </span>
            </button>
          ))}
        </div>
        <div className="flex justify-end">
          <EButton variant="quiet" onClick={onClose}>Never mind</EButton>
        </div>
      </DialogContent>
    </Dialog>
  )
}
