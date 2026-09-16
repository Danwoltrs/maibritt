# Handoff — Life Story: scrollable memoir + her editor (updated 2026-09-16)

**Resume point:** The build is COMPLETE on branch `feat/life-story` (22 commits ahead of `main`, not pushed, not merged). Next actions, in order: (1) fix the local Supabase anon key so the dev server can reach the database (every read currently fails with "Invalid API key"); (2) run the manual pass below on desktop Chrome and iPhone Safari; (3) decide how to integrate — merge to `main` locally, or push the branch and open a PR. Pushing `main` deploys to Vercel Production.

## The work (one paragraph)
A personal storytelling section of Mai-Britt's site. Visitors scroll through her life story at `/story` as a full-screen, cinematic sequence of chapters (text that fades in, full-bleed photos with soft parallax, a photo row that pins and slides sideways on desktop and turns page-by-page on phones, a fading slideshow timed to her voice, voice narration with a small player and optional "read along" transcript, video by upload or link, a persistent sound toggle and a thin progress bar). She builds it herself at `/story/edit`: 18 px minimum text, 56 px buttons with words, plain language, "+ Add" between items, a big red Record button that encodes MP3 in the browser, autosave with "Saved a moment ago", Undo, confirmation before removing anything, "Preview my story" and "Publish". Design was approved on a canvas first; the build follows the spec and plan.

- **Spec (approved):** [`../specs/2026-09-15-life-story-design.md`](../specs/2026-09-15-life-story-design.md)
- **Plan (13 tasks, executed):** [`../plans/2026-09-15-life-story.md`](../plans/2026-09-15-life-story.md)
- **Design canvas (approved):** https://claude.ai/artifact/3LKM4Zextn9zSUhbGsr39D

## Repo state right now
- **Branch:** `feat/life-story`, forked from `main` at `a684e8e`. 22 commits, tip `ed8588f`. **Not pushed.** `main` itself is 3 docs commits ahead of `origin/main` (spec, plan, first handoff), also not pushed.
- **Verification on the tip:** `npx vitest run` → 226 tests pass (baseline was 193). `npm run typecheck` → only the 8 pre-existing errors in the untracked `src/app/(admin)/exhibitions/page.tsx`; none in branch files.
- **Working tree:** pre-existing, unrelated modifications (`.gitignore`, `.mcp.json`) and untracked files (`.claude/settings.json`, older handoffs/plans, `scripts/`, `src/app/(admin)/exhibitions/page.tsx`, `src/lib/migrations/`, `supabasemaibritt.rtf`). None are this work. Leave them.
- **Migration:** `migrations/20260915_life_story.sql` is committed on the branch and was applied by Daniel on 2026-09-15.

## Environment problems found (not this branch's fault)
1. **Local Supabase anon key is invalid.** The dev server logs `[story] failed to load published story { message: 'Invalid API key' }` on every request. All local end-to-end testing of `/story`, `/story/preview` and `/story/edit` is blocked until the key in the local env file is replaced. Vercel's env is separate and may be fine.
2. **`next build` fails locally** because the untracked `src/app/(admin)/exhibitions/page.tsx` clashes with the tracked `src/app/exhibitions/page.tsx` (two pages resolving to `/exhibitions`). Not on the branch; the MP3 worker bundle was verified in a clean worktree. Vercel builds from git, so it is unaffected until that file is committed.
3. git tracks the project notes file as `claude.md` (lowercase) while the disk has `CLAUDE.md`; macOS case-insensitivity hides this. Pre-existing.

## What's done (commit table)
| SHA | What |
|---|---|
| `55acb78` | migration, document types, pure helpers + tests |
| `d8aeb0c` | timing + video-link helpers + tests |
| `23be978` `18b657f` | deps (`tus-js-client`, `@breezystack/lamejs`), `StoryService`, media helpers, middleware + header/FAB hidden on `/story*`; video upload survives poster failure |
| `1011d19` `d8b0825` | public shell: layout/theme/fonts, `SoundProvider`, chrome, opening, text block, not-ready page; page logs read errors + `cache()` |
| `fec68db` | photo block (parallax) + gallery (sideways / page-turn / stacked) |
| `bf27165` | audio player, voice block, slideshow block; `formatTime` in `timing.ts` |
| `c65ddea` `80c04f5` | video block + preview page; sound toggle moved under the preview bar |
| `9be2025` `9908513` | editor store (autosave 800 ms, undo ≤50, retry) + tests; bound to `StoryService` |
| `9131249` `4019337` | editor shell (route, overview, cards, add menu, confirm, text/opening editors); 56 px controls, dialog focus, keyboard sensor, `flushSave()`, undo reconciles selection |
| `230aea4` `79d2afd` | photo picker, style chooser, photos flow; single caption box, no overlapping uploads |
| `7e6c88d` `f7521c3` `3c2b6d3` | recorder (MediaRecorder → decode → lamejs worker → MP3), voice flow, slideshow voice control; level meter resumes its context, duration read before upload, context always closed |
| `c26e61e` | video flow (upload or link) |
| `ff8eac8` | publish route + dialog, CLAUDE.md notes |
| `ed8588f` | final whole-branch review fixes: flush never drops an edit, mute survives Begin, video posters and voice slideshows hold, recorder stops on leave, publish guards the opening |

## Locked decisions (do NOT relitigate)
1. Storage = one `story` row, `draft`/`published` jsonb; publish copies server-side via `POST /api/story/publish`.
2. Lives in this site behind the existing login; one story, one language; no sample copy.
3. Video = upload (tus, 500 MB) AND link (YouTube/Vimeo privacy embeds, rendered only after the tap).
4. Phone gallery = "one at a time" page-turn; reduced motion = plain vertical fades everywhere.
5. Recordings are MP3 encoded in the browser; fades via Web Audio `GainNode`; "Begin the story" unlocks every media element in the tap.
6. Editor rules: ≥18 px text, 56 px buttons (the red Record button is 168 px), 10 px radius on controls (dialogs 14/22 px), word labels, no jargon.
7. Decisions made during the build (all recorded, all reversible): work on a feature branch, not `main`; components never render `<main>` (root layout owns it); Tailwind 3.4 so spacing uses arbitrary px values; `formatTime` lives in `src/lib/story/timing.ts`; the sideways gallery ends with the same 96 px margin it starts with; the not-ready page also shows for an unnamed opening or zero chapters, and the publish dialog explains that before letting her publish; `flushSave()` rejects after a failed save so Preview stays on the page.

## Known small issues left in (triaged "can ship" by the final review)
- Photo upload progress bar jumps 0 → 100 (StorageService reports only on completion); video progress is real.
- Object names use `file.name.split('.').pop()` with no whitelist (a dotless filename gives an odd extension).
- `ImageRef.width/height` are the original's dimensions, not the 1920 px display render's (nothing reads them yet).
- Dialog portals fall back to Helvetica because `--font-story-sans` is on the `/story` layout div, not `<body>`.
- Auto-advancing slideshows have no pause control; they resume cycling after the recording ends.
- With sound off, tapping a video's play button does nothing visible.
- Chapter "Earlier/Later" not disabled at the ends (each press costs a no-op undo slot).
- Recorder: worker not terminated on encode error; `result.url` not revoked on cancel; 60 fps level updates.

## Manual pass — do this before merging (from the plan's Task 13)
1. Fix the local anon key, `npm run dev`, log in, open `/story/edit`. New chapter "How it all began" → Add Text (heading + two paragraphs) → Add Photo (drop a JPEG, caption) → Add Photo gallery (3 photos, "Slide sideways") → Add Slideshow (4 photos, "Fade", "Match my voice recording", record 20 s) → Add Voice recording (record, Listen back, Keep it, write a transcript) → Add Video (paste `https://vimeo.com/76979871`, then upload a short mp4). Move one item up, remove one (confirm), Undo. Reload: everything persists; bar says "Saved a moment ago".
2. Change the opening: name, title, portrait, background photo.
3. "Preview my story": opening, Begin, scroll through all seven kinds; sound toggle mutes; progress bar fills. Also: toggle sound OFF before tapping Begin, then ON again — sound must return (was a bug, fixed in `ed8588f`).
4. "Publish" → "Your story is online"; open `/story` in a private window: identical. Try publishing with the opening name empty: the dialog must refuse with guidance.
5. iPhone Safari on `/story`: tap Begin, scroll to the voice section — it plays without another tap; an uploaded video still shows its poster + play button after Begin; gallery turns page by page; toggle silences.
6. macOS Reduce Motion on: no parallax/pinning, everything fades.
7. Recorder on iPad: level bars move while recording; tap Cancel while the permission sheet is open, then allow — the mic indicator must NOT stay lit.
8. Confirm Supabase Storage sends `Access-Control-Allow-Origin: *` for the `story` bucket (the Web Audio fades depend on it; without it media is silent).

## Codebase anchors
- Public story: `src/app/story/{layout.tsx,story.css,page.tsx}`, `src/app/story/preview/page.tsx`, `src/components/story/*` (`Story.tsx` `renderBlock` switch; `SoundProvider.tsx` `useSound()`).
- Editor: `src/app/story/edit/*`, `src/components/story-editor/*` (`store.ts` — `editorStore`, `useEditorStore(selector)`, `apply/undo/flushSave/retrySave`; `EditorApp.tsx` switches on `screens.ts`).
- Data: `src/lib/story/{types,document,timing,videoLinks,media}.ts` (+ tests), `src/services/story.service.ts`, `src/app/api/story/publish/route.ts`, `migrations/20260915_life_story.sql`.
- Site wiring: `src/middleware.ts` (`/story/edit`, `/story/preview`, `/api/story` protected), `src/components/ConditionalHeader.tsx`, `src/components/admin/upload-artwork/quickUploadFab.logic.ts` (both hide on `/story*`), `src/services/storage.service.ts` (`'story'` bucket), `vitest.setup.ts` (Supabase env defaults for tests).

## Gotchas
- Media elements passed to `SoundProvider.register` must set `crossOrigin="anonymous"`.
- `SoundProvider.begin()` marks elements with `dataset.unlocking` during the unlock; `VideoBlock` ignores `onPlay` while it is set.
- The `/story` layout wraps the editor and preview too (theme + Source Sans 3). Intended.
- Pushes to `main` deploy to Vercel Production. No PR flow historically, but a PR from `feat/life-story` is fine.
- Never run SQL against the project; Daniel applies migrations. Never touch the untracked exhibitions page.
