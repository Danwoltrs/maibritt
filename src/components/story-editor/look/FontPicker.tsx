'use client'

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { FONTS, FONT_KIND_LABEL, FONT_KIND_ORDER } from '@/lib/story/fonts'
import { EButton, Icon } from '../ui'
import { STORY_FONT_CLASSES } from '@/app/story/fonts'

export function FontPicker({ open, title, sample, value, onChoose, onClose }: { open: boolean; title: string; sample: string; value: string; onChoose: (id: string) => void; onClose: () => void }) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className={`${STORY_FONT_CLASSES} story-theme max-h-[92svh] max-w-[860px] overflow-y-auto rounded-[22px] border-0 p-8 [&>button]:hidden`} style={{ background: 'var(--paper)' }}>
        <DialogTitle className="story-serif text-[34px] font-medium md:text-[38px]" style={{ color: 'var(--ink)' }}>{title}</DialogTitle>
        {FONT_KIND_ORDER.map((kind) => (
          <div key={kind} className="flex flex-col gap-3">
            <span className="text-[18px] uppercase tracking-[0.08em]" style={{ color: 'var(--ink-2)' }}>{FONT_KIND_LABEL[kind]}</span>
            <div className="grid gap-3 md:grid-cols-2">
              {FONTS.filter((f) => f.kind === kind).map((f) => {
                const selected = f.id === value
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => onChoose(f.id)}
                    className="relative flex min-h-[96px] flex-col justify-center gap-1 rounded-[14px] px-6 py-4 text-left"
                    style={{ border: `${selected ? 3 : 2}px solid ${selected ? 'var(--accent)' : 'var(--line)'}`, background: selected ? 'var(--accent-soft)' : 'var(--white)' }}
                  >
                    {selected && <span className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full" style={{ background: 'var(--accent)', color: 'var(--white)' }}><Icon name="check" size={18} /></span>}
                    <span className="truncate text-[30px] leading-tight" style={{ fontFamily: `var(${f.cssVar})`, color: 'var(--ink)' }}>{sample}</span>
                    <span className="text-[18px]" style={{ color: 'var(--ink-2)' }}>{f.name}</span>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
        <div className="flex justify-end">
          <EButton variant="quiet" onClick={onClose}>Never mind</EButton>
        </div>
      </DialogContent>
    </Dialog>
  )
}
