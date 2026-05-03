# Timeline Fill & Artwork Pagination Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fill the empty left side of timeline rows with artwork when there are 0–2 exhibitions, and replace the small artwork modal with a near-fullscreen viewer that paginates across years.

**Architecture:** Two separable changes in [src/components/timeline/](src/components/timeline/). (1) Extract a pure `splitArtworks()` helper that decides how many artworks move from the right column to the left column; reuse the existing `renderArtworkColumn` for both sides. (2) Rewrite `ArtworkOverlay` to a 95vw × 95vh image-dominant layout with prev/next navigation that walks a flat, filter-respecting list built once in `RiverMagazineTimeline`.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Tailwind, framer-motion, Vitest + Testing Library + jsdom (already configured at [vitest.config.ts](vitest.config.ts)).

**Reference spec:** [docs/superpowers/specs/2026-05-03-timeline-fill-and-artwork-pagination-design.md](docs/superpowers/specs/2026-05-03-timeline-fill-and-artwork-pagination-design.md)

---

## File Structure

**New files:**
- `src/components/timeline/splitArtworks.ts` — pure helper: given `(artworks, exhibitionCount, pressCount)`, returns `{ left: Artwork[], right: Artwork[] }`. Single responsibility, easily unit-testable.
- `src/components/timeline/splitArtworks.test.ts` — vitest unit tests for the split rule.
- `src/components/timeline/buildVisibleArtworkList.ts` — pure helper: given `(years, activeFilters)`, returns the flat ordered `Artwork[]` used by overlay pagination.
- `src/components/timeline/buildVisibleArtworkList.test.ts` — vitest unit tests for the flat-list builder.

**Modified files:**
- `src/components/timeline/RiverMagazineTimeline.tsx` — call `splitArtworks` inside `TimelineYearBlock`, render artworks on both sides; build `visibleArtworkList` with `useMemo` and pass to overlay.
- `src/components/timeline/ArtworkOverlay.tsx` — replace layout, add pagination props and arrow keyboard handlers.

The split helpers are pure and live next to the component that uses them. No changes to services, types, or admin code.

---

## Task 1: Pure split helper with unit tests

**Files:**
- Create: [src/components/timeline/splitArtworks.ts](src/components/timeline/splitArtworks.ts)
- Test: [src/components/timeline/splitArtworks.test.ts](src/components/timeline/splitArtworks.test.ts)

The split rule from the spec:
- Trigger: `exhibitions <= 2 AND artworks.length >= 3`.
- Compute `rightSlots`: count of "slots" the existing pair-grouping would produce for the artwork array (the rule from `renderArtworkColumn` in [RiverMagazineTimeline.tsx:294-327](src/components/timeline/RiverMagazineTimeline.tsx#L294-L327) — singles take 1 slot, pairs take 1 slot, pairs only form when index `i % 3 === 1` and a next item exists).
- Compute `leftSlots = exhibitionCount + pressCount`.
- While `rightSlots - leftSlots >= 2` AND `right.length > 1`: move the **last** artwork from `right` to `left`. Recompute `rightSlots` from the truncated array. Recompute `leftSlots = exhibitionCount + pressCount + countSlots(left)`.

`countSlots()` uses the same pair-grouping logic so the helper sees the same "vertical density" the renderer will produce.

- [ ] **Step 1: Write the failing tests**

Create `src/components/timeline/splitArtworks.test.ts`:

```ts
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
    // 5 artworks → renderArtworkColumn produces: single, pair, pair OR single, pair, single, single
    // depending on i%3===1 rule. With i=0 single, i=1 pair (a,b)→ no wait, i=1 pair takes i+1.
    // Walk: i=0 single (a, itemIndex 0); i=1 pair (b,c) since i%3===1 and i+2<=5; i=3 single (d); i=4 single (e). slots=4.
    // leftSlots starts at 0. 4 - 0 >= 2 and right.length > 1 → move 'e' left. right=[a,b,c,d] slots=3, left=[e] slots=1, leftTotal=1.
    // 3 - 1 >= 2 and right.length > 1 → move 'd' left. right=[a,b,c] slots=2, left=[d,e] slots=2, leftTotal=2.
    // 2 - 2 < 2 → stop.
    const artworks = ['a', 'b', 'c', 'd', 'e'].map(mk)
    const { left, right } = splitArtworks(artworks, 0, 0)
    expect(right.map(a => a.id)).toEqual(['a', 'b', 'c'])
    expect(left.map(a => a.id)).toEqual(['d', 'e'])
  })

  it('moves artworks left for 1 exhibition + 4 artworks', () => {
    // right slots for 4: i=0 single(a); i=1 pair(b,c); i=3 single(d). slots=3. left=1.
    // 3-1=2 >= 2 → move 'd' left. right=[a,b,c] slots=2, left=[d] slots=1, leftTotal=2.
    // 2-2=0 < 2 → stop.
    const artworks = ['a', 'b', 'c', 'd'].map(mk)
    const { left, right } = splitArtworks(artworks, 1, 0)
    expect(right.map(a => a.id)).toEqual(['a', 'b', 'c'])
    expect(left.map(a => a.id)).toEqual(['d'])
  })

  it('does not redistribute 2 exhibitions + 3 artworks (within 1 slot)', () => {
    // right slots for 3: i=0 single; i=1 pair(b,c). slots=2. left=2. diff=0. no move.
    const artworks = ['a', 'b', 'c'].map(mk)
    const { left, right } = splitArtworks(artworks, 2, 0)
    expect(left).toEqual([])
    expect(right.map(a => a.id)).toEqual(['a', 'b', 'c'])
  })

  it('always keeps at least one artwork on the right', () => {
    // 0 exhibitions, 3 artworks: right slots: i=0 single, i=1 pair(b,c). slots=2. left=0. 2-0=2 → move c left.
    // right=[a,b] slots: i=0 single, i=1 single (no pair since i+2=3 > 2.length). slots=2. left=[c] slots=1, leftTotal=1.
    // 2-1=1 < 2 → stop.
    const artworks = ['a', 'b', 'c'].map(mk)
    const { left, right } = splitArtworks(artworks, 0, 0)
    expect(right.length).toBeGreaterThanOrEqual(1)
  })

  it('counts press quotes toward left slot count', () => {
    // 0 exhibitions, 2 press, 4 artworks. left starts at 2.
    // right slots: i=0 single; i=1 pair(b,c); i=3 single. slots=3. 3-2=1 < 2 → no move.
    const artworks = ['a', 'b', 'c', 'd'].map(mk)
    const { left, right } = splitArtworks(artworks, 0, 2)
    expect(left).toEqual([])
    expect(right.map(a => a.id)).toEqual(['a', 'b', 'c', 'd'])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- splitArtworks`
Expected: FAIL with "Cannot find module './splitArtworks'" or equivalent.

- [ ] **Step 3: Write the implementation**

Create `src/components/timeline/splitArtworks.ts`:

```ts
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- splitArtworks`
Expected: all 7 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/timeline/splitArtworks.ts src/components/timeline/splitArtworks.test.ts
git commit -m "feat(timeline): add splitArtworks helper for left-column fill"
```

---

## Task 2: Wire splitArtworks into TimelineYearBlock

**Files:**
- Modify: [src/components/timeline/RiverMagazineTimeline.tsx:200-275](src/components/timeline/RiverMagazineTimeline.tsx#L200-L275)

Render artworks on both columns when `splitArtworks` returns a non-empty `left`. Drop the dashed "Studio year" placeholder when there's at least one artwork that ends up on the left (placeholder remains only when both `exhibitions.length === 0` and `left.length === 0`).

- [ ] **Step 1: Add the import at the top of `RiverMagazineTimeline.tsx`**

After the existing `import ArtworkOverlay from './ArtworkOverlay'` line, add:

```ts
import { splitArtworks } from './splitArtworks'
```

- [ ] **Step 2: Compute the split inside `TimelineYearBlock`**

In `TimelineYearBlock`, immediately after `const [ref, isVisible] = useScrollAnimation(0.1)` (around line 180), add:

```ts
const { left: leftArtworks, right: rightArtworks } = splitArtworks(
  ty.artworks,
  ty.exhibitions.length,
  ty.pressQuotes.length,
)
```

- [ ] **Step 3: Replace the LEFT column block (the `Exhibitions + Press` div)**

Replace the existing `LEFT: Exhibitions + Press` block (lines 207-258) with:

```tsx
        {/* LEFT: Exhibitions + Press + (optional) overflow artworks */}
        <div className="md:col-start-1 md:pr-9 max-md:pr-0 max-md:mb-5">
          {ty.exhibitions.length > 0 ? (
            <div className="space-y-3">
              {ty.exhibitions.map((exh, idx) => {
                const card = (
                  <div
                    className={`transition-all duration-700 ease-out ${
                      isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                    } ${!isExhibitionVisible(exh) ? '!opacity-[0.15] pointer-events-none' : ''}`}
                    style={{ transitionDelay: isVisible ? `${idx * 50}ms` : '0ms' }}
                  >
                    <ExhibitionBanner
                      exhibition={exh}
                      onClick={() => onSelectExhibition(exh)}
                    />
                  </div>
                )

                return isAdmin ? (
                  <ExhibitionContextMenu key={exh.id} exhibition={exh} onUpdate={onUpdate}>
                    {card}
                  </ExhibitionContextMenu>
                ) : (
                  <div key={exh.id}>{card}</div>
                )
              })}
            </div>
          ) : leftArtworks.length === 0 ? (
            <div className="border border-dashed border-gray-300 p-4.5 text-center mt-5">
              <div className="text-[8px] tracking-[3px] uppercase text-gray-400 mb-1.5 font-medium">No Exhibition</div>
              <div className="text-[13px] text-gray-500 italic">Studio year</div>
            </div>
          ) : null}

          {/* Press clips */}
          {ty.pressQuotes.length > 0 && (
            <div className="mt-3 space-y-3">
              {ty.pressQuotes.map((q, idx) => (
                <div
                  key={q.id}
                  className={`transition-all duration-700 ease-out ${
                    isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                  }`}
                  style={{ transitionDelay: isVisible ? `${(ty.exhibitions.length + idx) * 50}ms` : '0ms' }}
                >
                  <PressClip quote={q} />
                </div>
              ))}
            </div>
          )}

          {/* Overflow artworks (only when left column had room) */}
          {leftArtworks.length > 0 && (
            <div className={`flex flex-col gap-3 ${ty.exhibitions.length > 0 || ty.pressQuotes.length > 0 ? 'mt-3' : ''}`}>
              {renderArtworkColumn(leftArtworks, isArtworkVisible, onSelectArtwork, isAdmin, onUpdate, isVisible)}
            </div>
          )}
        </div>
```

- [ ] **Step 4: Replace the RIGHT column to use `rightArtworks`**

Replace the existing `RIGHT: Artworks` block (lines 269-274) with:

```tsx
        {/* RIGHT: Artworks */}
        <div className="md:col-start-3 md:pl-9 max-md:pl-0">
          <div className="flex flex-col gap-3">
            {renderArtworkColumn(rightArtworks, isArtworkVisible, onSelectArtwork, isAdmin, onUpdate, isVisible)}
          </div>
        </div>
```

- [ ] **Step 5: Verify the homepage still type-checks and builds**

Run: `npm run typecheck`
Expected: PASS (no errors).

Run: `npm test`
Expected: all tests PASS, including the new `splitArtworks` tests.

- [ ] **Step 6: Manual smoke test**

Run: `npm run dev`

Open the homepage, scroll to the timeline. Find a year with 0 exhibitions and ≥3 artworks (e.g., 2012 from the screenshot). Confirm:
- Left column shows 1–2 artworks (no more "Studio year" dashed placeholder).
- Right column shows the remaining artworks.
- Filter toggles still fade artworks correctly on whichever column they're on.

Stop the dev server.

- [ ] **Step 7: Commit**

```bash
git add src/components/timeline/RiverMagazineTimeline.tsx
git commit -m "feat(timeline): fill empty left column with artwork on studio-light years"
```

---

## Task 3: Pure visible-artwork-list helper with unit tests

**Files:**
- Create: [src/components/timeline/buildVisibleArtworkList.ts](src/components/timeline/buildVisibleArtworkList.ts)
- Test: [src/components/timeline/buildVisibleArtworkList.test.ts](src/components/timeline/buildVisibleArtworkList.test.ts)

This builds the flat artwork list the overlay paginates through. Years are already sorted descending in `RiverMagazineTimeline.loadData`. Within each year, preserve the existing artwork order (the order from `ty.artworks`). Filter out artworks whose category isn't visible under the current filters.

- [ ] **Step 1: Define the shared TimelineYear type for reuse**

The `TimelineYear` interface and `FilterId` type currently live inside `RiverMagazineTimeline.tsx`. To use them from the helper without circular imports, also export them. In [src/components/timeline/RiverMagazineTimeline.tsx:19-24](src/components/timeline/RiverMagazineTimeline.tsx#L19-L24), change:

```ts
interface TimelineYear {
```

to:

```ts
export interface TimelineYear {
```

`FilterId` is already exported from [src/components/timeline/TimelineFilters.tsx](src/components/timeline/TimelineFilters.tsx) (re-export comes via the existing `import TimelineFilters, { FilterId } from './TimelineFilters'`).

- [ ] **Step 2: Write the failing tests**

Create `src/components/timeline/buildVisibleArtworkList.test.ts`:

```ts
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
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test -- buildVisibleArtworkList`
Expected: FAIL with "Cannot find module './buildVisibleArtworkList'".

- [ ] **Step 4: Write the implementation**

Create `src/components/timeline/buildVisibleArtworkList.ts`:

```ts
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
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test -- buildVisibleArtworkList`
Expected: 3 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/timeline/buildVisibleArtworkList.ts src/components/timeline/buildVisibleArtworkList.test.ts src/components/timeline/RiverMagazineTimeline.tsx
git commit -m "feat(timeline): add buildVisibleArtworkList helper for overlay pagination"
```

---

## Task 4: Rewrite ArtworkOverlay layout (image-dominant, near-fullscreen)

**Files:**
- Modify: [src/components/timeline/ArtworkOverlay.tsx](src/components/timeline/ArtworkOverlay.tsx) (full rewrite)

This task focuses on **layout only** — pagination wiring comes in Task 5. The overlay still receives only `artwork` and `onClose`; navigation arrows render but are no-ops in this task. We do this so each task is reviewable in isolation.

- [ ] **Step 1: Replace the full file contents**

Replace `src/components/timeline/ArtworkOverlay.tsx` with:

```tsx
'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { Artwork } from '@/types'
import { Badge } from '@/components/ui/badge'

interface ArtworkOverlayProps {
  artwork: Artwork | null
  onClose: () => void
  onPrev?: () => void
  onNext?: () => void
  hasPrev?: boolean
  hasNext?: boolean
  positionLabel?: string  // e.g. "3 / 12 in 2012"
}

export default function ArtworkOverlay({
  artwork, onClose,
  onPrev, onNext, hasPrev = false, hasNext = false, positionLabel,
}: ArtworkOverlayProps) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft' && hasPrev && onPrev) onPrev()
      if (e.key === 'ArrowRight' && hasNext && onNext) onNext()
    }
    if (artwork) {
      document.addEventListener('keydown', handleKey)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [artwork, onClose, onPrev, onNext, hasPrev, hasNext])

  if (!artwork) return null

  const title = artwork.title.en || artwork.title.ptBR
  const medium = artwork.medium.en || artwork.medium.ptBR
  const mainImage = artwork.images?.[0]?.display || artwork.images?.[0]?.original

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[500] flex items-center justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm cursor-pointer"
          onClick={onClose}
        />

        {/* Panel */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
          className="
            relative z-10 bg-white rounded-lg shadow-2xl overflow-hidden
            w-[95vw] h-[95vh] flex flex-col
            max-md:w-screen max-md:h-screen max-md:rounded-none
          "
        >
          {/* Close button */}
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute top-3 right-3 z-20 w-9 h-9 flex items-center justify-center bg-white/80 hover:bg-white rounded-full text-gray-700 hover:text-gray-900 transition-colors shadow"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Image area (top ~75%) */}
          <div className="relative bg-neutral-900 flex-1 min-h-0 flex items-center justify-center">
            {mainImage ? (
              <img
                src={mainImage}
                alt={title}
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              <span className="text-gray-500 text-sm">No image</span>
            )}

            {/* Desktop: edge-overlay arrows */}
            <button
              onClick={onPrev}
              disabled={!hasPrev}
              aria-label="Previous artwork"
              className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 items-center justify-center bg-black/40 hover:bg-black/70 disabled:opacity-30 disabled:cursor-not-allowed rounded-full text-white transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={onNext}
              disabled={!hasNext}
              aria-label="Next artwork"
              className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 items-center justify-center bg-black/40 hover:bg-black/70 disabled:opacity-30 disabled:cursor-not-allowed rounded-full text-white transition-colors"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          {/* Description strip (bottom ~25%) */}
          <div className="bg-white border-t border-gray-200 px-6 py-4 max-md:px-4 max-md:py-3">
            <div className="flex items-start gap-6 max-md:flex-col max-md:gap-3">
              {/* Title block */}
              <div className="min-w-0 flex-shrink-0">
                <Badge variant="outline" className="bg-gray-100 text-gray-800 capitalize text-[10px] border-0 mb-1.5">
                  {artwork.category ? artwork.category.charAt(0).toUpperCase() + artwork.category.slice(1) : 'Artwork'}
                </Badge>
                <h2 className="text-[20px] font-medium leading-tight text-gray-900 truncate">{title}</h2>
                <div className="text-[11px] text-gray-500 mt-0.5">{artwork.year}</div>
              </div>

              {/* Metadata row */}
              <div className="flex flex-wrap gap-x-6 gap-y-1.5 flex-1 text-[12px] text-gray-700 max-md:text-[11px]">
                {medium && (
                  <div>
                    <span className="text-[9px] tracking-[2px] uppercase text-gray-500 font-medium block">Medium</span>
                    <span>{medium}</span>
                  </div>
                )}
                {artwork.dimensions && (
                  <div>
                    <span className="text-[9px] tracking-[2px] uppercase text-gray-500 font-medium block">Dimensions</span>
                    <span>{artwork.dimensions}</span>
                  </div>
                )}
                {artwork.artSeries && (
                  <div>
                    <span className="text-[9px] tracking-[2px] uppercase text-gray-500 font-medium block">Series</span>
                    <span>{artwork.artSeries.nameEn || artwork.artSeries.namePt}</span>
                  </div>
                )}
              </div>

              {/* View full link */}
              {artwork.slug && (
                <a
                  href={`/artwork/${artwork.slug}`}
                  className="text-[10px] tracking-[2px] uppercase text-blue-600 hover:text-gray-900 transition-colors font-medium whitespace-nowrap self-end max-md:self-start"
                >
                  View Full Details &rarr;
                </a>
              )}
            </div>

            {/* Pagination indicator (desktop: centered below row; mobile: bottom bar) */}
            {positionLabel && (
              <>
                <div className="hidden md:block text-center text-[11px] text-gray-500 mt-3">
                  {positionLabel}
                </div>
                <div className="md:hidden flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                  <button
                    onClick={onPrev}
                    disabled={!hasPrev}
                    aria-label="Previous artwork"
                    className="min-h-[44px] px-4 flex items-center gap-1 text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-5 h-5" />
                    <span className="text-[12px]">Prev</span>
                  </button>
                  <span className="text-[11px] text-gray-500">{positionLabel}</span>
                  <button
                    onClick={onNext}
                    disabled={!hasNext}
                    aria-label="Next artwork"
                    className="min-h-[44px] px-4 flex items-center gap-1 text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <span className="text-[12px]">Next</span>
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
```

- [ ] **Step 2: Verify type-check passes**

Run: `npm run typecheck`
Expected: PASS. (`RiverMagazineTimeline.tsx` still calls `<ArtworkOverlay artwork={...} onClose={...} />` — the new pagination props are all optional, so the existing call site still type-checks.)

- [ ] **Step 3: Manual smoke test**

Run: `npm run dev`. Open the timeline, click any artwork. Confirm:
- Modal opens at 95vw × 95vh.
- Image is centered, full painting visible (no crop).
- Arrows render but do nothing yet (no `onPrev`/`onNext` passed).
- Esc closes; clicking backdrop closes; X button closes.

Stop the dev server.

- [ ] **Step 4: Commit**

```bash
git add src/components/timeline/ArtworkOverlay.tsx
git commit -m "feat(timeline): rewrite ArtworkOverlay layout to near-fullscreen image-dominant"
```

---

## Task 5: Wire pagination from RiverMagazineTimeline into the overlay

**Files:**
- Modify: [src/components/timeline/RiverMagazineTimeline.tsx](src/components/timeline/RiverMagazineTimeline.tsx)

Build the flat visible-artwork list, derive the current artwork's index, year-position, and per-year totals, then pass everything the overlay needs.

- [ ] **Step 1: Add the import for `useMemo` and the helper**

At the top of `RiverMagazineTimeline.tsx`, change:

```ts
import React, { useEffect, useState, useCallback } from 'react'
```

to:

```ts
import React, { useEffect, useState, useCallback, useMemo } from 'react'
```

After the `import { splitArtworks } from './splitArtworks'` line added in Task 2, add:

```ts
import { buildVisibleArtworkList } from './buildVisibleArtworkList'
```

- [ ] **Step 2: Build the memoized visible-artwork list**

Inside the `RiverMagazineTimeline` component body, after the existing `useCallback` hooks (around line 82, after `isYearVisible`), add:

```ts
const visibleArtworkList = useMemo(
  () => buildVisibleArtworkList(years, activeFilters),
  [years, activeFilters],
)
```

- [ ] **Step 3: Compute pagination props and pass them to the overlay**

Replace the existing overlay render (lines 153-158):

```tsx
      {selectedArtwork && (
        <ArtworkOverlay
          artwork={selectedArtwork}
          onClose={() => setSelectedArtwork(null)}
        />
      )}
```

with:

```tsx
      {selectedArtwork && (() => {
        const idx = visibleArtworkList.findIndex(a => a.id === selectedArtwork.id)
        const safeIdx = idx === -1 ? 0 : idx
        const prevArtwork = safeIdx > 0 ? visibleArtworkList[safeIdx - 1] : null
        const nextArtwork = safeIdx < visibleArtworkList.length - 1 ? visibleArtworkList[safeIdx + 1] : null

        const sameYearList = visibleArtworkList.filter(a => a.year === selectedArtwork.year)
        const inYearIdx = sameYearList.findIndex(a => a.id === selectedArtwork.id)
        const positionLabel = sameYearList.length > 0
          ? `${inYearIdx + 1} / ${sameYearList.length} in ${selectedArtwork.year}`
          : undefined

        return (
          <ArtworkOverlay
            artwork={selectedArtwork}
            onClose={() => setSelectedArtwork(null)}
            onPrev={prevArtwork ? () => setSelectedArtwork(prevArtwork) : undefined}
            onNext={nextArtwork ? () => setSelectedArtwork(nextArtwork) : undefined}
            hasPrev={prevArtwork !== null}
            hasNext={nextArtwork !== null}
            positionLabel={positionLabel}
          />
        )
      })()}
```

- [ ] **Step 4: Verify type-check + tests pass**

Run: `npm run typecheck && npm test`
Expected: PASS.

- [ ] **Step 5: Manual smoke test**

Run: `npm run dev`. On the timeline:
- Click an artwork in the middle of a multi-year set. Verify arrows are enabled.
- Click right arrow several times. Verify it walks through the year, then crosses into the next (older) year.
- Verify the position label (e.g. "2 / 4 in 2012") updates and resets when crossing year boundaries.
- Press `←` and `→`. Verify keyboard pagination matches the mouse arrows.
- Apply a filter (e.g. "Painting"). Re-open an artwork. Verify pagination only walks visible-category artworks.
- Open the very first artwork (newest year, first item). Verify left arrow is disabled.
- Open the very last artwork (oldest year, last item). Verify right arrow is disabled.
- Resize to mobile width. Verify modal becomes fullscreen and the bottom bar shows `[Prev]   [3 / 12 in 2012]   [Next]`.

Stop the dev server.

- [ ] **Step 6: Commit**

```bash
git add src/components/timeline/RiverMagazineTimeline.tsx
git commit -m "feat(timeline): paginate ArtworkOverlay across years with filter awareness"
```

---

## Self-Review Notes

**Spec coverage check:**
- Spec §"Trigger" (≤2 exhibitions, ≥3 artworks) → Task 1 implementation guard.
- Spec §"Redistribution rule" (move from right tail until within 1 slot, keep ≥1 on right) → Task 1 loop.
- Spec §"Visual treatment" (artworks render below exhibitions/press, same `ArtworkCard`) → Task 2 Step 3.
- Spec §"Edge cases" (drop placeholder when artworks moved) → Task 2 Step 3 ternary.
- Spec §"Filter interaction" (filtered-out artworks fade in place) → preserved by reusing `renderArtworkColumn` which already applies `isArtworkVisible`.
- Spec §"Modal layout" (95vw × 95vh, image dominant, description strip) → Task 4.
- Spec §"Navigation" (cross-year jumping, flat filter-respecting list) → Task 3 helper + Task 5 wiring.
- Spec §"Pagination indicator" (`{n} / {total} in {year}`) → Task 5 Step 3.
- Spec §"Keyboard" (Esc, ←, →) → Task 4 `handleKey`.
- Spec §"Mobile" (full-screen, image ~60vh, bottom bar) → Task 4 Tailwind responsive classes (`max-md:` variants and the `md:hidden` bottom bar).

**Type/name consistency check:** `splitArtworks`, `countSlots`, `buildVisibleArtworkList`, `TimelineYear` (now exported), `FilterId`, `ArtworkOverlayProps` (extended optional fields) — all consistent across tasks.

**Placeholder scan:** None. Every step has concrete code or commands.

**Mobile note (60vh):** The spec says "image takes ~60vh on mobile." The Task 4 implementation uses `flex-1 min-h-0` so the image area absorbs available space inside the `100vh` mobile container, which works out to ~60–75vh after the description strip with the bottom bar takes its natural height. This satisfies the spec intent without hard-coding a brittle 60vh.
