import type { StoryColors, StoryLook, StoryDocument } from './types'
import { DEFAULT_BODY_FONT, DEFAULT_HEADING_FONT } from './fonts'

export const DEFAULT_COLORS: StoryColors = {
  page: '#f5f0e8',
  text: '#2a2521',
  accent: '#b5623a',
  accentText: '#fbf9f5',
  backdrop: '#1e1712',
}

export const DEFAULT_LOOK: StoryLook = {
  fonts: { heading: DEFAULT_HEADING_FONT, body: DEFAULT_BODY_FONT },
  colors: DEFAULT_COLORS,
  words: {},
}

export function cloneLook(look: StoryLook): StoryLook {
  return { fonts: { ...look.fonts }, colors: { ...look.colors }, words: { ...look.words } }
}

export function setLook(doc: StoryDocument, look: StoryLook): StoryDocument {
  return { ...doc, look: cloneLook(look) }
}

export const PALETTES: { id: string; name: string; colors: StoryColors }[] = [
  { id: 'paper', name: 'Paper & terracotta', colors: DEFAULT_COLORS },
  { id: 'ink', name: 'Ink & cream', colors: { page: '#fbf7ef', text: '#1c1a17', accent: '#1c1a17', accentText: '#fbf7ef', backdrop: '#141210' } },
  { id: 'sea', name: 'Sea', colors: { page: '#eef3f2', text: '#15302f', accent: '#1f6f6a', accentText: '#f4fbfa', backdrop: '#0f2321' } },
  { id: 'night', name: 'Night', colors: { page: '#171a1f', text: '#f1ede4', accent: '#d9a066', accentText: '#171a1f', backdrop: '#0b0d10' } },
  { id: 'rose', name: 'Rose', colors: { page: '#f8eef0', text: '#3a2229', accent: '#b04a63', accentText: '#fff6f8', backdrop: '#2a1519' } },
  { id: 'forest', name: 'Forest', colors: { page: '#f0f2ea', text: '#1f2a1d', accent: '#4b6b3c', accentText: '#f5f8f0', backdrop: '#131a11' } },
]

export const ROLE_INFO: { key: keyof StoryColors; label: string; hint: string }[] = [
  { key: 'page', label: 'Page', hint: 'The background behind your words' },
  { key: 'text', label: 'Text', hint: 'Your words and headings' },
  { key: 'accent', label: 'Accent', hint: 'Buttons, the thin progress line, chapter labels' },
  { key: 'accentText', label: 'Button text', hint: 'The words on your buttons' },
  { key: 'backdrop', label: 'Behind photos', hint: 'The dark colour behind the first screen, photos and videos' },
]

export function isHex(value: unknown): value is string {
  return typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value)
}

function toRgb(hex: string): [number, number, number] {
  return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)]
}

function toHex(rgb: [number, number, number]): string {
  return '#' + rgb.map((c) => Math.round(Math.max(0, Math.min(255, c))).toString(16).padStart(2, '0')).join('')
}

export function mix(a: string, b: string, t: number): string {
  const k = Math.max(0, Math.min(1, t))
  const ra = toRgb(a)
  const rb = toRgb(b)
  return toHex([ra[0] + (rb[0] - ra[0]) * k, ra[1] + (rb[1] - ra[1]) * k, ra[2] + (rb[2] - ra[2]) * k])
}

function luminance(hex: string): number {
  const [r, g, b] = toRgb(hex).map((c) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function contrastRatio(a: string, b: string): number {
  const la = luminance(a)
  const lb = luminance(b)
  const [hi, lo] = la > lb ? [la, lb] : [lb, la]
  return (hi + 0.05) / (lo + 0.05)
}

function safeColors(colors: StoryColors): StoryColors {
  const out = { ...DEFAULT_COLORS }
  for (const key of Object.keys(DEFAULT_COLORS) as (keyof StoryColors)[]) {
    if (isHex(colors[key])) out[key] = colors[key].toLowerCase()
  }
  return out
}

const PAPER_WHITE = '#fbf9f5'

export function themeVars(colors: StoryColors): Record<string, string> {
  const c = safeColors(colors)
  const onBackdrop = contrastRatio(PAPER_WHITE, c.backdrop) >= contrastRatio(c.text, c.backdrop) ? PAPER_WHITE : c.text
  return {
    '--paper': c.page,
    '--paper-2': mix(c.page, c.text, 0.06),
    '--paper-3': mix(c.page, c.text, 0.12),
    '--line': mix(c.page, c.text, 0.22),
    '--white': mix(c.page, '#ffffff', 0.4),
    '--ink': c.text,
    '--ink-2': mix(c.text, c.page, 0.35),
    '--ink-3': mix(c.text, c.page, 0.55),
    '--accent': c.accent,
    '--accent-2': mix(c.accent, '#000000', 0.2),
    '--accent-soft': mix(c.accent, c.page, 0.8),
    '--accent-text': c.accentText,
    '--backdrop': c.backdrop,
    '--on-backdrop': onBackdrop,
  }
}

export function readabilityNote(colors: StoryColors): string | null {
  const c = safeColors(colors)
  if (contrastRatio(c.text, c.page) < 4.5) return 'Your text may be hard to read on this page colour.'
  if (contrastRatio(c.accentText, c.accent) < 3) return 'The words on your buttons may be hard to read on this accent colour.'
  return null
}
