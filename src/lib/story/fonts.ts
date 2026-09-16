export type FontKind = 'serif' | 'display' | 'sans' | 'hand' | 'typewriter'
export type FontEntry = { id: string; name: string; kind: FontKind; cssVar: string }

export const DEFAULT_HEADING_FONT = 'cormorant'
export const DEFAULT_BODY_FONT = 'source-sans'

export const FONTS: FontEntry[] = [
  { id: 'cormorant', name: 'Cormorant Garamond', kind: 'serif', cssVar: '--font-cormorant' },
  { id: 'playfair', name: 'Playfair Display', kind: 'serif', cssVar: '--font-playfair' },
  { id: 'libre-baskerville', name: 'Libre Baskerville', kind: 'serif', cssVar: '--font-libre-baskerville' },
  { id: 'eb-garamond', name: 'EB Garamond', kind: 'serif', cssVar: '--font-eb-garamond' },
  { id: 'lora', name: 'Lora', kind: 'serif', cssVar: '--font-lora' },
  { id: 'fraunces', name: 'Fraunces', kind: 'serif', cssVar: '--font-fraunces' },
  { id: 'dm-serif', name: 'DM Serif Display', kind: 'display', cssVar: '--font-dm-serif' },
  { id: 'abril', name: 'Abril Fatface', kind: 'display', cssVar: '--font-abril' },
  { id: 'source-sans', name: 'Source Sans 3', kind: 'sans', cssVar: '--font-source-sans' },
  { id: 'inter', name: 'Inter', kind: 'sans', cssVar: '--font-inter-story' },
  { id: 'jost', name: 'Jost', kind: 'sans', cssVar: '--font-jost-story' },
  { id: 'nunito', name: 'Nunito', kind: 'sans', cssVar: '--font-nunito' },
  { id: 'raleway', name: 'Raleway', kind: 'sans', cssVar: '--font-raleway' },
  { id: 'caveat', name: 'Caveat', kind: 'hand', cssVar: '--font-caveat' },
  { id: 'dancing', name: 'Dancing Script', kind: 'hand', cssVar: '--font-dancing' },
  { id: 'special-elite', name: 'Special Elite', kind: 'typewriter', cssVar: '--font-special-elite' },
]

export const FONT_KIND_LABEL: Record<FontKind, string> = {
  serif: 'Elegant',
  display: 'Bold',
  sans: 'Clear',
  hand: 'Handwritten',
  typewriter: 'Typewriter',
}

export const FONT_KIND_ORDER: FontKind[] = ['serif', 'sans', 'hand', 'typewriter', 'display']

export function fontById(id: string): FontEntry {
  return FONTS.find((f) => f.id === id) ?? FONTS[0]
}
