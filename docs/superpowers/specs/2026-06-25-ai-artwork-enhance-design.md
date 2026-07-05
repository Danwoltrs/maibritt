# AI Artwork Enhance — Design Spec (Phase 1)

**Date:** 2026-06-25
**Status:** Draft for review
**Scope:** Phase 1 only (deterministic core). Generative gallery-wall staging is Phase 2 (separate spec).

---

## 1. Problem & Goal

Mai-Britt photographs her paintings **before the canvas is stretched**, so source photos show a loose, slack canvas: slight tilt, soft self-shadows from the sag, raw margins, and background clutter. They look amateur online.

We want an **"Enhance"** button on the artwork upload screen that turns such a photo into a clean, **taut, light-wood-framed catalogue image** — with a single glance-and-confirm crop step — and stores it as the public display image without ever touching the artist's original file.

**This site is a record/presentation of her work, not a storefront for these images.** That relaxes the fidelity bar from "legal-grade pixel match" to "present her real paintings faithfully and well." We therefore use cheap, non-generative tooling and skip the heavy audit machinery a sales site would need — but we still **never repaint, restyle, or hallucinate the painting's surface.**

### Success criteria
- Artist uploads a phone photo → clicks Enhance → confirms the detected crop → gets a framed, taut, evenly-lit catalogue image she approves, in under ~30s.
- The painting's *painted face* is only ever geometrically resampled and globally color/brightness-adjusted — never regenerated.
- The original upload is preserved immutably; enhancement is reversible (she can revert to the plain photo).
- Cost ≈ **$0.01–0.05 per artwork**; one external API account (fal.ai).

### Non-goals (Phase 1)
- Gallery-wall lifestyle mockups (Phase 2).
- Any generative/diffusion model touching the painting.
- SSIM audit trails, lossless masters, reproducibility hashes (sales-grade concerns we don't need for a record).
- Re-processing sculptures/video — Phase 1 targets `category = 'painting'` (and other flat 2-D work); the button is simply hidden/disabled otherwise.

---

## 2. The Enhancement Pipeline

Five stages. Stages 1–4 run automatically after the artist confirms the crop in stage 1.

| # | Stage | Tool | Does it alter the painting face? |
|---|-------|------|-------------------------------|
| 1 | **Detect → crop → straighten** | fal.ai **BiRefNet** segmentation mask → OpenCV.js 4-point homography (tilt/keystone only; **no mesh ripple-dewarp**) | No — geometric resample only |
| 2 | **Flatten-to-taut** | Deterministic **flat-field de-shadow**: Lab **L-channel ÷ blurred illumination map**, a/b chroma preserved. $0, local | No — divides out low-freq shading; brushwork & hue intact |
| 3 | **Color / white-balance / exposure** | `sharp` deterministic math (`linear`/`normalise`/`modulate`/`gamma`), gains clamped | No — global recolor of existing pixels |
| 4 | **Upscale / sharpen** | fal.ai **Recraft Crisp Upscale** (non-generative) or Real-ESRGAN | No — adds resolution, no invention |
| 5 | **Frame (Output A)** | `sharp` `composite()` over the **medium-appropriate** frame preset (floater for canvas, mat+glass for paper) + bevel + shadow | No — her pixels dropped in untouched |

**Critical ordering (load-bearing):** upscale (stage 4) runs on the **bare corrected painting** and is stored as the enhanced master *before* framing. Framing only composites; nothing re-touches the painting after stage 4.

### The "stretched canvas" feel (canvas / floater only)
For canvas paintings, this is what makes it read as a finished, stretched work rather than a flat photo of slack fabric. It lives in two safe places:

1. **Taut face (stages 1–2):** the homography straighten removes tilt/keystone; then **flat-field de-shadow** divides out the soft shadow gradient the slack canvas casts. Operating only on the Lab **L** channel against a large-radius blurred illumination map (radius larger than any brushstroke), then recombining the **original a/b** channels, removes the shading while preserving every brushstroke and exact hue. Deterministic, $0, cannot hallucinate. *Heavy ripple/wrinkle removal is deliberately out of scope:* no fidelity-safe hosted tool exists and document-dewarp models bend straight edges. Pronounced-ripple photos get a manual "needs flattening" flag for review rather than auto-processing.
2. **Real depth (stage 5):** the floater composite adds, via a single **parametric `sharp` template**, two stacked soft shadows (tight contact shadow + softer ambient) and a four-strip **bevel** (light top/left, dark bottom/right) so the canvas reads as a physical object sitting ~2–3 cm proud inside the frame — not a printed poster (matching photo 2). All geometry is expressed as fractions of the long edge → scale/aspect-invariant and consistent across the grid. **`keepIccProfile()` is mandatory** (sharp strips ICC → sRGB by default, which would shift her colors); the framed master is saved as **lossless PNG**.

For **works on paper**, depth doesn't apply: they're flat under a mat, so stage 5 instead centers the art in a white mat window with a subtle mat-window bevel + paper drop-shadow (matching photo 1, rendered clean).

### Crop safety
A wrong crop on a loose canvas with a busy background is the single most likely failure. Mitigations:
- BiRefNet mask → contour → 4 corners; **Gemini 2.5 Flash box detection as a cheap fallback** if the mask is low-confidence.
- **The artist always sees the detected quad and can drag corners before confirming** (the one human gate).
- Crop slightly **inside** the detected quad to avoid background-color bleed at painted edges.
- Cap keystone correction (~3–5°) so a near-flat canvas is never aggressively reshaped.

---

## 3. Frame Presets — two families, picked by medium

Framing is deterministic compositing, so supporting multiple frames costs nothing at runtime. There are **two structurally different frame families** (grounded in the artist's real reference photos), auto-suggested by the artwork's `category` and always overridable.

### Family A — Floater (canvas paintings) — *photo 2*
Canvas **edge-to-edge** in a slim **light-wood** floater frame with a small reveal gap, composited with **bevel + contact shadow** so it reads as a stretched canvas sitting proud (the "feels stretched" look). *Photo 2's frame is light wood — it only reads gold because of the warm indoor lighting, i.e. exactly the white-balance cast stage 3 corrects.*
- **Default: `oak-floater` — light natural oak (this is photo 2's real frame).**
- Alternates: `ash-floater` (pale ash), `walnut-floater` (warmer mid wood), `black-floater` (thin black). A gold/metallic floater can be added on request but isn't part of the default light-wood set.

### Family B — Matted under glass (works on paper / engravings) — *photo 1*
Art centered in a **white mat window** (smaller than the frame) inside a light oak frame, with a subtle mat-window bevel + paper drop-shadow. Rendered **clean — no glass glare**.
- **Default: `oak-mat` — light oak + white mat.**
- Alternates: mat-width / oak-tone variants later if wanted.

### Medium → default mapping
| `category` | Default frame |
|---|---|
| `painting` | `oak-floater` (Family A) |
| `engraving` | `oak-mat` (Family B) |
| `mixed-media` | `oak-floater`, one-click switch to matted |
| `sculpture`, `video` | Enhance button hidden (not flat 2-D) |

**Implementation:** each preset = a transparent-center (floater) or mat-window (matted) **PNG** + the opening/window bounding box (measured once) + bevel / shadow / mat params, defined as static config in `src/lib/framing/presets.ts`; PNG assets stored in the Supabase `artworks` bucket under `frames/`. I generate the starter set; any preset can later be swapped for a photograph of Mai-Britt's real frame. Changing a preset re-runs **only the framing stage** (cheap, instant) — no re-detection or re-upscale.

---

## 4. Architecture

Async and non-blocking, because the pipeline is multi-second and Vercel has a 4.5 MB request cap and serverless timeouts.

```
Browser (ArtworkUploadForm)
  │  1. signed direct upload of original → Supabase Storage  (bypass 4.5MB cap)
  │  2. POST /api/enhance/detect  { imagePath }
  ▼
Next.js Route Handler (runtime: 'nodejs')
  │  → fal BiRefNet (mask) → OpenCV.js corners → returns quad to browser
  ▼
Browser shows crop overlay → artist confirms/adjusts → POST /api/enhance/run { imagePath, quad, framePreset }
  ▼
Route Handler inserts image_jobs row (status: processing), runs:
  warp → flatten → color → (fal upscale) → frame   [writes new derived paths to Storage]
  → updates image_jobs (status: done, result paths)
  ▼
Browser polls job status (or Supabase Realtime) → shows before/after → artist Approves
  → writes the enhanced+framed variant into artworks.images JSONB; sets it as the display image
```

- **One external provider for Phase 1: fal.ai** (BiRefNet detection + Recraft/ESRGAN upscale). Optional Google AI key for the Gemini fallback detector.
- Warp (OpenCV.js WASM, lazy-loaded), flatten, color, and framing are all **local** in the Node route — no per-image cost.
- Upscale is the one GPU call; it's fast enough to run within the route for Phase 1, but the `image_jobs` row makes it safe to move to a webhook later (Phase 2 needs that anyway).
- **Reuse, don't replace,** [storage.service.ts](../../../src/services/storage.service.ts): enhanced variants are new files alongside the existing original/display/thumbnail.

---

## 5. Data Model

The enhanced outputs live inside the existing `artworks.images` JSONB (each image object gains optional fields), so **no column changes to `artworks`**. One new table tracks pipeline jobs.

Each image object extends from:
```json
{ "original": "...", "display": "...", "thumbnail": "..." }
```
to optionally include:
```json
{
  "original": "...", "display": "...", "thumbnail": "...",
  "enhanced": "<bare corrected+upscaled painting>",
  "framed":   "<catalogue framed image — the public display>",
  "framePreset": "oak",
  "enhancedAt": "2026-06-25T12:00:00Z"
}
```
The public site shows `framed ?? display`. "Revert" simply clears the enhanced fields → falls back to the plain photo. Originals are never overwritten.

### SQL to paste (you apply the migration)

```sql
-- Tracks each async enhancement job for an uploaded artwork image.
CREATE TABLE IF NOT EXISTS image_jobs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artwork_id    UUID REFERENCES artworks(id) ON DELETE CASCADE,
  source_path   TEXT NOT NULL,                 -- storage path of the original upload
  status        TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','detecting','processing','done','failed')),
  stage         TEXT,                           -- last completed stage label (for progress UI)
  frame_preset  TEXT NOT NULL DEFAULT 'oak',
  quad          JSONB,                          -- confirmed 4 corner points
  result        JSONB,                          -- { enhanced, framed, ... } paths
  error         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_image_jobs_artwork ON image_jobs(artwork_id);
CREATE INDEX IF NOT EXISTS idx_image_jobs_status  ON image_jobs(status);

ALTER TABLE image_jobs ENABLE ROW LEVEL SECURITY;

-- Admin-only access (artist dashboard). Adjust to match existing admin policy pattern.
CREATE POLICY "admin manage image_jobs" ON image_jobs
  FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
```
> RLS policy is a placeholder — we'll align it with how the existing admin tables gate `authenticated` before applying.

---

## 6. UI Changes

In [ArtworkUploadForm.tsx](../../../src/components/artwork/ArtworkUploadForm.tsx):
- After a painting image is added, show an **"Enhance with AI"** button on that preview.
- Clicking opens a **crop-confirm modal**: the photo with the detected quad as draggable corners + a frame-preset picker (oak default) + "Enhance".
- A **progress strip** shows stage labels (Straighten → Flatten → Color → Sharpen → Frame).
- On completion, a **before/after** with **Approve** / **Discard**. Approve sets `framed` as the display image.
- Enhanced images carry an "Enhanced" badge; a **Revert** action restores the plain photo.

New small modules:
- `src/lib/framing/presets.ts` — preset config.
- `src/lib/enhance/` — warp, flatten, color, frame helpers (each focused, well under file-size limits).
- `src/app/api/enhance/detect/route.ts` and `src/app/api/enhance/run/route.ts`.
- `src/services/enhance.service.ts` — client-side calls + job polling.

---

## 7. Fidelity Principles (the one rule)

> AI may fix the **photography** (crop, straighten, light, color, resolution) and build the **frame** around the painting. It must **never** repaint, restyle, denoise-hallucinate, or regenerate the painting's surface.

Concretely: only non-generative tools touch the painting (geometric warp, `sharp` math, a non-generative upscaler capped at ~2×). Diffusion upscalers (Magnific, SUPIR, Clarity, Topaz generative models) are **forbidden** on the painting. The original upload is immutable; everything else is a derived, revertible variant.

---

## 8. Cost & Prerequisites

- **Per artwork:** detect ~$0.005 + color ~$0 + upscale ~$0.004 (Recraft Crisp) + frame $0 ≈ **$0.01–0.05**.
- **Monthly:** ~$5–25 at 50–100 artworks.
- **Prerequisite from you:** a **fal.ai account + API key** (`FAL_KEY`). Optional `GOOGLE_AI_API_KEY` for the fallback detector. You apply the SQL migration.

---

## 9. Error Handling

- Low-confidence detection → fall back to Gemini box, else present an un-cropped manual quad for the artist to set.
- Upscale failure → skip stage 4, proceed with the corrected (un-upscaled) painting; flag in the job.
- Any stage error → `image_jobs.status = 'failed'` with `error`; the form shows a retry; the original is untouched.
- Artist can always **Discard** and keep the plain photo.

---

## 10. Open Items (resolved during plan)
- Exact RLS policy to mirror existing admin tables.
- Whether upscale runs inline vs via a job worker for Phase 1 (leaning inline; table is ready for either). With de-shadow now local, **the only external call in Phase 1 is crop detection** — upscale is optional and can ship later.
- Tune the flat-field blur radius + bevel/shadow constants against real photos (recipe is decided; constants need eyeballing on her work).
- Frame preset PNGs — generate the light-wood floater set + the oak-mat template, and measure each opening/mat-window box.
