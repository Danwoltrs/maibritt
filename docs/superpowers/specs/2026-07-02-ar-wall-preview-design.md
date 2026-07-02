# AR Wall Preview + Enhanced|Original Toggle — Design Spec

**Date:** 2026-07-02
**Status:** Approved (design review done in session; pending user spec review)
**Scope:** Project A of two. Project B (social "post how it looks on your wall" feed) is deferred to its own spec; §8 records what this design deliberately sets up for it.

---

## 1. Problem & Goal

Visitors can see Mai-Britt's paintings in the lightbox and detail page, but:

1. There is no way in the **lightbox** to compare the AI-enhanced catalogue image with the original photo (the detail page has a toggle; the lightbox does not).
2. There is no way to judge **how a painting would look and fit on your own wall**. Dimensions are a free-text string ("185×285"), so nothing can be sized for real.

**Goal:** In the artwork lightbox and detail page:
- a minimal `[ Enhanced | Original ]` text toggle,
- a **"View on your wall"** AR button that hangs the framed, enhanced painting on the visitor's real wall at true physical scale — wall-anchored, snap-in-place, pinch-scaling locked — on iPhone/iPad (AR Quick Look) and Android (WebXR / Scene Viewer), with a QR hand-off for desktop visitors.

### Success criteria
- Toggle appears in the lightbox only when an enhanced variant exists; switching crossfades between enhanced and original.
- On a phone, tapping "View on your wall" reaches an AR view of the artwork at true size (±real-world tracking accuracy), anchored to a vertical surface, in under ~5s on second view (cached model).
- On desktop, the same button shows a QR code that opens the artwork's AR flow on a phone.
- The artist enters height/width as two numeric cm fields; existing artworks are backfilled from their dimension strings.
- No regression to existing URLs (slugs derive from the untouched `dimensions` text).

### Non-goals
- Social posting / per-artwork visitor feed (Project B).
- AR for `sculpture` / `video` categories.
- In-page AR capture that the site receives (platform-impossible on iOS; see §8).
- Editing/moving multiple artworks in one AR session.

---

## 2. Decisions locked during design

| Decision | Choice |
|---|---|
| Dimension convention | Existing strings are **height × width, in cm** ("185×285" = 185 tall, 285 wide) |
| Where 3D models are built | **Server-side, on demand, cached** in Supabase Storage (Scene Viewer requires a public HTTPS URL; QR handoff needs stable links) |
| Desktop behavior | AR button opens a **QR popover** linking to the artwork page with `?ar=1` |
| What AR shows | The **enhanced painting in a 3D floater frame** built from geometry (not the flat `framed` composite, whose baked-in wall background would look wrong in AR) |
| Build order | Project A (this spec) first; Project B brainstormed after AR ships |

---

## 3. Data model

### 3.1 New columns (SQL to paste — you apply)

```sql
-- Numeric dimensions for AR true-scale rendering. The dimensions TEXT column
-- stays authoritative for display and slug generation.
ALTER TABLE artworks
  ADD COLUMN IF NOT EXISTS height_cm NUMERIC(6,1),
  ADD COLUMN IF NOT EXISTS width_cm  NUMERIC(6,1);

COMMENT ON COLUMN artworks.height_cm IS 'Physical height in cm (H x W convention). Drives AR true scale.';
COMMENT ON COLUMN artworks.width_cm  IS 'Physical width in cm (H x W convention). Drives AR true scale.';
```

### 3.2 Backfill (SQL to paste — you apply)

First number → height, second → width. Decimal commas normalized. Rows that don't parse to exactly two plausible numbers stay NULL (no guessing).

```sql
WITH parsed AS (
  SELECT id,
         (regexp_match(replace(dimensions, ',', '.'),
            '(\d+(?:\.\d+)?)\s*[x×X]\s*(\d+(?:\.\d+)?)'))[1]::numeric AS h,
         (regexp_match(replace(dimensions, ',', '.'),
            '(\d+(?:\.\d+)?)\s*[x×X]\s*(\d+(?:\.\d+)?)'))[2]::numeric AS w
  FROM artworks
)
UPDATE artworks a
SET height_cm = p.h,
    width_cm  = p.w
FROM parsed p
WHERE a.id = p.id
  AND p.h BETWEEN 1 AND 999
  AND p.w BETWEEN 1 AND 999
  AND a.height_cm IS NULL
  AND a.width_cm  IS NULL;

-- Review leftovers (fix manually in the admin edit form):
SELECT id, title_en, dimensions
FROM artworks
WHERE height_cm IS NULL OR width_cm IS NULL
ORDER BY year DESC;
```

### 3.3 Admin form changes

In `UploadArtworkDialog`, `PerImageDetailsStep`, and `EditArtworkModal`:
- Replace the single dimensions text input with **Height (cm)** and **Width (cm)** numeric inputs.
- The display string auto-composes as `"{H} × {W} cm"` into the existing `dimensions` field; the text stays editable afterwards for special cases (diptychs, "variable dimensions").
- The known-dimensions dropdown keeps working; picking an entry fills the numeric fields when it parses.
- Service layer (`artwork.service.ts` types + transforms): add `heightCm` / `widthCm` (camelCase ↔ `height_cm`/`width_cm`).

No change to slug generation — it keeps reading the text field.

---

## 4. Lightbox toggle — [ Enhanced | Original ]

In [ArtworkOverlay.tsx](../../../src/components/timeline/ArtworkOverlay.tsx) (194 lines today):

- Bottom bar gains a minimal text switch: `Enhanced | Original` — plain text, active side emphasized, matching the bar's existing typography. Bilingual: `Aprimorada | Original` in PT.
- Rendered **only when** `images[0].enhanced` or `images[0].framed` exists.
- "Enhanced" shows `framed ?? enhanced ?? display`; "Original" shows `original`. Crossfade with the overlay's existing Framer Motion setup.
- Default state: Enhanced.
- The detail page's existing three-way toggle (Original / Cropped / Enhanced) is untouched except label wording alignment.

---

## 5. AR "View on your wall"

### 5.1 Placement & gating

- Button appears in the lightbox bottom bar and on the artwork detail page.
- Shown only when `height_cm` AND `width_cm` are set and category is flat 2-D (`painting`, `engraving`, `mixed-media`).
- Device routing:
  - **iOS Safari** (iPhone/iPad): `<a rel="ar">` link with a child `<img>`, pointing at the served `.usdz` — opens AR Quick Look directly.
  - **Android**: `<model-viewer>` (lazy-loaded) with `src={glbUrl}`, `ar-modes="webxr scene-viewer quick-look"`, `ar-placement="wall"`, `ar-scale="fixed"`. WebXR is primary (wall placement under model-viewer's control); Scene Viewer is fallback (its `enable_vertical_placement` is documented-flaky).
  - **Desktop**: QR popover ("Scan to see it on your wall / Escaneie para vê-la na sua parede") encoding `https://maibrittwolthers.com/artwork/{slug}?ar=1`. The artwork page, when opened with `?ar=1` on a capable device, auto-opens the AR flow once the model URLs are ready.
- Pre-launch hint (one line, both languages): *"Point your camera at a picture, door or shelf on your wall"* — blank walls give AR too few feature points to detect a vertical plane (Artsy's documented lesson).

### 5.2 The 3D model

A shallow **floater-framed canvas** built from 5 boxes, authored **in meters at true size** (both formats require real-world meters; USDZ `metersPerUnit = 1`):

- Canvas box: `width_cm/100 × height_cm/100 × 0.04` m; front face textured with the painting; sides painted a neutral canvas-edge tone.
- Four frame strips in the artwork's `framePreset` wood tone — a static per-preset hex constant added to `src/lib/framing/presets.ts` (e.g. oak ≈ `#C6A678`; defaults to oak when unset) — matching the floater proportions used by the site's 2-D framing (`frameWidthFrac` ≈ 0.022 of long edge, small reveal gap), total depth ~0.055 m.
- Texture: `images[0].enhanced ?? display`, prepared with `sharp` (already a dependency): decode → sRGB → JPEG quality 85 → max edge 2048 px.

### 5.3 File generation (server, on demand, cached)

New route `POST /api/ar/[artworkId]` (`runtime: 'nodejs'`), public (artworks are public), no user-supplied URLs (image paths come from the DB row — no SSRF surface):

1. Load artwork; verify it qualifies (dimensions + category). 404/422 otherwise.
2. Compute `hash = sha256(imagePath, height_cm, width_cm, framePreset, MODEL_VERSION)` (first 16 hex chars).
3. If `ar/{artworkId}-{hash}.glb` and `.usdz` exist in the `artworks` bucket → return their public URLs immediately.
4. Otherwise generate both, upload, return URLs. Old-hash files are left behind (harmless, tiny) — re-enhancing or editing dimensions changes the hash and yields fresh files.

Response is **JSON with URLs only** — never the model bytes (Vercel 4.5 MB response cap).

**GLB** — authored with `@gltf-transform/core` (pure JS, `NodeIO`, no polyfills): hand-built box positions/normals/UVs (~24 vertices per box), painting JPEG embedded verbatim via `texture.setImage()` + `setMimeType('image/jpeg')`, wood material via `setBaseColorFactor`. glTF units are meters by spec, giving Scene Viewer/WebXR true scale.

**USDZ** — hand-authored (no maintained npm package exists; three.js's exporter is browser-only):
- `model.usda` text file **first in the archive**: `metersPerUnit = 1`, `upAxis = "Y"`, root-level anchored prim (Apple requires anchorable prims at document root) carrying Apple's documented anchoring schema:
  ```usda
  def Xform "Artwork" (prepend apiSchemas = ["Preliminary_AnchoringAPI"])
  {
      uniform token preliminary:anchoring:type = "plane"
      uniform token preliminary:planeAnchoring:alignment = "vertical"
      ...mesh + UsdPreviewSurface material + UsdUVTexture → painting JPEG...
  }
  ```
- Packed with `fflate` `zipSync(files, { level: 0 })` (USDZ spec: zero compression) using the 64-byte data-alignment technique three.js uses (padding via zip local-header extra field id `12345`; alignment applies to each file's *data* offset — standard zip tools cannot produce this).
- Uploaded with `contentType: 'model/vnd.usdz+zip'` and a real `.usdz` extension (Safari requires the MIME type; served-URL + extension avoids historical blob-URL Quick Look bugs).

**Quick Look URL fragments** on the iOS link: `#allowsContentScaling=0` (lock true scale; double-tap reset stays available) `&canonicalWebPageURL={artwork page URL}` (Quick Look's share button shares the artwork page, not the raw USDZ).

### 5.4 Client pieces

- `ArWallButton.tsx` — device detection (iOS vs Android vs desktop), calls the API, renders the right launcher; QR modal via the `qrcode` package (client-side, renders to data URL). Bilingual labels: *"View on your wall / Veja na sua parede"*.
- `<model-viewer>` loaded only on demand (dynamic import on Android tap) — it never loads for iOS/desktop visitors.
- Loading state on the button while generation runs (first tap on a new artwork: a few seconds; cached: instant).

New modules: `src/lib/ar/geometry.ts` (box/UV builder), `src/lib/ar/glb.ts`, `src/lib/ar/usdz.ts`, `src/lib/ar/texture.ts`, `src/app/api/ar/[artworkId]/route.ts`, `src/components/artwork/ArWallButton.tsx`.
New deps: `@gltf-transform/core`, `fflate`, `qrcode` (+ `@types/qrcode`). All pure JS; no native binaries; no bundle pressure.

---

## 6. Error handling

- Missing/invalid dimensions or non-flat category → AR button simply not rendered (public site never shows a dead button). Admin edit form shows the empty numeric fields as the natural nudge.
- Generation failure (image fetch, sharp, upload) → 500 with error code; button shows a bilingual toast ("Couldn't prepare the AR view — try again") and reverts to idle. Nothing else on the page is affected.
- Backfill leftovers: the review `SELECT` in §3.2 lists them; the artist fixes via the edit form.
- WebXR unavailable on an Android device → model-viewer falls through to Scene Viewer automatically (its built-in behavior).
- QR flow on a desktop-only visitor's phone-less session: the QR modal is informational; closing it is the only action needed.

## 7. Testing

Vitest (harness already in the repo):
- `usdz.test.ts` — parse the generated archive's zip local headers: assert store-only entries, `model.usda` first, every file's data offset ≡ 0 (mod 64); assert the usda contains both anchoring tokens, `metersPerUnit = 1`, and vertex positions matching `height_cm/width_cm` in meters.
- `glb.test.ts` — round-trip through `@gltf-transform/core` `NodeIO.readBinary`: mesh extents match physical size in meters; texture bytes present with `image/jpeg` MIME.
- `geometry.test.ts` — box/UV construction: aspect ratio, frame strip proportions, depth constants.
- Dimension parsing — unit tests for the string→numbers helper used by admin forms against her real formats: `"185×285"`, `"100 x 80 cm"`, `"80,5 x 100 cm"`, junk.
- API route — 404 unknown artwork, 422 missing dimensions/wrong category, cache-hit path returns without regenerating.

Manual device gate before calling it shipped: iPhone (Quick Look wall anchor, true scale, locked scaling, shutter works) and one ARCore Android (WebXR wall placement; Scene Viewer fallback launches).

## 8. Groundwork for Project B (social feed) — recorded, not built

Research established: neither Quick Look nor Scene Viewer can hand the captured photo back to the page (system overlays, no API). Quick Look *does* have a built-in shutter saving to the camera roll. So Project B's flow will be: capture in AR → "post how it looks on your wall" upload button on the artwork page → moderated per-artwork feed (site has no public auth today; anonymous submission + artist approval is the likely shape). Nothing in Project A blocks or presupposes this beyond `canonicalWebPageURL` pointing shares at the artwork page.

## 9. Verified sources (research pass, 2026-07-02)

- Apple `Preliminary_AnchoringAPI` schema & vertical alignment: developer.apple.com/documentation/usd (anchoring-type, planeanchoring-alignment, placing-a-prim-in-the-real-world); WWDC19 612, WWDC23 10274 (metersPerUnit).
- model-viewer `ar-placement` behavior per mode & Scene Viewer public-URL requirement: google/model-viewer source `features/ar.ts`, discussions #1863/#2230, issues #2303/#2054/#4159; developers.google.com/ar/develop/scene-viewer.
- USDZ package rules (store-only zip, 64-byte data alignment, usd-first): openusd.org/release/spec_usdz.html; three.js `USDZExporter.js` (fflate + extra-field padding technique).
- Server-side authoring: gltf-transform.dev (`NodeIO`, `Texture.setImage`); Vercel function limits (4.5 MB response cap).
- UX prior art: Artsy engineering blog (blank-wall detection), Saatchi/8th Wall case study, ArtPlacer QR handoff, Quick Look `#allowsContentScaling` / `#canonicalWebPageURL` (WebKit blog 8421).
