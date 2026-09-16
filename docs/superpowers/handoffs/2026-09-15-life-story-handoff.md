# Handoff — Life Story: scrollable memoir + her editor (2026-09-15)

**Resume point:** EXECUTE Tasks 1–13 in [`../plans/2026-09-15-life-story.md`](../plans/2026-09-15-life-story.md) with `superpowers:subagent-driven-development` (a fresh subagent per task, review between tasks). **No app code is written yet** — only the spec and plan are committed. Before Task 1's SQL matters (the editor, Task 9 onward), ask Daniel whether he has applied `migrations/20260915_life_story.sql`; the SQL was pasted to him in chat on 2026-09-15 and he applies migrations himself.

## The work (one paragraph)
A personal storytelling section of Mai-Britt's site. Visitors scroll through her life story at `/story` as a full-screen, cinematic sequence of chapters (text that fades in, full-bleed photos with soft parallax, a photo row that pins and slides sideways, a fading slideshow timed to her voice, voice narration with a small player and optional "read along" transcript, video by upload or link, a persistent sound toggle and a thin progress bar). She builds it herself at `/story/edit` in a deliberately simple editor: 18 px minimum text, 56 px buttons with words, plain language, "+ Add" between items, a big red Record button, autosave with "Saved a moment ago", Undo, confirmation before removing anything, "Preview my story" and "Publish". Design was approved on a canvas first (link below); the build follows the spec and plan exactly.

- **Spec (approved):** [`../specs/2026-09-15-life-story-design.md`](../specs/2026-09-15-life-story-design.md)
- **Plan (13 tasks, code included):** [`../plans/2026-09-15-life-story.md`](../plans/2026-09-15-life-story.md)
- **Design canvas (approved, the visual reference):** https://claude.ai/artifact/3LKM4Zextn9zSUhbGsr39D — three pages: "The story" (7 desktop moments + 3 phone frames), "Her editor" (7 screens), "How she builds it" (10-step flow).

## Repo state right now
- **Repo:** `maibritt` — single repo, code + `docs/superpowers/` together. Branch `main`.
- **Upstream:** `origin/main`; **`main` is 2 commits ahead, NOT pushed** (`76779bf` spec, `7a6bc9c` plan, plus this handoff once committed). Pushing `main` deploys to Vercel Production — docs-only, harmless, but push deliberately. Verify with `git status -sb`.
- **Working tree:** pre-existing, unrelated modifications (`.gitignore`, `.mcp.json`) and untracked files (`.claude/settings.json`, older handoffs/plans, `scripts/`, `src/app/(admin)/exhibitions/page.tsx`, `src/lib/migrations/`, `supabasemaibritt.rtf`). None are this work. Stage story paths only.
- **Stashes:** not checked this session (`git stash list` was blocked by permissions); a pre-existing "Login redirect fixes attempt" stash may exist — leave it.

## What's done
| SHA | What |
|---|---|
| `76779bf` | `docs(story): life story design spec` — `docs/superpowers/specs/2026-09-15-life-story-design.md` |
| `7a6bc9c` | `docs(story): life story implementation plan` — `docs/superpowers/plans/2026-09-15-life-story.md` (4,421 lines, every task carries its code, tests and a browser check) |

Verification run this session: none on app code (there is none). Baseline before starting: `npx vitest run` and `npm run typecheck`; note the pre-existing tsc errors in `src/app/(admin)/exhibitions/page.tsx` and stale `.next/types` — not yours.

## Locked decisions (do NOT relitigate)
1. **Storage = one document, two copies.** A single `story` row with `draft` jsonb and `published` jsonb. Autosave writes the whole draft; publish copies draft → published on the server (`POST /api/story/publish`). Chosen over normalized tables for a single author; last-write-wins across tabs is accepted.
2. **Lives in this site**: public `/story`, editor `/story/edit`, preview `/story/preview`, all behind the existing Supabase login via `middleware.ts` + `AuthGuard`. Not a separate app.
3. **One story, one language.** Whatever she writes. No EN/PT-BR duplication, no story picker.
4. **Video = upload AND link.** Upload via resumable `tus-js-client` into bucket `story` (500 MB cap), poster frame captured in the browser; or a pasted YouTube/Vimeo link rendered with the privacy embeds. Link videos don't obey the corner sound toggle (their own controls do) — accepted.
5. **Phone gallery = "one at a time" (option C).** On phones the sideways gallery becomes a pinned section where each scroll step brings the next photo up full-bleed with its caption; previous photo dimmed behind. Reduced motion → plain vertical stack of fading photos (also the desktop reduced-motion fallback).
6. **Recordings are MP3, encoded in the browser** (`MediaRecorder` → `decodeAudioData` → `@breezystack/lamejs` in a Web Worker) so they play on every device. Fades use a Web Audio `GainNode` (iOS ignores `volume`); "Begin the story" primes every media element inside the tap.
7. **No sample copy ships.** Every string on the public page comes from the document; the editor's placeholders are examples only. All words are hers.
8. **Editor rules:** ≥18 px text, 56 px buttons, 10 px radius, every control has a word label, no "block / embed / parallax / section settings" anywhere visible. Palette and fonts are fixed in the plan's Global Constraints (paper `#F5F0E8`, ink `#2A2521`, accent `#B5623A`; Cormorant Garamond headlines via existing `--font-serif`, Source Sans 3 body via `--font-story-sans`).
9. **Migration applied by Daniel, by hand.** Never run SQL against the project; paste it.
10. **Design is approved as-is.** Don't redesign screens; the canvas is the reference.

## Files created / modified by the plan
- **New** `migrations/20260915_life_story.sql` — `story` table + RLS + seed row + `story` bucket + 4 storage policies.
- **New** `src/lib/story/{types,document,timing,videoLinks,media}.ts` (+ `.test.ts` for document, timing, videoLinks).
- **New** `src/services/story.service.ts` — draft/published read+write, photo/audio/video/poster uploads.
- **New** `src/app/story/{layout.tsx,story.css,page.tsx}`, `src/app/story/preview/page.tsx`, `src/app/story/edit/{layout,page}.tsx`, `src/app/api/story/publish/route.ts`.
- **New** `src/components/story/*` — `Story`, `SoundProvider`, `StoryChrome`, `Opening`, `AudioPlayer`, `NotReady`, `useIsPhone`, `blocks/{Text,Photo,Gallery,Slideshow,Audio,Video}Block`.
- **New** `src/components/story-editor/*` — `store.ts` (+test), `EditorApp`, `screens.ts`, `ui.tsx`, `TopBar`, `ChapterPills`, `StoryOverview`, `BlockCard`, `AddMenu`, `ConfirmRemove`, `TextEditor`, `NameChapter`, `OpeningEditor`, `PhotoPicker`, `PhotoStyleChooser`, `PhotosFlow`, `VoiceForSlideshow`, `Recorder`, `RecordFlow`, `recorder/{mp3.worker,encodeMp3,useRecorder}.ts`, `VideoFlow`, `PublishDialog`.
- **New** `src/types/lamejs.d.ts`.
- **Modify** [`src/middleware.ts:5-18`](../../../src/middleware.ts#L5-L18) `isAdminRoute` — add `/story/edit`, `/story/preview`, `/api/story`.
- **Modify** [`src/components/ConditionalHeader.tsx`](../../../src/components/ConditionalHeader.tsx) — return null on `/story*` (currently always renders `<Header />`).
- **Modify** [`src/services/storage.service.ts`](../../../src/services/storage.service.ts) — add `'story'` to the four bucket unions (`uploadImages`, `uploadSingleImage`, `deleteImages`, `listFiles`).
- **Modify** `package.json` — `tus-js-client`, `@breezystack/lamejs`. **Modify** `CLAUDE.md` (Task 13) and possibly `vitest.setup.ts` (env defaults, Task 8).

## Codebase anchors (saves re-exploring)
- [`src/middleware.ts:5-18`](../../../src/middleware.ts#L5-L18) — `isAdminRoute()` prefix list; the cookie-based `createServerClient` pattern below it is what `api/story/publish` copies.
- [`src/app/api/translate/route.ts:1-4`](../../../src/app/api/translate/route.ts#L1-L4) — existing route handler using `createServerClient` + `cookies()` (Next 15: `await cookies()`).
- [`src/lib/supabase.ts`](../../../src/lib/supabase.ts) — `supabase` (browser client, cookies) and `supabaseAdmin`; `config.supabase.url` comes from `src/lib/config.ts`.
- [`src/components/auth/AuthGuard.tsx`](../../../src/components/auth/AuthGuard.tsx) — `<AuthGuard redirectTo="/login">`, uses `useAuth()` from `src/contexts/AuthContext.tsx`.
- [`src/app/(admin)/layout.tsx`](../../../src/app/(admin)/layout.tsx) — the admin sidebar layout the editor must NOT use (editor lives at `src/app/story/edit/` with its own layout).
- [`src/services/storage.service.ts:26-35`](../../../src/services/storage.service.ts#L26-L35) — `uploadImages(files, bucket, onProgress)` returns `{ urls: { original, display, thumbnail } }`; no width/height, so `StoryService.uploadPhotos` measures with `readImageSize` first.
- [`src/app/layout.tsx:8-19`](../../../src/app/layout.tsx#L8-L19) — `Cormorant_Garamond` exposed as `--font-serif` (weights 300/400/600 + italic); `Inter` is the site body font (do not use in the story).
- [`migrations/20260227_journal_system.sql:54-75`](../../../migrations/20260227_journal_system.sql#L54-L75) — the bucket + storage-policy pattern the story migration mirrors.
- [`src/components/ui/dialog.tsx`](../../../src/components/ui/dialog.tsx), [`alert-dialog.tsx`](../../../src/components/ui/alert-dialog.tsx) — radix primitives reused by `AddMenu`, `PublishDialog`, `ConfirmRemove`.
- [`vitest.config.ts`](../../../vitest.config.ts) — jsdom, globals, `@` alias, `src/**/*.test.{ts,tsx}`.
- Installed and relied on: `framer-motion ^12`, `zustand ^5`, `react-dropzone ^14`, `@dnd-kit/sortable ^10`, Next `15.5.9`, React 19.

## Gotchas
- **Single repo, zsh:** quote paths with brackets when staging (`git add 'src/app/(admin)/...'`). Stage story paths explicitly; the tree carries unrelated pre-existing changes.
- **Migration by Daniel only.** Task 1's SQL is in the plan and was pasted in chat. If `/story/edit` shows "Could not load your story", the table probably isn't there yet — ask, don't run it.
- **`/story` layout wraps `/story/edit` and `/story/preview` too** (`src/app/story/layout.tsx` sets the theme class + Source Sans 3). That's intended; don't add the site header back.
- **`ConditionalHeader`** currently always renders the header; the story routes need it hidden (Task 3).
- **Media elements that go through `SoundProvider.register` must set `crossOrigin="anonymous"`** or the Web Audio graph is silent. Supabase public storage serves CORS `*`.
- **Task 9 references `PickOnePhoto` from Task 10** (`OpeningEditor`) and stubs for `PublishDialog` (Task 13) and `VoiceForSlideshow` (Task 11). Run 9 and 10 back to back, or use the stubs noted in the plan.
- **`@breezystack/lamejs` types:** the plan adds `src/types/lamejs.d.ts`; worker is loaded with `new Worker(new URL('./mp3.worker.ts', import.meta.url))` (Next/webpack supports this).
- **`tus-js-client` endpoint** is `${SUPABASE_URL}/storage/v1/upload/resumable` with the user's access token; chunk size must be 6 MiB.
- **Pre-existing tsc errors** in `src/app/(admin)/exhibitions/page.tsx` and stale `.next/types/**` are not yours.
- **Pushes to `main` deploy to Vercel Production.** No PR flow. Don't push mid-task without saying so.
- **Supabase host NXDOMAIN** was seen on 2026-07-05 (memory `frame-mockup-phase1-state`); if fetches fail, check DNS before debugging code.
- **File-size ceiling ~2000 lines** (Daniel's rule) — the plan keeps every file under ~400.

## Next / suggested next-up
1. Tasks 1–3 (helpers, service, route protection) — pure code + tests, no UI, unblocks everything.
2. Tasks 4–7 (public story) — check each in the browser with the SQL snippet in Task 4 step 7.
3. Tasks 8–13 (editor + publish) — needs the migration applied to test end to end.
4. After the build: the Task 13 manual pass on iPhone Safari (audio unlock/fade, page-turn gallery) is the real acceptance test.
5. Later, not now: orphaned-media cleanup, translation, trimming recordings (all out of scope per spec).

## Things the user said that should shape future work
- "Approved, and the text, all her own choice of words." — ship no sample copy; the sample paragraphs on the canvas are for size only.
- Video: "include option to add videos as well" → answered as **Both** (upload + link).
- Story location: this site at `/story`; one language; one story of chapters.
- Phone gallery: chose **option C** ("one at a time" page-turn) over stacked or swipe.
- Daniel applies migrations himself and wants the SQL pasted.
- Always ask before big jobs (CLAUDE.md); the design and build were both approved explicitly. Don't relitigate.
- Execution preference: **handoff to a fresh session that runs the plan with subagents** (this document).

## Manual smoke test (after build)
1. Log in, open `/story/edit`: New chapter "How it all began" → Add Text (heading + two paragraphs) → Add Photo (drop a JPEG, caption) → Add Photo gallery (3 photos, keep "Slide sideways") → Add Slideshow (4 photos, "Fade", "Match my voice recording", record 20 s) → Add Voice recording (record, Listen back, Keep it, write a transcript) → Add Video (paste `https://vimeo.com/76979871`, then also upload a short mp4). Move one item up, remove one (confirm), Undo. Reload: everything persists; bar says "Saved a moment ago".
2. Change the opening: name, title, portrait, background photo.
3. "Preview my story": opening, Begin, scroll through all seven kinds; sound toggle mutes; progress bar fills.
4. "Publish" → "Your story is online"; open `/story` in a private window: identical.
5. iPhone Safari on `/story`: tap Begin, scroll to the voice section — it plays without another tap; gallery turns page by page; toggle silences.
6. macOS Reduce Motion on: no parallax/pinning, everything fades.
