import type { Artwork } from '@/types'

/**
 * Mirror of the pair-grouping logic in renderArtworkColumn — a "slot" is one
 * vertical row, whether it holds a single card or a pair of cards.
 */
function countSlots(artworks: Artwork[]): number {
  let slots = 0
  let i = 0
  while (i < artworks.length) {
    const next = artworks[i + 1]
    if (next && i + 2 <= artworks.length && i % 3 === 1) {
      i += 2
    } else {
      i += 1
    }
    slots += 1
  }
  return slots
}

export function splitArtworks(
  artworks: Artwork[],
  exhibitionCount: number,
  pressCount: number,
): { left: Artwork[]; right: Artwork[] } {
  if (exhibitionCount > 2 || artworks.length < 3) {
    return { left: [], right: artworks }
  }

  const left: Artwork[] = []
  const right = [...artworks]

  while (right.length > 1) {
    const rightSlots = countSlots(right)
    const leftSlots = exhibitionCount + pressCount + countSlots(left)
    if (rightSlots - leftSlots < 2) break
    const moved = right.pop()!
    left.unshift(moved)
  }

  return { left, right }
}
