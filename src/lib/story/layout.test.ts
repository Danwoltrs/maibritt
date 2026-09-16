import { describe, it, expect } from 'vitest'
import { GRID, TILE_KEYS, alignmentFor, clampRect, defaultLayout, moveTile, readingOrder, resizeTile, setBlockLayout, setOpeningLayout, type SectionKind } from './layout'
import { addChapter, createEmptyDocument, insertBlock } from './document'
import type { TextBlock } from './types'

const KINDS: SectionKind[] = ['opening', 'text', 'photo', 'gallery', 'slideshow', 'audio', 'video']

describe('defaultLayout', () => {
  it('lists exactly the tile keys for each kind and keeps every tile inside the grid', () => {
    for (const kind of KINDS) {
      const layout = defaultLayout(kind)
      expect(Object.keys(layout.tiles).sort()).toEqual([...TILE_KEYS[kind]].sort())
      for (const r of Object.values(layout.tiles)) {
        expect(r.x).toBeGreaterThanOrEqual(0)
        expect(r.y).toBeGreaterThanOrEqual(0)
        expect(r.x + r.w).toBeLessThanOrEqual(GRID.cols)
        expect(r.y + r.h).toBeLessThanOrEqual(GRID.rows)
        expect(r.w).toBeGreaterThanOrEqual(1)
        expect(r.h).toBeGreaterThanOrEqual(1)
      }
    }
    expect(TILE_KEYS.gallery).toEqual([])
  })
  it('returns a fresh object each time', () => {
    const a = defaultLayout('text')
    a.tiles.body.x = 11
    expect(defaultLayout('text').tiles.body.x).not.toBe(11)
  })
})

describe('clampRect', () => {
  it('keeps the rect inside the grid and at least one cell', () => {
    expect(clampRect({ x: -2, y: -1, w: 3, h: 2 })).toEqual({ x: 0, y: 0, w: 3, h: 2 })
    expect(clampRect({ x: 11, y: 7, w: 3, h: 3 })).toEqual({ x: 9, y: 5, w: 3, h: 3 })
    expect(clampRect({ x: 0, y: 0, w: 0, h: 0 })).toEqual({ x: 0, y: 0, w: 1, h: 1 })
    expect(clampRect({ x: 0, y: 0, w: 20, h: 20 })).toEqual({ x: 0, y: 0, w: 12, h: 8 })
  })
})

describe('moveTile and resizeTile', () => {
  it('move by cells, clamped, without mutating', () => {
    const layout = defaultLayout('text')
    const moved = moveTile(layout, 'body', 100, -100)
    expect(moved.tiles.body).toEqual({ x: 12 - layout.tiles.body.w, y: 0, w: layout.tiles.body.w, h: layout.tiles.body.h })
    expect(layout.tiles.body.x).toBe(defaultLayout('text').tiles.body.x)
  })
  it('resize by cells with a 1×1 minimum', () => {
    const layout = defaultLayout('text')
    expect(resizeTile(layout, 'heading', -100, -100).tiles.heading).toMatchObject({ w: 1, h: 1 })
    const grown = resizeTile(layout, 'heading', 100, 100).tiles.heading
    expect(grown.x + grown.w).toBe(12)
    expect(grown.y + grown.h).toBe(8)
  })
  it('ignores an unknown key', () => {
    const layout = defaultLayout('text')
    expect(moveTile(layout, 'nope', 1, 1)).toEqual(layout)
  })
})

describe('readingOrder', () => {
  it('orders by row then column', () => {
    const layout = { cols: 12 as const, rows: 8 as const, tiles: { a: { x: 6, y: 2, w: 2, h: 1 }, b: { x: 0, y: 2, w: 2, h: 1 }, c: { x: 3, y: 0, w: 2, h: 1 } } }
    expect(readingOrder(layout)).toEqual(['c', 'b', 'a'])
  })
})

describe('alignmentFor', () => {
  it('uses the horizontal centre in thirds', () => {
    expect(alignmentFor({ x: 0, y: 0, w: 2, h: 1 })).toBe('left')
    expect(alignmentFor({ x: 4, y: 0, w: 4, h: 1 })).toBe('center')
    expect(alignmentFor({ x: 9, y: 0, w: 3, h: 1 })).toBe('right')
    expect(alignmentFor({ x: 0, y: 0, w: 12, h: 1 })).toBe('center')
  })
})

describe('layout setters', () => {
  const text = (id: string): TextBlock => ({ id, kind: 'text', heading: id, body: '' })
  it('set and remove the opening layout', () => {
    const doc = createEmptyDocument()
    const withLayout = setOpeningLayout(doc, defaultLayout('opening'))
    expect(withLayout.opening.layout).toEqual(defaultLayout('opening'))
    expect(doc.opening.layout).toBeUndefined()
    expect(setOpeningLayout(withLayout, null).opening.layout).toBeUndefined()
  })
  it('set and remove a block layout without touching neighbours', () => {
    const { doc, chapterId } = addChapter(createEmptyDocument(), 'One')
    let d = insertBlock(doc, chapterId, 0, text('a'))
    d = insertBlock(d, chapterId, 1, text('b'))
    const withLayout = setBlockLayout(d, chapterId, 'b', defaultLayout('text'))
    const blocks = withLayout.chapters[0].blocks
    expect(blocks[0].layout).toBeUndefined()
    expect(blocks[1].layout).toEqual(defaultLayout('text'))
    expect(setBlockLayout(withLayout, chapterId, 'b', null).chapters[0].blocks[1].layout).toBeUndefined()
  })
})
