import type { Block, BlockKind, GridRect, SectionLayout, StoryDocument, TileStyle } from './types'

export const GRID = { cols: 12, rows: 8 } as const

export type SectionKind = 'opening' | BlockKind
export type ArrangeTarget = { type: 'opening' } | { type: 'block'; chapterId: string; blockId: string }
export type Alignment = 'left' | 'center' | 'right'

export const TILE_KEYS: Record<SectionKind, string[]> = {
  opening: ['portrait', 'eyebrow', 'name', 'title', 'begin'],
  text: ['label', 'heading', 'body'],
  photo: ['label', 'caption'],
  gallery: [],
  slideshow: ['label', 'player', 'caption'],
  audio: ['label', 'heading', 'player', 'transcript'],
  video: ['label', 'caption'],
}

export const TILE_LABEL: Record<string, string> = {
  portrait: 'Portrait',
  eyebrow: 'Small line',
  name: 'Your name',
  title: 'Title',
  begin: 'Button',
  label: 'Chapter label',
  heading: 'Heading',
  body: 'Words',
  caption: 'Caption',
  player: 'Player',
  transcript: 'Read along',
}

const DEFAULTS: Record<SectionKind, Record<string, GridRect>> = {
  opening: {
    portrait: { x: 5, y: 0, w: 2, h: 2 },
    eyebrow: { x: 3, y: 2, w: 6, h: 1 },
    name: { x: 1, y: 3, w: 10, h: 2 },
    title: { x: 3, y: 5, w: 6, h: 1 },
    begin: { x: 4, y: 6, w: 4, h: 2 },
  },
  text: {
    label: { x: 3, y: 0, w: 6, h: 1 },
    heading: { x: 3, y: 1, w: 6, h: 2 },
    body: { x: 3, y: 3, w: 6, h: 4 },
  },
  photo: {
    label: { x: 0, y: 0, w: 4, h: 1 },
    caption: { x: 1, y: 5, w: 7, h: 2 },
  },
  gallery: {},
  slideshow: {
    label: { x: 0, y: 0, w: 4, h: 1 },
    player: { x: 1, y: 5, w: 5, h: 2 },
    caption: { x: 7, y: 5, w: 4, h: 2 },
  },
  audio: {
    label: { x: 3, y: 0, w: 6, h: 1 },
    heading: { x: 3, y: 1, w: 6, h: 2 },
    player: { x: 3, y: 3, w: 6, h: 1 },
    transcript: { x: 3, y: 4, w: 6, h: 3 },
  },
  video: {
    label: { x: 0, y: 0, w: 4, h: 1 },
    caption: { x: 1, y: 5, w: 7, h: 2 },
  },
}

export function cloneLayout(layout: SectionLayout): SectionLayout {
  const tiles: Record<string, GridRect> = {}
  for (const [k, r] of Object.entries(layout.tiles)) tiles[k] = { ...r }
  const next: SectionLayout = { cols: 12, rows: 8, tiles }
  if (layout.styles) {
    const styles: Record<string, TileStyle> = {}
    for (const [k, s] of Object.entries(layout.styles)) {
      styles[k] = { ...s, ...(s.box ? { box: { ...s.box } } : {}), ...(s.button ? { button: { ...s.button } } : {}) }
    }
    if (Object.keys(styles).length) next.styles = styles
  }
  return next
}

export function defaultLayout(kind: SectionKind): SectionLayout {
  return cloneLayout({ cols: 12, rows: 8, tiles: DEFAULTS[kind] })
}

export function clampRect(rect: GridRect): GridRect {
  const w = Math.max(1, Math.min(GRID.cols, Math.round(rect.w)))
  const h = Math.max(1, Math.min(GRID.rows, Math.round(rect.h)))
  const x = Math.max(0, Math.min(GRID.cols - w, Math.round(rect.x)))
  const y = Math.max(0, Math.min(GRID.rows - h, Math.round(rect.y)))
  return { x, y, w, h }
}

function withTile(layout: SectionLayout, key: string, fn: (r: GridRect) => GridRect): SectionLayout {
  const current = layout.tiles[key]
  if (!current) return layout
  const next = cloneLayout(layout)
  next.tiles[key] = clampRect(fn(current))
  return next
}

export function moveTile(layout: SectionLayout, key: string, dx: number, dy: number): SectionLayout {
  return withTile(layout, key, (r) => ({ ...r, x: r.x + dx, y: r.y + dy }))
}

export function resizeTile(layout: SectionLayout, key: string, dw: number, dh: number): SectionLayout {
  return withTile(layout, key, (r) => {
    const w = Math.max(1, Math.min(GRID.cols - r.x, r.w + dw))
    const h = Math.max(1, Math.min(GRID.rows - r.y, r.h + dh))
    return { ...r, w, h }
  })
}

export function readingOrder(layout: SectionLayout): string[] {
  return Object.entries(layout.tiles)
    .sort(([, a], [, b]) => a.y - b.y || a.x - b.x)
    .map(([key]) => key)
}

export function alignmentFor(rect: GridRect): Alignment {
  const centre = rect.x + rect.w / 2
  if (centre < GRID.cols / 3) return 'left'
  if (centre > (GRID.cols * 2) / 3) return 'right'
  return 'center'
}

function withoutLayout<T extends { layout?: SectionLayout }>(item: T): T {
  const { layout: _dropped, ...rest } = item
  void _dropped
  return rest as T
}

export function setOpeningLayout(doc: StoryDocument, layout: SectionLayout | null): StoryDocument {
  const opening = layout ? { ...doc.opening, layout: cloneLayout(layout) } : withoutLayout(doc.opening)
  return { ...doc, opening }
}

export function setBlockLayout(doc: StoryDocument, chapterId: string, blockId: string, layout: SectionLayout | null): StoryDocument {
  return {
    ...doc,
    chapters: doc.chapters.map((c) =>
      c.id !== chapterId
        ? c
        : {
            ...c,
            blocks: c.blocks.map((b): Block => (b.id !== blockId ? b : layout ? { ...b, layout: cloneLayout(layout) } : withoutLayout(b))),
          }
    ),
  }
}

export function sectionLayoutOf(doc: StoryDocument, target: ArrangeTarget): SectionLayout | undefined {
  if (target.type === 'opening') return doc.opening.layout
  return doc.chapters.find((c) => c.id === target.chapterId)?.blocks.find((b) => b.id === target.blockId)?.layout
}
