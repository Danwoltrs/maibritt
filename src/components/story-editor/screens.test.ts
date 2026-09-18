import { describe, it, expect } from 'vitest'
import { screenFromParams } from './screens'
import { addChapter, createEmptyDocument, insertBlock } from '@/lib/story/document'
import type { StoryDocument, TextBlock } from '@/lib/story/types'

const text = (id: string): TextBlock => ({ id, kind: 'text', heading: id, body: '' })

function doc(): { doc: StoryDocument; chapterId: string } {
  const { doc: d0, chapterId } = addChapter(createEmptyDocument(), 'One')
  let d = insertBlock(d0, chapterId, 0, text('a'))
  d = insertBlock(d, chapterId, 1, text('b'))
  return { doc: d, chapterId }
}
const p = (q: string) => new URLSearchParams(q)

describe('screenFromParams', () => {
  it('starts a new chapter', () => {
    expect(screenFromParams(p('new=chapter'), doc().doc)).toEqual({ kind: 'name-chapter' })
  })

  it('inserts before a named block, in that block s chapter', () => {
    const { doc: d, chapterId } = doc()
    expect(screenFromParams(p('before=b&kind=photo'), d)).toEqual({ kind: 'photos', mode: 'photo', chapterId, insertIndex: 1, blockId: undefined })
    expect(screenFromParams(p('before=a&kind=text'), d)).toEqual({ kind: 'text', chapterId, insertIndex: 0, blockId: undefined })
  })

  it('appends at the end of a chapter', () => {
    const { doc: d, chapterId } = doc()
    expect(screenFromParams(p(`end=${chapterId}&kind=audio`), d)).toEqual({ kind: 'record', chapterId, insertIndex: 2, blockId: undefined })
  })

  it('maps every kind to its own screen', () => {
    const { doc: d, chapterId } = doc()
    expect(screenFromParams(p(`end=${chapterId}&kind=gallery`), d)).toMatchObject({ kind: 'photos', mode: 'gallery' })
    expect(screenFromParams(p(`end=${chapterId}&kind=slideshow`), d)).toMatchObject({ kind: 'photos', mode: 'slideshow' })
    expect(screenFromParams(p(`end=${chapterId}&kind=video`), d)).toMatchObject({ kind: 'video' })
  })

  it('returns null for anything that no longer resolves', () => {
    const { doc: d, chapterId } = doc()
    expect(screenFromParams(p(''), d)).toBeNull()
    expect(screenFromParams(p('before=gone&kind=text'), d)).toBeNull()
    expect(screenFromParams(p('end=gone&kind=text'), d)).toBeNull()
    expect(screenFromParams(p('before=a'), d)).toBeNull()
    expect(screenFromParams(p('before=a&kind=bogus'), d)).toBeNull()
    expect(screenFromParams(p(`end=${chapterId}&kind=__proto__`), d)).toBeNull()
  })
})
