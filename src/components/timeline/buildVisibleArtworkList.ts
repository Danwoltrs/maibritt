import type { Artwork } from '@/types'
import type { TimelineYear } from './RiverMagazineTimeline'
import type { FilterId } from './TimelineFilters'

export function buildVisibleArtworkList(
  years: TimelineYear[],
  activeFilters: FilterId[],
): Artwork[] {
  const all = activeFilters.includes('all')
  const out: Artwork[] = []
  for (const ty of years) {
    for (const a of ty.artworks) {
      if (all || activeFilters.includes(a.category)) {
        out.push(a)
      }
    }
  }
  return out
}
