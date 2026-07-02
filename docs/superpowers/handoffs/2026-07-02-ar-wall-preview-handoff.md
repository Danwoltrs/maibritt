# Handoff — AR Wall Preview: spec + plan done, EXECUTE next (2026-07-02)

_Separate job from [2026-06-29-ai-enhance-crop-and-original-handoff.md](2026-06-29-ai-enhance-crop-and-original-handoff.md) (enhance crop Fix A + cropped-original toggle — still open, unrelated; don't mix the two)._

**Resume point:** EXECUTE [../plans/2026-07-02-ar-wall-preview.md](../plans/2026-07-02-ar-wall-preview.md) task-by-task — **no app code written yet**. Plan header mandates superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Start at Task 1 (dimension parser). **Task 2 Step 2 PAUSES: paste the migration SQL for Daniel and wait for his confirmation before continuing** — he always applies migrations himself.

## The work (one paragraph)
Three visitor-facing features on the artwork viewers: (1) a minimal `[ Enhanced | Original ]` text toggle in the lightbox ([ArtworkOverlay.tsx](../../../src/components/timeline/ArtworkOverlay.tsx)) — the detail page already has a richer toggle; (2) split dimensions into `height_cm`/`width_cm` numeric columns (the existing free-text `dimensions` stays for display + slugs) with backfill + admin Height/Width inputs; (3) a **"View on your wall" AR button** — a server-generated, cached 3D floater-framed canvas at true physical scale, launched via AR Quick Look on iOS (hand-authored USDZ with vertical wall anchoring), model-viewer WebXR→Scene Viewer on Android, and a QR hand-off modal on desktop. Spec: [../specs/2026-07-02-ar-wall-preview-design.md](../specs/2026-07-02-ar-wall-preview-design.md). A social "post how it looks on your wall" feed is **Project B — deferred**, gets its own brainstorm after AR ships.

## Repo state right now
- **Repo:** `maibritt` — single repo (NOT the Wolthers two-repo split; `wolthers-repo-facts.md` does not apply). App code + `docs/superpowers/` share this git repo.
- **Branch:** `main`, working tree clean (tracked files). HEAD = `7dc5cb4`.
- **UNPUSHED:** `b6c807b` (spec) and `7dc5cb4` (plan) are **local-only** — verify with `git log --oneline @{u}..`. Docs-only, safe to push, but remember `main` auto-deploys to Vercel Production (SSH remote `git@github.com:Danwoltrs/maibritt.git`).
- **Untracked (pre-existing, not this work):** older `docs/superpowers/handoffs/*` + the 2026-06-25 enhance spec/plan, `.claude/settings.json`, `scripts/update-exhibitions-schema.sql`, `src/app/(admin)/exhibitions/page.tsx`, `src/lib/migrations/`, `supabasemaibritt.rtf`.
- **Stash:** `stash@{0}: On main: Login redirect fixes attempt` — unrelated, leave it.

## What's done
| SHA | What |
|---|---|
| `b6c807b` | `docs:` design spec — `docs/superpowers/specs/2026-07-02-ar-wall-preview-design.md` |
| `7dc5cb4` | `docs:` implementation plan (14 TDD tasks, complete code) — `docs/superpowers/plans/2026-07-02-ar-wall-preview.md` |

**No app code, no migration applied, no deps installed.** Verification so far = the design research pass only (spec §9 has the cited sources).

## Locked decisions (do NOT relitigate)
1. **Dimensions are HEIGHT × WIDTH, in cm** — Daniel confirmed ("185×285" = 185 tall). Backfill maps first number → `height_cm`. Never swap.
2. **3D models are generated server-side, on demand, cached in Supabase Storage** (`artworks` bucket, `ar/{artworkId}-{hash}.glb|.usdz`). Scene Viewer requires a public HTTPS URL (blob: does NOT work on Android — verified in model-viewer source/discussions), and the QR hand-off needs stable links.
3. **We author our own USDZ** (`.usda` text + store-only 64-byte-aligned zip via fflate) with Apple's `Preliminary_AnchoringAPI` tokens (`anchoring:type = "plane"`, `planeAnchoring:alignment = "vertical"`). Reason: model-viewer's auto-generated iOS USDZ **silently drops wall anchoring** — verified in `model-viewer/src/features/ar.ts`.
4. **AR texture = `images[0].enhanced ?? display`, NEVER `framed`** — the framed composite has a wall-colored margin baked in, wrong on a real wall. The frame is 3D geometry (wood tone = new `woodHex` per preset).
5. **True scale locked:** geometry in meters, `metersPerUnit = 1`, `#allowsContentScaling=0` on the Quick Look link; `#canonicalWebPageURL` points shares at the artwork page.
6. **Desktop = QR hand-off** to `/artwork/{slug}?ar=1` (auto-preps model, pulses the button). Chosen over hiding or disabling the button.
7. **The `dimensions` TEXT column stays authoritative for display + slug generation** — slugs parse it ([artwork.service.ts:128](../../../src/services/artwork.service.ts)); changing it would break URLs.
8. **Project A before Project B.** Social feed (visitor wall photos, moderation, anonymous posting — site has NO public auth) is a separate spec later. AR sessions cannot hand the captured photo back to the page on either platform (verified) → B will be "screenshot in AR, then upload".
9. **Lightbox toggle** renders only when an enhanced/framed variant exists; default **Enhanced** (`framed ?? enhanced`); "Original" = raw photo; crossfade.
10. Daniel approved the spec verbatim ("this is it") and chose **subagent-driven-or-inline is open, but execution was consciously deferred** ("Not now") — don't treat the delay as doubt about the design.

## Files created / modified by the plan (blast radius)
- **New** `src/lib/dimensions.ts` — parse/compose "185 x 285 cm" ↔ numbers (Task 1).
- **New** `migrations/20260702_add_artwork_numeric_dimensions.sql` — columns + backfill; **Daniel applies** (Task 2).
- **New** `src/lib/ar/{constants,geometry,glb,usdz,texture,eligibility,device}.ts` + tests (Tasks 5–9, 11). `constants.ts` is the client-safe module — **`eligibility.ts` uses `node:crypto` and must never be imported by client components**.
- **New** `src/app/api/ar/[artworkId]/route.ts` — public POST, generate + cache, returns JSON URLs only (Task 10).
- **New** `src/components/artwork/ArWallButton.tsx`, `src/types/model-viewer.d.ts` (Task 11).
- **Modify** `src/types/index.ts` (~L20), `src/services/artwork.service.ts` (L17/33/416/483/910), `src/services/storage.service.ts` (add `uploadArModel` after L228), `src/lib/framing/presets.ts` (+`woodHex`), the three admin forms, `src/components/timeline/ArtworkOverlay.tsx`, `src/app/artwork/[slug]/{page,ArtworkDetailClient}.tsx`, `next.config.js` (~L42 tracing), `package.json`.
- **New deps (pure JS):** `@gltf-transform/core@^4`, `fflate@^0.8`, `qrcode@^1.5` (+`@types/qrcode`), `@google/model-viewer@^4`.

## Codebase anchors (saves re-exploring)
- [ArtworkOverlay.tsx:49](../../../src/components/timeline/ArtworkOverlay.tsx) — `mainImage = display || original` (the line the toggle replaces); bottom bar metadata row starts ~L128; hooks must stay above the `if (!artwork) return null` at L45.
- [ArtworkDetailClient.tsx:258](../../../src/app/artwork/[slug]/ArtworkDetailClient.tsx) — `flex gap-3 mt-auto` buttons row (AR button goes first); existing 2-way image toggle at L148-167 stays.
- [artwork.service.ts:897](../../../src/services/artwork.service.ts) — `transformArtworkFromDB`; insert at ~L409; update object at ~L483.
- [storage.service.ts:215](../../../src/services/storage.service.ts) — `uploadDerived` (the pattern `uploadArModel` mirrors: `supabaseAdmin ?? supabase`, artworks bucket write policy is authenticated-only).
- [presets.ts](../../../src/lib/framing/presets.ts) — `FRAME_PRESETS` / `frameWidthFrac` (0.022) / `defaultPresetForCategory`.
- Admin dimensions UIs: [PerImageDetailsStep.tsx:452-493](../../../src/components/admin/upload-artwork/PerImageDetailsStep.tsx) (handlers L186-203, `current` fallback L95), [EditArtworkModal.tsx:460-516](../../../src/components/admin/EditArtworkModal.tsx) (state L69, load L157, save L233), [UploadArtworkDialog.tsx:227-268](../../../src/components/admin/upload-artwork/UploadArtworkDialog.tsx) (details init + `buildPayload`).
- [next.config.js:42](../../../next.config.js) — `outputFileTracingIncludes` (enhance already bundles `@img`; AR route needs the same).

## Gotchas
- **Daniel applies ALL migrations by pasting SQL** — the plan pauses at Task 2 Step 2 for this. Ask, wait, confirm the leftover-rows SELECT count.
- **`node:crypto` in the client bundle**: `ArWallButton` must import `AR_CATEGORIES` from `src/lib/ar/constants.ts`, not `eligibility.ts`. This was caught in plan self-review — keep it that way.
- **Vitest + `@/lib/supabase`**: importing any service in a test crashes on missing env; `vi.mock('@/lib/supabase', ...)` BEFORE the dynamic import (Task 2 Step 5 shows the pattern).
- **USDZ alignment test is the oracle** (parses real zip local headers). If `packUsdz` fails it, port three.js `USDZExporter.js` extra-field-12345 padding exactly — never loosen the test.
- **USD st flips V** relative to glTF UVs (`st = (u, 1 - v)`, already in the plan code). If the painting renders upside-down on device, this is the knob.
- **Final gate is real hardware** (Task 14 checklist): iPhone Quick Look wall-anchor + true scale, ARCore Android WebXR. Simulators can't do AR. Deploy a preview and test.
- `main` auto-deploys to Vercel Production; no PR flow — but device testing needs a deployed URL anyway, so push when the suite is green.
- Pre-existing `tsc` errors live in `exhibitions/page.tsx` + stale `.next/types` (~10) — don't chase them; only fail on touched files.
- The plan doc itself is 2,207 lines (7 over Daniel's 2,200 soft ceiling) — he was informed and accepted; don't "fix" it.
- `AR_MODEL_VERSION` in `constants.ts` bumps to invalidate all cached AR models after geometry/material changes.

## Next / suggested next-up
1. **Execute Tasks 1–14** of the plan (this handoff's whole point). Tasks 1 and 4–9 are pure TDD library work, safely parallel-friendly; 2 needs Daniel (SQL); 12–13 touch the visitor UI; 14 is the device pass.
2. After it ships live: offer a **changelog entry** (changelog skill) announcing the AR feature.
3. Then: **brainstorm Project B** — per-artwork social feed of visitor wall photos (anonymous upload + artist moderation; capture-in-AR → re-upload flow; no public auth exists today).

## Things the user said that should shape future work
- "art on the wall is for the AR generated" — the on-the-wall presentation belongs to the AR view (drove decision 4: 3D frame, not the flat framed photo).
- Spec approved verbatim: "this is it". Execution deferred with "Not now" — resume without re-opening design questions.
- Standing preferences: always paste SQL for him; he applies migrations; files under ~2000 lines (inform + refactor beyond ~2200).
