# Timeline Left-Column Fill & Enlarged Artwork Overlay with Pagination

**Date:** 2026-05-03
**Scope:** Public homepage timeline (`RiverMagazineTimeline`) and artwork overlay (`ArtworkOverlay`).

## Problem

Two related issues on the public artistic-journey timeline:

1. **Empty left column on studio years and exhibition-light years.** When a year has 0 exhibitions, the left column shows only a small dashed "Studio year" placeholder, leaving a large amount of vertical whitespace next to a tall stack of right-column artworks. Years with 1–2 exhibitions but many artworks have the same lopsided look.
2. **Artwork overlay underwhelms the artwork.** The current overlay is a small two-column card (~820px wide) with the image cropped via `object-cover` and no way to navigate between artworks — the user must close and reopen for each one.

## Goals

- Fill empty/underused left-column space with artwork from the same year, so years feel visually balanced.
- Make the artwork overlay show the painting at full scale and let the user paginate through artworks without closing the modal.

## Non-Goals

- No new data model. No "featured artwork" concept. Artworks moved to the left render identically to those on the right.
- No changes to exhibition cards, press clips, the year marker, or the timeline spine.
- No changes to admin context menus or the artwork detail page (`/artwork/[slug]`).

---

## Part 1: Left-Column Artwork Fill

### Trigger

A year is eligible for redistribution when **both** are true:

- `exhibitions.length <= 2`
- `artworks.length >= 3`

Years outside this range render as today.

### Redistribution rule

Compute `rightSlots` = number of vertical "slots" the artwork column would consume if rendered with the existing pair-grouping logic in `renderArtworkColumn` (each single = 1 slot, each pair = 1 slot).

Compute `leftSlots` = `exhibitions.length + pressQuotes.length`.

While `rightSlots - leftSlots >= 2`, move the **last** slot from the right column to the bottom of the left column. Stop when the columns are within 1 slot of each other, or when the right column has only 1 slot remaining (always keep at least one artwork on the right so the row reads as two-sided).

The grouping into singles vs. pairs is recomputed after redistribution so the moved artworks form valid pairs on the left where possible.

### Visual treatment

Moved artworks render *below* exhibitions and press clips on the left, using the same `ArtworkCard` component (single or pair grid) as the right column. Spacing between exhibition stack and the moved artworks: same `gap-3` already used between artwork rows.

The fade-in animation delay continues to increment so left-column artworks animate in after exhibitions and press clips on that side.

### Edge cases

- **0 exhibitions, 0 press, ≥1 artwork:** drop the dashed "Studio year" placeholder entirely. The left column shows artworks. (The placeholder remains only if the year has 0 artworks too — should not occur in practice since a year only exists in `years` if it has at least one artwork or exhibition.)
- **0 exhibitions, 0 press, 0 artworks:** placeholder remains.
- **1 exhibition, 1 artwork:** no redistribution (right has 1 slot, left has 1 slot — already balanced).
- **2 exhibitions, 3 artworks:** right has up to 2 slots (1 single + 1 pair, or 3 singles depending on the existing pair-grouping). Within 1 of left → no move.
- **0 exhibitions, 5 artworks:** left starts at 0 slots, right at ~3 slots. Move 1 slot left → 1 vs. 2. Stop. Left column shows ~1–2 artworks; right shows ~2–3.

### Filter interaction

Filter visibility (`isArtworkVisible`) applies to whichever column the artwork ends up in. Filtered-out artworks fade in place; they do not get re-redistributed when filters change.

### Files affected

- `src/components/timeline/RiverMagazineTimeline.tsx` — modify `TimelineYearBlock` to compute redistribution and render artworks on both columns. Extract a small `splitArtworks(artworks, exhibitionCount, pressCount)` pure helper that returns `{ left: Artwork[], right: Artwork[] }`. Reuse `renderArtworkColumn` for both sides.

---

## Part 2: Enlarged Artwork Overlay with Pagination

### Modal layout

- Modal sized at **95vw × 95vh**, centered on the dark backdrop (`bg-black/80 backdrop-blur-sm`, already wired).
- Vertical split: top ~75% is the image area, bottom ~25% is the description strip.
- **Image area:** `bg-neutral-900`, image rendered with `object-contain` so the full painting is visible. Image element is centered both axes.
- **Description strip:** white background, horizontal flex layout:
  - Left: badge (category) + title + year, stacked.
  - Center/right: medium, dimensions, series — compact key/value pairs in a row.
  - Far right: "View Full Details →" link (same target as today: `/artwork/${slug}`).
  - Bottom-center of strip: pagination counter (see below).
- Close button (`×`) anchored top-right of the modal, above the image area.

### Navigation

- **Prev/Next arrow buttons** overlay the left and right edges of the image area, vertically centered. Style: 44×44 circular, `bg-black/40 hover:bg-black/70 text-white`, with chevron icons.
- **Pagination scope:** flat list of all visible artworks across all years (respecting `activeFilters`), sorted by year descending, then by the artwork's order within the year (preserving the order from `ty.artworks`).
- **Cross-year jumping:** when the user pages past the last artwork of a year, the next press lands on the first artwork of the next (older) year. The year label in the description strip updates to reflect the new artwork's year.
- **Boundaries:** prev disabled on the very first artwork in the list; next disabled on the very last. Disabled state: `opacity-30 cursor-not-allowed`.

### Pagination indicator

Bottom-center of the description strip:

> `3 / 12 in 2012`

Format: `{currentIndexInYear} / {totalInYear} in {year}`. Resets when crossing year boundaries — always reflects the current artwork's position within its own year, not the full timeline.

### Keyboard

- `Esc` closes (already wired).
- `←` paginates to previous artwork.
- `→` paginates to next artwork.
- Disabled at boundaries (no-op rather than wrap).

### Mobile (`max-md`)

- Modal becomes full-screen (`100vw × 100vh`).
- Image area takes ~60vh; description scrolls below.
- Arrows become a bottom bar with the structure: `[← Prev]   [3 / 12 in 2012]   [Next →]`. Tap targets ≥44px tall.
- Image-edge overlay arrows are hidden on `max-md`.

### Data flow

The overlay needs the full visible-artworks list to paginate. Pass it as a prop:

```ts
interface ArtworkOverlayProps {
  artwork: Artwork | null
  artworkList: Artwork[]   // ordered, filter-respecting, year-grouped (year desc, in-year asc)
  onClose: () => void
  onNavigate: (artwork: Artwork) => void
}
```

`RiverMagazineTimeline` builds `artworkList` whenever `years` or `activeFilters` changes (memoized with `useMemo`), and passes it in. The overlay computes its current index by reference: `artworkList.findIndex(a => a.id === artwork.id)`.

### Files affected

- `src/components/timeline/ArtworkOverlay.tsx` — replace two-column small-modal layout with the new image-dominant layout. Add prev/next handling and keyboard listeners. Add mobile bottom-bar variant.
- `src/components/timeline/RiverMagazineTimeline.tsx` — build memoized `visibleArtworkList`, pass to overlay, wire `onNavigate` to `setSelectedArtwork`.

---

## Testing

- **Manual visual checks** (no automated tests for layout):
  - Year with 0 exhibitions + 5 artworks → left column shows ~1–2 artworks below where the placeholder used to be.
  - Year with 1 exhibition + 4 artworks → left shows exhibition + 1 moved artwork; right shows the rest.
  - Year with 2 exhibitions + 3 artworks → no redistribution (within 1 slot).
  - Year with 0 exhibitions + 1 artwork → left column empty (no placeholder); right shows the artwork.
  - Filter toggles still fade artworks correctly on whichever column they ended up.
- **Overlay:**
  - Click an artwork → opens at 95vw × 95vh, full painting visible.
  - Right arrow paginates within year, then jumps to next year's first artwork. Pagination counter updates.
  - Left arrow at first artwork is disabled. Right arrow at last artwork is disabled.
  - Keyboard arrows work; `Esc` closes.
  - Mobile viewport: modal is full-screen, bottom bar shows nav.
  - Filter applied → pagination only includes filter-visible artworks.

## Open questions

None. Design is ready for implementation planning.
