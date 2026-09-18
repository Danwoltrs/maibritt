'use client'

import { useEffect, useRef, useState } from 'react'
import type { SectionLayout, TileStyle } from '@/lib/story/types'
import { TILE_LABEL } from '@/lib/story/layout'
import { MAX_PADDING, MAX_RADIUS, MENU_FOR, TILE_ROLE, clearTileStyle, nextScale, setTileStyle, styleOf, type MenuSection } from '@/lib/story/tileStyle'
import { MAX_INDENT } from '@/lib/story/rich'
import { FONTS, FONT_KIND_LABEL, FONT_KIND_ORDER, fontById } from '@/lib/story/fonts'
import { PALETTES } from '@/lib/story/look'
import { Icon } from '../ui'

const WIDTH = 288

type Props = {
  name: string
  at: { x: number; y: number }
  layout: SectionLayout
  canWrite: boolean
  onChange: (layout: SectionLayout) => void
  onWrite: () => void
  onClose: () => void
}

function Row({ label, detail, onClick }: { label: string; detail?: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-[56px] w-full items-center justify-between gap-3 rounded-[10px] px-4 text-left text-[19px] hover:bg-[var(--accent-soft)]" role="menuitem"
      style={{ color: 'var(--ink)' }}
    >
      <span>{label}</span>
      {detail && <span className="text-[18px]" style={{ color: 'var(--ink-2)' }}>{detail}</span>}
    </button>
  )
}

function Heading({ children }: { children: string }) {
  return (
    <span className="px-4 pb-1 pt-3 text-[18px] uppercase tracking-[0.1em]" style={{ color: 'var(--ink-3)' }}>
      {children}
    </span>
  )
}

function ColourRows({ label, value, onPick }: { label: string; value?: string; onPick: (hex: string) => void }) {
  const input = useRef<HTMLInputElement>(null)
  const swatches = Array.from(new Set(PALETTES.flatMap((p) => [p.colors.text, p.colors.accent, p.colors.page, p.colors.accentText, p.colors.backdrop])))
  return (
    <div className="flex flex-col gap-2 px-4 py-2">
      <span className="text-[18px]" style={{ color: 'var(--ink-2)' }}>{label}</span>
      <div className="flex flex-wrap gap-2">
        {swatches.map((c) => (
          <button
            key={c}
            type="button"
            aria-label={c}
            onClick={() => onPick(c)}
            className="h-10 w-10 rounded-full"
            style={{ background: c, boxShadow: value?.toLowerCase() === c.toLowerCase() ? '0 0 0 3px var(--accent)' : '0 0 0 1px var(--line)' }}
          />
        ))}
        <span className="relative inline-flex">
          <input
            ref={input}
            type="color"
            value={value ?? '#000000'}
            onChange={(e) => onPick(e.target.value)}
            aria-label={`${label}: pick any colour`}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
          <button type="button" onClick={() => input.current?.click()} className="flex h-11 items-center rounded-full px-3 text-[18px]" style={{ border: '2px solid var(--line)', color: 'var(--ink)' }}>
            Any colour
          </button>
        </span>
      </div>
    </div>
  )
}

export function PieceMenu({ name, at, layout, canWrite, onChange, onWrite, onClose }: Props) {
  const box = useRef<HTMLDivElement>(null)
  const [sub, setSub] = useState<'font' | null>(null)
  const role = TILE_ROLE[name] ?? 'text'
  const style = styleOf(layout, name)
  // Only offer writing where there are words of hers to change.
  const sections = MENU_FOR[role].filter((s) => s !== 'write' || canWrite)
  const label = TILE_LABEL[name] ?? name

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && (sub ? setSub(null) : onClose())
    const onDown = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) onClose()
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('pointerdown', onDown)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('pointerdown', onDown)
    }
  }, [onClose, sub])

  const patch = (p: TileStyle) => onChange(setTileStyle(layout, name, p))

  const left = Math.max(12, Math.min(at.x, (typeof window === 'undefined' ? 1280 : window.innerWidth) - WIDTH - 12))
  const top = Math.max(12, Math.min(at.y, (typeof window === 'undefined' ? 800 : window.innerHeight) - 420))

  const section = (kind: MenuSection) => {
    switch (kind) {
      case 'write':
        return <Row key={kind} label={role === 'button' ? 'Change the words' : 'Write here'} onClick={onWrite} />
      case 'font':
        return <Row key={kind} label="Font" detail={style.font ? fontById(style.font).name : 'The story’s font'} onClick={() => setSub('font')} />
      case 'colour':
        return <ColourRows key={kind} label="Colour of the words" value={style.color} onPick={(hex) => patch({ color: hex })} />
      case 'buttonColour':
        return (
          <div key={kind} className="flex flex-col">
            <ColourRows label="Button colour" value={style.button?.background} onPick={(hex) => patch({ button: { background: hex } })} />
            <ColourRows label="Colour of the words" value={style.button?.label} onPick={(hex) => patch({ button: { label: hex } })} />
          </div>
        )
      case 'size':
        return (
          <div key={kind} className="flex gap-2 px-4 py-1">
            <Row label="Bigger" onClick={() => patch({ scale: nextScale(style.scale, 1) })} />
            <Row label="Smaller" onClick={() => patch({ scale: nextScale(style.scale, -1) })} />
          </div>
        )
      case 'align':
        return (
          <div key={kind} className="flex flex-col">
            <Heading>Line it up</Heading>
            <div className="flex gap-1 px-4">
              {(['left', 'center', 'right'] as const).map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => patch({ align: a })}
                  className="flex h-[52px] flex-1 items-center justify-center rounded-[10px] text-[18px]"
                  style={{ border: `2px solid ${style.align === a ? 'var(--accent)' : 'var(--line)'}`, color: 'var(--ink)' }}
                >
                  {a === 'left' ? 'Left' : a === 'center' ? 'Middle' : 'Right'}
                </button>
              ))}
            </div>
          </div>
        )
      case 'indent':
        return (
          <div key={kind} className="flex gap-2 px-4 py-1">
            <Row label="Move in" onClick={() => patch({ indent: Math.min(MAX_INDENT, (style.indent ?? 0) + 1) || undefined })} />
            <Row label="Move out" onClick={() => patch({ indent: Math.max(0, (style.indent ?? 0) - 1) || undefined })} />
          </div>
        )
      case 'box':
        return (
          <div key={kind} className="flex flex-col">
            <Heading>A box behind it</Heading>
            <ColourRows label="Box colour" value={style.box?.background} onPick={(hex) => patch({ box: { background: hex } })} />
            <div className="flex gap-2 px-4">
              <Row label="More room" onClick={() => patch({ box: { padding: Math.min(MAX_PADDING, (style.box?.padding ?? 0) + 1) } })} />
              <Row label="Less room" onClick={() => patch({ box: { padding: Math.max(0, (style.box?.padding ?? 0) - 1) } })} />
            </div>
            <div className="flex gap-2 px-4">
              <Row label="Rounder" onClick={() => patch({ box: { radius: Math.min(MAX_RADIUS, (style.box?.radius ?? 0) + 1) } })} />
              <Row label="Squarer" onClick={() => patch({ box: { radius: Math.max(0, (style.box?.radius ?? 0) - 1) } })} />
            </div>
            {style.box && <Row label="No box" onClick={() => patch({ box: undefined })} />}
          </div>
        )
      case 'rounded':
        return (
          <div key={kind} className="flex flex-col">
            <Heading>Corners</Heading>
            <div className="flex gap-1 px-4">
              {(['round', 'soft', 'square'] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => patch({ button: { corners: c } })}
                  className="flex h-[52px] flex-1 items-center justify-center rounded-[10px] text-[18px]"
                  style={{ border: `2px solid ${(style.button?.corners ?? 'round') === c ? 'var(--accent)' : 'var(--line)'}`, color: 'var(--ink)' }}
                >
                  {c === 'round' ? 'Round' : c === 'soft' ? 'Soft' : 'Square'}
                </button>
              ))}
            </div>
          </div>
        )
      case 'reset':
        return (
          <div key={kind} className="flex flex-col">
            <span className="mx-4 my-2 h-px" style={{ background: 'var(--line)' }} />
            <Row label="Back to the story's look" onClick={() => { onChange(clearTileStyle(layout, name)); onClose() }} />
          </div>
        )
    }
  }

  return (
    <div
      ref={box}
      className="fixed z-[80] flex max-h-[80svh] flex-col overflow-y-auto rounded-[14px] p-2 shadow-xl"
      style={{ left, top, width: WIDTH, border: '2px solid var(--line)', background: 'var(--white)' }}
      role="menu"
      aria-label={label}
    >
      {sub === 'font' ? (
        <>
          <Row label="Back" onClick={() => setSub(null)} />
          {FONT_KIND_ORDER.map((kind) => (
            <div key={kind} className="flex flex-col">
              <Heading>{FONT_KIND_LABEL[kind]}</Heading>
              {FONTS.filter((f) => f.kind === kind).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => { patch({ font: f.id }); setSub(null) }}
                  className="flex min-h-[56px] items-center justify-between rounded-[10px] px-4 text-left hover:bg-[var(--accent-soft)]"
                  style={{ color: 'var(--ink)' }}
                >
                  <span className="truncate text-[24px]" style={{ fontFamily: `var(${f.cssVar})` }}>{f.name}</span>
                  {style.font === f.id && <Icon name="check" size={20} />}
                </button>
              ))}
            </div>
          ))}
          <Row label="The story's font" onClick={() => { patch({ font: undefined }); setSub(null) }} />
        </>
      ) : (
        <>
          <span className="px-4 pb-2 pt-2 text-[18px] uppercase tracking-[0.1em]" style={{ color: 'var(--ink-2)' }}>{label}</span>
          {sections.map(section)}
        </>
      )}
    </div>
  )
}
