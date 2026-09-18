import type { Mark, Paragraph, RichText, Run } from './types'

export const INDENT_STEP = 32
export const MAX_INDENT = 6

const MARK_ORDER: Mark[] = ['bold', 'italic', 'underline']
const MARK_TAG: Record<Mark, string> = { bold: 'strong', italic: 'em', underline: 'u' }
const TAG_MARK: Record<string, Mark> = { B: 'bold', STRONG: 'bold', I: 'italic', EM: 'italic', U: 'underline' }
const BLOCK_TAGS = new Set(['P', 'DIV', 'LI', 'H1', 'H2', 'H3', 'H4', 'BLOCKQUOTE', 'SECTION', 'ARTICLE'])
const DROP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'IFRAME', 'OBJECT', 'EMBED', 'TEMPLATE'])

/**
 * Some browsers (Safari especially, and Chrome once styleWithCSS has been
 * flipped) express bold and friends as inline styles rather than tags. Read
 * both, or her formatting would vanish the moment she stops typing.
 */
function marksFromStyle(element: HTMLElement): Mark[] {
  const out: Mark[] = []
  const weight = element.style.fontWeight
  if (weight === 'bold' || weight === 'bolder' || (weight !== '' && Number(weight) >= 600)) out.push('bold')
  if (element.style.fontStyle === 'italic' || element.style.fontStyle === 'oblique') out.push('italic')
  if ((element.style.textDecorationLine || element.style.textDecoration || '').includes('underline')) out.push('underline')
  return out
}

function sortMarks(marks: Mark[]): Mark[] {
  return MARK_ORDER.filter((m) => marks.includes(m))
}

function sameMarks(a: Mark[] | undefined, b: Mark[] | undefined): boolean {
  const x = a ?? []
  const y = b ?? []
  return x.length === y.length && x.every((m, i) => m === y[i])
}

function pushRun(runs: Run[], text: string, marks: Mark[]): void {
  if (!text) return
  const sorted = sortMarks(marks)
  const last = runs[runs.length - 1]
  if (last && sameMarks(last.marks, sorted.length ? sorted : undefined)) {
    last.text += text
    return
  }
  runs.push(sorted.length ? { text, marks: sorted } : { text })
}

export function richFromPlain(body: string): RichText {
  const paragraphs = body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((text): Paragraph => ({ runs: [{ text }] }))
  return paragraphs.length ? paragraphs : [{ runs: [] }]
}

export function plainFromRich(rich: RichText): string {
  return rich
    .map((p) => p.runs.map((r) => r.text).join(''))
    .filter((t) => t.trim())
    .join('\n\n')
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/** The seed for the editable element. Emits only <p>, <strong>, <em> and <u>. */
export function richToHtml(rich: RichText): string {
  return rich
    .map((p) => {
      const align = p.align === 'center' || p.align === 'right' || p.align === 'left' ? p.align : undefined
      const indent = Math.max(0, Math.min(MAX_INDENT, Number(p.indent) || 0))
      const style = [align ? `text-align:${align}` : '', indent ? `padding-left:${indent * INDENT_STEP}px` : '']
        .filter(Boolean)
        .join(';')
      const attr = style ? ` style="${style}"` : ''
      const inner = p.runs
        .map((r) => {
          const tags = sortMarks(r.marks ?? []).map((m) => MARK_TAG[m])
          const open = tags.map((t) => `<${t}>`).join('')
          const close = tags.map((t) => `</${t}>`).reverse().join('')
          return `${open}${escapeHtml(r.text)}${close}`
        })
        .join('')
      return `<p${attr}>${inner || '<br>'}</p>`
    })
    .join('')
}

function readBlockStyle(node: HTMLElement): { align?: Paragraph['align']; indent?: number } {
  const align = node.style.textAlign
  const padding = parseInt(node.style.paddingLeft || '0', 10)
  const indent = Number.isFinite(padding) ? Math.min(MAX_INDENT, Math.round(padding / INDENT_STEP)) : 0
  return {
    align: align === 'center' || align === 'right' ? align : undefined,
    indent: indent > 0 ? indent : undefined,
  }
}

function trimParagraph(p: Paragraph): Paragraph {
  const runs = p.runs.filter((r) => r.text.trim() !== '')
  const out: Paragraph = { runs }
  if (p.align) out.align = p.align
  if (p.indent) out.indent = p.indent
  return out
}

/**
 * Reads an edited element back. Anything it does not understand becomes plain
 * text; dangerous tags are dropped entirely. Never throws.
 */
export function richFromElement(root: HTMLElement): RichText {
  const paragraphs: Paragraph[] = []
  let current: Paragraph = { runs: [] }
  let touched = false

  const flush = (style?: { align?: Paragraph['align']; indent?: number }) => {
    if (style) {
      if (style.align) current.align = style.align
      if (style.indent) current.indent = style.indent
    }
    paragraphs.push(trimParagraph(current))
    current = { runs: [] }
  }

  // The style of the block currently being walked, so a <br> inside it keeps it.
  let blockStyle: { align?: Paragraph['align']; indent?: number } | undefined

  const walk = (node: Node, marks: Mark[]) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent ?? ''
      if (text) {
        touched = true
        pushRun(current.runs, text, marks)
      }
      return
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return
    const element = node as HTMLElement
    const tag = element.tagName
    if (DROP_TAGS.has(tag)) return
    if (tag === 'BR') {
      touched = true
      flush(blockStyle)
      return
    }
    if (BLOCK_TAGS.has(tag)) {
      if (current.runs.length) flush(blockStyle)
      const outer = blockStyle
      const style = readBlockStyle(element)
      blockStyle = style
      touched = true
      element.childNodes.forEach((child) => walk(child, marks))
      flush(style)
      blockStyle = outer
      return
    }
    const fromTag = TAG_MARK[tag]
    const next = [...marks]
    for (const mark of [...(fromTag ? [fromTag] : []), ...marksFromStyle(element)]) {
      if (!next.includes(mark)) next.push(mark)
    }
    element.childNodes.forEach((child) => walk(child, next))
  }

  root.childNodes.forEach((child) => walk(child, []))
  if (current.runs.length || !touched) flush(blockStyle)

  // Blank paragraphs are dropped, exactly as richFromPlain drops blank lines,
  // so `rich` and the plain `body` always agree.
  const kept = paragraphs.filter((p) => p.runs.length > 0)
  return kept.length ? kept : [{ runs: [] }]
}

export function setParagraphAlign(rich: RichText, index: number, align: Paragraph['align']): RichText {
  if (index < 0 || index >= rich.length) return rich
  return rich.map((p, i) => {
    if (i !== index) return p
    const next: Paragraph = { ...p }
    if (align && align !== 'left') next.align = align
    else delete next.align
    return next
  })
}

export function setParagraphIndent(rich: RichText, index: number, delta: number): RichText {
  if (index < 0 || index >= rich.length) return rich
  return rich.map((p, i) => {
    if (i !== index) return p
    const value = Math.max(0, Math.min(MAX_INDENT, (p.indent ?? 0) + delta))
    const next: Paragraph = { ...p }
    if (value > 0) next.indent = value
    else delete next.indent
    return next
  })
}
