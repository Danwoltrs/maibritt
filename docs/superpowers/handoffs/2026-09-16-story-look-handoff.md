# Handoff — Life Story: her words, fonts, colours, and the arrange grid (2026-09-16)

Supersedes [`2026-09-15-life-story-handoff.md`](2026-09-15-life-story-handoff.md) for what happens next; that file still holds the original build's commit table, gotchas and manual pass, all of which remain true.

**Resume point:** The feature is BUILT, REVIEWED and BROWSER-SMOKE-TESTED on branch `feat/story-look` (15 commits on top of `main` = `88754a9`), typecheck clean, 262 tests green, `next build` succeeds in a clean worktree. It is NOT merged and NOT pushed. Daniel fixed the local Supabase anon key on 2026-09-16 (the dev server now reads the story row; the stored draft is version 1 with her name and no chapters, nothing published). Next: (1) Daniel runs the device pass below (iPad finger drag, iPhone Safari), (2) merges `feat/story-look` into `main` and pushes (pushing `main` deploys to Vercel Production). For a Vercel preview to test on the iPad first, push the branch as-is: `git push -u origin feat/story-look`.

## Browser smoke test done (headless Chrome, 2026-09-16)
Run against a temporary uncommitted harness route that rendered `EditorApp` without the auth guard (saves fail unauthenticated, so nothing was written) and a synthetic arranged document through `<Story>`. Deleted afterwards. Verified:
- Look screen: all sixteen font cards compute to their real families (the portal fix works); choosing Caveat and the Night palette updates the live preview (`--paper` = `#171a1f`, h1 in Caveat); the chapter-word field commits on Enter.
- Arrange screen (opening): real content on the grid with labels and corner handles; mouse drag moves the name tile and snaps; corner handle resizes; ArrowRight nudges; the phone-order strip updates; "Put it back as it was" restores the default tiles; Done stores the layout and the overview card shows "Arranged by you".
- Public renderer with stored layouts: desktop shows 12-column grids (name centred, heading right-aligned when moved into the right third), Night palette and Caveat applied, chapter label shows only the title with numbering off, "Começar" on the button; at 390 px every arranged section stacks in reading order, no horizontal scroll; the block without a layout renders its original markup.
- No console errors other than the expected "Get current user" from the unauthenticated harness.
Not covered: finger drag on a real iPad, iPhone Safari, the publish flow, Undo after Look changes (needs an authenticated save).

## What this branch adds (one paragraph)
Mai-Britt can now choose every word the page used to hardcode ("The life story of", "Begin the story", the word "Chapter", "in her own voice", "Sound on/off", "Read along", the not-ready line), pick a heading font and a reading font from a curated menu of sixteen, set five colour roles (page, text, accent, button text, backdrop) with six ready-made palettes and a gentle readability note, and drag the pieces of the opening and of every block (except galleries) on a 12 × 8 grid with snap, resize, arrow keys and a phone-order strip. Everything goes through the existing autosave, Undo and Publish. Old documents render pixel-identically until she changes something.

- **Spec:** [`../specs/2026-09-16-story-look-and-arrange-design.md`](../specs/2026-09-16-story-look-and-arrange-design.md)
- **Plan (12 tasks, all executed):** [`../plans/2026-09-16-story-look-and-arrange.md`](../plans/2026-09-16-story-look-and-arrange.md)

## Repo state right now
- **Branch:** `feat/story-look`; tip = the last `fix(story-editor): grid-lines layer…` commit after `928c2ec` (handoff). `main` is still `88754a9` = `origin/main`. Nothing on this branch is pushed.
- **Verification on the tip:** `npx vitest run` → 262 pass (baseline 226). `npm run typecheck` → only the 8 pre-existing errors in the untracked `src/app/(admin)/exhibitions/page.tsx`. `npx next build` in a clean worktree with placeholder env → success; the only warning is the pre-existing Supabase realtime/Edge one.
- **New dependency:** `@dnd-kit/modifiers@^9` (committed in `package.json` / lock).
- **No SQL, no migration.** The document version moved to 2 inside the existing jsonb; `normalizeDocument` upgrades on read.
- **Working tree:** the same unrelated pre-existing modifications and untracked files as before (`.gitignore`, `.mcp.json`, older handoffs, `scripts/`, the exhibitions page, `src/lib/migrations/`, `supabasemaibritt.rtf`). Leave them.

## What's done (commit table)
| SHA | What |
|---|---|
| `bdd744a` `3caa598` | spec and plan |
| `4bddad3` | Story link in public header, Life Story in admin sidebar and dashboard quick actions |
| `eb67d24` | types v2 (`look`, `layout?`), font catalogue, default look, `normalizeDocument` on every read |
| `92c553c` | `words.ts` (defaults, overrides, `chapterLabel`, `voiceLabel`, `setWord`) wired into Opening, chrome, audio block, NotReady, page |
| `21fdd2a` | `look.ts`: six palettes, `mix`, `contrastRatio`, `themeVars`, `readabilityNote` |
| `1305b1c` | sixteen `next/font` loaders (`preload: false`), `StoryTheme`, `--backdrop` / `--on-backdrop` / `--accent-text` replace hardcoded colours |
| `2aaa920` | `layout.ts`: grid, tile keys, defaults, move/resize/order, setters |
| `1ecc219` | `Arranged` renderer; every block exposes tile builders and keeps its old markup when there is no layout |
| `512f204` | editor plumbing: screens, palette/grid icons, Look button, "Move things around" on cards |
| `3170fa1` | Look screen: live scaled preview, font picker dialog, colour section, word section |
| `a30b9f7` | Arrange screen and canvas (dnd-kit draggable + snap + restrict, resize handle, arrow keys, phone-order strip, Done, Put it back as it was) |
| `0d2aa6a` | review fixes (see below) |

## Review findings and what was done
Whole-branch review (subagent) found two Critical, five Important, ten Minor. Fixed in `0d2aa6a`:
- Hand-picked colours were previewed but never saved (blur compared against the already-updated local look). Now compared against the store's colours.
- The font picker dialog portals to `<body>`, outside the div carrying the `next/font` variable classes, so every sample rendered in Helvetica. `STORY_FONT_CLASSES` is now on the `DialogContent`.
- The default palette's derived tones (line, paper-2/3, accent-soft…) drifted from the hand-tuned CSS. `themeVars` now short-circuits the untouched palette to the historical values; test locks it.
- Link-video radial gradient restored (via `color-mix`), chapter label stays visible once a video starts, video caption size kept at 30 px.
- Arrange canvas now mirrors the page grid's padding (40/48 px) and 16 px column gap, scaled, so tiles land where she put them.
- Phone preview on the Look screen capped at 240 px. Tap on the canvas background deselects. Resize handle resets on pointer cancel. Selection outline is a fixed colour, not her accent. Tile builders return `null` for absent content so empty tiles don't take a slot. Normaliser validates colours (`isHex`) and font ids. Chapter-word field shows "No numbering — only your titles" when numbering is off.
Left as-is, knowingly: `useIsPhone` starts `false`, so an arranged section may flash as a grid for one frame on phones before stacking (rendering both variants would double-register media with `SoundProvider`); the audio play icon on dark backdrops is now `--backdrop` (#1e1712) instead of `--ink` (#2a2521), imperceptible at 24 px; nested `<button>` inside the dnd-kit `role="button"` tile is an a11y lint, harmless for her.

## Locked decisions (do NOT relitigate)
1. All of the original life-story decisions (see the superseded handoff).
2. Drag = grid, not free canvas: a "Move things around" button per section, a 12 × 8 grid, tiles snap to cells, tiles may overlap, galleries are not arrangeable. Phones stack tiles in reading order (row, then column). Daniel chose this over free positioning.
3. Fonts = curated sixteen, no catalogue browsing, no uploads. Colours = five global roles + six palettes, no per-block colours. Look editing happens on its own screen with a live preview, not in place on the page.
4. Blank word field = "use the original" for every key except the chapter word, where blank = numbering off. Only overrides are stored.
5. No layout stored ⇒ the block renders its original hand-tuned markup. `Done` on the Arrange screen always stores a layout (the default one if she changed nothing); "Put it back as it was" + Done removes it.
6. The editor's own chrome is never wrapped in `StoryTheme`; only the story, preview, Look preview and Arrange canvas are.

## Device pass — to do (from the spec's Testing section; desktop Chrome already covered above)
1. Look: pick Playfair for headings and Caveat for reading, the Night palette, then change Accent by hand and click away. Preview follows each tap. Back → Preview my story matches. Undo three times steps the look back. Reload keeps it.
2. Words: chapter word blank; "Begin the story" in Portuguese. Preview shows titles without numbers and her phrase. "Use the original" restores one.
3. Arrange the opening on an iPad with a finger: drag the name top-left, widen it, move the button under it, Done. Preview on the iPad matches; on an iPhone the pieces stack in the order the strip showed. "Put it back as it was" + Done restores the design and the card loses "Arranged by you".
4. Arrange a photo block's caption over the image centre: on the photo on desktop, under it on the phone.
5. Publish, then `/story` in a private window on both devices.
6. Open a story that was published before this branch (or publish nothing new): it must look exactly as before.
7. Also still pending from the previous handoff: its own manual pass (recorder on iPad, CORS on the `story` bucket, reduced motion).

## Codebase anchors
- Pure helpers: `src/lib/story/{words,look,fonts,layout,document}.ts` (+ tests). `normalizeDocument` in `document.ts`; `themeVars` / `HISTORICAL_VARS` / `isDefaultPalette` in `look.ts`; `defaultLayout` / `TILE_KEYS` / `TILE_LABEL` in `layout.ts`.
- Fonts: catalogue `src/lib/story/fonts.ts`; loaders `src/app/story/fonts.ts` (`STORY_FONT_CLASSES` applied in `src/app/story/layout.tsx` and on the font picker dialog). `story.css` reads `--story-body-font` / `--story-heading-font` with the old defaults as fallbacks.
- Rendering: `src/components/story/StoryTheme.tsx`, `Arranged.tsx`; each block file exports its tile builder (`openingTiles`, `textTiles`, `photoTiles`, `audioTiles`, `videoTiles`; the slideshow builds tiles inline because they depend on hooks).
- Editor: `src/components/story-editor/look/*` (`LookScreen`, `LookPreview`, `FontSection`, `FontPicker`, `ColourSection`, `WordSection`), `src/components/story-editor/arrange/*` (`ArrangeScreen`, `ArrangeCanvas`, `tiles.tsx`), `screens.ts` (`look`, `arrange`), `TopBar.tsx` (Look button), `BlockCard.tsx` / `StoryOverview.tsx` ("Move things around", "Arranged by you").

## Gotchas
- Any dialog that must show her fonts needs `STORY_FONT_CLASSES` on its content, because Radix portals to `<body>`.
- `themeVars` returns the historical map for the exact default palette; if you retune a default colour, update `HISTORICAL_VARS`, `story.css` and the test together.
- The Arrange canvas assumes a 1280 × 800 screen; the page grid uses `100svh`. Rows match at that height and grow with content elsewhere.
- Colour inputs commit on blur, not on change (Chrome fires `change` per tick). The preview follows `onPreview`.
- Never run SQL against the project. Never touch the untracked exhibitions page. Pushing `main` deploys to Production.
- The local anon key is valid again as of 2026-09-16; the `next build` clash with the untracked exhibitions page is still there (build in a worktree, as Task 12 of the plan does).
