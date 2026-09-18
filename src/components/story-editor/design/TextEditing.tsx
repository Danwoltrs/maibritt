'use client'

import { useEffect, useRef, useState } from 'react'
import type { RichText } from '@/lib/story/types'
import { richFromElement, richToHtml, setParagraphAlign, setParagraphIndent } from '@/lib/story/rich'
import type { Rect } from './useTileRects'

export type EditResult = { rich: RichText; plain: string }

type Props = {
  rect: Rect
  html: string
  marks: boolean
  onCommit: (el: HTMLElement) => void
  onClose: () => void
}

function Key({ label, title, onClick, active = false }: { label: string; title: string; onClick: () => void; active?: boolean }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className="flex h-11 min-w-[44px] items-center justify-center rounded-[8px] px-3 text-[19px]"
      style={{ background: active ? 'var(--accent)' : 'transparent', color: active ? 'var(--accent-text)' : 'var(--ink)' }}
    >
      {label}
    </button>
  )
}

/**
 * Turns one piece into something she can type into, right where it sits, with a
 * small toolbar over it. Marks use execCommand, which every browser this site
 * supports still honours; the result is read back through richFromElement, so
 * nothing but the four tags we understand can survive.
 */
export function TextEditing({ rect, html, marks, onCommit, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [, force] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.innerHTML = html
    el.focus()
    const range = document.createRange()
    range.selectNodeContents(el)
    range.collapse(false)
    const sel = window.getSelection()
    sel?.removeAllRanges()
    sel?.addRange(range)
  }, [html])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.preventDefault()
      const el = ref.current
      if (el) onCommit(el)
      onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCommit, onClose])

  const command = (name: string) => {
    document.execCommand(name)
    ref.current?.focus()
    force((n) => n + 1)
  }

  const paragraphIndex = (): number => {
    const el = ref.current
    const sel = window.getSelection()
    if (!el || !sel || sel.rangeCount === 0) return -1
    let node: Node | null = sel.getRangeAt(0).startContainer
    while (node && node.parentNode !== el) node = node.parentNode
    return node ? Array.prototype.indexOf.call(el.childNodes, node) : -1
  }

  const applyParagraph = (fn: (rich: RichText, index: number) => RichText) => {
    const el = ref.current
    if (!el) return
    const index = paragraphIndex()
    if (index < 0) return
    el.innerHTML = richToHtml(fn(richFromElement(el), index))
    el.focus()
    force((n) => n + 1)
  }

  const active = (name: string) => {
    try {
      return document.queryCommandState(name)
    } catch {
      return false
    }
  }

  return (
    <>
      <div
        className="fixed inset-0 z-[70]"
        onPointerDown={() => {
          const el = ref.current
          if (el) onCommit(el)
          onClose()
        }}
      />
      <div
        className="absolute z-[75] flex items-center gap-1 rounded-[12px] p-1.5 shadow-xl"
        style={{ left: rect.left, top: Math.max(8, rect.top - 60), border: '2px solid var(--line)', background: 'var(--white)' }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {marks && (
          <>
            <Key label="B" title="Bold" onClick={() => command('bold')} active={active('bold')} />
            <Key label="I" title="Italic" onClick={() => command('italic')} active={active('italic')} />
            <Key label="U" title="Underline" onClick={() => command('underline')} active={active('underline')} />
            <span className="mx-1 h-6 w-px" style={{ background: 'var(--line)' }} />
          </>
        )}
        <Key label="Left" title="Line it up on the left" onClick={() => applyParagraph((r, i) => setParagraphAlign(r, i, 'left'))} />
        <Key label="Middle" title="Line it up in the middle" onClick={() => applyParagraph((r, i) => setParagraphAlign(r, i, 'center'))} />
        <Key label="Right" title="Line it up on the right" onClick={() => applyParagraph((r, i) => setParagraphAlign(r, i, 'right'))} />
        <span className="mx-1 h-6 w-px" style={{ background: 'var(--line)' }} />
        <Key label="→" title="Move in" onClick={() => applyParagraph((r, i) => setParagraphIndent(r, i, 1))} />
        <Key label="←" title="Move out" onClick={() => applyParagraph((r, i) => setParagraphIndent(r, i, -1))} />
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline={marks}
        className="absolute z-[75] outline-none"
        style={{
          left: rect.left,
          top: rect.top,
          width: rect.width,
          minHeight: rect.height,
          boxShadow: '0 0 0 2px var(--accent)',
          borderRadius: 4,
          background: 'rgba(251,249,245,0.06)',
        }}
        onPointerDown={(e) => e.stopPropagation()}
        onKeyUp={() => force((n) => n + 1)}
        onMouseUp={() => force((n) => n + 1)}
      />
    </>
  )
}
