# Story Design Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans or superpowers:subagent-driven-development. Steps use `- [ ]` for tracking.

**Goal:** Turn "Move things around" into a real-size design surface where she can drag, right-click any piece to change its font, colour, size, alignment and box, change the Begin button's colours, and write with bold / italic / underline, align and indent.

**Architecture:** Two new pure modules (`rich.ts`, `tileStyle.ts`) with full unit tests carry all the logic. `SectionLayout` gains an optional `styles` map beside `tiles`, so every tested layout helper is untouched. Text sizes move from Tailwind classes into CSS custom properties so a tile can scale by setting one variable. `Arranged` applies a tile's style; `TextBlock` renders rich text as React elements. The editor's design screen renders the *real* section full-size and floats a measured overlay, a content-aware context menu and an in-place text editor over it.

**Tech Stack:** Next.js 15, TypeScript, zustand, framer-motion, @dnd-kit (drag is hand-rolled here on pointer events since the surface is full-size), vitest + jsdom.

**Spec:** `docs/superpowers/specs/2026-09-17-story-design-mode-design.md` (extends the 2026-09-16 look-and-arrange spec).

## Global Constraints

- Editor rules: ≥18 px text, 56 px rows and buttons, words not jargon, radius 10 px on controls.
- No SQL. Document stays version 2; everything added is optional; a document without it renders byte-identically.
- Never `git add -A` / `git add src` — untracked files under `src/` break the Production build. Stage named paths.
- Verify with `npx vitest run` (267 baseline), `npm run typecheck` (only the 8 pre-existing exhibitions errors), and `npx next build` in a **clean worktree**.
- Branch `feat/story-design-mode`. Commits end with `Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>`.

---

### Task 1: `rich.ts` — rich text helpers
**Files:** create `src/lib/story/rich.ts`, `src/lib/story/rich.test.ts`; modify `src/lib/story/types.ts` (`Mark`, `Run`, `Paragraph`, `RichText`, `TextBlock.rich?`).
**Produces:** `richFromPlain`, `plainFromRich`, `richToHtml`, `richFromElement`, `setParagraphAlign`, `setParagraphIndent`, `MAX_INDENT`.

- [ ] Write `rich.test.ts` first: round trip, blank lines collapse, `richToHtml` escapes `&<>` and emits only `p/strong/em/u`, `richFromElement` on nested `<b><i>`, on `<div>` blocks, on `<span style>`, on a stray `<script>`, reading `text-align` and `padding-left`, merging equal neighbouring runs, empty element → one empty paragraph, align/indent setters clamp to 0…6.
- [ ] Run: `npx vitest run src/lib/story/rich.test.ts` → fails (module missing).
- [ ] Implement `rich.ts`; add the types to `types.ts`.
- [ ] Run again → passes. Commit.

### Task 2: `tileStyle.ts` — per-piece style helpers
**Files:** create `src/lib/story/tileStyle.ts`, `src/lib/story/tileStyle.test.ts`; modify `src/lib/story/types.ts` (`TileStyle`, `SectionLayout.styles?`), `src/lib/story/layout.ts` (`cloneLayout` copies `styles`; `TILE_ROLE`).
**Produces:** `SCALE_STEPS`, `nextScale`, `INDENT_STEP`, `PADDING_STEP`, `RADIUS_STEP`, `styleOf`, `setTileStyle`, `clearTileStyle`, `tileCss`, `TILE_ROLE`, `MENU_FOR`.

- [ ] Write `tileStyle.test.ts`: `nextScale` walks the ladder and stops at both ends; `setTileStyle` deep-merges, prunes an emptied style, removes `styles` when the last goes, never mutates; `clearTileStyle`; `tileCss` per role (scale → `--piece-scale`, align → `textAlign`, indent → `paddingLeft`, box → paint); `TILE_ROLE` covers every key in `TILE_KEYS`; `MENU_FOR` has a section list for every role.
- [ ] Run → fails. Implement. Run → passes.
- [ ] Extend `layout.test.ts`: `cloneLayout`/`setBlockLayout` carry `styles`; `moveTile`/`resizeTile`/`readingOrder` ignore them.
- [ ] Commit.

### Task 3: size plumbing — CSS pieces
**Files:** modify `src/app/story/story.css`; `src/components/story/Opening.tsx`, `blocks/TextBlock.tsx`, `blocks/PhotoBlock.tsx`, `blocks/AudioBlock.tsx`, `blocks/VideoBlock.tsx`, `blocks/SlideshowBlock.tsx`.

- [ ] Add `.piece { font-size: calc(var(--piece-base) * var(--piece-scale, 1)) }` and one `.piece-<name>` per piece with its current mobile base and a `@media (min-width: 768px)` desktop base, matching today's Tailwind values exactly: name 54/104, title 24/36, eyebrow 12/14, heading 44/76, body 19/21, caption 24/34, caption-video 22/30, caption-small 22/26, label 12/13 (on dark) and 13/14 (on paper), voice-heading 40/56, transcript 20/25, begin 19/21.
- [ ] Swap each component's `text-[..] md:text-[..]` for `piece piece-<name>`. Change nothing else.
- [ ] Verify no visual drift: `npx vitest run`, `npm run typecheck`, and a dev-server screenshot of a sample story compared against the same page before the change.
- [ ] Commit.

### Task 4: `Arranged` applies styles; `TextBlock` renders rich
**Files:** modify `src/components/story/Arranged.tsx`, `src/components/story/blocks/TextBlock.tsx`.

- [ ] `Arranged` reads `layout.styles` and puts `tileCss(style, role).css` on each tile wrapper (grid and phone-stack paths alike), wrapping children in a box `<div>` when `boxCss` is non-null. Tag each wrapper `data-tile={key}` for the design surface to measure.
- [ ] `TextBlock` grows a `Rich` renderer: `block.rich` → `<p>` per paragraph with `textAlign` and `paddingLeft: indent * INDENT_STEP`, runs → `<strong>/<em>/<u>`/text as React elements. No `dangerouslySetInnerHTML`. Falls back to `paragraphs(body)`.
- [ ] Commit.

### Task 5: design surface — real size, measured overlay, drag and resize
**Files:** create `src/components/story-editor/design/DesignSurface.tsx`, `TileOverlay.tsx`, `useTileRects.ts`; modify `src/components/story-editor/arrange/ArrangeScreen.tsx` to render them (keeping its Done / Put it back / phone-order behaviour).

- [ ] `useTileRects(containerRef, layout)` measures every `[data-tile]` with `getBoundingClientRect`, refreshed by `ResizeObserver` and on scroll/resize, returning rects in container coordinates plus the grid geometry (cell width including gap, cell height, padding).
- [ ] `DesignSurface` renders the real section inside `StoryTheme` under `MotionConfig reducedMotion="always"`, full viewport, with the overlay above it.
- [ ] `TileOverlay` per tile: dashed outline, name chip, drag by pointer events converting px → cells via the measured geometry (`moveTile`), 28 px corner resize (`resizeTile`), arrow-key nudge when selected, `contextmenu` and 600 ms long-press to open the menu, double-click to write.
- [ ] Commit.

### Task 6: `PieceMenu` — content aware
**Files:** create `src/components/story-editor/design/PieceMenu.tsx`, `ColourChoice.tsx`.

- [ ] Menu opens at the pointer, flips to stay inside the viewport, closes on Escape / outside click. 56 px rows, words only.
- [ ] Sections come from `MENU_FOR[role]`: Write, Font (submenu of the sixteen, each shown in its own family), Colour (palette swatches + native picker), Bigger, Smaller, Align, Indent, Box (background, padding ±, rounded ±, No box), Button colour, Label colour, Rounded, and always "Back to the story's look".
- [ ] Every choice calls `setTileStyle` / `clearTileStyle` on the working layout.
- [ ] Commit.

### Task 7: writing in place
**Files:** create `src/components/story-editor/design/TextEditing.tsx`.

- [ ] Selected text tile becomes `contentEditable`, seeded with `richToHtml(rich ?? richFromPlain(body))` for a body tile, or its plain string otherwise.
- [ ] Floating toolbar above the selection: **B**, *I*, <u>U</u> (body only), align left / centre / right, indent less / more. Marks via `document.execCommand`; align and indent via `setParagraphAlign` / `setParagraphIndent` on the paragraph holding the caret.
- [ ] Commit through `apply`: body tiles write `rich` **and** the derived `plainFromRich` into `body`; plain tiles write their field. Escape or clicking away commits; nothing is lost on leaving the screen.
- [ ] Commit.

### Task 8: `DesignBar` and entry
**Files:** create `src/components/story-editor/design/DesignBar.tsx`; modify `ArrangeScreen.tsx`.

- [ ] A translucent bar floating over the top of the surface: back, the section's name, "Show the grid" toggle, "Put it back as it was", **Done**. The section itself stays exactly 100 svh beneath it.
- [ ] Keep the phone-order strip, shown in a collapsible line rather than below the fold.
- [ ] Commit.

### Task 9: verification
- [ ] `npx vitest run` — 267 baseline plus the new rich/tileStyle tests, all green.
- [ ] `npm run typecheck` — only the 8 pre-existing exhibitions errors.
- [ ] `npx next build` in a clean worktree — succeeds.
- [ ] Headless-Chrome smoke test through a temporary harness (deleted after): right-click a piece → menu shows the right sections; pick a font and a colour → the piece changes; bigger / align; box; select words → bold; Done → the public render matches.
- [ ] Whole-branch code review; fix what it finds.
- [ ] Update the handoff; merge and push only when Daniel says so.
