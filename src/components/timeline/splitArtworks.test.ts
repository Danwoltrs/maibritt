import { describe, it, expect } from 'vitest'
import { splitArtworks } from './splitArtworks'
import type { Artwork } from '@/types'

const mk = (id: string): Artwork => ({
  id,
  slug: id,
  title: { ptBR: id, en: id },
  year: 2012,
  medium: { ptBR: '', en: '' },
  dimensions: '',
  description: { ptBR: '', en: '' },
  category: 'painting',
  images: [],
  forSale: false,
  currency: 'BRL',
  isAvailable: true,
  displayOrder: 0,
  featured: false,
  createdAt: new Date(),
  updatedAt: new Date(),
})

describe('splitArtworks', () => {
  it('returns all artworks on the right when below the trigger (artworks < 3)', () => {
    const artworks = [mk('a'), mk('b')]
    const { left, right } = splitArtworks(artworks, 0, 0)
    expect(left).toEqual([])
    expect(right).toEqual(artworks)
  })

  it('returns all artworks on the right when exhibitions > 2', () => {
    const artworks = [mk('a'), mk('b'), mk('c'), mk('d')]
    const { left, right } = splitArtworks(artworks, 3, 0)
    expect(left).toEqual([])
    expect(right).toEqual(artworks)
  })

  it('moves artworks left for studio years with 5 artworks', () => {
    const artworks = ['a', 'b', 'c', 'd', 'e'].map(mk)
    const { left, right } = splitArtworks(artworks, 0, 0)
    expect(right.map(a => a.id)).toEqual(['a', 'b', 'c'])
    expect(left.map(a => a.id)).toEqual(['d', 'e'])
  })

  it('moves artworks left for 1 exhibition + 4 artworks', () => {
    const artworks = ['a', 'b', 'c', 'd'].map(mk)
    const { left, right } = splitArtworks(artworks, 1, 0)
    expect(right.map(a => a.id)).toEqual(['a', 'b', 'c'])
    expect(left.map(a => a.id)).toEqual(['d'])
  })

  it('does not redistribute 2 exhibitions + 3 artworks (within 1 slot)', () => {
    const artworks = ['a', 'b', 'c'].map(mk)
    const { left, right } = splitArtworks(artworks, 2, 0)
    expect(left).toEqual([])
    expect(right.map(a => a.id)).toEqual(['a', 'b', 'c'])
  })

  it('always keeps at least one artwork on the right', () => {
    const artworks = ['a', 'b', 'c'].map(mk)
    const { left, right } = splitArtworks(artworks, 0, 0)
    expect(right.length).toBeGreaterThanOrEqual(1)
  })

  it('counts press quotes toward left slot count', () => {
    const artworks = ['a', 'b', 'c', 'd'].map(mk)
    const { left, right } = splitArtworks(artworks, 0, 2)
    expect(left).toEqual([])
    expect(right.map(a => a.id)).toEqual(['a', 'b', 'c', 'd'])
  })
})
