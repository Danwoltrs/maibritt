# Handoff — Life Story: design mode (2026-09-17)

Follows [`2026-09-16-story-look-handoff.md`](2026-09-16-story-look-handoff.md), which is merged and live.

**Resume point:** MERGED into `main` and pushed on 2026-09-17 (`origin/main` = `e55115d`; pushing `main` deploys to Vercel Production). `feat/story-design-mode` deleted. 310 tests green, typecheck clean, and a clean-worktree `next build` passed on the code tip `6ff82c6` (the only later commit is this document). Next: the device pass below on an iPad (long-press, finger drag, on-screen keyboard) and in Safari, where `execCommand` writes inline styles rather than tags.

## What this branch adds
"Move things around" is no longer a scaled miniature. It renders the **real published section at full size**, measures where each piece actually landed and floats handles on those rectangles. Right-clicking (or holding) a piece opens a menu offering only what fits it: font, colour, bigger/smaller, alignment, indent, a box behind it, and on the Begin button its colour, label colour and corners — always ending in "Back to the story's look". Double-clicking a piece of text edits it where it sits, in the published typeface, with bold / italic / underline (body text) and align / indent.

- **Spec:** [`../specs/2026-09-17-story-design-mode-design.md`](../specs/2026-09-17-story-design-mode-design.md)
- **Plan:** [`../plans/2026-09-17-story-design-mode.md`](../plans/2026-09-17-story-design-mode.md)

## Repo state
- **Branch:** everything is on `main` = `origin/main` = `e55115d` (9 commits since `b7190d1`), pushed 2026-09-17; the branch is deleted.
- **Verification on the tip:** `npx vitest run` → 310 (baseline 267). `npm run typecheck` → only the 8 pre-existing exhibitions errors. `npx next build` in a clean worktree → success.
- **No SQL, no migration.** Document stays version 2; `styles` and `rich` are optional, so an untouched story renders identically.
- Working tree carries only the usual unrelated `.gitignore` / `.mcp.json` edits.

## Data model added
- `SectionLayout.styles?: Record<tileKey, TileStyle>` beside `tiles`, so every tested layout helper still works on plain `GridRect`s. `TileStyle` = `font, color, scale, align, indent, box{background,padding,radius}, button{background,label,corners}`.
- `TextBlock.rich?: RichText` — paragraphs of runs with `bold/italic/underline`, plus per-paragraph `align` and `indent`. `body` stays the plain-text mirror, rewritten on every commit, so previews and the publish guard are untouched.
- Text sizes moved out of Tailwind into `--piece-base` × `--piece-scale` (`story.css`), and per-piece colour arrives as `--piece-color`, which every piece falls back to. Verified in the browser that all 16 sizes match the old values at both widths.

## Review findings, all fixed in `6ff82c6`
Three would have met her immediately:
1. **"Put it back as it was" locked the browser** in an endless render loop (`defaultLayout` made a new object every render, which re-ran the measuring effect). Memoised, and measuring now bails out when nothing moved.
2. **Choosing a font did nothing on body text, small lines, labels or the button** — `--story-body-font` resolves where `font-family` is declared, far above the tile. The family is now declared on the tile too.
3. **Editing a heading or caption ran it through `innerHTML`**, eating `<` and `&` and executing stored markup in her signed-in session. Plain fields are set as text.

Also fixed: right-click no longer drags the piece before opening the menu (it did on Windows/Linux, where contextmenu fires on button-up); arrow keys nudge and Enter writes; Safari's inline-style bold is understood and `styleWithCSS` is turned off; the caret survives aligning a paragraph; tiles that appear or vanish as she writes get handles (MutationObserver); design mode tells her to use a bigger screen instead of breaking below 768 px; "Write here" only shows where there are words to change, and the transcript is now writable; Bigger works on a portrait and the player (transform, not font size); after a reset the surface shows what Done will actually publish, with a button to start arranging again.

Left knowingly: the floating bars still overlay the top and bottom of the section (the price of a true 100 svh surface; both are compact and translucent); a slideshow keeps advancing under the surface; scaling the Begin button past about 1.6 crowds its fixed height.

## Browser test done (headless Chrome)
Through a temporary harness, deleted afterwards: right-click opens a content-aware menu; Caveat changes the rendered font on **body text** and on the name; a swatch changes the rendered colour; Bigger takes 104 px → 119.6 px; the Begin button takes a new colour and square corners; double-click opens an editable that copies the piece's face, size and colour and hides the original; bold applies to a selection; centring round-trips and renders as `<p style="text-align:center"><strong>…`; `Mai-Britt <Wolthers> & co` survives editing verbatim; reset leaves the page responsive and restores handles; ArrowRight nudges a tile one cell. No console errors.

**Not covered:** a real iPad (long-press, finger drag, on-screen keyboard), Safari, pasting into the editable, and the publish flow.

## Device pass — to do
1. Design the opening at real size on an iPad: hold a piece to open the menu, pick a font and a colour, make it bigger, align right, drag it. Done. The published page matches what the surface showed.
2. Right-click Begin: change the button and label colours; check the Look screen's accent is untouched.
3. Put a box behind a caption over a photo; add room; round it.
4. In a Words block select two words, bold them, underline one; centre the second paragraph and indent it twice. Reload: it persists. Undo steps back.
5. In **Safari** specifically, bold something and leave the tile — the mark must survive (this is where `execCommand` writes inline styles).
6. "Back to the story's look" on a piece drops every exception on it.
7. Open a story written before this change: it must render identically until she touches it.

## Codebase anchors
- Pure: `src/lib/story/rich.ts` (+ test), `src/lib/story/tileStyle.ts` (+ test), `src/lib/story/layout.ts` (`cloneLayout` carries `styles`).
- Render: `src/components/story/Arranged.tsx` (`Tile` applies `tileCss`, tags `data-tile`), `blocks/TextBlock.tsx` (`Body` renders `rich` as React elements).
- Design mode: `src/components/story-editor/design/` — `DesignScreen` (state, commits, guards), `SectionRender` (the real section), `useTileRects` (measurement + grid geometry), `TileOverlay` (drag, resize, long-press, keyboard), `PieceMenu` (content aware), `TextEditing` (in-place writing), `DesignBar`.
- The old `story-editor/arrange/` directory is deleted; nothing imports it.

## Gotchas
- Never `git add -A` / `git add src` here — untracked files under `src/` (the `(admin)/exhibitions` page) break the Production build. Stage named paths, and build in a clean worktree before pushing.
- A CSS variable only reaches text through an element that declares `font-family` itself; declare the family directly when a piece must follow.
- `richFromElement` is the only sanitiser and runs at commit, so between a paste and the commit the editable holds arbitrary clipboard markup. A paste handler that inserts plain text is the obvious next hardening.
- The surface's pixel→cell maths assumes uniform rows; a row that grows past its minimum makes dragging slightly off (the outlines stay right because they are measured).
