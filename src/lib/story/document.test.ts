import { describe, it, expect } from 'vitest'
import {
  createEmptyDocument,
  addChapter,
  renameChapter,
  removeChapter,
  moveChapter,
  insertBlock,
  updateBlock,
  removeBlock,
  moveBlock,
  reorderBlocks,
  findBlock,
  normalizeDocument,
} from './document'
import { DEFAULT_LOOK } from './look'
import type { TextBlock, StoryDocument } from './types'

const text = (id: string): TextBlock => ({ id, kind: 'text', heading: id, body: '' })

function docWithBlocks(): { doc: StoryDocument; chapterId: string } {
  const { doc, chapterId } = addChapter(createEmptyDocument(), 'One')
  let d = insertBlock(doc, chapterId, 0, text('a'))
  d = insertBlock(d, chapterId, 1, text('b'))
  d = insertBlock(d, chapterId, 2, text('c'))
  return { doc: d, chapterId }
}

const ids = (doc: StoryDocument, chapterId: string) =>
  doc.chapters.find((c) => c.id === chapterId)!.blocks.map((b) => b.id)

describe('createEmptyDocument', () => {
  it('is version 2 with an empty opening, no chapters and the default look', () => {
    const doc = createEmptyDocument()
    expect(doc.version).toBe(2)
    expect(doc.chapters).toEqual([])
    expect(doc.opening).toEqual({ name: '', title: '', portrait: null, cover: null })
    expect(doc.look).toEqual(DEFAULT_LOOK)
    expect(doc.look).not.toBe(DEFAULT_LOOK)
  })
})

describe('normalizeDocument', () => {
  it('turns null into an empty version-2 document', () => {
    expect(normalizeDocument(null)).toEqual(createEmptyDocument())
  })

  it('upgrades a version-1 document and keeps its content', () => {
    const v1 = { version: 1, opening: { name: 'Mai', title: 'A life', portrait: null, cover: null }, chapters: [{ id: 'c', title: 'One', blocks: [] }] }
    const doc = normalizeDocument(v1)
    expect(doc.version).toBe(2)
    expect(doc.opening.name).toBe('Mai')
    expect(doc.chapters).toHaveLength(1)
    expect(doc.look).toEqual(DEFAULT_LOOK)
  })

  it('fills a partial look and drops unknown word keys', () => {
    const doc = normalizeDocument({ version: 2, opening: { name: 'M' }, chapters: [], look: { colors: { accent: '#123456' }, words: { begin: 'Começar', bogus: 'x' } } })
    expect(doc.look.fonts).toEqual(DEFAULT_LOOK.fonts)
    expect(doc.look.colors).toEqual({ ...DEFAULT_LOOK.colors, accent: '#123456' })
    expect(doc.look.words).toEqual({ begin: 'Começar' })
    expect(doc.opening).toEqual({ name: 'M', title: '', portrait: null, cover: null })
  })

  it('keeps section layouts as they are', () => {
    const layout = { cols: 12, rows: 8, tiles: { name: { x: 0, y: 0, w: 6, h: 2 } } }
    const doc = normalizeDocument({ version: 2, opening: { name: 'M', layout }, chapters: [], look: DEFAULT_LOOK })
    expect(doc.opening.layout).toEqual(layout)
  })

  it('does not share the default look object between documents', () => {
    const a = normalizeDocument(null)
    const b = normalizeDocument(null)
    a.look.colors.accent = '#000000'
    expect(b.look.colors.accent).toBe(DEFAULT_LOOK.colors.accent)
  })
})

describe('chapters', () => {
  it('adds a chapter at the end and returns its id', () => {
    const { doc, chapterId } = addChapter(createEmptyDocument(), 'Childhood')
    expect(doc.chapters).toHaveLength(1)
    expect(doc.chapters[0].id).toBe(chapterId)
    expect(doc.chapters[0].title).toBe('Childhood')
  })

  it('renames a chapter without touching others', () => {
    const a = addChapter(createEmptyDocument(), 'A')
    const b = addChapter(a.doc, 'B')
    const doc = renameChapter(b.doc, a.chapterId, 'A2')
    expect(doc.chapters.map((c) => c.title)).toEqual(['A2', 'B'])
  })

  it('removes a chapter', () => {
    const a = addChapter(createEmptyDocument(), 'A')
    const b = addChapter(a.doc, 'B')
    expect(removeChapter(b.doc, a.chapterId).chapters.map((c) => c.title)).toEqual(['B'])
  })

  it('moves a chapter and clamps at the ends', () => {
    const a = addChapter(createEmptyDocument(), 'A')
    const b = addChapter(a.doc, 'B')
    const c = addChapter(b.doc, 'C')
    expect(moveChapter(c.doc, c.chapterId, -1).chapters.map((x) => x.title)).toEqual(['A', 'C', 'B'])
    expect(moveChapter(c.doc, a.chapterId, -1).chapters.map((x) => x.title)).toEqual(['A', 'B', 'C'])
    expect(moveChapter(c.doc, c.chapterId, 1).chapters.map((x) => x.title)).toEqual(['A', 'B', 'C'])
  })
})

describe('blocks', () => {
  it('inserts at an index', () => {
    const { doc, chapterId } = docWithBlocks()
    const d = insertBlock(doc, chapterId, 1, text('x'))
    expect(ids(d, chapterId)).toEqual(['a', 'x', 'b', 'c'])
  })

  it('does not mutate the input document', () => {
    const { doc, chapterId } = docWithBlocks()
    insertBlock(doc, chapterId, 0, text('x'))
    expect(ids(doc, chapterId)).toEqual(['a', 'b', 'c'])
  })

  it('updates a block by id', () => {
    const { doc, chapterId } = docWithBlocks()
    const d = updateBlock(doc, chapterId, 'b', { ...text('b'), heading: 'New' })
    expect(findBlock(d, 'b')?.block).toMatchObject({ heading: 'New' })
  })

  it('removes a block and keeps order', () => {
    const { doc, chapterId } = docWithBlocks()
    expect(ids(removeBlock(doc, chapterId, 'b'), chapterId)).toEqual(['a', 'c'])
  })

  it('moves a block up and down and clamps at the ends', () => {
    const { doc, chapterId } = docWithBlocks()
    expect(ids(moveBlock(doc, chapterId, 'c', -1), chapterId)).toEqual(['a', 'c', 'b'])
    expect(ids(moveBlock(doc, chapterId, 'a', -1), chapterId)).toEqual(['a', 'b', 'c'])
    expect(ids(moveBlock(doc, chapterId, 'c', 1), chapterId)).toEqual(['a', 'b', 'c'])
  })

  it('reorders by an explicit id list', () => {
    const { doc, chapterId } = docWithBlocks()
    expect(ids(reorderBlocks(doc, chapterId, ['c', 'a', 'b']), chapterId)).toEqual(['c', 'a', 'b'])
  })

  it('finds a block with its chapter', () => {
    const { doc, chapterId } = docWithBlocks()
    expect(findBlock(doc, 'b')).toMatchObject({ chapterId, index: 1 })
    expect(findBlock(doc, 'zzz')).toBeNull()
  })
})
