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
} from './document'
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
  it('has no chapters and an empty opening', () => {
    const doc = createEmptyDocument()
    expect(doc.version).toBe(1)
    expect(doc.chapters).toEqual([])
    expect(doc.opening).toEqual({ name: '', title: '', portrait: null, cover: null })
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
