import type { CSSProperties } from 'react'
import type { SectionLayout, TileStyle } from './types'
import { INDENT_STEP } from './rich'
import { fontById } from './fonts'

export const SCALE_STEPS = [0.6, 0.75, 0.9, 1, 1.15, 1.35, 1.6, 2]
export const PADDING_STEP = 8
export const RADIUS_STEP = 6
export const MAX_PADDING = 5
export const MAX_RADIUS = 5

export type TileRole = 'text' | 'button' | 'image' | 'player'
export type MenuSection = 'write' | 'font' | 'colour' | 'size' | 'align' | 'indent' | 'box' | 'buttonColour' | 'rounded' | 'reset'

/** Which piece is which, so the menu can offer only what applies. */
export const TILE_ROLE: Record<string, TileRole> = {
  name: 'text',
  title: 'text',
  eyebrow: 'text',
  heading: 'text',
  body: 'text',
  caption: 'text',
  label: 'text',
  transcript: 'text',
  begin: 'button',
  portrait: 'image',
  player: 'player',
}

export const MENU_FOR: Record<TileRole, MenuSection[]> = {
  text: ['write', 'font', 'colour', 'size', 'align', 'indent', 'box', 'reset'],
  button: ['write', 'buttonColour', 'font', 'size', 'rounded', 'reset'],
  image: ['size', 'box', 'reset'],
  player: ['size', 'box', 'reset'],
}

export function nextScale(current: number | undefined, direction: 1 | -1): number {
  const value = current ?? 1
  let index = SCALE_STEPS.indexOf(value)
  if (index < 0) {
    // An unfamiliar value snaps onto the nearest rung before stepping.
    index = SCALE_STEPS.reduce((best, step, i) => (Math.abs(step - value) < Math.abs(SCALE_STEPS[best] - value) ? i : best), 0)
  }
  return SCALE_STEPS[Math.max(0, Math.min(SCALE_STEPS.length - 1, index + direction))]
}

export function styleOf(layout: SectionLayout, key: string): TileStyle {
  return layout.styles?.[key] ?? {}
}

function pruned(style: TileStyle): TileStyle | null {
  const out: TileStyle = {}
  if (style.font) out.font = style.font
  if (style.color) out.color = style.color
  if (style.scale !== undefined && style.scale !== 1) out.scale = style.scale
  if (style.align) out.align = style.align
  if (style.indent) out.indent = style.indent
  if (style.box) {
    const box: NonNullable<TileStyle['box']> = {}
    if (style.box.background) box.background = style.box.background
    if (style.box.padding) box.padding = style.box.padding
    if (style.box.radius) box.radius = style.box.radius
    if (Object.keys(box).length) out.box = box
  }
  if (style.button) {
    const button: NonNullable<TileStyle['button']> = {}
    if (style.button.background) button.background = style.button.background
    if (style.button.label) button.label = style.button.label
    if (style.button.corners && style.button.corners !== 'round') button.corners = style.button.corners
    if (Object.keys(button).length) out.button = button
  }
  return Object.keys(out).length ? out : null
}

/** Deep-merges a patch onto one tile's style; a key set to undefined is removed. */
export function setTileStyle(layout: SectionLayout, key: string, patch: TileStyle): SectionLayout {
  if (!layout.tiles[key]) return layout
  const current = styleOf(layout, key)
  const merged: TileStyle = { ...current, ...patch }
  if (patch.box) merged.box = { ...current.box, ...patch.box }
  if (patch.button) merged.button = { ...current.button, ...patch.button }
  for (const field of Object.keys(patch) as (keyof TileStyle)[]) {
    if (patch[field] === undefined) delete merged[field]
  }
  const next = pruned(merged)
  const styles = { ...layout.styles }
  if (next) styles[key] = next
  else delete styles[key]
  const out: SectionLayout = { cols: 12, rows: 8, tiles: layout.tiles }
  if (Object.keys(styles).length) out.styles = styles
  return out
}

export function clearTileStyle(layout: SectionLayout, key: string): SectionLayout {
  if (!layout.styles?.[key]) return layout
  const styles = { ...layout.styles }
  delete styles[key]
  const out: SectionLayout = { cols: 12, rows: 8, tiles: layout.tiles }
  if (Object.keys(styles).length) out.styles = styles
  return out
}

const ALIGN_ITEMS = { left: 'flex-start', center: 'center', right: 'flex-end' } as const
export const BUTTON_RADIUS = { round: '999px', soft: '18px', square: '4px' } as const

/** The inline styles a tile wrapper and its optional box need. */
export function tileCss(style: TileStyle, role: TileRole): { css: CSSProperties; boxCss: CSSProperties | null } {
  const css: CSSProperties = {}
  if (style.scale && style.scale !== 1) (css as Record<string, unknown>)['--piece-scale'] = style.scale
  if (style.font) {
    // The piece may be a heading or body text, so set both: whichever variable
    // it reads, it gets her choice. The variable name comes from the catalogue —
    // it is not always "--font-<id>" (Inter and Jost differ).
    const family = `var(${fontById(style.font).cssVar})`
    ;(css as Record<string, unknown>)['--story-heading-font'] = family
    ;(css as Record<string, unknown>)['--story-body-font'] = family
  }
  // Pieces paint themselves, so a per-piece colour arrives as the variable
  // each of them falls back to rather than as an inherited colour.
  if (style.color && role !== 'button') (css as Record<string, unknown>)['--piece-color'] = style.color
  if (style.align) {
    css.textAlign = style.align
    css.alignItems = ALIGN_ITEMS[style.align]
  }
  if (style.indent) css.paddingLeft = style.indent * INDENT_STEP

  if (role === 'button' && style.button) {
    // The Begin button paints itself from the story's accent, so overriding
    // those two variables on the tile repaints just this button.
    if (style.button.background) (css as Record<string, unknown>)['--accent'] = style.button.background
    if (style.button.label) (css as Record<string, unknown>)['--accent-text'] = style.button.label
    if (style.button.corners) (css as Record<string, unknown>)['--begin-radius'] = BUTTON_RADIUS[style.button.corners]
  }

  const box = style.box
  if (!box) return { css, boxCss: null }
  const boxCss: CSSProperties = {}
  if (box.background) boxCss.background = box.background
  if (box.padding) boxCss.padding = Math.min(MAX_PADDING, box.padding) * PADDING_STEP
  if (box.radius) boxCss.borderRadius = Math.min(MAX_RADIUS, box.radius) * RADIUS_STEP
  return { css, boxCss: Object.keys(boxCss).length ? boxCss : null }
}
