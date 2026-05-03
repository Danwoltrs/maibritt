import { describe, it, expect } from 'vitest'
import { buildVisibleArtworkList } from './buildVisibleArtworkList'
import type { TimelineYear } from './RiverMagazineTimeline'
import type { Artwork } from '@/types'

const mk = (id: string, year: number, category: Artwork['category'] = 'painting'): Artwork => ({
  id, slug: id,
  title: { ptBR: id, en: id },
  year,
  medium: { ptBR: '', en: '' },
  dimensions: '',
  description: { ptBR: '', en: '' },
  category,
  images: [],
  forSale: false,
  currency: 'BRL',
  isAvailable: true,
  displayOrder: 0,
  featured: false,
  createdAt: new Date(),
  updatedAt: new Date(),
})

const years: TimelineYear[] = [
  { year: 2014, exhibitions: [], pressQuotes: [], artworks: [mk('a', 2014), mk('b', 2014)] },
  { year: 2012, exhibitions: [], pressQuotes: [], artworks: [mk('c', 2012, 'painting'), mk('d', 2012, 'sculpture')] },
]

describe('buildVisibleArtworkList', () => {
  it('returns all artworks across years when "all" filter is active, year desc, in-year order preserved', () => {
    const list = buildVisibleArtworkList(years, ['all'])
    expect(list.map(a => a.id)).toEqual(['a', 'b', 'c', 'd'])
  })

  it('filters out artworks whose category is not in active filters', () => {
    const list = buildVisibleArtworkList(years, ['painting'])
    expect(list.map(a => a.id)).toEqual(['a', 'b', 'c'])
  })

  it('returns empty list when no filter matches', () => {
    const list = buildVisibleArtworkList(years, ['video'])
    expect(list).toEqual([])
  })

  it('returns empty list when years is empty', () => {
    const list = buildVisibleArtworkList([], ['all'])
    expect(list).toEqual([])
  })

  it('preserves caller-supplied year order (does not sort)', () => {
    const reversedYears: TimelineYear[] = [
      { year: 2012, exhibitions: [], pressQuotes: [], artworks: [mk('c', 2012, 'painting'), mk('d', 2012, 'sculpture')] },
      { year: 2014, exhibitions: [], pressQuotes: [], artworks: [mk('a', 2014), mk('b', 2014)] },
    ]
    const list = buildVisibleArtworkList(reversedYears, ['all'])
    expect(list.map(a => a.id)).toEqual(['c', 'd', 'a', 'b'])
  })
})
