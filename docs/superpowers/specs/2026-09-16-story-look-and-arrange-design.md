# Life Story: her words, fonts, colours, and a grid to move things on

Extends [`2026-09-15-life-story-design.md`](2026-09-15-life-story-design.md).
Everything in that spec stays true unless this one says otherwise.

## Purpose

The story page shipped as a fixed template: Cormorant headings, Source
Sans body, a paper-and-terracotta palette, and a handful of phrases the
app wrote for her ("The life story of", "Begin the story", "Chapter one").
Mai-Britt is an artist. The template stays as a starting point, but she
must be able to choose every word on the page, pick fonts, change the
colours, and move the pieces of each screen around. All of it from the
same editor, with the same rules: 18 px minimum, 56 px buttons with
words, no jargon, autosave, Undo.

Three additions:

1. **Words** — every phrase the app used to hardcode becomes editable,
   with the original shown as the template.
2. **Look** — one screen for fonts (a curated menu of sixteen), colours
   (five roles, six ready-made palettes) and words, with a live preview.
3. **Arrange** — a "Move things around" button on the opening and on
   each block. It opens that one screen on a large 12 × 8 grid where the
   pieces (name, title, portrait, button, heading, body, caption, player,
   transcript) are tiles she drags and resizes, snapping to cells.
   Phones stack the tiles in reading order.

Also folded in, from the previous handoff: a "Story" link in the public
header, "Life Story" in the admin sidebar and dashboard quick actions.

## Data model

No SQL. The document stays one jsonb per column. Its version becomes 2.
A normaliser upgrades any version-1 document on read, so the published
story keeps rendering exactly as today until she changes something.

```ts
type StoryDocument = {
  version: 2
  opening: StoryOpening            // gains `layout?: SectionLayout`
  chapters: Chapter[]              // each block gains `layout?: SectionLayout`
  look: StoryLook
}

type StoryLook = {
  fonts: { heading: FontId; body: FontId }
  colors: {
    page: string        // hex; default #f5f0e8  (paper)
    text: string        // default #2a2521       (ink)
    accent: string      // default #b5623a       (buttons, progress bar, chapter labels)
    accentText: string  // default #fbf9f5       (text on buttons)
    backdrop: string    // default #1e1712       (behind the opening, photos, slideshows, videos)
  }
  words: Partial<Record<WordKey, string>>   // only overrides are stored
}

type WordKey =
  | 'eyebrow'     // "The life story of"
  | 'begin'       // "Begin the story"
  | 'soundNote'   // "This story is told with sound"
  | 'chapterWord' // "Chapter"  → "Chapter one · Title"; blank hides the numbering
  | 'voiceLabel'  // "Mai-Britt, in her own voice" (default built from her first name)
  | 'ownWords'    // "In her own words" (small line above a voice recording)
  | 'readAlong'   // "Read along"
  | 'soundOn'     // "Sound on"
  | 'soundOff'    // "Sound off"
  | 'notReady'    // "This story is still being written."

type FontId = string  // one of the sixteen ids in the catalogue below

type GridRect = { x: number; y: number; w: number; h: number }  // whole cells
type SectionLayout = { cols: 12; rows: 8; tiles: Record<string, GridRect> }
```

`createEmptyDocument()` returns version 2 with `look` set to the
defaults and no layouts. `normalizeDocument(raw)` accepts anything the
database might hold (null, version 1, a version 2 with missing keys)
and returns a complete version-2 document; it fills `look` with a deep
merge over the defaults and leaves absent layouts absent. It runs in
`StoryService.getDraft`, `StoryService.getPublished`, and the public
page's loader. Tests cover: null, a v1 document, a v2 document with a
partial `look`, and a v2 document with unknown word keys (dropped).

Words are stored only when they differ from the default. A field set
back to the exact default text is removed from `words`. The chapter word
is the one key where the empty string is meaningful (numbering off), so
it is stored as `''`.

### Pure helpers (all unit tested)

`src/lib/story/words.ts`
- `WORD_DEFAULTS: Record<WordKey, string>`.
- `wordsFor(look): Record<WordKey, string>` — defaults with overrides.
- `chapterLabel(index, title, chapterWord)` — `"Chapter one · Title"`;
  with a blank chapter word returns just the title, or `""` when the
  title is also blank; indexes past twelve fall back to digits.
- `voiceLabel(name, override)` — override verbatim when present,
  otherwise `"<first name>, in her own voice"` or `"In her own voice"`.

`src/lib/story/look.ts`
- `DEFAULT_LOOK`, `PALETTES` (six, each `{ id, name, colors }`:
  Paper & terracotta (the default), Ink & cream, Sea, Night, Rose,
  Forest).
- `themeVars(colors)` — the CSS variable map the page already reads:
  `--paper`, `--paper-2`, `--paper-3`, `--white`, `--ink`, `--ink-2`,
  `--ink-3`, `--line`, `--accent`, `--accent-2`, `--accent-soft`,
  `--accent-text`, `--backdrop`, `--on-backdrop`. Derived tones are
  mixes: paper-2 = page mixed 6 % toward text, paper-3 12 %, line 22 %;
  ink-2 = text mixed 35 % toward page, ink-3 55 %; accent-2 = accent
  mixed 20 % toward black; accent-soft = accent mixed 80 % toward page;
  white = page mixed 40 % toward pure white; on-backdrop = `#fbf9f5` or
  the text colour, whichever contrasts more with the backdrop.
- `mix(hexA, hexB, t)`, `contrastRatio(hexA, hexB)` (WCAG),
  `readabilityNote(colors): string | null` — a plain sentence when text
  on page is under 4.5, or button text on accent is under 3, else null.
  It never blocks a choice.

`src/lib/story/fonts.ts` (pure catalogue; the loader lives in the app)
- `FONTS: { id: FontId; name: string; kind: 'serif' | 'sans' | 'hand' | 'typewriter' | 'display'; cssVar: string }[]`
  Sixteen entries:
  serif — Cormorant Garamond, Playfair Display, Libre Baskerville,
  EB Garamond, Lora, Fraunces; display — DM Serif Display, Abril
  Fatface; sans — Source Sans 3, Inter, Jost, Nunito, Raleway;
  hand — Caveat, Dancing Script; typewriter — Special Elite.
- `fontById(id)` falls back to the default for an unknown id.

`src/lib/story/layout.ts`
- `GRID = { cols: 12, rows: 8 }`.
- `TILE_KEYS: Record<'opening' | BlockKind, string[]>` — opening:
  `portrait, eyebrow, name, title, begin`; text: `label, heading, body`;
  photo: `label, caption`; slideshow: `label, player, caption`; audio:
  `label, heading, player, transcript`; video: `label, caption`;
  gallery: `[]` (not arrangeable, it has its own motion).
- `defaultLayout(kind)` — tiles placed where the current design puts
  them, so the Arrange screen opens looking like the page does now.
- `clampRect(rect)`, `moveTile(layout, key, dx, dy)`,
  `resizeTile(layout, key, dw, dh)` (minimum 1 × 1, kept inside the
  grid), `readingOrder(layout): string[]` (by row, then column),
  `alignmentFor(rect): 'left' | 'center' | 'right'` (by the tile's
  horizontal centre: left third, middle third, right third).
- `setOpeningLayout(doc, layout | null)`,
  `setBlockLayout(doc, chapterId, blockId, layout | null)` — `null`
  removes the layout and returns the section to the built-in design.

Tiles may overlap. An artist may want a caption over a photo, and the
grid makes accidental overlap obvious.

## Rendering

### Theme

`src/components/story/StoryTheme.tsx` wraps the story in
`<div className="story-theme" style={vars}>` where `vars` is
`themeVars(look.colors)` plus `--story-heading-font` and
`--story-body-font` pointing at the chosen fonts' variables.
`story.css` changes two lines: `.story-theme` reads
`var(--story-body-font, var(--font-story-sans))` and `.story-serif`
reads `var(--story-heading-font, var(--font-serif))`. The editor's own
chrome is not wrapped by `StoryTheme`, so her font and colour choices
change the story, never the buttons she edits with.

The three places that hardcode `#1e1712` (opening, photo, slideshow,
video, page-turn gallery) read `var(--backdrop)`. Text drawn over
photos keeps its translucent white; solid text over the backdrop with
no photo (the opening without a cover, the link-video screen) reads
`var(--on-backdrop)`. The Begin button reads `--accent` and
`--accent-text`.

### Fonts

`src/app/story/fonts.ts` declares the sixteen families with
`next/font/google`, `subsets: ['latin']` (Portuguese and Danish letters
live in Latin-1), `display: 'swap'`, `preload: false`, and a CSS
variable per family matching `FONTS[i].cssVar`. Each declares weight 400
and one heavier weight the family offers (500–700); variable families
need no weight list. The story layout applies every family's class to
its wrapper div. Browsers download a font file only when text uses that
family, so visitors fetch just the two she chose.

### Words

`Story.tsx` computes `words = wordsFor(document.look)` once and passes
what each component needs. `Opening` shows `words.eyebrow`,
`words.begin`, `words.soundNote`. `StoryChrome` uses `soundOn` /
`soundOff`. `AudioBlock` uses `ownWords` and `readAlong`. Chapter
labels come from `chapterLabel(i, title, words.chapterWord)`; the voice
label from `voiceLabel(name, words.voiceLabel)`. `NotReady` takes a
`text` prop; the public page passes `words.notReady` when a document
exists (it may be unnamed or chapterless) and the default otherwise.

### Grid sections

Each arrangeable block exposes its pieces as named render functions and
hands them to one shared component:

```tsx
<Section layout={block.layout} kind="text" backdrop={...} tiles={{ label: <Label/>, heading: <Heading/>, body: <Body/> }}>
  {/* the block's existing hand-tuned markup, used when there is no layout */}
</Section>
```

- **No layout** → renders the children exactly as today. Nothing
  changes for existing content.
- **Layout, wide screen (≥ 768 px)** → a CSS grid, twelve columns,
  eight rows of `minmax(calc((100svh - 80px) / 8), auto)` with 40 px
  vertical and 48 px horizontal padding, `min-height: 100svh`. Each tile
  sits at `grid-column: x+1 / span w; grid-row: y+1 / span h`, text
  aligned by `alignmentFor(rect)`, `min-width: 0`. Rows grow if a tile's
  text is taller than its cells, so nothing is ever clipped. Backdrop
  media (the photo, slideshow images, video) stays absolutely
  positioned behind the grid.
- **Layout, phone** → the tiles in `readingOrder(layout)` stacked in a
  column with the block's current phone spacing. Backdrop media as
  above.

The chapter-label tile has no children when `chapterLabel` returns an
empty string, and empty tiles render nothing.

## Editor

### Screens

`screens.ts` gains `{ kind: 'look' }` and
`{ kind: 'arrange'; target: { type: 'opening' } | { type: 'block'; chapterId: string; blockId: string } }`.
`EditorApp` routes them to `LookScreen` and `ArrangeScreen`.

### Look screen (`src/components/story-editor/look/`)

Opened from a new **Look** button in the top bar (palette icon, between
Undo and Preview). `PageTop` title "The look of my story", back label
"Back to my story".

Two columns on wide screens: controls (flexible) and a sticky preview
(480 px). On phones the preview sits on top, sticky, 240 px tall.

**Preview** (`LookPreview.tsx`): a 1280 px wide frame scaled with
`transform: scale()` to fit, `pointer-events: none`, inside
`MotionConfig reducedMotion="always"`, rendering `StoryTheme` around
`Opening` and the first block of the first chapter (or a short built-in
sample text block when she has none, marked "sample"). It reads a local
`look` state so it updates on every tap without waiting for autosave.

**Fonts** (`FontSection.tsx`, `FontPicker.tsx`): two rows, "For
headings" and "For reading", each showing the current family's name, a
sample in that family (her name for headings, "Um dia de sol em Santos,
et lille hus i Danmark" for reading, so accents and Danish letters are
visible), and a 56 px **Change** button. Change opens a full-screen
dialog listing the sixteen families as 96 px cards in two columns, each
card showing its sample in the family itself, grouped by kind with
plain headings (Elegant, Clear, Handwritten, Typewriter, Bold). Tap a
card to choose; the dialog closes.

**Colours** (`ColourSection.tsx`): a row of six palette swatches (each
a 64 px circle striped with its five colours and its name under it;
the current one has an accent ring), then five rows, one per role, each
with a plain name and hint ("Page — the background behind your words"),
a 56 px swatch, and **Change** which opens the browser's colour picker
(`<input type="color">` sized 56 px, labelled). Below the rows, when
`readabilityNote` returns text, a calm sentence in `--ink-2`: "Your text
may be hard to read on this page colour." It never blocks. A quiet
**Back to the original colours** button restores the default palette.

**Words** (`WordSection.tsx`): ten labelled fields, each with a hint
saying where the phrase appears, the default as placeholder, 18 px. A
field that differs from the default shows a quiet **Use the original**
button that clears it. The chapter word's hint says "Leave this empty
to show only your chapter titles". Fields commit on blur or Enter.

Every commit calls `apply` with `setLook(doc, nextLook)`, so autosave,
Undo and "Saved a moment ago" behave as everywhere else. Colour pickers
commit on `change`, not on every `input` event, so a drag through the
picker is one undo step.

### Arrange screen (`src/components/story-editor/arrange/`)

Reached from the opening card ("Move things around", grid icon) and
from every block card except galleries. `PageTop` title "Move things
around", right side **Done**.

`ArrangeScreen.tsx` holds a local layout state initialised from the
section's stored layout or `defaultLayout(kind)`.

**Canvas** (`ArrangeCanvas.tsx`): a 16 : 10 box as wide as the page
allows (max 1200 px), showing the section's real backdrop (cover photo,
photo, first slideshow image or video poster, dimmed; paper for text and
voice) and a dotted 12 × 8 grid. Tiles render the real content scaled by
`canvasWidth / 1280` so she moves her actual name, not a placeholder.
Each tile is a `@dnd-kit` draggable with `createSnapModifier(cellSize)`
and `restrictToParentElement`; drop converts the pixel delta to cells
and calls `moveTile`. A 28 px corner handle at the bottom-right resizes
by cells through pointer events (`resizeTile`). The selected tile has a
2 px accent outline and the arrow keys nudge it one cell; Escape
deselects. Tiles set `touch-action: none` so a finger drag works on
iPad and iPhone.

Under the canvas: a sentence "On a phone, things stack in this order:"
followed by numbered chips in `readingOrder`, updating live, and a quiet
**Put it back as it was** button that removes the layout (the section
returns to the built-in design) and shows the default tiles again.

**Done** calls `apply` with `setOpeningLayout` or `setBlockLayout`
(with `null` when she chose "Put it back as it was" and made no further
change), then goes back. Leaving with the back button discards the
local state; nothing is written until Done, so a wrong drag costs
nothing.

### Cards

`BlockCard` gains a third button, **Move things around**, hidden for
galleries. The opening card in `StoryOverview` gains the same button
beside "Change the opening". Cards whose section has a layout show a
small "Arranged by you" note under the kind label.

### Icons

`ui.tsx` `Icon` gains `palette` and `grid`.

## Site wiring (from the previous handoff)

- `src/components/Header.tsx`: `{ name: 'Story', href: '/story', namePt: 'História' }` between About and Contact.
- `src/components/admin/Layout/AdminSidebar.tsx`: "Life Story" → `/story/edit` after Journal, book icon.
- `src/app/dashboard/page.tsx`: quick action `{ title: 'Life Story', description: 'Write or edit her story', href: '/story/edit' }`.

## Errors

Nothing here uploads or calls a route. The only failure mode is the
save, already handled by the top bar. An unknown font id or a malformed
colour in a stored document falls back to the default at read time
(`fontById`, and `themeVars` validates hex and substitutes the default
for that role).

## Testing

Vitest in `src/lib/story/`:
- `words.test.ts` — defaults, overrides, chapter labels with and without
  a chapter word, indexes past twelve, voice label with and without a
  name and with an override.
- `look.test.ts` — `mix`, `contrastRatio` against known pairs (black on
  white = 21), `themeVars` produces every variable and validates hex,
  `on-backdrop` flips on a light backdrop, `readabilityNote` on a bad
  and a good palette, every palette passes its own readability check.
- `layout.test.ts` — every default layout is inside the grid and lists
  exactly `TILE_KEYS[kind]`, move and resize clamp, minimum size,
  reading order, alignment thirds, set/remove layout on opening and on a
  block without touching other blocks.
- `document.test.ts` — `createEmptyDocument` is version 2 with the
  default look; `normalizeDocument` cases listed above; existing
  helpers keep `look` and layouts intact through insert, move, remove.

`store.test.ts` is unchanged.

Manual pass (the finger drag is the main risk):
1. Open Look. Pick Playfair for headings, Caveat for reading, the Night
   palette, then change Accent by hand. The preview follows each tap.
   Preview my story: fonts and colours match. Undo three times: the
   look steps back. Reload: the look persists.
2. Words: set the chapter word blank, change "Begin the story" to
   Portuguese. Preview shows titles without numbers and her phrase.
   Clearing any other field means "use the original"; "Use the
   original" does the same in one tap.
3. Arrange the opening on an iPad with a finger: drag the name to the
   top-left, widen it, move the button under it. Done. Preview on the
   iPad: it matches; on an iPhone the pieces stack in the order the
   strip showed. "Put it back as it was" restores the design.
4. Arrange a photo block's caption over the image's centre. It sits on
   the photo on desktop and under it on the phone.
5. Publish, then check `/story` in a private window on both devices.
6. A version-1 story from before this change still renders identically
   before any Look change is made.

## Out of scope

Chapter drag-and-drop (Earlier / Later stay), per-block colours, her own
font files, rich text, translation of the editor itself, arranging
galleries.
