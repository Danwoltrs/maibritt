# Life Story: design mode — right-click styling, rich text, real size

Extends [`2026-09-16-story-look-and-arrange-design.md`](2026-09-16-story-look-and-arrange-design.md).
Everything there stays true unless this says otherwise.

## Purpose

"Move things around" today is a scaled-down canvas where she drags tiles on a
grid. Daniel's ask: what she sees there should be exactly what she gets, she
should be able to right-click any piece and change its font, its colour, the
button's colour, put a box around it, and she should be able to write with
bold, italic and underline, align and indent.

Three changes:

1. **Real size.** The design surface stops being a 16:10 miniature. It renders
   the section at exactly the size a visitor sees, with the grid and handles
   floated over it.
2. **Right-click, content aware.** Right-clicking (or long-pressing) a piece
   opens a menu offering only what applies to that piece: font, colour, size
   and alignment on text; button and label colour on the Begin button; a box
   (background, padding, rounded corners) on anything; and always "Back to the
   story's look" to drop the exception.
3. **Writing in place.** Clicking into a piece of text edits it where it sits.
   Selecting words raises a small toolbar: bold, italic, underline, align left
   / centre / right, and indent.

Per-piece choices are exceptions. The Look screen still sets the story's
fonts and colours; this overrides them for one piece of one section.

## Data model

No SQL. Still one jsonb, version stays 2, and everything added is optional, so
a document without it renders exactly as it does today.

### Per-piece style

`SectionLayout` gains a sibling map to `tiles`, keyed the same way. Keeping it
separate leaves every tested layout helper (`moveTile`, `resizeTile`,
`readingOrder`, `clampRect`) working on plain `GridRect`s.

```ts
type SectionLayout = {
  cols: 12
  rows: 8
  tiles: Record<string, GridRect>
  styles?: Record<string, TileStyle>
}

type TileStyle = {
  font?: string                                  // a FontId from the sixteen
  color?: string                                 // hex
  scale?: number                                 // 1 = as designed
  align?: 'left' | 'center' | 'right'            // overrides alignmentFor(rect)
  indent?: number                                // steps, each 32 px
  box?: { background?: string; padding?: number; radius?: number }
  button?: { background?: string; label?: string }   // the Begin button only
}
```

`scale` is chosen from a fixed ladder so "bigger" and "smaller" always land on
a sensible value: `0.6, 0.75, 0.9, 1, 1.15, 1.35, 1.6, 2`.
`indent` is 0–6 steps. `box.padding` is 0–5 steps of 8 px, `box.radius`
0–5 steps of 6 px.

### Rich text

Only the text block's `body` gets marks; headings and captions stay single
strings (they still take font, colour, size, alignment and a box). `TextBlock`
gains an optional `rich`; `body` remains the plain-text form of the same
content, kept in sync on every edit, so block-card previews, the publish guard
and anything else reading `body` keep working untouched.

```ts
type Mark = 'bold' | 'italic' | 'underline'
type Run = { text: string; marks?: Mark[] }
type Paragraph = { runs: Run[]; align?: 'left' | 'center' | 'right'; indent?: number }
type RichText = Paragraph[]

type TextBlock = { …; body: string; rich?: RichText }
```

A block with no `rich` renders from `body` exactly as before. The first time
she formats anything in that block, `rich` appears, seeded from `body`.

### Pure helpers (all unit tested)

`src/lib/story/rich.ts`
- `richFromPlain(body): RichText` — blank lines separate paragraphs, one run each.
- `plainFromRich(rich): string` — paragraphs joined by a blank line.
- `richToHtml(rich): string` — the seed for the editable element; emits only
  `<p>` with `style="text-align:…;padding-left:…"` and `<strong> <em> <u>`.
- `richFromElement(el: HTMLElement): RichText` — reads an edited element back.
  Walks block children, maps `B/STRONG → bold`, `I/EM → italic`,
  `U → underline`, reads `text-align` and `padding-left`, drops every other
  tag and attribute, merges neighbouring runs with equal marks, and returns at
  least one paragraph.
- `setParagraphAlign(rich, index, align)`, `setParagraphIndent(rich, index, delta)`.

`src/lib/story/tileStyle.ts`
- `SCALE_STEPS`, `nextScale(current, direction)`, `INDENT_STEP = 32`,
  `PADDING_STEP = 8`, `RADIUS_STEP = 6`.
- `styleOf(layout, key): TileStyle` — `{}` when absent.
- `setTileStyle(layout, key, patch): SectionLayout` — deep-merges the patch;
  a key set to `undefined` is removed; a style left empty is removed; `styles`
  itself is removed when it empties, so an untouched section stores nothing.
- `clearTileStyle(layout, key)` — "Back to the story's look".
- `tileCss(style, kind): { css: CSSProperties; boxCss: CSSProperties | null }` —
  the inline styles a tile wrapper and its box need, including
  `--piece-scale`, `textAlign`, `paddingLeft`, and the box paint.
- `MENU_FOR: Record<TileRole, MenuSection[]>` — which sections a piece offers
  (see "Content awareness" below).

## Rendering

### Size without rewriting the type scale

Each text piece currently hardcodes its size in Tailwind (`text-[54px]
md:text-[104px]`). Those classes move into `story.css` as named pieces that
read a base and a scale:

```css
.piece { font-size: calc(var(--piece-base) * var(--piece-scale, 1)); }
.piece-name { --piece-base: 54px; }
@media (min-width: 768px) { .piece-name { --piece-base: 104px; } }
```

One class per piece: `name, title, eyebrow, heading, body, caption,
caption-video, caption-small, label, voice-heading, transcript, begin`. The
components swap their size classes for `piece piece-<x>`; nothing else about
them changes. A tile then scales by setting `--piece-scale` on its wrapper,
and text that is not inside a layout is unaffected.

### Applying a style

`Arranged` already wraps each tile. It gains the style: the wrapper carries
`tileCss(...).css`, and when `box` is set the tile's children are wrapped in a
`<div>` carrying `boxCss`. `align` overrides `alignmentFor(rect)`; `indent`
adds left padding. On phones the stack applies the same styles, so her choices
survive at every width. A piece with no style renders byte-identically to today.

### Rich text

`TextBlock` renders `block.rich` when present: one `<p>` per paragraph with
`text-align` and `padding-left`, runs mapped to `<strong>`, `<em>`, `<u>` and
plain text, built as React elements — never `dangerouslySetInnerHTML`.
Otherwise it renders `paragraphs(body)` as it does now.

## Design mode (`/story/edit` → "Move things around")

The screen keeps its name and its entry points. Inside, it is rebuilt.

`src/components/story-editor/design/`:

- **`DesignScreen.tsx`** — owns the local layout (nothing saved until Done),
  the selected tile, the open context menu and the editing tile. Renders the
  surface, the floating bar and the menus.
- **`DesignSurface.tsx`** — a full-viewport `StoryTheme` containing the real
  section (the same `Opening` / `TextBlock` / `PhotoBlock` / … the public page
  renders, with the working layout applied, media muted and motion off through
  `MotionConfig reducedMotion="always"`). Each tile wrapper in `Arranged`
  carries `data-tile="<key>"`; the surface measures those with a
  `ResizeObserver` plus a scroll/resize listener and draws its overlay on the
  measured rectangles, so the handles always sit on what is actually rendered.
- **`TileOverlay.tsx`** — per tile: a dashed outline, a name chip, a drag area,
  a corner resize handle, `contextmenu` and long-press (600 ms) to open the
  menu, and a double-click to start writing. Dragging and resizing convert
  pixels to cells with the surface's measured grid geometry and call the
  existing `moveTile` / `resizeTile`.
- **`PieceMenu.tsx`** — the content-aware menu, opened at the pointer, kept
  inside the viewport. 56 px rows, words not icons, submenus for fonts and
  colours.
- **`TextEditing.tsx`** — turns the selected text tile into a
  `contentEditable` in place, seeded with `richToHtml` (body) or its plain
  string, with a floating toolbar above the selection: **B**, *I*, <u>U</u>,
  align left / centre / right, indent less / more. Marks use
  `document.execCommand`, which every browser this site supports still
  honours; on commit the element is read back with `richFromElement` and the
  block is updated through `apply`, so autosave and Undo work as everywhere.
  Plain fields (name, title, heading, caption) commit as their text content.
- **`DesignBar.tsx`** — floats over the top of the surface, semi-transparent
  so the section stays exactly 100 svh: back, the section's name, "Show the
  grid" toggle, "Put it back as it was", and **Done**.

### Content awareness

Each tile key maps to a role, and the role decides the menu:

| role | tiles | menu |
| --- | --- | --- |
| `text` | name, title, eyebrow, heading, body, caption, label, transcript, voice heading | Write, Font, Colour, Bigger, Smaller, Align, Indent, Box, Back to the story's look |
| `button` | begin | Words, Button colour, Label colour, Font, Bigger, Smaller, Rounded, Back to the story's look |
| `image` | portrait | Bigger, Smaller, Box, Back to the story's look |
| `player` | player | Bigger, Smaller, Box, Back to the story's look |

Only `body` offers marks in its toolbar; other text tiles get align and indent
only. "Box" opens a submenu: Background colour, More padding, Less padding,
More rounded, Less rounded, No box.

### Touch

Long-press opens the menu; the same 600 ms timer cancels on move or lift.
Drag and resize already use pointer events with `touch-action: none`. The
menu and toolbar rows are 56 px.

## Errors and edge cases

- A font id or colour that no longer parses falls back to the story's look at
  render time, as `themeVars` and `fontById` already do.
- `richFromElement` never throws on unexpected markup; anything it does not
  understand becomes plain text.
- Removing a block removes its layout and styles with it (they live inside it).
- A tile whose content is empty still renders nothing; its style is harmless.
- Escape closes the menu, then the toolbar, then leaves text editing.

## Testing

Vitest:
- `rich.test.ts` — plain → rich → plain round trip; blank lines; `richToHtml`
  escapes text and emits only the four tags; `richFromElement` on a jsdom
  element with nested `<b><i>`, `<div>` instead of `<p>`, `<span style>`, a
  stray `<script>`, alignment and indent; merging neighbouring equal runs;
  empty element gives one empty paragraph; align and indent setters clamp.
- `tileStyle.test.ts` — `nextScale` walks and stops at both ends; `setTileStyle`
  merges, prunes empty styles and removes `styles` when the last one goes;
  `clearTileStyle`; `tileCss` for each role; `MENU_FOR` covers every tile key
  in `TILE_KEYS`.
- `layout.test.ts` — existing helpers still ignore `styles`; `setBlockLayout`
  carries `styles` through.

Manual pass:
1. Design the opening at real size: drag the name, resize it, right-click it,
   pick Playfair and a colour, make it bigger twice, align right. Done. The
   published page matches exactly what the surface showed.
2. Right-click Begin: change the button colour and the label colour. Check the
   Look screen's accent is untouched.
3. Put a box behind a caption over a photo; add padding; round it.
4. In a text block, select two words, bold them, underline one; centre the
   second paragraph and indent it twice. Reload: it persists. Undo steps back.
5. "Back to the story's look" on a piece drops every exception on it.
6. iPad: long-press a piece to open the menu; drag with a finger; write with
   the on-screen keyboard.
7. A story written before this change renders identically until she touches it.

## Out of scope

Marks in headings and captions, colour or size on selected words, lists,
links, per-piece motion, and designing galleries (still not arrangeable).
