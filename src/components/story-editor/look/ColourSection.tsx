'use client'

import { useEffect, useRef, useState } from 'react'
import type { StoryColors } from '@/lib/story/types'
import { DEFAULT_COLORS, PALETTES, ROLE_INFO, readabilityNote } from '@/lib/story/look'
import { EButton, Icon } from '../ui'

function samePalette(a: StoryColors, b: StoryColors): boolean {
  return (Object.keys(a) as (keyof StoryColors)[]).every((k) => a[k].toLowerCase() === b[k].toLowerCase())
}

function Swatch({ colors, selected, name, onClick }: { colors: StoryColors; selected: boolean; name: string; onClick: () => void }) {
  const stripes = [colors.page, colors.text, colors.accent, colors.accentText, colors.backdrop]
  return (
    <button type="button" onClick={onClick} className="flex w-[104px] flex-col items-center gap-2 rounded-[14px] p-2" style={{ background: selected ? 'var(--accent-soft)' : 'transparent' }} aria-pressed={selected}>
      <span className="flex h-16 w-16 overflow-hidden rounded-full" style={{ boxShadow: selected ? '0 0 0 3px var(--accent)' : '0 0 0 2px var(--line)' }}>
        {stripes.map((c, i) => (
          <span key={i} className="h-full flex-1" style={{ background: c }} />
        ))}
      </span>
      <span className="text-center text-[18px] leading-tight" style={{ color: 'var(--ink)' }}>{name}</span>
    </button>
  )
}

/**
 * The native picker fires `change` on every tick in Chrome but only on close
 * in Safari and Firefox. The swatch and the preview follow every tick through
 * `onPreview`; the store is written once, on blur, through `onCommit`.
 */
function RoleRow({ label, hint, value, onPreview, onCommit }: { label: string; hint: string; value: string; onPreview: (hex: string) => void; onCommit: (hex: string) => void }) {
  const input = useRef<HTMLInputElement>(null)
  const [live, setLive] = useState(value)
  useEffect(() => setLive(value), [value])
  return (
    <div className="flex flex-wrap items-center gap-5 rounded-2xl border p-5" style={{ borderColor: 'var(--line)', background: 'var(--white)' }}>
      <span className="h-14 w-14 shrink-0 rounded-[10px]" style={{ background: live, border: '2px solid var(--line)' }} />
      <div className="flex min-w-[200px] flex-grow flex-col gap-1">
        <span className="text-[20px] font-semibold" style={{ color: 'var(--ink)' }}>{label}</span>
        <span className="text-[18px]" style={{ color: 'var(--ink-2)' }}>{hint}</span>
      </div>
      <span className="relative inline-flex">
        <input
          ref={input}
          type="color"
          value={live}
          onChange={(e) => {
            setLive(e.target.value)
            onPreview(e.target.value)
          }}
          onBlur={() => live !== value && onCommit(live)}
          aria-label={`Choose the ${label.toLowerCase()} colour`}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
        <EButton small icon={<Icon name="pencil" size={20} />} onClick={() => input.current?.click()}>Change</EButton>
      </span>
    </div>
  )
}

export function ColourSection({ colors, onPreview, onChange }: { colors: StoryColors; onPreview: (colors: StoryColors) => void; onChange: (colors: StoryColors) => void }) {
  const note = readabilityNote(colors)
  return (
    <section className="flex flex-col gap-5">
      <h2 className="story-serif m-0 text-[36px] font-medium" style={{ color: 'var(--ink)' }}>Colours</h2>
      <div className="flex flex-wrap gap-2">
        {PALETTES.map((p) => (
          <Swatch key={p.id} colors={p.colors} name={p.name} selected={samePalette(p.colors, colors)} onClick={() => onChange({ ...p.colors })} />
        ))}
      </div>
      <div className="flex flex-col gap-3">
        {ROLE_INFO.map((r) => (
          <RoleRow key={r.key} label={r.label} hint={r.hint} value={colors[r.key]} onPreview={(hex) => onPreview({ ...colors, [r.key]: hex })} onCommit={(hex) => onChange({ ...colors, [r.key]: hex })} />
        ))}
      </div>
      {note && <p className="m-0 text-[18px]" style={{ color: 'var(--ink-2)' }}>{note}</p>}
      {!samePalette(colors, DEFAULT_COLORS) && (
        <div>
          <EButton variant="quiet" onClick={() => onChange({ ...DEFAULT_COLORS })}>Back to the original colours</EButton>
        </div>
      )}
    </section>
  )
}
