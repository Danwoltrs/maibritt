'use client'

import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import type { RichText } from '@/lib/story/types'
import { richFromElement, richToHtml, setParagraphAlign, setParagraphIndent } from '@/lib/story/rich'
import type { Rect } from './useTileRects'

export type EditResult = { rich: RichText; plain: string }

type Props = {
  tile: HTMLElement
  rect: Rect
  html: string
  marks: boolean
  onCommit: (el: HTMLElement) => void
  onClose: () => void
}

/**
 * Copies the look of the piece being edited onto the editable, so what she
 * types is set in the same face, size and colour it will be published in.
 */
function typographyOf(tile: HTMLElement): CSSProperties {
  const piece = tile.querySelector<HTMLElement>('.piece') ?? tile
  const s = window.getComputedStyle(piece)
  return {
    fontFamily: s.fontFamily,
    fontSize: s.fontSize,
    fontWeight: s.fontWeight,
    fontStyle: s.fontStyle,
    lineHeight: s.lineHeight,
    letterSpacing: s.letterSpacing,
    color: s.color,
    textTransform: s.textTransform as CSSProperties['textTransform'],
    textAlign: window.getComputedStyle(tile).textAlign as CSSProperties['textAlign'],
  }
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
export function TextEditing({ tile, rect, html, marks, onCommit, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [, force] = useState(0)
  const typography = useMemo(() => typographyOf(tile), [tile])

  // The real piece steps aside while she types, so she never sees the words twice.
  useEffect(() => {
    const previous = tile.style.visibility
    tile.style.visibility = 'hidden'
    return () => {
      tile.style.visibility = previous
    }
  }, [tile])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    // Only the rich path is html we generated ourselves; a plain field is text
    // and must never be parsed as markup.
    if (marks) el.innerHTML = html
    else el.textContent = html
    el.focus()
    const range = document.createRange()
    range.selectNodeContents(el)
    range.collapse(false)
    const sel = window.getSelection()
    sel?.removeAllRanges()
    sel?.addRange(range)
  }, [html, marks])

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
    // Ask for tags rather than inline styles; richFromElement reads both, but
    // tags survive a round trip more predictably.
    try {
      document.execCommand('styleWithCSS', false, 'false')
    } catch {
      // Some browsers refuse; the style reader covers us.
    }
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

  /** Where the caret sits, counted in characters from the start of its paragraph. */
  const caretOffset = (index: number): number => {
    const el = ref.current
    const sel = window.getSelection()
    if (!el || !sel || sel.rangeCount === 0) return 0
    const paragraph = el.childNodes[index]
    if (!paragraph) return 0
    const range = sel.getRangeAt(0).cloneRange()
    range.selectNodeContents(paragraph)
    range.setEnd(sel.getRangeAt(0).endContainer, sel.getRangeAt(0).endOffset)
    return range.toString().length
  }

  const putCaret = (index: number, offset: number) => {
    const el = ref.current
    const paragraph = el?.childNodes[index]
    if (!el || !paragraph) return
    const walker = document.createTreeWalker(paragraph, NodeFilter.SHOW_TEXT)
    let left = offset
    let node = walker.nextNode()
    while (node && left > (node.textContent?.length ?? 0)) {
      left -= node.textContent?.length ?? 0
      node = walker.nextNode()
    }
    const range = document.createRange()
    if (node) range.setStart(node, Math.min(left, node.textContent?.length ?? 0))
    else range.selectNodeContents(paragraph)
    range.collapse(true)
    const sel = window.getSelection()
    sel?.removeAllRanges()
    sel?.addRange(range)
  }

  const applyParagraph = (fn: (rich: RichText, index: number) => RichText) => {
    const el = ref.current
    if (!el) return
    const index = paragraphIndex()
    if (index < 0) return
    const offset = caretOffset(index)
    el.innerHTML = richToHtml(fn(richFromElement(el), index))
    el.focus()
    putCaret(index, offset)
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
        className="fixed inset-0 z-[62]"
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
        className="absolute z-[75] flex flex-col justify-center outline-none"
        style={{
          ...typography,
          left: rect.left,
          top: rect.top,
          width: rect.width,
          minHeight: rect.height,
          boxShadow: '0 0 0 2px var(--accent)',
          borderRadius: 4,
        }}
        onPointerDown={(e) => e.stopPropagation()}
        onKeyUp={() => force((n) => n + 1)}
        onMouseUp={() => force((n) => n + 1)}
      />
    </>
  )
}
