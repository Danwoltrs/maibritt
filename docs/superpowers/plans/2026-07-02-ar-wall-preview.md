# AR Wall Preview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let visitors toggle `[ Enhanced | Original ]` in the artwork lightbox and hang the framed, enhanced painting on their real wall at true scale via AR (iOS Quick Look / Android WebXR–Scene Viewer), with a QR hand-off on desktop.

**Architecture:** Two numeric columns (`height_cm`, `width_cm`) join the existing free-text `dimensions`. A public API route builds, on first request per artwork, a 3D floater-framed canvas — GLB authored with `@gltf-transform/core`, USDZ hand-authored (`.usda` text + store-only 64-byte-aligned zip via `fflate`) with Apple's vertical-plane anchoring tokens — and caches both in Supabase Storage. A client `ArWallButton` routes per device: iOS `<a rel="ar">`, Android `<model-viewer>`, desktop QR code.

**Tech Stack:** Next.js 15 App Router (React 19, TS), sharp, Supabase Storage/Postgres, `@gltf-transform/core`, `fflate`, `qrcode`, `@google/model-viewer`, Vitest.

**Spec:** `docs/superpowers/specs/2026-07-02-ar-wall-preview-design.md`

## Global Constraints

- **Dimensions convention: HEIGHT × WIDTH, in cm.** "185×285" = 185 cm tall, 285 cm wide. Never swap.
- **All 3D geometry is authored in METERS at true size** (`heightCm / 100`). USDZ header hardcodes `metersPerUnit = 1`, `upAxis = "Y"`; glTF is meters by spec.
- **USDZ packaging rules:** store-only zip (`level: 0`), `model.usda` first entry, every file's DATA offset ≡ 0 (mod 64). Served with `contentType: 'model/vnd.usdz+zip'` and a real `.usdz` extension. GLB served as `model/gltf-binary`.
- **API returns JSON URLs only, never model bytes** (Vercel 4.5 MB response cap).
- **AR route:** `export const runtime = 'nodejs'`, `export const maxDuration = 60`; add `/api/ar/**` to `outputFileTracingIncludes` (sharp binaries).
- The existing `dimensions` TEXT column is never dropped or repurposed — display and slug generation keep reading it.
- **Bilingual UI copy** (EN / PT-BR) matching existing patterns, e.g. `View on your wall / Veja na sua parede`.
- Files stay under ~2000 lines (project rule).
- **The user applies all SQL migrations by pasting them** — plan tasks only create the `.sql` file and pause for confirmation.
- New deps are pure JS: `@gltf-transform/core`, `fflate`, `qrcode` (+`@types/qrcode`), `@google/model-viewer`. No native binaries besides the already-present sharp.

---

## File Structure

**Create:**
- `migrations/20260702_add_artwork_numeric_dimensions.sql` — columns + backfill (user applies)
- `src/lib/dimensions.ts` + `src/lib/dimensions.test.ts` — parse/compose "185 x 285 cm" ↔ numbers
- `src/lib/ar/geometry.ts` + test — framed-canvas mesh builder (meters, quad-based)
- `src/lib/ar/glb.ts` + test — GLB author (gltf-transform)
- `src/lib/ar/usdz.ts` + test — `.usda` author + aligned-zip packer
- `src/lib/ar/texture.ts` + test — sharp texture prep (≤2048 px sRGB JPEG)
- `src/lib/ar/constants.ts` — client-safe AR constants (categories, model version)
- `src/lib/ar/eligibility.ts` + test — qualification + cache-hash helpers (server)
- `src/lib/ar/device.ts` + test — iOS/Android/desktop detection
- `src/app/api/ar/[artworkId]/route.ts` — generate-and-cache endpoint
- `src/components/artwork/ArWallButton.tsx` — AR launcher + QR modal
- `src/types/model-viewer.d.ts` — JSX typing for `<model-viewer>`

**Modify:**
- `src/lib/database.sql` — reference schema gains the two columns
- `src/types/index.ts` — `Artwork.heightCm` / `widthCm`
- `src/services/artwork.service.ts` — create/update/transform plumbing
- `src/services/storage.service.ts` — `uploadArModel()`
- `src/lib/framing/presets.ts` (+ its test) — `woodHex` per preset
- `src/components/admin/upload-artwork/types.ts` — `ArtworkDetails.heightCm/widthCm`
- `src/components/admin/upload-artwork/UploadArtworkDialog.tsx` — init + payload
- `src/components/admin/upload-artwork/PerImageDetailsStep.tsx` — numeric inputs
- `src/components/admin/EditArtworkModal.tsx` — numeric inputs + save
- `src/components/timeline/ArtworkOverlay.tsx` — toggle + AR button
- `src/app/artwork/[slug]/ArtworkDetailClient.tsx` + `page.tsx` — AR button + `?ar=1`
- `next.config.js` — file tracing for `/api/ar/**`
- `package.json` — deps

---

## Task 1: Dimension parse/compose helper

**Files:**
- Create: `src/lib/dimensions.ts`
- Test: `src/lib/dimensions.test.ts`

**Interfaces:**
- Produces: `parseDimensionsToCm(text: string): { heightCm: number; widthCm: number } | null` — first number = height. Returns null unless exactly a plausible H×W pair is found (each 1–999).
- Produces: `composeDimensions(heightCm?: number, widthCm?: number): string` — `"185 x 285 cm"`; decimals use a comma (`"80,5 x 100 cm"`); empty string when either is missing/invalid.

- [ ] **Step 1: Write the failing test `src/lib/dimensions.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { parseDimensionsToCm, composeDimensions } from './dimensions'

describe('parseDimensionsToCm', () => {
  it('parses compact form', () => {
    expect(parseDimensionsToCm('185×285')).toEqual({ heightCm: 185, widthCm: 285 })
  })
  it('parses spaced form with unit', () => {
    expect(parseDimensionsToCm('100 x 80 cm')).toEqual({ heightCm: 100, widthCm: 80 })
  })
  it('parses decimal comma', () => {
    expect(parseDimensionsToCm('80,5 X 100 cm')).toEqual({ heightCm: 80.5, widthCm: 100 })
  })
  it('rejects strings without an HxW pair', () => {
    expect(parseDimensionsToCm('variable dimensions')).toBeNull()
    expect(parseDimensionsToCm('')).toBeNull()
  })
  it('rejects implausible sizes', () => {
    expect(parseDimensionsToCm('1850 x 2850')).toBeNull()
  })
})

describe('composeDimensions', () => {
  it('composes integers', () => {
    expect(composeDimensions(185, 285)).toBe('185 x 285 cm')
  })
  it('uses decimal comma and trims trailing zeros', () => {
    expect(composeDimensions(80.5, 100)).toBe('80,5 x 100 cm')
  })
  it('returns empty string when a side is missing', () => {
    expect(composeDimensions(undefined, 100)).toBe('')
    expect(composeDimensions(NaN, 100)).toBe('')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/dimensions.test.ts`
Expected: FAIL — cannot find module `./dimensions`.

- [ ] **Step 3: Implement `src/lib/dimensions.ts`**

```ts
/** Artist convention (confirmed): first number is HEIGHT, second is WIDTH, in cm. */
export function parseDimensionsToCm(
  text: string,
): { heightCm: number; widthCm: number } | null {
  if (!text) return null
  const m = text.replace(/,/g, '.').match(/(\d+(?:\.\d+)?)\s*[x×X]\s*(\d+(?:\.\d+)?)/)
  if (!m) return null
  const heightCm = parseFloat(m[1])
  const widthCm = parseFloat(m[2])
  const plausible = (v: number) => v >= 1 && v <= 999
  if (!plausible(heightCm) || !plausible(widthCm)) return null
  return { heightCm, widthCm }
}

function fmt(v: number): string {
  // Trim trailing zeros, Brazilian decimal comma: 80.5 -> "80,5", 185 -> "185"
  return String(Math.round(v * 10) / 10).replace('.', ',')
}

export function composeDimensions(heightCm?: number, widthCm?: number): string {
  if (
    heightCm == null || widthCm == null ||
    !Number.isFinite(heightCm) || !Number.isFinite(widthCm) ||
    heightCm <= 0 || widthCm <= 0
  ) return ''
  return `${fmt(heightCm)} x ${fmt(widthCm)} cm`
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/dimensions.test.ts`
Expected: PASS (8 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/dimensions.ts src/lib/dimensions.test.ts
git commit -m "feat: parse and compose artwork dimensions (H x W cm convention)"
```

---

## Task 2: Migration + Artwork type + service plumbing

**Files:**
- Create: `migrations/20260702_add_artwork_numeric_dimensions.sql`
- Modify: `src/lib/database.sql` (artworks table block, around line 41)
- Modify: `src/types/index.ts:20` (Artwork interface)
- Modify: `src/services/artwork.service.ts` (interfaces at lines 17-33, insert ~line 409, update ~line 483, transform ~line 897)
- Test: `src/services/artwork.transform.test.ts`

**Interfaces:**
- Produces: `Artwork.heightCm?: number`, `Artwork.widthCm?: number` (camelCase, from `height_cm`/`width_cm`).
- Produces: `ArtworkCreateData.heightCm?: number; widthCm?: number` and same on `ArtworkUpdateData` — later tasks (admin forms) pass these.

- [ ] **Step 1: Create `migrations/20260702_add_artwork_numeric_dimensions.sql`**

```sql
-- Numeric dimensions for AR true-scale rendering.
-- Convention (confirmed with the artist): first number in the existing
-- dimensions text is HEIGHT, second is WIDTH, both in cm.
-- The dimensions TEXT column stays authoritative for display and slugs.

ALTER TABLE artworks
  ADD COLUMN IF NOT EXISTS height_cm NUMERIC(6,1),
  ADD COLUMN IF NOT EXISTS width_cm  NUMERIC(6,1);

COMMENT ON COLUMN artworks.height_cm IS 'Physical height in cm (H x W convention). Drives AR true scale.';
COMMENT ON COLUMN artworks.width_cm  IS 'Physical width in cm (H x W convention). Drives AR true scale.';

-- Backfill from the free-text dimensions column. Rows that do not parse to
-- exactly two plausible numbers stay NULL (fixed manually in the admin form).
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

-- Review leftovers (fix via admin edit form):
SELECT id, title_en, dimensions
FROM artworks
WHERE height_cm IS NULL OR width_cm IS NULL
ORDER BY year DESC;
```

- [ ] **Step 2: PAUSE — user applies the migration.** Paste the SQL above for the user and wait for confirmation that it ran (including how many rows the final SELECT returned). Do not continue until confirmed.

- [ ] **Step 3: Mirror the columns in `src/lib/database.sql`**

Find the `dimensions` line in the `artworks` CREATE TABLE block (~line 41) and add directly below it:

```sql
  height_cm NUMERIC(6,1),
  width_cm NUMERIC(6,1),
```

- [ ] **Step 4: Extend the `Artwork` type in `src/types/index.ts`**

Directly after `dimensions: string` (line 20), add:

```ts
  heightCm?: number   // physical height in cm (H x W convention)
  widthCm?: number    // physical width in cm
```

- [ ] **Step 5: Write the failing transform test `src/services/artwork.transform.test.ts`**

The service module imports `@/lib/supabase`, which builds a client from env vars that don't exist under Vitest — mock it before importing.

```ts
import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/supabase', () => ({ supabase: {}, supabaseAdmin: null }))

const { ArtworkService } = await import('./artwork.service')

const row = {
  id: 'a1', slug: 's', title_pt: 't', title_en: 't', year: 2026,
  medium_pt: 'm', medium_en: 'm', dimensions: '185 x 285 cm',
  category: 'painting', images: [], for_sale: false,
  created_at: '2026-01-01', updated_at: '2026-01-01',
}

describe('transformArtworkFromDB numeric dimensions', () => {
  it('maps height_cm/width_cm to numbers (PostgREST may send strings)', () => {
    const t = (ArtworkService as any).transformArtworkFromDB({ ...row, height_cm: '185.0', width_cm: 285 })
    expect(t.heightCm).toBe(185)
    expect(t.widthCm).toBe(285)
  })
  it('leaves them undefined when NULL', () => {
    const t = (ArtworkService as any).transformArtworkFromDB({ ...row, height_cm: null, width_cm: null })
    expect(t.heightCm).toBeUndefined()
    expect(t.widthCm).toBeUndefined()
  })
})
```

- [ ] **Step 6: Run test to verify it fails**

Run: `npx vitest run src/services/artwork.transform.test.ts`
Expected: FAIL — `heightCm` is `undefined` in the first test (mapping not implemented).

- [ ] **Step 7: Implement service plumbing in `src/services/artwork.service.ts`**

(a) `ArtworkCreateData` (line 17 block) — after `dimensions?: string`, add:

```ts
  heightCm?: number
  widthCm?: number
```

(b) `ArtworkUpdateData` (line 33 block) — after `dimensions?: string`, add the same two lines.

(c) In `createArtwork`'s `.insert({...})` (~line 416), after `dimensions: dims,` add:

```ts
          height_cm: artworkData.heightCm ?? null,
          width_cm: artworkData.widthCm ?? null,
```

(d) In `updateArtwork` (~line 483), after the `updateData.dimensions` line add:

```ts
      if (updateData.heightCm !== undefined) updateObject.height_cm = updateData.heightCm
      if (updateData.widthCm !== undefined) updateObject.width_cm = updateData.widthCm
```

(e) In `transformArtworkFromDB` (~line 910), after `dimensions: data.dimensions,` add:

```ts
      heightCm: data.height_cm != null ? Number(data.height_cm) : undefined,
      widthCm: data.width_cm != null ? Number(data.width_cm) : undefined,
```

- [ ] **Step 8: Run test to verify it passes**

Run: `npx vitest run src/services/artwork.transform.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 9: Typecheck and commit**

Run: `npm run typecheck` — expected: exit 0.

```bash
git add migrations/20260702_add_artwork_numeric_dimensions.sql src/lib/database.sql src/types/index.ts src/services/artwork.service.ts src/services/artwork.transform.test.ts
git commit -m "feat: add height_cm/width_cm to artworks with backfill and service plumbing"
```

---

## Task 3: Admin forms — Height/Width numeric inputs

**Files:**
- Modify: `src/components/admin/upload-artwork/types.ts:6-17`
- Modify: `src/components/admin/upload-artwork/UploadArtworkDialog.tsx` (details init ~line 227, `buildPayload` ~line 248)
- Modify: `src/components/admin/upload-artwork/PerImageDetailsStep.tsx` (handlers ~line 186, dimensions block lines 452-493)
- Modify: `src/components/admin/EditArtworkModal.tsx` (state ~line 69, load ~line 157, save `handleSave` ~line 233, dimensions block lines 460-516)

**Interfaces:**
- Consumes: `parseDimensionsToCm` / `composeDimensions` (Task 1); `ArtworkCreateData.heightCm/widthCm`, `ArtworkUpdateData.heightCm/widthCm` (Task 2).
- Produces: `ArtworkDetails.heightCm: string; widthCm: string` (form state is strings; payloads convert to numbers).

Form behavior (same in all three forms): two numeric text inputs *Height (cm)* / *Width (cm)*; typing recomposes the `dimensions` display string via `composeDimensions`; picking a known-dimensions dropdown entry fills the numerics via `parseDimensionsToCm` (and always sets the text). Number conversion helper: `const toNum = (s: string) => { const v = parseFloat(s.replace(',', '.')); return Number.isFinite(v) && v > 0 ? v : undefined }`.

- [ ] **Step 1: Extend `ArtworkDetails` in `src/components/admin/upload-artwork/types.ts`**

After `dimensions: string` (line 11), add:

```ts
  heightCm: string   // form input value, e.g. "185" or "80,5"
  widthCm: string
```

- [ ] **Step 2: Update `UploadArtworkDialog.tsx`**

(a) In `handleContinue`'s details init (~line 230), change the initializer object to:

```ts
      details[i] = {
        titlePt: '', titleEn: '', mediumPt: '', mediumEn: '',
        dimensions: '', heightCm: '', widthCm: '',
        descriptionPt: '', descriptionEn: '', featured: false,
      }
```

(b) At the top of the file add the import:

```ts
import { composeDimensions } from '@/lib/dimensions'
```

(c) In `buildPayload` (~line 253), add a converter above the `return` and two payload fields after `dimensions: d.dimensions,`:

```ts
      const toNum = (s: string) => {
        const v = parseFloat((s || '').replace(',', '.'))
        return Number.isFinite(v) && v > 0 ? v : undefined
      }
      const heightCm = toNum(d.heightCm)
      const widthCm = toNum(d.widthCm)
      return {
        title: { ptBR: d.titlePt, en: d.titleEn },
        year,
        medium: { ptBR: d.mediumPt, en: d.mediumEn },
        dimensions: d.dimensions || composeDimensions(heightCm, widthCm),
        heightCm,
        widthCm,
        // ...rest of the existing fields unchanged
```

(d) There is a second inline default-details object in `PerImageDetailsStep.tsx` line 95-98 (the `current` fallback) — it is updated in Step 3.

- [ ] **Step 3: Update `PerImageDetailsStep.tsx`**

(a) Add imports:

```ts
import { parseDimensionsToCm, composeDimensions } from '@/lib/dimensions'
```

(b) Update the `current` fallback (lines 95-98) to include the new fields:

```ts
  const current = artworkDetails[currentIndex] || {
    titlePt: '', titleEn: '', mediumPt: '', mediumEn: '',
    dimensions: '', heightCm: '', widthCm: '',
    descriptionPt: '', descriptionEn: '', featured: false,
  }
```

(c) Replace `handleSelectDimension` (lines 186-192) so picking a known string also fills the numerics:

```ts
  const handleSelectDimension = (value: string) => {
    if (value === '__new__') {
      setShowNewDimension(true)
      return
    }
    const parsed = parseDimensionsToCm(value)
    onUpdateDetails(currentIndex, {
      dimensions: value,
      heightCm: parsed ? String(parsed.heightCm).replace('.', ',') : '',
      widthCm: parsed ? String(parsed.widthCm).replace('.', ',') : '',
    })
  }
```

(d) In `handleAddNewDimension` (lines 194-203), replace the `onUpdateDetails` call with the same parsed shape:

```ts
    const parsed = parseDimensionsToCm(dim)
    onUpdateDetails(currentIndex, {
      dimensions: dim,
      heightCm: parsed ? String(parsed.heightCm).replace('.', ',') : '',
      widthCm: parsed ? String(parsed.widthCm).replace('.', ',') : '',
    })
```

(e) Add a numeric-change handler next to the others (~line 204):

```ts
  const handleDimensionNumbers = (field: 'heightCm' | 'widthCm', raw: string) => {
    const next = { ...current, [field]: raw }
    const toNum = (s: string) => {
      const v = parseFloat((s || '').replace(',', '.'))
      return Number.isFinite(v) && v > 0 ? v : undefined
    }
    onUpdateDetails(currentIndex, {
      [field]: raw,
      dimensions: composeDimensions(toNum(next.heightCm), toNum(next.widthCm)) || current.dimensions,
    })
  }
```

(f) Inside the `{/* Dimensions - Dropdown */}` block (lines 452-493), insert the two inputs directly under the `<Label>Dimensions</Label>` line, before the dropdown row:

```tsx
              <div className="flex gap-2">
                <div className="flex-1 space-y-1">
                  <Label className="text-xs">Height (cm) / Altura</Label>
                  <Input
                    inputMode="decimal"
                    value={current.heightCm}
                    onChange={(e) => handleDimensionNumbers('heightCm', e.target.value)}
                    placeholder="185"
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <Label className="text-xs">Width (cm) / Largura</Label>
                  <Input
                    inputMode="decimal"
                    value={current.widthCm}
                    onChange={(e) => handleDimensionNumbers('widthCm', e.target.value)}
                    placeholder="285"
                  />
                </div>
              </div>
```

Keep the dropdown and "Current:" hint as they are (the dropdown now backfills the numerics via (c)).

- [ ] **Step 4: Update `EditArtworkModal.tsx`**

(a) Add imports:

```ts
import { parseDimensionsToCm, composeDimensions } from '@/lib/dimensions'
```

(b) Add state next to `dimensions` (line 69):

```ts
  const [heightCmVal, setHeightCmVal] = useState('')
  const [widthCmVal, setWidthCmVal] = useState('')
```

(c) In `loadData` after `setDimensions(data.dimensions)` (line 157), add:

```ts
        setHeightCmVal(data.heightCm != null ? String(data.heightCm).replace('.', ',') : '')
        setWidthCmVal(data.widthCm != null ? String(data.widthCm).replace('.', ',') : '')
```

(d) Add a shared converter near the top of the component body:

```ts
  const toNum = (s: string) => {
    const v = parseFloat((s || '').replace(',', '.'))
    return Number.isFinite(v) && v > 0 ? v : undefined
  }
```

(e) In the Dimensions block (lines 460-516): insert Height/Width inputs directly under `<Label>Dimensions</Label>`, mirroring Step 3(f) but writing local state and recomposing the text:

```tsx
              <div className="flex gap-2">
                <div className="flex-1 space-y-1">
                  <Label className="text-xs">Height (cm) / Altura</Label>
                  <Input
                    inputMode="decimal"
                    value={heightCmVal}
                    onChange={(e) => {
                      setHeightCmVal(e.target.value)
                      const composed = composeDimensions(toNum(e.target.value), toNum(widthCmVal))
                      if (composed) setDimensions(composed)
                    }}
                    placeholder="185"
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <Label className="text-xs">Width (cm) / Largura</Label>
                  <Input
                    inputMode="decimal"
                    value={widthCmVal}
                    onChange={(e) => {
                      setWidthCmVal(e.target.value)
                      const composed = composeDimensions(toNum(heightCmVal), toNum(e.target.value))
                      if (composed) setDimensions(composed)
                    }}
                    placeholder="285"
                  />
                </div>
              </div>
```

Also update the dropdown's `onValueChange` (line 466-469) so a picked string backfills the numerics:

```tsx
                  onValueChange={(v) => {
                    if (v === '__new__') { setShowNewDimension(true); return }
                    setDimensions(v)
                    const parsed = parseDimensionsToCm(v)
                    setHeightCmVal(parsed ? String(parsed.heightCm).replace('.', ',') : '')
                    setWidthCmVal(parsed ? String(parsed.widthCm).replace('.', ',') : '')
                  }}
```

(f) In `handleSave` (~line 233): find the object literal passed to `ArtworkService.updateArtwork` (it already contains `dimensions`) and add these two properties beside it:

```ts
        heightCm: toNum(heightCmVal),
        widthCm: toNum(widthCmVal),
```

Note: `ArtworkUpdateData.heightCm` is `number | undefined` and the service only writes when `!== undefined`, so clearing both inputs leaves the DB values untouched (acceptable; correcting a value is done by typing a new one).

- [ ] **Step 5: Typecheck + build**

Run: `npm run typecheck && npm run build`
Expected: both exit 0. (If `build` flags the unrelated pre-existing warnings, only fail on errors in the touched files.)

- [ ] **Step 6: Commit**

```bash
git add src/components/admin/upload-artwork/types.ts src/components/admin/upload-artwork/UploadArtworkDialog.tsx src/components/admin/upload-artwork/PerImageDetailsStep.tsx src/components/admin/EditArtworkModal.tsx
git commit -m "feat(admin): height/width cm inputs composing the dimensions string"
```

---

## Task 4: Wood color per frame preset

**Files:**
- Modify: `src/lib/framing/presets.ts`
- Modify: `src/lib/framing/presets.test.ts`

**Interfaces:**
- Produces: `FramePreset.woodHex: string` — sRGB hex for the AR frame material, e.g. `'#C6A678'`.

- [ ] **Step 1: Add the failing assertion to `src/lib/framing/presets.test.ts`**

Append inside the existing `describe('frame presets', ...)`:

```ts
  it('every preset carries a wood hex color for AR', () => {
    for (const p of Object.values(FRAME_PRESETS)) {
      expect(p.woodHex).toMatch(/^#[0-9A-Fa-f]{6}$/)
    }
  })
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/framing/presets.test.ts`
Expected: FAIL — `woodHex` undefined.

- [ ] **Step 3: Add `woodHex` to the interface and presets in `src/lib/framing/presets.ts`**

Add to `FramePreset`:

```ts
  woodHex: string          // sRGB frame color for the AR 3D model
```

And per preset: `'oak-floater'` → `woodHex: '#C6A678'`, `'ash-floater'` → `'#D8CDBA'`, `'walnut-floater'` → `'#7A5A3E'`, `'black-floater'` → `'#222222'`, `'oak-mat'` → `'#C6A678'`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/framing/presets.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/framing/presets.ts src/lib/framing/presets.test.ts
git commit -m "feat: wood hex color per frame preset for AR materials"
```

---

## Task 5: AR geometry builder

**Files:**
- Create: `src/lib/ar/geometry.ts`
- Test: `src/lib/ar/geometry.test.ts`

**Interfaces:**
- Produces:
  - `interface ArMeshData { positions: number[]; normals: number[]; uvs: number[] | null; quadCount: number }` — 4 unique vertices per quad, emitted quad-by-quad so `faceVertexIndices` are sequential; UVs in glTF convention (v=0 at image top).
  - `interface ArModel { painting: ArMeshData; canvas: ArMeshData; frame: ArMeshData; outerWidthM: number; outerHeightM: number; depthM: number }`
  - `buildArtworkModel(widthCm: number, heightCm: number, frameWidthFrac?: number): ArModel`
  - `hexToLinearRgb(hex: string): [number, number, number]`
  - Constants: `CANVAS_DEPTH_M = 0.04`, `FRAME_DEPTH_M = 0.055`, `GAP_FRAC = 0.010`.
- Geometry frame of reference: origin at the center of the wall face; X right, Y up (both in the wall plane), Z out of the wall (`z ∈ [0, FRAME_DEPTH_M]`). This is what the vertical-plane anchor expects: back flush with the wall.

- [ ] **Step 1: Write the failing test `src/lib/ar/geometry.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import {
  buildArtworkModel, hexToLinearRgb,
  CANVAS_DEPTH_M, FRAME_DEPTH_M, GAP_FRAC,
} from './geometry'

function bounds(positions: number[]) {
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity]
  for (let i = 0; i < positions.length; i += 3) {
    for (let a = 0; a < 3; a++) {
      min[a] = Math.min(min[a], positions[i + a])
      max[a] = Math.max(max[a], positions[i + a])
    }
  }
  return { min, max }
}

describe('buildArtworkModel', () => {
  // 185 cm tall x 285 cm wide painting
  const m = buildArtworkModel(285, 185)
  const longEdge = 2.85

  it('sizes the painting face to true meters', () => {
    const { min, max } = bounds(m.painting.positions)
    expect(max[0] - min[0]).toBeCloseTo(2.85, 3)  // width along X
    expect(max[1] - min[1]).toBeCloseTo(1.85, 3)  // height along Y
    expect(m.painting.quadCount).toBe(1)
    expect(m.painting.uvs).toHaveLength(8)
  })

  it('painting face sits at the canvas front, recessed inside the frame', () => {
    const { min, max } = bounds(m.painting.positions)
    expect(min[2]).toBeCloseTo(CANVAS_DEPTH_M, 4)
    expect(max[2]).toBeCloseTo(CANVAS_DEPTH_M, 4)
    expect(CANVAS_DEPTH_M).toBeLessThan(FRAME_DEPTH_M)
  })

  it('outer frame adds gap + frame width on every side', () => {
    const fw = 0.022 * longEdge, gap = GAP_FRAC * longEdge
    expect(m.outerWidthM).toBeCloseTo(2.85 + 2 * (gap + fw), 3)
    expect(m.outerHeightM).toBeCloseTo(1.85 + 2 * (gap + fw), 3)
    const { min, max } = bounds(m.frame.positions)
    expect(max[0] - min[0]).toBeCloseTo(m.outerWidthM, 3)
    expect(min[2]).toBeCloseTo(0, 4)          // back flush with the wall
    expect(max[2]).toBeCloseTo(FRAME_DEPTH_M, 4)
  })

  it('mesh data is consistent quad soup', () => {
    for (const mesh of [m.painting, m.canvas, m.frame]) {
      expect(mesh.positions.length).toBe(mesh.quadCount * 4 * 3)
      expect(mesh.normals.length).toBe(mesh.positions.length)
      // normals are unit length
      for (let i = 0; i < mesh.normals.length; i += 3) {
        const len = Math.hypot(mesh.normals[i], mesh.normals[i + 1], mesh.normals[i + 2])
        expect(len).toBeCloseTo(1, 5)
      }
    }
    expect(m.canvas.quadCount).toBe(5)   // box minus front face
    expect(m.frame.quadCount).toBe(24)   // 4 strips x 6 faces
  })
})

describe('hexToLinearRgb', () => {
  it('converts black/white exactly and midtones monotonically', () => {
    expect(hexToLinearRgb('#000000')).toEqual([0, 0, 0])
    expect(hexToLinearRgb('#FFFFFF').every(v => Math.abs(v - 1) < 1e-6)).toBe(true)
    const [r] = hexToLinearRgb('#C6A678')
    expect(r).toBeGreaterThan(0.3)
    expect(r).toBeLessThan(0.7)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/ar/geometry.test.ts`
Expected: FAIL — cannot find module `./geometry`.

- [ ] **Step 3: Implement `src/lib/ar/geometry.ts`**

```ts
/** Framed-canvas AR geometry. Meters, Y-up, back of the frame at z=0 (flush
 *  with the wall), +z out of the wall. Origin centered on the wall face. */

export const CANVAS_DEPTH_M = 0.04   // stretched-canvas depth
export const FRAME_DEPTH_M = 0.055   // floater frame depth (canvas sits recessed)
export const GAP_FRAC = 0.010        // floater reveal gap, fraction of long edge

export interface ArMeshData {
  positions: number[]      // xyz, 4 unique verts per quad, quad-by-quad
  normals: number[]
  uvs: number[] | null     // glTF convention: v=0 at image top
  quadCount: number
}

export interface ArModel {
  painting: ArMeshData
  canvas: ArMeshData
  frame: ArMeshData
  outerWidthM: number
  outerHeightM: number
  depthM: number
}

function emptyMesh(): ArMeshData {
  return { positions: [], normals: [], uvs: null, quadCount: 0 }
}

/** Push one quad (4 verts, CCW as seen from the normal side). */
function pushQuad(
  mesh: ArMeshData,
  verts: [number, number, number][],
  normal: [number, number, number],
  uvs?: [number, number][],
) {
  for (let i = 0; i < 4; i++) {
    mesh.positions.push(...verts[i])
    mesh.normals.push(...normal)
    if (uvs) {
      if (!mesh.uvs) mesh.uvs = []
      mesh.uvs.push(...uvs[i])
    }
  }
  mesh.quadCount++
}

/** Axis-aligned box as 6 quads with outward normals. skipFront omits the +z face. */
function pushBox(
  mesh: ArMeshData,
  x0: number, x1: number, y0: number, y1: number, z0: number, z1: number,
  opts: { skipFront?: boolean } = {},
) {
  if (!opts.skipFront) {
    pushQuad(mesh, [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], [0, 0, 1])
  }
  pushQuad(mesh, [[x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0]], [0, 0, -1]) // back
  pushQuad(mesh, [[x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0]], [0, 1, 0])  // top
  pushQuad(mesh, [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]], [0, -1, 0]) // bottom
  pushQuad(mesh, [[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]], [-1, 0, 0]) // left
  pushQuad(mesh, [[x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1]], [1, 0, 0])  // right
}

export function buildArtworkModel(
  widthCm: number,
  heightCm: number,
  frameWidthFrac = 0.022,
): ArModel {
  const w = widthCm / 100
  const h = heightCm / 100
  const long = Math.max(w, h)
  const gap = GAP_FRAC * long
  const fw = frameWidthFrac * long

  const painting = emptyMesh()
  const canvas = emptyMesh()
  const frame = emptyMesh()

  // Painting face: single textured quad at the canvas front.
  const zf = CANVAS_DEPTH_M
  pushQuad(
    painting,
    [[-w / 2, -h / 2, zf], [w / 2, -h / 2, zf], [w / 2, h / 2, zf], [-w / 2, h / 2, zf]],
    [0, 0, 1],
    [[0, 1], [1, 1], [1, 0], [0, 0]], // glTF UVs: v=0 is the image top
  )

  // Canvas body: box without its front face (the painting quad replaces it).
  pushBox(canvas, -w / 2, w / 2, -h / 2, h / 2, 0, CANVAS_DEPTH_M, { skipFront: true })

  // Floater frame: left/right run full outer height; top/bottom butt between them.
  const ix = w / 2 + gap          // inner frame edge (x)
  const iy = h / 2 + gap          // inner frame edge (y)
  const ox = ix + fw              // outer edge (x)
  const oy = iy + fw              // outer edge (y)
  pushBox(frame, -ox, -ix, -oy, oy, 0, FRAME_DEPTH_M)  // left
  pushBox(frame, ix, ox, -oy, oy, 0, FRAME_DEPTH_M)    // right
  pushBox(frame, -ix, ix, iy, oy, 0, FRAME_DEPTH_M)    // top
  pushBox(frame, -ix, ix, -oy, -iy, 0, FRAME_DEPTH_M)  // bottom

  return {
    painting, canvas, frame,
    outerWidthM: 2 * ox,
    outerHeightM: 2 * oy,
    depthM: FRAME_DEPTH_M,
  }
}

/** sRGB hex -> linear RGB triplet (glTF baseColorFactor / USD diffuseColor are linear). */
export function hexToLinearRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', ''), 16)
  const s = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(v => v / 255)
  const lin = s.map(c => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)))
  return [lin[0], lin[1], lin[2]]
}

/** Raw-canvas edge color (sides of the stretched canvas). */
export const CANVAS_EDGE_HEX = '#EFEAE2'
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/ar/geometry.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/ar/geometry.ts src/lib/ar/geometry.test.ts
git commit -m "feat: true-scale framed-canvas AR geometry builder"
```

---

## Task 6: GLB builder

**Files:**
- Create: `src/lib/ar/glb.ts`
- Test: `src/lib/ar/glb.test.ts`
- Modify: `package.json` (deps)

**Interfaces:**
- Consumes: `buildArtworkModel`, `hexToLinearRgb`, `CANVAS_EDGE_HEX`, `ArMeshData` (Task 5).
- Produces: `buildGlb(opts: ArBuildOptions): Promise<Uint8Array>` where

```ts
export interface ArBuildOptions {
  widthCm: number
  heightCm: number
  textureJpeg: Uint8Array   // prepared sRGB JPEG of the painting
  woodHex: string
  frameWidthFrac?: number
}
```

- [ ] **Step 1: Install dependencies**

```bash
npm install @gltf-transform/core@^4 fflate@^0.8
```

(`fflate` is used in Task 7 — installing both here keeps one lockfile change.)

- [ ] **Step 2: Write the failing test `src/lib/ar/glb.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { NodeIO } from '@gltf-transform/core'
import { buildGlb } from './glb'

// 1x1 red JPEG (smallest valid), base64
const TINY_JPEG = Uint8Array.from(Buffer.from(
  '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0a' +
  'HBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAA' +
  'AAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AVN//2Q==', 'base64'))

describe('buildGlb', () => {
  it('produces a valid GLB with true-scale extents and an embedded JPEG', async () => {
    const glb = await buildGlb({
      widthCm: 285, heightCm: 185, textureJpeg: TINY_JPEG, woodHex: '#C6A678',
    })
    expect(glb.length).toBeGreaterThan(500)

    const doc = await new NodeIO().readBinary(glb)
    const root = doc.getRoot()
    expect(root.listTextures()).toHaveLength(1)
    expect(root.listTextures()[0].getMimeType()).toBe('image/jpeg')
    expect(root.listMaterials().length).toBe(3)

    // Union of POSITION accessor bounds must match the outer frame in meters.
    let min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity]
    for (const mesh of root.listMeshes()) {
      for (const prim of mesh.listPrimitives()) {
        const acc = prim.getAttribute('POSITION')!
        const pmin = acc.getMin([0, 0, 0]), pmax = acc.getMax([0, 0, 0])
        min = min.map((v, i) => Math.min(v, pmin[i]))
        max = max.map((v, i) => Math.max(v, pmax[i]))
      }
    }
    const long = 2.85, extra = 2 * (0.010 * long + 0.022 * long)
    expect(max[0] - min[0]).toBeCloseTo(2.85 + extra, 2)
    expect(max[1] - min[1]).toBeCloseTo(1.85 + extra, 2)
    expect(max[2] - min[2]).toBeCloseTo(0.055, 3)
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run src/lib/ar/glb.test.ts`
Expected: FAIL — cannot find module `./glb`.

- [ ] **Step 4: Implement `src/lib/ar/glb.ts`**

```ts
import { Document, NodeIO, Material } from '@gltf-transform/core'
import {
  buildArtworkModel, hexToLinearRgb, CANVAS_EDGE_HEX, type ArMeshData,
} from './geometry'

export interface ArBuildOptions {
  widthCm: number
  heightCm: number
  textureJpeg: Uint8Array
  woodHex: string
  frameWidthFrac?: number
}

/** Quad soup -> two triangles per quad, sequential vertices. */
function triIndices(quadCount: number): Uint32Array {
  const idx = new Uint32Array(quadCount * 6)
  for (let q = 0; q < quadCount; q++) {
    const v = q * 4, t = q * 6
    idx[t] = v; idx[t + 1] = v + 1; idx[t + 2] = v + 2
    idx[t + 3] = v; idx[t + 4] = v + 2; idx[t + 5] = v + 3
  }
  return idx
}

export async function buildGlb(opts: ArBuildOptions): Promise<Uint8Array> {
  const model = buildArtworkModel(opts.widthCm, opts.heightCm, opts.frameWidthFrac)
  const doc = new Document()
  const buffer = doc.createBuffer()

  const tex = doc.createTexture('painting')
    .setImage(opts.textureJpeg)
    .setMimeType('image/jpeg')

  const matPainting = doc.createMaterial('painting')
    .setBaseColorTexture(tex)
    .setRoughnessFactor(0.9)
    .setMetallicFactor(0)
  const matCanvas = doc.createMaterial('canvasEdge')
    .setBaseColorFactor([...hexToLinearRgb(CANVAS_EDGE_HEX), 1])
    .setRoughnessFactor(1)
    .setMetallicFactor(0)
  const matWood = doc.createMaterial('wood')
    .setBaseColorFactor([...hexToLinearRgb(opts.woodHex), 1])
    .setRoughnessFactor(0.7)
    .setMetallicFactor(0)

  const mesh = doc.createMesh('artwork')
  const addPrim = (data: ArMeshData, material: Material) => {
    const prim = doc.createPrimitive()
      .setAttribute('POSITION', doc.createAccessor().setType('VEC3')
        .setArray(new Float32Array(data.positions)).setBuffer(buffer))
      .setAttribute('NORMAL', doc.createAccessor().setType('VEC3')
        .setArray(new Float32Array(data.normals)).setBuffer(buffer))
      .setIndices(doc.createAccessor().setType('SCALAR')
        .setArray(triIndices(data.quadCount)).setBuffer(buffer))
      .setMaterial(material)
    if (data.uvs) {
      prim.setAttribute('TEXCOORD_0', doc.createAccessor().setType('VEC2')
        .setArray(new Float32Array(data.uvs)).setBuffer(buffer))
    }
    mesh.addPrimitive(prim)
  }
  addPrim(model.painting, matPainting)
  addPrim(model.canvas, matCanvas)
  addPrim(model.frame, matWood)

  const node = doc.createNode('Artwork').setMesh(mesh)
  doc.createScene('Scene').addChild(node)

  return new NodeIO().writeBinary(doc)
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/lib/ar/glb.test.ts`
Expected: PASS (1 test).

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json src/lib/ar/glb.ts src/lib/ar/glb.test.ts
git commit -m "feat: server-side GLB author for AR artwork models"
```

---

## Task 7: USDZ builder (usda author + aligned zip)

**Files:**
- Create: `src/lib/ar/usdz.ts`
- Test: `src/lib/ar/usdz.test.ts`

**Interfaces:**
- Consumes: `buildArtworkModel`, `hexToLinearRgb`, `CANVAS_EDGE_HEX`, `ArBuildOptions` (Tasks 5-6).
- Produces:
  - `buildUsdz(opts: ArBuildOptions): Uint8Array` — complete `.usdz` bytes.
  - `buildUsda(opts: ArBuildOptions): string` — the USD text (exported for tests).
  - `packUsdz(entries: Record<string, Uint8Array>): Uint8Array` — store-only zip, each file's data 64-byte aligned (exported for tests).
- **The alignment test parses the real zip bytes and is the oracle.** If it fails, port the padding bookkeeping from three.js `USDZExporter.js` (fflate `extra` field id `12345`) rather than loosening the test.

- [ ] **Step 1: Write the failing test `src/lib/ar/usdz.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { buildUsdz, buildUsda, packUsdz } from './usdz'

const TINY_JPEG = Uint8Array.from(Buffer.from(
  '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0a' +
  'HBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAA' +
  'AAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AVN//2Q==', 'base64'))

const OPTS = { widthCm: 285, heightCm: 185, textureJpeg: TINY_JPEG, woodHex: '#C6A678' }

/** Walk zip local file headers. */
function localEntries(buf: Uint8Array) {
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength)
  const out: { name: string; method: number; dataOffset: number; size: number }[] = []
  let p = 0
  while (p + 30 <= buf.length && dv.getUint32(p, true) === 0x04034b50) {
    const method = dv.getUint16(p + 8, true)
    const size = dv.getUint32(p + 18, true)
    const nameLen = dv.getUint16(p + 26, true)
    const extraLen = dv.getUint16(p + 28, true)
    const name = new TextDecoder().decode(buf.subarray(p + 30, p + 30 + nameLen))
    const dataOffset = p + 30 + nameLen + extraLen
    out.push({ name, method, dataOffset, size })
    p = dataOffset + size
  }
  return out
}

describe('buildUsda', () => {
  const usda = buildUsda(OPTS)
  it('declares real-world scale and vertical wall anchoring', () => {
    expect(usda).toContain('metersPerUnit = 1')
    expect(usda).toContain('upAxis = "Y"')
    expect(usda).toContain('prepend apiSchemas = ["Preliminary_AnchoringAPI"]')
    expect(usda).toContain('uniform token preliminary:anchoring:type = "plane"')
    expect(usda).toContain('uniform token preliminary:planeAnchoring:alignment = "vertical"')
  })
  it('meshes reference the packed texture and true-size points', () => {
    expect(usda).toContain('@textures/painting.jpg@')
    expect(usda).toContain('1.425')   // half width in meters (285cm/2)
    expect(usda).toContain('0.925')   // half height in meters (185cm/2)
  })
})

describe('packUsdz / buildUsdz', () => {
  it('is a store-only zip, usda first, all data offsets 64-byte aligned', () => {
    const usdz = buildUsdz(OPTS)
    const entries = localEntries(usdz)
    expect(entries.length).toBe(2)
    expect(entries[0].name).toBe('model.usda')
    expect(entries[1].name).toBe('textures/painting.jpg')
    for (const e of entries) {
      expect(e.method).toBe(0)            // stored, no deflate
      expect(e.dataOffset % 64).toBe(0)   // USDZ spec alignment
    }
  })
  it('aligns regardless of entry sizes', () => {
    for (const padTo of [1, 63, 64, 100, 1000]) {
      const entries = {
        'model.usda': new Uint8Array(padTo).fill(65),
        'b.jpg': new Uint8Array(17).fill(66),
        'c.jpg': new Uint8Array(3).fill(67),
      }
      const zip = packUsdz(entries)
      for (const e of localEntries(zip)) expect(e.dataOffset % 64).toBe(0)
    }
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/ar/usdz.test.ts`
Expected: FAIL — cannot find module `./usdz`.

- [ ] **Step 3: Implement `src/lib/ar/usdz.ts`**

```ts
import { zipSync, type ZipOptions } from 'fflate'
import {
  buildArtworkModel, hexToLinearRgb, CANVAS_EDGE_HEX, type ArMeshData,
} from './geometry'
import type { ArBuildOptions } from './glb'

const f = (v: number) => {
  const s = v.toFixed(4)
  return s === '-0.0000' ? '0.0000' : s
}

function pointsAttr(data: ArMeshData): string {
  const pts: string[] = []
  for (let i = 0; i < data.positions.length; i += 3) {
    pts.push(`(${f(data.positions[i])}, ${f(data.positions[i + 1])}, ${f(data.positions[i + 2])})`)
  }
  return pts.join(', ')
}

function normalsAttr(data: ArMeshData): string {
  const ns: string[] = []
  for (let i = 0; i < data.normals.length; i += 3) {
    ns.push(`(${f(data.normals[i])}, ${f(data.normals[i + 1])}, ${f(data.normals[i + 2])})`)
  }
  return ns.join(', ')
}

/** USD st convention flips V relative to the glTF UVs stored in geometry. */
function stAttr(data: ArMeshData): string {
  const st: string[] = []
  for (let i = 0; i < (data.uvs?.length ?? 0); i += 2) {
    st.push(`(${f(data.uvs![i])}, ${f(1 - data.uvs![i + 1])})`)
  }
  return st.join(', ')
}

function extentAttr(data: ArMeshData): string {
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity]
  for (let i = 0; i < data.positions.length; i += 3) {
    for (let a = 0; a < 3; a++) {
      min[a] = Math.min(min[a], data.positions[i + a])
      max[a] = Math.max(max[a], data.positions[i + a])
    }
  }
  return `[(${min.map(f).join(', ')}), (${max.map(f).join(', ')})]`
}

function meshBlock(name: string, data: ArMeshData, materialPath: string): string {
  const counts = new Array(data.quadCount).fill(4).join(', ')
  const indices = Array.from({ length: data.quadCount * 4 }, (_, i) => i).join(', ')
  const st = data.uvs
    ? `\n        texCoord2f[] primvars:st = [${stAttr(data)}] (\n            interpolation = "vertex"\n        )`
    : ''
  return `
    def Mesh "${name}" (
        prepend apiSchemas = ["MaterialBindingAPI"]
    )
    {
        uniform bool doubleSided = 0
        float3[] extent = ${extentAttr(data)}
        int[] faceVertexCounts = [${counts}]
        int[] faceVertexIndices = [${indices}]
        rel material:binding = ${materialPath}
        normal3f[] normals = [${normalsAttr(data)}] (
            interpolation = "vertex"
        )
        point3f[] points = [${pointsAttr(data)}]${st}
        uniform token subdivisionScheme = "none"
    }`
}

function colorMaterial(name: string, hex: string): string {
  const [r, g, b] = hexToLinearRgb(hex)
  return `
        def Material "${name}"
        {
            token outputs:surface.connect = </Artwork/Materials/${name}/Surface.outputs:surface>

            def Shader "Surface"
            {
                uniform token info:id = "UsdPreviewSurface"
                color3f inputs:diffuseColor = (${f(r)}, ${f(g)}, ${f(b)})
                float inputs:metallic = 0
                float inputs:roughness = 0.8
                token outputs:surface
            }
        }`
}

export function buildUsda(opts: ArBuildOptions): string {
  const model = buildArtworkModel(opts.widthCm, opts.heightCm, opts.frameWidthFrac)
  return `#usda 1.0
(
    customLayerData = {
        string creator = "maibrittwolthers.com AR generator"
    }
    defaultPrim = "Artwork"
    metersPerUnit = 1
    upAxis = "Y"
)

def Xform "Artwork" (
    prepend apiSchemas = ["Preliminary_AnchoringAPI"]
)
{
    uniform token preliminary:anchoring:type = "plane"
    uniform token preliminary:planeAnchoring:alignment = "vertical"
${meshBlock('Painting', model.painting, '</Artwork/Materials/PaintingMat>')}
${meshBlock('CanvasBody', model.canvas, '</Artwork/Materials/CanvasMat>')}
${meshBlock('Frame', model.frame, '</Artwork/Materials/WoodMat>')}

    def Scope "Materials"
    {
        def Material "PaintingMat"
        {
            token outputs:surface.connect = </Artwork/Materials/PaintingMat/Surface.outputs:surface>

            def Shader "Surface"
            {
                uniform token info:id = "UsdPreviewSurface"
                color3f inputs:diffuseColor.connect = </Artwork/Materials/PaintingMat/Tex.outputs:rgb>
                float inputs:metallic = 0
                float inputs:roughness = 0.9
                token outputs:surface
            }

            def Shader "Primvar"
            {
                uniform token info:id = "UsdPrimvarReader_float2"
                string inputs:varname = "st"
                float2 outputs:result
            }

            def Shader "Tex"
            {
                uniform token info:id = "UsdUVTexture"
                asset inputs:file = @textures/painting.jpg@
                token inputs:sourceColorSpace = "sRGB"
                float2 inputs:st.connect = </Artwork/Materials/PaintingMat/Primvar.outputs:result>
                token inputs:wrapS = "clamp"
                token inputs:wrapT = "clamp"
                color3f outputs:rgb
            }
        }
${colorMaterial('CanvasMat', CANVAS_EDGE_HEX)}
${colorMaterial('WoodMat', opts.woodHex)}
    }
}
`
}

/** Store-only zip with every entry's DATA offset 64-byte aligned (USDZ spec).
 *  Alignment padding rides in the local-header extra field (id 12345), the
 *  same technique three.js's USDZExporter uses. */
export function packUsdz(entries: Record<string, Uint8Array>): Uint8Array {
  const files: Record<string, [Uint8Array, ZipOptions & { extra?: Record<number, Uint8Array> }]> = {}
  let offset = 0
  for (const [name, data] of Object.entries(entries)) {
    const headerBase = 30 + name.length          // local header without extra field
    const dataStart = offset + headerBase
    const rem = dataStart & 63
    if (rem === 0) {
      files[name] = [data, { level: 0 }]
      offset = dataStart + data.length
    } else {
      // extra field = 4-byte id+size header + padding bytes
      let padTotal = 64 - rem
      if (padTotal < 4) padTotal += 64
      files[name] = [data, { level: 0, extra: { 12345: new Uint8Array(padTotal - 4) } }]
      offset = dataStart + padTotal + data.length
    }
  }
  return zipSync(files as Parameters<typeof zipSync>[0])
}

export function buildUsdz(opts: ArBuildOptions): Uint8Array {
  const usda = new TextEncoder().encode(buildUsda(opts))
  return packUsdz({
    'model.usda': usda,                    // must be the FIRST file in the package
    'textures/painting.jpg': opts.textureJpeg,
  })
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/ar/usdz.test.ts`
Expected: PASS (4 tests). If an alignment assertion fails, inspect how fflate wrote the extra field (it may also append it to the central directory — harmless) and port three.js's `USDZExporter.js` offset bookkeeping exactly; do not weaken the test.

- [ ] **Step 5: Commit**

```bash
git add src/lib/ar/usdz.ts src/lib/ar/usdz.test.ts
git commit -m "feat: hand-authored wall-anchored USDZ with 64-byte aligned packaging"
```

---

## Task 8: Texture preparation

**Files:**
- Create: `src/lib/ar/texture.ts`
- Test: `src/lib/ar/texture.test.ts`

**Interfaces:**
- Produces: `prepareTexture(src: Buffer | Uint8Array): Promise<Uint8Array>` — sRGB JPEG (quality 85), longest edge ≤ 2048, EXIF rotation applied, alpha flattened to white.

- [ ] **Step 1: Write the failing test `src/lib/ar/texture.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import sharp from 'sharp'
import { prepareTexture } from './texture'

describe('prepareTexture', () => {
  it('emits a JPEG capped at 2048px from an oversized PNG with alpha', async () => {
    const src = await sharp({
      create: { width: 3000, height: 1500, channels: 4, background: { r: 200, g: 30, b: 30, alpha: 0.5 } },
    }).png().toBuffer()
    const out = await prepareTexture(src)
    const meta = await sharp(Buffer.from(out)).metadata()
    expect(meta.format).toBe('jpeg')
    expect(Math.max(meta.width!, meta.height!)).toBeLessThanOrEqual(2048)
    expect(meta.hasAlpha).toBe(false)
  })
  it('leaves small images unscaled', async () => {
    const src = await sharp({
      create: { width: 640, height: 480, channels: 3, background: { r: 10, g: 120, b: 60 } },
    }).jpeg().toBuffer()
    const out = await prepareTexture(src)
    const meta = await sharp(Buffer.from(out)).metadata()
    expect(meta.width).toBe(640)
    expect(meta.height).toBe(480)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/ar/texture.test.ts`
Expected: FAIL — cannot find module `./texture`.

- [ ] **Step 3: Implement `src/lib/ar/texture.ts`**

```ts
import sharp from 'sharp'

const MAX_EDGE = 2048

/** Prepare the painting image as an AR texture: EXIF-rotated, alpha flattened,
 *  capped at 2048px, plain sRGB JPEG (AR viewers assume sRGB). */
export async function prepareTexture(src: Buffer | Uint8Array): Promise<Uint8Array> {
  const buf = await sharp(Buffer.from(src), { failOn: 'none' })
    .rotate()                                  // honor EXIF orientation
    .flatten({ background: '#ffffff' })        // drop alpha (JPEG has none)
    .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toBuffer()
  return new Uint8Array(buf)
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/ar/texture.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/ar/texture.ts src/lib/ar/texture.test.ts
git commit -m "feat: sharp texture prep for AR models"
```

---

## Task 9: Eligibility + cache-hash helpers

**Files:**
- Create: `src/lib/ar/constants.ts` (client-safe — no Node imports; `ArWallButton` imports from here)
- Create: `src/lib/ar/eligibility.ts` (server-side — uses `node:crypto`)
- Test: `src/lib/ar/eligibility.test.ts`

**Interfaces:**
- Produces (in `constants.ts`, re-exported by `eligibility.ts`):
  - `AR_MODEL_VERSION = 1` — bump to invalidate every cached model.
  - `AR_CATEGORIES = ['painting', 'engraving', 'mixed-media']`
  - `qualifiesForAr(row): { ok: true; heightCm: number; widthCm: number; imageUrl: string; presetKey: string } | { ok: false; reason: string }` — row is the raw DB shape `{ category, height_cm, width_cm, images }`.
  - `arModelHash(input: { imageUrl: string; heightCm: number; widthCm: number; presetKey: string }): string` — 16 hex chars, includes `AR_MODEL_VERSION`.
- Image choice: `images[0].enhanced ?? images[0].display` (never `framed` — its baked wall margin is wrong for AR).

- [ ] **Step 1: Write the failing test `src/lib/ar/eligibility.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { qualifiesForAr, arModelHash } from './eligibility'

const base = {
  category: 'painting',
  height_cm: '185.0',
  width_cm: 285,
  images: [{ original: 'o.jpg', display: 'd.webp', thumbnail: 't.webp', enhanced: 'e.png', framePreset: 'walnut-floater' }],
}

describe('qualifiesForAr', () => {
  it('accepts a flat artwork with numeric dimensions, preferring the enhanced image', () => {
    const q = qualifiesForAr(base)
    expect(q).toMatchObject({ ok: true, heightCm: 185, widthCm: 285, imageUrl: 'e.png', presetKey: 'walnut-floater' })
  })
  it('falls back to display and default preset', () => {
    const q = qualifiesForAr({ ...base, images: [{ original: 'o.jpg', display: 'd.webp', thumbnail: 't.webp' }] })
    expect(q).toMatchObject({ ok: true, imageUrl: 'd.webp', presetKey: 'oak-floater' })
  })
  it('rejects missing dimensions, wrong category, no image', () => {
    expect(qualifiesForAr({ ...base, height_cm: null }).ok).toBe(false)
    expect(qualifiesForAr({ ...base, category: 'sculpture' }).ok).toBe(false)
    expect(qualifiesForAr({ ...base, images: [] }).ok).toBe(false)
  })
})

describe('arModelHash', () => {
  const input = { imageUrl: 'e.png', heightCm: 185, widthCm: 285, presetKey: 'oak-floater' }
  it('is 16 hex chars and stable', () => {
    expect(arModelHash(input)).toMatch(/^[0-9a-f]{16}$/)
    expect(arModelHash(input)).toBe(arModelHash({ ...input }))
  })
  it('changes when any input changes', () => {
    expect(arModelHash({ ...input, widthCm: 286 })).not.toBe(arModelHash(input))
    expect(arModelHash({ ...input, imageUrl: 'e2.png' })).not.toBe(arModelHash(input))
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/ar/eligibility.test.ts`
Expected: FAIL — cannot find module `./eligibility`.

- [ ] **Step 3: Implement `src/lib/ar/constants.ts` and `src/lib/ar/eligibility.ts`**

`src/lib/ar/constants.ts` — client-safe (imported by the browser button; must never import Node built-ins):

```ts
/** Bump to invalidate every cached AR model (geometry/material changes). */
export const AR_MODEL_VERSION = 1

export const AR_CATEGORIES = ['painting', 'engraving', 'mixed-media'] as const
```

`src/lib/ar/eligibility.ts`:

```ts
import crypto from 'node:crypto'
import { defaultPresetForCategory, FRAME_PRESETS } from '@/lib/framing/presets'
import { AR_MODEL_VERSION, AR_CATEGORIES } from './constants'

export { AR_MODEL_VERSION, AR_CATEGORIES }

export type ArQualification =
  | { ok: true; heightCm: number; widthCm: number; imageUrl: string; presetKey: string }
  | { ok: false; reason: string }

/** row = raw artworks DB shape: { category, height_cm, width_cm, images }. */
export function qualifiesForAr(row: {
  category?: string
  height_cm?: unknown
  width_cm?: unknown
  images?: { display?: string; enhanced?: string; framePreset?: string }[]
}): ArQualification {
  if (!row.category || !(AR_CATEGORIES as readonly string[]).includes(row.category)) {
    return { ok: false, reason: 'category_not_flat' }
  }
  const heightCm = row.height_cm != null ? Number(row.height_cm) : NaN
  const widthCm = row.width_cm != null ? Number(row.width_cm) : NaN
  if (!Number.isFinite(heightCm) || !Number.isFinite(widthCm) || heightCm <= 0 || widthCm <= 0) {
    return { ok: false, reason: 'missing_dimensions' }
  }
  const img = row.images?.[0]
  // framed is never used here: its baked-in wall margin is wrong in real AR.
  const imageUrl = img?.enhanced || img?.display
  if (!imageUrl) return { ok: false, reason: 'no_image' }
  const presetKey = img?.framePreset && FRAME_PRESETS[img.framePreset]
    ? img.framePreset
    : defaultPresetForCategory(row.category)
  return { ok: true, heightCm, widthCm, imageUrl, presetKey }
}

export function arModelHash(input: {
  imageUrl: string
  heightCm: number
  widthCm: number
  presetKey: string
}): string {
  return crypto.createHash('sha256')
    .update([AR_MODEL_VERSION, input.imageUrl, input.heightCm, input.widthCm, input.presetKey].join('|'))
    .digest('hex')
    .slice(0, 16)
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/ar/eligibility.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/ar/constants.ts src/lib/ar/eligibility.ts src/lib/ar/eligibility.test.ts
git commit -m "feat: AR eligibility and cache-hash helpers"
```

---

## Task 10: Storage upload + AR API route + file tracing

**Files:**
- Modify: `src/services/storage.service.ts` (add method after `uploadDerived`, ~line 228)
- Create: `src/app/api/ar/[artworkId]/route.ts`
- Modify: `next.config.js` (`outputFileTracingIncludes`, ~line 42)

**Interfaces:**
- Consumes: `qualifiesForAr`, `arModelHash` (Task 9); `prepareTexture` (Task 8); `buildGlb` (Task 6); `buildUsdz` (Task 7); `FRAME_PRESETS` (Task 4).
- Produces:
  - `StorageService.uploadArModel(baseName: string, kind: 'glb' | 'usdz', buf: Uint8Array): Promise<string>` — uploads to `artworks` bucket at `ar/{baseName}.{kind}` with the correct MIME, returns public URL.
  - `POST /api/ar/{artworkId}` → `200 { glb: string, usdz: string }` | `400/404/422/500 { error: string }`. Task 11's client calls this.

- [ ] **Step 1: Add `uploadArModel` to `src/services/storage.service.ts`** (after `uploadDerived`, before `getPublicUrl`)

```ts
  /** Upload a generated AR model (GLB/USDZ) and return its public URL.
   * Service-role client for the same reason as uploadDerived: the artworks
   * bucket INSERT policy is authenticated-only, and this runs server-side
   * from the public AR route. Files are content-addressed (hash in the name),
   * so long cache + upsert is safe. */
  static async uploadArModel(
    baseName: string,
    kind: 'glb' | 'usdz',
    buf: Uint8Array,
  ): Promise<string> {
    const client = supabaseAdmin ?? supabase
    const path = `ar/${baseName}.${kind}`
    const contentType = kind === 'usdz' ? 'model/vnd.usdz+zip' : 'model/gltf-binary'
    const { error } = await client.storage.from('artworks').upload(path, buf, {
      cacheControl: '31536000', upsert: true, contentType,
    })
    if (error) throw error
    return client.storage.from('artworks').getPublicUrl(path).data.publicUrl
  }
```

- [ ] **Step 2: Create `src/app/api/ar/[artworkId]/route.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import { StorageService } from '@/services/storage.service'
import { qualifiesForAr, arModelHash } from '@/lib/ar/eligibility'
import { prepareTexture } from '@/lib/ar/texture'
import { buildGlb } from '@/lib/ar/glb'
import { buildUsdz } from '@/lib/ar/usdz'
import { FRAME_PRESETS } from '@/lib/framing/presets'

export const runtime = 'nodejs'
export const maxDuration = 60

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Public endpoint: artworks are public, and generation inputs come solely
 * from the artwork's own DB row (no user-supplied URLs -> no SSRF surface).
 * Output files are content-addressed, so repeat calls are cache hits. */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ artworkId: string }> },
) {
  const { artworkId } = await params
  if (!UUID_RE.test(artworkId)) {
    return NextResponse.json({ error: 'invalid_id' }, { status: 400 })
  }

  try {
    const client = supabaseAdmin ?? supabase
    const { data, error } = await client
      .from('artworks')
      .select('id, category, height_cm, width_cm, images')
      .eq('id', artworkId)
      .single()
    if (error || !data) return NextResponse.json({ error: 'not_found' }, { status: 404 })

    const q = qualifiesForAr(data)
    if (!q.ok) return NextResponse.json({ error: q.reason }, { status: 422 })

    const hash = arModelHash(q)
    const baseName = `${artworkId}-${hash}`

    // Cache check: both files already generated?
    const { data: existing } = await client.storage
      .from('artworks')
      .list('ar', { search: baseName })
    const have = new Set((existing ?? []).map(f => f.name))
    const publicUrl = (kind: 'glb' | 'usdz') =>
      client.storage.from('artworks').getPublicUrl(`ar/${baseName}.${kind}`).data.publicUrl
    if (have.has(`${baseName}.glb`) && have.has(`${baseName}.usdz`)) {
      return NextResponse.json({ glb: publicUrl('glb'), usdz: publicUrl('usdz') })
    }

    // Generate. Image URL comes from our own DB row (Supabase public URL).
    const imgRes = await fetch(q.imageUrl)
    if (!imgRes.ok) return NextResponse.json({ error: 'image_fetch_failed' }, { status: 500 })
    const textureJpeg = await prepareTexture(Buffer.from(await imgRes.arrayBuffer()))

    const preset = FRAME_PRESETS[q.presetKey]
    const buildOpts = {
      widthCm: q.widthCm,
      heightCm: q.heightCm,
      textureJpeg,
      woodHex: preset.woodHex,
      frameWidthFrac: preset.frameWidthFrac,
    }
    const [glbBytes, usdzBytes] = [await buildGlb(buildOpts), buildUsdz(buildOpts)]

    const [glb, usdz] = await Promise.all([
      StorageService.uploadArModel(baseName, 'glb', glbBytes),
      StorageService.uploadArModel(baseName, 'usdz', usdzBytes),
    ])
    return NextResponse.json({ glb, usdz })
  } catch (e) {
    console.error('AR model generation failed', e)
    return NextResponse.json({ error: 'generation_failed' }, { status: 500 })
  }
}
```

- [ ] **Step 3: Add file tracing in `next.config.js`**

Inside the existing `outputFileTracingIncludes` object (~line 42), add the AR route pattern alongside the enhance one:

```js
    '/api/ar/**': ['./node_modules/@img/**'],
```

- [ ] **Step 4: Verify build + full test suite**

Run: `npm run typecheck && npm run test`
Expected: exit 0, all suites pass.

- [ ] **Step 5: Manual smoke test (local)**

Run: `npm run dev`, then with a real artwork id that has dimensions (grab one from the admin):

```bash
curl -s -X POST http://localhost:3000/api/ar/<artwork-uuid> | head -c 400
```

Expected: `{"glb":"https://...supabase.co/.../ar/<id>-<hash>.glb","usdz":".../ar/<id>-<hash>.usdz"}`. Second call returns the same URLs near-instantly (cache hit). Download the `.usdz` URL and confirm bytes start with `PK` and the first entry name is `model.usda` (e.g. `curl -s <usdz-url> | head -c 64 | xxd`).

- [ ] **Step 6: Commit**

```bash
git add src/services/storage.service.ts src/app/api/ar/[artworkId]/route.ts next.config.js
git commit -m "feat: on-demand cached AR model generation endpoint"
```

---

## Task 11: Device detection + ArWallButton (+ QR, model-viewer)

**Files:**
- Create: `src/lib/ar/device.ts`
- Test: `src/lib/ar/device.test.ts`
- Create: `src/types/model-viewer.d.ts`
- Create: `src/components/artwork/ArWallButton.tsx`
- Modify: `package.json` (deps)

**Interfaces:**
- Consumes: `POST /api/ar/{artworkId}` (Task 10).
- Produces:
  - `detectArPlatform(ua: string, maxTouchPoints: number): 'ios' | 'android' | 'desktop'`
  - `<ArWallButton artworkId slug category heightCm? widthCm? autoOpen? variant?>` — renders nothing when ineligible. `variant: 'bar' | 'detail'` picks compact (lightbox bar) vs regular (detail page) styling. Used by Tasks 12-13.

- [ ] **Step 1: Install dependencies**

```bash
npm install qrcode@^1.5 @google/model-viewer@^4
npm install -D @types/qrcode@^1.5
```

- [ ] **Step 2: Write the failing test `src/lib/ar/device.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { detectArPlatform } from './device'

const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1'
const IPAD_DESKTOP_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Safari/605.1.15'
const ANDROID = 'Mozilla/5.0 (Linux; Android 15; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0 Mobile Safari/537.36'
const MAC = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0 Safari/537.36'

describe('detectArPlatform', () => {
  it('detects iPhone', () => expect(detectArPlatform(IPHONE, 5)).toBe('ios'))
  it('detects iPad masquerading as macOS via touch points', () => {
    expect(detectArPlatform(IPAD_DESKTOP_UA, 5)).toBe('ios')
  })
  it('detects Android', () => expect(detectArPlatform(ANDROID, 5)).toBe('android'))
  it('detects desktop (no touch)', () => expect(detectArPlatform(MAC, 0)).toBe('desktop'))
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run src/lib/ar/device.test.ts`
Expected: FAIL — cannot find module `./device`.

- [ ] **Step 4: Implement `src/lib/ar/device.ts`**

```ts
export type ArPlatform = 'ios' | 'android' | 'desktop'

/** iPadOS Safari reports a macOS UA; multi-touch is the tell. */
export function detectArPlatform(ua: string, maxTouchPoints: number): ArPlatform {
  if (/iPhone|iPad|iPod/.test(ua)) return 'ios'
  if (/Macintosh/.test(ua) && maxTouchPoints > 1) return 'ios'
  if (/Android/.test(ua)) return 'android'
  return 'desktop'
}

export function currentArPlatform(): ArPlatform {
  if (typeof navigator === 'undefined') return 'desktop'
  return detectArPlatform(navigator.userAgent, navigator.maxTouchPoints ?? 0)
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/lib/ar/device.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 6: Create `src/types/model-viewer.d.ts`**

```ts
import type React from 'react'

// Minimal typing for Google's <model-viewer> custom element (React 19 JSX).
declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        src?: string
        'ios-src'?: string
        alt?: string
        ar?: boolean
        'ar-modes'?: string
        'ar-placement'?: string
        'ar-scale'?: string
        'camera-controls'?: boolean
        'shadow-intensity'?: string
        style?: React.CSSProperties
      }
    }
  }
}
```

- [ ] **Step 7: Create `src/components/artwork/ArWallButton.tsx`**

```tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { View, X } from 'lucide-react'
import QRCode from 'qrcode'
import { currentArPlatform, type ArPlatform } from '@/lib/ar/device'
import { AR_CATEGORIES } from '@/lib/ar/constants'

interface ArWallButtonProps {
  artworkId: string
  slug: string
  category: string
  heightCm?: number
  widthCm?: number
  /** Open the AR flow automatically (arriving from the desktop QR hand-off). */
  autoOpen?: boolean
  /** 'bar' = compact text button for the lightbox bar; 'detail' = outlined button. */
  variant?: 'bar' | 'detail'
}

interface ArUrls { glb: string; usdz: string }

const LABEL = 'View on your wall'
const LABEL_PT = 'Veja na sua parede'

export default function ArWallButton({
  artworkId, slug, category, heightCm, widthCm, autoOpen = false, variant = 'bar',
}: ArWallButtonProps) {
  const [platform, setPlatform] = useState<ArPlatform | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [androidUrls, setAndroidUrls] = useState<ArUrls | null>(null)
  const urlsRef = useRef<ArUrls | null>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const eligible =
    (AR_CATEGORIES as readonly string[]).includes(category) &&
    typeof heightCm === 'number' && heightCm > 0 &&
    typeof widthCm === 'number' && widthCm > 0

  // Platform is browser-only; render nothing during SSR.
  useEffect(() => { setPlatform(currentArPlatform()) }, [])

  const fetchUrls = async (): Promise<ArUrls> => {
    if (urlsRef.current) return urlsRef.current
    const res = await fetch(`/api/ar/${artworkId}`, { method: 'POST' })
    if (!res.ok) throw new Error('ar_generation_failed')
    const urls = (await res.json()) as ArUrls
    urlsRef.current = urls
    return urls
  }

  const launchIos = (urls: ArUrls) => {
    const pageUrl = `${window.location.origin}/artwork/${slug}`
    const anchor = document.createElement('a')
    anchor.setAttribute('rel', 'ar')
    // Lock pinch-scaling (true size) and make Quick Look's share button
    // point at the artwork page instead of the raw USDZ.
    anchor.setAttribute(
      'href',
      `${urls.usdz}#allowsContentScaling=0&canonicalWebPageURL=${encodeURIComponent(pageUrl)}`,
    )
    // Quick Look requires an <img> child inside the rel=ar anchor.
    const img = document.createElement('img')
    img.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
    img.alt = ''
    anchor.appendChild(img)
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
  }

  const handleClick = async () => {
    setError(false)
    if (platform === 'desktop') {
      const target = `${window.location.origin}/artwork/${slug}?ar=1`
      setQrDataUrl(await QRCode.toDataURL(target, { width: 240, margin: 1 }))
      return
    }
    setLoading(true)
    try {
      const urls = await fetchUrls()
      if (platform === 'ios') {
        launchIos(urls)
      } else {
        await import('@google/model-viewer')
        setAndroidUrls(urls)
      }
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  // QR hand-off arrival: pre-generate the model and pull the button into view.
  useEffect(() => {
    if (!autoOpen || !eligible || !platform || platform === 'desktop') return
    buttonRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    fetchUrls().catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoOpen, eligible, platform])

  if (!eligible || platform === null) return null

  const barClasses =
    'inline-flex items-center gap-1.5 text-[10px] tracking-[2px] uppercase font-medium text-gray-700 hover:text-gray-900 transition-colors whitespace-nowrap disabled:opacity-50'
  const detailClasses =
    'inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50'

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={handleClick}
        disabled={loading}
        title={`${LABEL} / ${LABEL_PT}`}
        className={`${variant === 'bar' ? barClasses : detailClasses} ${autoOpen ? 'animate-pulse' : ''}`}
      >
        <View className={variant === 'bar' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
        {loading ? 'Preparing… / Preparando…' : LABEL}
      </button>
      {error && (
        <span className="text-[10px] text-red-600 ml-2">
          Couldn&apos;t prepare the AR view — try again / Não foi possível preparar — tente novamente
        </span>
      )}

      {/* Desktop: QR hand-off */}
      {qrDataUrl && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/60" onClick={() => setQrDataUrl(null)}>
          <div className="bg-white rounded-lg p-6 text-center shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <button aria-label="Close" className="float-right -mt-2 -mr-2 text-gray-400 hover:text-gray-700" onClick={() => setQrDataUrl(null)}>
              <X className="w-5 h-5" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrDataUrl} alt="QR code" className="mx-auto w-[240px] h-[240px]" />
            <p className="mt-3 text-sm font-medium text-gray-900">Scan to see it on your wall</p>
            <p className="text-xs text-gray-500">Escaneie para vê-la na sua parede</p>
          </div>
        </div>
      )}

      {/* Android: model-viewer sheet (WebXR first; Scene Viewer fallback) */}
      {androidUrls && (
        <div className="fixed inset-0 z-[600] flex flex-col bg-black/90">
          <div className="flex items-center justify-between px-4 py-3 text-white">
            <span className="text-sm">{LABEL} / {LABEL_PT}</span>
            <button aria-label="Close" onClick={() => setAndroidUrls(null)}>
              <X className="w-6 h-6" />
            </button>
          </div>
          <model-viewer
            src={androidUrls.glb}
            ios-src={androidUrls.usdz}
            alt="Artwork on your wall"
            ar
            ar-modes="webxr scene-viewer quick-look"
            ar-placement="wall"
            ar-scale="fixed"
            camera-controls
            style={{ flex: 1, width: '100%' }}
          />
          <p className="px-4 py-3 text-center text-xs text-white/80">
            Tap the AR icon, then point your camera at a picture, door or shelf on your wall
            <br />
            Toque no ícone AR e aponte a câmera para um quadro, porta ou prateleira na parede
          </p>
        </div>
      )}
    </>
  )
}
```

- [ ] **Step 8: Typecheck**

Run: `npm run typecheck`
Expected: exit 0. (If `lucide-react` has no `View` icon in the installed version, use `Scan` instead — check with `grep -r "export.*\bView\b" node_modules/lucide-react/dist/lucide-react.d.ts | head -1`.)

- [ ] **Step 9: Commit**

```bash
git add package.json package-lock.json src/lib/ar/device.ts src/lib/ar/device.test.ts src/types/model-viewer.d.ts src/components/artwork/ArWallButton.tsx
git commit -m "feat: ArWallButton with per-platform AR launch and desktop QR hand-off"
```

---

## Task 12: Lightbox — [ Enhanced | Original ] toggle + AR button

**Files:**
- Modify: `src/components/timeline/ArtworkOverlay.tsx`

**Interfaces:**
- Consumes: `ArWallButton` (Task 11); `Artwork.heightCm/widthCm` (Task 2).

- [ ] **Step 1: Add state + image selection to `ArtworkOverlay.tsx`**

(a) Change the react import (line 3) to:

```ts
import { useEffect, useState } from 'react'
```

(b) Add the import:

```ts
import ArWallButton from '@/components/artwork/ArWallButton'
```

(c) Replace the `mainImage` line (line 49) with:

```ts
  const img0 = artwork.images?.[0]
  const enhancedUrl = img0?.framed || img0?.enhanced || ''
  const hasToggle = !!enhancedUrl && !!img0?.original && enhancedUrl !== img0.original
  const mainImage = hasToggle
    ? (view === 'original' ? img0!.original : enhancedUrl)
    : (img0?.display || img0?.original)
```

(d) Add the toggle state near the top of the component (before the `useEffect`, after the destructured props) — and reset it when the artwork changes:

```ts
  const [view, setView] = useState<'enhanced' | 'original'>('enhanced')
  useEffect(() => { setView('enhanced') }, [artwork?.id])
```

Note: `if (!artwork) return null` (line 45) sits AFTER hooks — keep hook order intact by placing the new `useState`/`useEffect` above it, next to the existing `useEffect`.

- [ ] **Step 2: Crossfade the image**

Replace the plain `<img ...>` (lines 87-91) with a keyed motion image so toggling crossfades:

```tsx
              <motion.img
                key={mainImage}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.25 }}
                src={mainImage}
                alt={title}
                className="max-w-full max-h-full object-contain"
              />
```

- [ ] **Step 3: Add the toggle + AR button to the bottom bar**

Directly BEFORE the `{/* View full link */}` block (line 149), insert:

```tsx
              {/* Enhanced | Original + AR */}
              <div className="flex items-center gap-5 self-end max-md:self-start whitespace-nowrap">
                {hasToggle && (
                  <div className="text-[10px] tracking-[2px] uppercase font-medium">
                    <button
                      type="button"
                      onClick={() => setView('enhanced')}
                      className={view === 'enhanced' ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600 transition-colors'}
                    >
                      Enhanced
                    </button>
                    <span className="text-gray-300 mx-1.5">|</span>
                    <button
                      type="button"
                      onClick={() => setView('original')}
                      className={view === 'original' ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600 transition-colors'}
                    >
                      Original
                    </button>
                  </div>
                )}
                <ArWallButton
                  artworkId={artwork.id}
                  slug={artwork.slug}
                  category={artwork.category}
                  heightCm={artwork.heightCm}
                  widthCm={artwork.widthCm}
                  variant="bar"
                />
              </div>
```

- [ ] **Step 4: Verify**

Run: `npm run typecheck && npm run test`
Expected: exit 0, suites pass.

Run: `npm run dev`, open the home page timeline, click an artwork with an enhanced image:
- toggle appears and swaps enhanced ↔ original with a crossfade;
- an artwork without enhancement shows no toggle;
- an artwork with `height_cm`/`width_cm` shows "View on your wall"; on desktop it opens the QR modal.

- [ ] **Step 5: Commit**

```bash
git add src/components/timeline/ArtworkOverlay.tsx
git commit -m "feat(lightbox): Enhanced|Original toggle and AR wall button"
```

---

## Task 13: Detail page — AR button + ?ar=1 hand-off

**Files:**
- Modify: `src/app/artwork/[slug]/page.tsx`
- Modify: `src/app/artwork/[slug]/ArtworkDetailClient.tsx`

**Interfaces:**
- Consumes: `ArWallButton` (Task 11).
- Produces: `/artwork/{slug}?ar=1` auto-opens the AR flow (the QR target from Task 11).

- [ ] **Step 1: Pass `?ar=1` through `page.tsx`**

Update the props interface and page component (lines 6-8 and 47-56):

```tsx
interface ArtworkPageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ ar?: string }>
}
```

```tsx
export default async function ArtworkPage({ params, searchParams }: ArtworkPageProps) {
  const { slug } = await params
  const { ar } = await searchParams
  const artwork = await ArtworkService.getArtworkBySlug(slug)

  if (!artwork) {
    notFound()
  }

  return <ArtworkDetailClient artwork={artwork} autoOpenAr={ar === '1'} />
}
```

- [ ] **Step 2: Mount the button in `ArtworkDetailClient.tsx`**

(a) Update the props interface (lines 12-16):

```ts
interface ArtworkDetailClientProps {
  artwork: Artwork
  autoOpenAr?: boolean
}

export default function ArtworkDetailClient({ artwork, autoOpenAr = false }: ArtworkDetailClientProps) {
```

(b) Add the import:

```ts
import ArWallButton from '@/components/artwork/ArWallButton'
```

(c) In the buttons row (`<div className="flex gap-3 mt-auto">`, line 258), add as the FIRST child:

```tsx
                <ArWallButton
                  artworkId={artwork.id}
                  slug={artwork.slug}
                  category={artwork.category}
                  heightCm={artwork.heightCm}
                  widthCm={artwork.widthCm}
                  autoOpen={autoOpenAr}
                  variant="detail"
                />
```

- [ ] **Step 3: Verify**

Run: `npm run typecheck && npm run build`
Expected: exit 0.

Run: `npm run dev`, open `/artwork/<some-slug>?ar=1` in a desktop browser — the AR button renders (desktop → click shows QR); no console errors. The `flex gap-3` row wraps gracefully on narrow screens (add `flex-wrap` to that row if it overflows).

- [ ] **Step 4: Commit**

```bash
git add src/app/artwork/[slug]/page.tsx src/app/artwork/[slug]/ArtworkDetailClient.tsx
git commit -m "feat(detail): AR wall button with QR ?ar=1 hand-off"
```

---

## Task 14: Full verification + device pass

**Files:** none (verification only)

- [ ] **Step 1: Full suite**

Run: `npm run test && npm run typecheck && npm run build`
Expected: all pass, build succeeds.

- [ ] **Step 2: Line-count check on touched files**

Run: `wc -l src/components/admin/EditArtworkModal.tsx src/components/admin/upload-artwork/PerImageDetailsStep.tsx src/components/timeline/ArtworkOverlay.tsx src/components/artwork/ArWallButton.tsx`
Expected: all under ~2000 lines. If any exceeds it, STOP and inform the user per project rule.

- [ ] **Step 3: Deploy to preview and run the device checklist** (real hardware — simulators can't do AR)

Push the branch; on the Vercel preview URL:

**iPhone/iPad (Safari):**
- [ ] Lightbox shows `[ Enhanced | Original ]` on enhanced artworks; crossfade works.
- [ ] "View on your wall" opens AR Quick Look.
- [ ] Model anchors to a wall (aim at a picture/door/shelf if a blank wall won't detect).
- [ ] Size is true to `height_cm × width_cm` (measure roughly against a real object).
- [ ] Pinch-scaling is locked; double-tap resets.
- [ ] Quick Look share button offers the artwork page URL, not the raw file.

**Android (Chrome, ARCore device):**
- [ ] Button opens the model-viewer sheet; AR icon starts WebXR wall placement.
- [ ] On a non-WebXR browser, Scene Viewer opens the hosted GLB.

**Desktop:**
- [ ] Button shows the QR modal; scanning it opens `/artwork/{slug}?ar=1` on the phone, which pre-generates the model, scrolls to the pulsing button, and one tap launches AR.

**Admin:**
- [ ] Upload flow: Height/Width inputs compose the dimensions string; dropdown pick fills numerics.
- [ ] Edit modal: existing artwork shows backfilled numbers; saving persists them.

- [ ] **Step 4: Record any device-test fixes as separate commits**, then hand back for merge/announcement (the changelog skill can announce the feature once live).
