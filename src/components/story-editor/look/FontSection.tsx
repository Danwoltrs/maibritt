'use client'

import { useState } from 'react'
import type { StoryLook } from '@/lib/story/types'
import { fontById } from '@/lib/story/fonts'
import { EButton, Icon } from '../ui'
import { FontPicker } from './FontPicker'

const READING_SAMPLE = 'Um dia de sol em Santos, et lille hus i Danmark'

function FontRow({ label, sample, value, onChange, pickerTitle }: { label: string; sample: string; value: string; onChange: (id: string) => void; pickerTitle: string }) {
  const [open, setOpen] = useState(false)
  const font = fontById(value)
  return (
    <div className="flex flex-wrap items-center gap-5 rounded-2xl border p-5" style={{ borderColor: 'var(--line)', background: 'var(--white)' }}>
      <div className="flex min-w-[240px] flex-grow flex-col gap-1">
        <span className="text-[18px] uppercase tracking-[0.08em]" style={{ color: 'var(--ink-2)' }}>{label} · {font.name}</span>
        <span className="truncate text-[34px] leading-tight" style={{ fontFamily: `var(${font.cssVar})`, color: 'var(--ink)' }}>{sample}</span>
      </div>
      <EButton small icon={<Icon name="pencil" size={20} />} onClick={() => setOpen(true)}>Change</EButton>
      <FontPicker open={open} title={pickerTitle} sample={sample} value={value} onChoose={(id) => { onChange(id); setOpen(false) }} onClose={() => setOpen(false)} />
    </div>
  )
}

export function FontSection({ look, name, onChange }: { look: StoryLook; name: string; onChange: (fonts: StoryLook['fonts']) => void }) {
  const headingSample = name.trim() || 'Your name'
  return (
    <section className="flex flex-col gap-4">
      <h2 className="story-serif m-0 text-[36px] font-medium" style={{ color: 'var(--ink)' }}>Fonts</h2>
      <FontRow label="For headings" sample={headingSample} value={look.fonts.heading} pickerTitle="A font for your headings" onChange={(heading) => onChange({ ...look.fonts, heading })} />
      <FontRow label="For reading" sample={READING_SAMPLE} value={look.fonts.body} pickerTitle="A font for reading" onChange={(body) => onChange({ ...look.fonts, body })} />
    </section>
  )
}
