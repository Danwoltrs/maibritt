# Mobile Quick-Upload FAB Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a floating camera button on mobile that, for a logged-in artist, opens the phone's camera/photo picker and then the full-screen artwork upload dialog with the chosen images preloaded.

**Architecture:** A new global client component `QuickUploadFab` is mounted once in the root layout (shared by public + admin routes). It self-gates on auth/route via a pure predicate, holds a hidden `<input type="file" accept="image/*" multiple>` (no `capture`, so iOS/Android offer Camera *or* Library), and on selection opens the existing `UploadArtworkDialog` with a new `initialFiles` prop. The dialog's step‑1 shell gains `max-lg:` overrides to render full-screen on mobile; everything else in the dialog is unchanged.

**Tech Stack:** Next.js 15 (App Router), React 19, TypeScript 5, Tailwind CSS 3.4, shadcn/ui (Radix Dialog), lucide-react, Vitest + Testing Library (jsdom).

## Global Constraints

- Keep files under ~2000 lines; refactor if exceeded (user rule).
- Tests are co-located `*.test.ts` files using `import { describe, it, expect } from 'vitest'`. The repo has **no component (`.test.tsx`) tests** — convention is to unit-test **pure logic** only. Follow it: TDD the extracted pure functions; verify JSX/wiring with `npm run typecheck` + `npm run build` (+ manual mobile check).
- The file input must **not** use the `capture` attribute (that is what makes the OS show the Camera/Library/Browse menu rather than forcing the camera).
- Mobile gating is CSS-based: `lg:hidden` for the button, `max-lg:` variants for the dialog. Do **not** introduce a JS `useIsMobile` hook (avoids SSR/hydration flash).
- Touch target ≥ 44px (the FAB is 56px). Bottom offset respects the home indicator: `bottom: max(1rem, env(safe-area-inset-bottom))`.
- Desktop (`lg+`) dialog rendering must remain exactly as it is today.
- Auth source of truth: `useAuth()` from `@/hooks/useAuth`, returning `{ user, loading, isAuthenticated }`.

**Known decision — FAB input validation:** The desktop dropzone enforces type (jpeg/png/webp), ≤50MB, and ≤20 files via react-dropzone. The FAB picker uses `accept="image/*"` (broad on purpose: it surfaces the camera and lets iOS transcode HEIC→JPEG on selection, which is the common iPhone case). The FAB mirrors only the **20-file cap** (`MAX_IMAGE_COUNT`); it intentionally **defers type/size enforcement** to the dialog's existing upload-failure UI (the "finalizing / some uploads need attention" step with per-file Retry), rather than duplicating validation and inventing new error UI on the FAB. Verify HEIC + oversized behavior on a real device (manual test in Task 5).

---

## File Structure

| File | Responsibility |
|------|----------------|
| `src/components/admin/upload-artwork/imageFiles.ts` | **New** — pure `filesToUploadedImages(files)` mapping helper |
| `src/components/admin/upload-artwork/imageFiles.test.ts` | **New** — unit tests for the helper |
| `src/components/admin/upload-artwork/quickUploadFab.logic.ts` | **New** — pure `shouldShowQuickUploadFab(...)` visibility predicate |
| `src/components/admin/upload-artwork/quickUploadFab.logic.test.ts` | **New** — unit tests for the predicate |
| `src/components/admin/upload-artwork/QuickUploadFab.tsx` | **New** — the FAB: hidden file input + button + owns the dialog |
| `src/components/admin/upload-artwork/UploadArtworkDialog.tsx` | **Modify** — use helper in `onDrop`; add `initialFiles` prop + seeding effect; full-screen-on-mobile on step‑1 `DialogContent` |
| `src/app/layout.tsx` | **Modify** — mount `<QuickUploadFab />` inside `<AuthProvider>` |

---

### Task 1: Extract `filesToUploadedImages` helper

**Files:**
- Create: `src/components/admin/upload-artwork/imageFiles.ts`
- Test: `src/components/admin/upload-artwork/imageFiles.test.ts`
- Modify: `src/components/admin/upload-artwork/UploadArtworkDialog.tsx:193-196` (use the helper in `onDrop`)

**Interfaces:**
- Consumes: `UploadedImage` from `./types` (`{ file: File; preview: string }`)
- Produces: `filesToUploadedImages(files: File[]): UploadedImage[]` — maps each `File` to `{ file, preview: URL.createObjectURL(file) }`, preserving order.

- [ ] **Step 1: Write the failing test**

Create `src/components/admin/upload-artwork/imageFiles.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { filesToUploadedImages } from './imageFiles'

beforeEach(() => {
  // jsdom does not implement URL.createObjectURL — provide a deterministic stub
  ;(URL as unknown as { createObjectURL: (f: File) => string }).createObjectURL =
    vi.fn((file: File) => `blob:mock-${file.name}`)
})

describe('filesToUploadedImages', () => {
  it('maps each file to an UploadedImage with a preview url, preserving order', () => {
    const a = new File(['a'], 'a.jpg', { type: 'image/jpeg' })
    const b = new File(['b'], 'b.png', { type: 'image/png' })

    const result = filesToUploadedImages([a, b])

    expect(result).toHaveLength(2)
    expect(result[0].file).toBe(a)
    expect(result[0].preview).toBe('blob:mock-a.jpg')
    expect(result[1].file).toBe(b)
    expect(result[1].preview).toBe('blob:mock-b.png')
  })

  it('returns an empty array for empty input', () => {
    expect(filesToUploadedImages([])).toEqual([])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- imageFiles`
Expected: FAIL — `Failed to resolve import "./imageFiles"` (file does not exist yet).

- [ ] **Step 3: Write minimal implementation**

Create `src/components/admin/upload-artwork/imageFiles.ts`:

```ts
import type { UploadedImage } from './types'

/** Max images per upload batch — mirrors the dropzone's react-dropzone maxFiles. */
export const MAX_IMAGE_COUNT = 20

/**
 * Convert picked/dropped File objects into the dialog's UploadedImage shape.
 * Shared by the dropzone (onDrop) and the quick-upload FAB (initialFiles).
 */
export function filesToUploadedImages(files: File[]): UploadedImage[] {
  return files.map((file) => ({ file, preview: URL.createObjectURL(file) }))
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- imageFiles`
Expected: PASS (2 passed).

- [ ] **Step 5: Refactor `onDrop` to use the helper**

In `src/components/admin/upload-artwork/UploadArtworkDialog.tsx`, add the import near the other local imports (alongside the `./types` import on line 33):

```ts
import { filesToUploadedImages } from './imageFiles'
```

Replace the body of `onDrop` (currently lines 193-196):

```ts
    onDrop: (accepted) => {
      const newImages = accepted.map(file => ({ file, preview: URL.createObjectURL(file) }))
      setImages(prev => [...prev, ...newImages])
```

with:

```ts
    onDrop: (accepted) => {
      const newImages = filesToUploadedImages(accepted)
      setImages(prev => [...prev, ...newImages])
```

(Leave the rest of the `onDrop` callback — the draft-save / error lines after it — unchanged.)

- [ ] **Step 6: Verify types and existing tests still pass**

Run: `npm run typecheck`
Expected: no errors.
Run: `npm run test -- upload-artwork`
Expected: PASS (imageFiles + existing draftStorage/useBackgroundUploads suites all green).

- [ ] **Step 7: Commit**

```bash
git add src/components/admin/upload-artwork/imageFiles.ts src/components/admin/upload-artwork/imageFiles.test.ts src/components/admin/upload-artwork/UploadArtworkDialog.tsx
git commit -m "refactor(upload): extract filesToUploadedImages helper"
```

---

### Task 2: `shouldShowQuickUploadFab` visibility predicate

**Files:**
- Create: `src/components/admin/upload-artwork/quickUploadFab.logic.ts`
- Test: `src/components/admin/upload-artwork/quickUploadFab.logic.test.ts`

**Interfaces:**
- Produces:
  - `interface QuickUploadFabVisibility { isAuthenticated: boolean; loading: boolean; pathname: string | null; dialogOpen: boolean }`
  - `shouldShowQuickUploadFab(input: QuickUploadFabVisibility): boolean` — true only when not loading, authenticated, dialog closed, and not on `/login`. (Viewport is handled separately by CSS, not this predicate.)

- [ ] **Step 1: Write the failing test**

Create `src/components/admin/upload-artwork/quickUploadFab.logic.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { shouldShowQuickUploadFab } from './quickUploadFab.logic'

const base = {
  isAuthenticated: true,
  loading: false,
  pathname: '/artworks',
  dialogOpen: false,
}

describe('shouldShowQuickUploadFab', () => {
  it('shows when authenticated, not loading, dialog closed, off the login page', () => {
    expect(shouldShowQuickUploadFab(base)).toBe(true)
  })

  it('is hidden while auth is still loading', () => {
    expect(shouldShowQuickUploadFab({ ...base, loading: true })).toBe(false)
  })

  it('is hidden when not authenticated', () => {
    expect(shouldShowQuickUploadFab({ ...base, isAuthenticated: false })).toBe(false)
  })

  it('is hidden on the login page', () => {
    expect(shouldShowQuickUploadFab({ ...base, pathname: '/login' })).toBe(false)
  })

  it('is hidden while the upload dialog is open', () => {
    expect(shouldShowQuickUploadFab({ ...base, dialogOpen: true })).toBe(false)
  })

  it('tolerates a null pathname', () => {
    expect(shouldShowQuickUploadFab({ ...base, pathname: null })).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- quickUploadFab.logic`
Expected: FAIL — `Failed to resolve import "./quickUploadFab.logic"`.

- [ ] **Step 3: Write minimal implementation**

Create `src/components/admin/upload-artwork/quickUploadFab.logic.ts`:

```ts
export interface QuickUploadFabVisibility {
  isAuthenticated: boolean
  loading: boolean
  pathname: string | null
  dialogOpen: boolean
}

/**
 * Whether the floating quick-upload button should be rendered.
 * Viewport (mobile-only) is handled by CSS (`lg:hidden`), not here.
 */
export function shouldShowQuickUploadFab({
  isAuthenticated,
  loading,
  pathname,
  dialogOpen,
}: QuickUploadFabVisibility): boolean {
  if (loading) return false
  if (!isAuthenticated) return false
  if (dialogOpen) return false
  if (pathname === '/login') return false
  return true
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- quickUploadFab.logic`
Expected: PASS (6 passed).

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/upload-artwork/quickUploadFab.logic.ts src/components/admin/upload-artwork/quickUploadFab.logic.test.ts
git commit -m "feat(upload): add quick-upload FAB visibility predicate"
```

---

### Task 3: `initialFiles` prop + full-screen-on-mobile in `UploadArtworkDialog`

**Files:**
- Modify: `src/components/admin/upload-artwork/UploadArtworkDialog.tsx` (props interface ~58-61; component signature line 65; add a seeding effect; step‑1 `DialogContent` className line 421)

**Interfaces:**
- Consumes: `filesToUploadedImages` from `./imageFiles` (added in Task 1).
- Produces: `UploadArtworkDialog` now accepts an optional `initialFiles?: File[]`. When the dialog opens with `initialFiles` present, `images` is seeded from them so the artist lands on step 1 with thumbnails already populated. Existing callers (`open` + `onClose` only) are unaffected.

> No automated unit test here — this is JSX/effect wiring, which this repo verifies via typecheck/build (it has no `.test.tsx` tests). Manual mobile verification is in Task 5.

- [ ] **Step 1: Add `initialFiles` to the props interface**

In `src/components/admin/upload-artwork/UploadArtworkDialog.tsx`, change the props interface (currently lines 58-61):

```ts
interface UploadArtworkDialogProps {
  open: boolean
  onClose: () => void
}
```

to:

```ts
interface UploadArtworkDialogProps {
  open: boolean
  onClose: () => void
  /** Pre-selected files (e.g. from the mobile quick-upload FAB) to seed step 1. */
  initialFiles?: File[]
}
```

- [ ] **Step 2: Destructure the new prop**

Change the component signature (line 65):

```ts
export function UploadArtworkDialog({ open, onClose }: UploadArtworkDialogProps) {
```

to:

```ts
export function UploadArtworkDialog({ open, onClose, initialFiles }: UploadArtworkDialogProps) {
```

- [ ] **Step 3: Seed `images` from `initialFiles` when the dialog opens**

Immediately after the "Load categories when dialog opens" effect (it ends at line 116, just before the "Check for saved draft" effect at line 118), insert:

```ts
  // Seed step 1 with files passed in from the quick-upload FAB
  useEffect(() => {
    if (open && initialFiles && initialFiles.length > 0) {
      setImages(filesToUploadedImages(initialFiles))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialFiles])
```

(`useEffect` and `setImages` are already imported/defined; `filesToUploadedImages` was imported in Task 1.)

- [ ] **Step 4: Make the step‑1 dialog full-screen on mobile**

Change the step‑1 `DialogContent` className (line 421):

```tsx
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
```

to:

```tsx
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto max-lg:left-0 max-lg:top-0 max-lg:translate-x-0 max-lg:translate-y-0 max-lg:w-screen max-lg:h-dvh max-lg:max-h-dvh max-lg:max-w-none max-lg:rounded-none max-lg:border-0">
```

Rationale (each `max-lg:` overrides a base class from `src/components/ui/dialog.tsx` line 41): `left-[50%]`/`top-[50%]`→`left-0`/`top-0`; `translate-x-[-50%]`/`translate-y-[-50%]`→`translate-*-0`; `w-full`→`w-screen`; height becomes `h-dvh`/`max-h-dvh` (dynamic viewport height, correct under the mobile URL bar); `max-w-lg`/`sm:max-w-[700px]`→`max-w-none`; `sm:rounded-lg`→`rounded-none`; `border`→`border-0`. Above `lg`, all base values still apply, so desktop is unchanged. (Steps 2–4 are untouched: step 2 / `PerImageDetailsStep` already renders `fixed inset-0` full-screen and stacks on mobile; steps 3–4 are brief centered modals.)

- [ ] **Step 5: Verify types and build**

Run: `npm run typecheck`
Expected: no errors.
Run: `npm run build`
Expected: compiles successfully (no type or lint failures).

- [ ] **Step 6: Commit**

```bash
git add src/components/admin/upload-artwork/UploadArtworkDialog.tsx
git commit -m "feat(upload): accept initialFiles and go full-screen on mobile"
```

---

### Task 4: `QuickUploadFab` component

**Files:**
- Create: `src/components/admin/upload-artwork/QuickUploadFab.tsx`

**Interfaces:**
- Consumes: `useAuth` (`@/hooks/useAuth`), `usePathname` (`next/navigation`), `shouldShowQuickUploadFab` (`./quickUploadFab.logic`), `filesToUploadedImages`'s sibling constant `MAX_IMAGE_COUNT` (`./imageFiles`), `UploadArtworkDialog` (`./UploadArtworkDialog`), `Camera` (`lucide-react`).
- Produces: `QuickUploadFab()` — a client component rendering nothing when hidden, a hidden file input + a bottom-right camera button when visible, and the upload dialog once files are picked (capped to `MAX_IMAGE_COUNT`).

- [ ] **Step 1: Create the component**

Create `src/components/admin/upload-artwork/QuickUploadFab.tsx`:

```tsx
'use client'

import { useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Camera } from 'lucide-react'

import { useAuth } from '@/hooks/useAuth'
import { UploadArtworkDialog } from './UploadArtworkDialog'
import { shouldShowQuickUploadFab } from './quickUploadFab.logic'
import { MAX_IMAGE_COUNT } from './imageFiles'

/**
 * Mobile-only floating button for the logged-in artist.
 * Tap -> native Camera/Library picker -> full-screen UploadArtworkDialog
 * with the chosen images preloaded. Mounted once in the root layout.
 */
export function QuickUploadFab() {
  const { isAuthenticated, loading } = useAuth()
  const pathname = usePathname()
  const inputRef = useRef<HTMLInputElement>(null)
  const [files, setFiles] = useState<File[] | null>(null)

  const dialogOpen = files !== null
  const showButton = shouldShowQuickUploadFab({
    isAuthenticated,
    loading,
    pathname,
    dialogOpen,
  })

  function handlePick(e: React.ChangeEvent<HTMLInputElement>) {
    // Cap to the same batch size the dropzone allows.
    const picked = (e.target.files ? Array.from(e.target.files) : []).slice(0, MAX_IMAGE_COUNT)
    // Reset so picking the same file again still fires onChange next time.
    e.target.value = ''
    if (picked.length > 0) setFiles(picked)
  }

  return (
    <>
      {showButton && (
        <>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handlePick}
          />
          <button
            type="button"
            aria-label="Add artwork"
            onClick={() => inputRef.current?.click()}
            style={{ bottom: 'max(1rem, env(safe-area-inset-bottom))' }}
            className="lg:hidden fixed right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gray-900 text-white shadow-lg transition-transform active:scale-95"
          >
            <Camera className="h-6 w-6" />
          </button>
        </>
      )}

      {dialogOpen && (
        <UploadArtworkDialog
          open
          initialFiles={files ?? undefined}
          onClose={() => setFiles(null)}
        />
      )}
    </>
  )
}
```

- [ ] **Step 2: Verify types and build**

Run: `npm run typecheck`
Expected: no errors.
Run: `npm run lint`
Expected: no errors for `QuickUploadFab.tsx`.

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/upload-artwork/QuickUploadFab.tsx
git commit -m "feat(upload): add mobile QuickUploadFab component"
```

---

### Task 5: Mount the FAB in the root layout

**Files:**
- Modify: `src/app/layout.tsx` (import + render inside `<AuthProvider>`)

**Interfaces:**
- Consumes: `QuickUploadFab` from `@/components/admin/upload-artwork/QuickUploadFab`.

- [ ] **Step 1: Import the component**

In `src/app/layout.tsx`, add below the existing `AuthProvider` import (line 5):

```ts
import { QuickUploadFab } from '@/components/admin/upload-artwork/QuickUploadFab'
```

- [ ] **Step 2: Render it inside `<AuthProvider>`**

Change the provider block (lines 63-68):

```tsx
        <AuthProvider>
          <ConditionalHeader />
          <main className="min-h-screen">
            {children}
          </main>
        </AuthProvider>
```

to:

```tsx
        <AuthProvider>
          <ConditionalHeader />
          <main className="min-h-screen">
            {children}
          </main>
          <QuickUploadFab />
        </AuthProvider>
```

- [ ] **Step 3: Verify types and build**

Run: `npm run typecheck`
Expected: no errors.
Run: `npm run build`
Expected: compiles successfully.

- [ ] **Step 4: Manual mobile verification**

Run: `npm run dev`, open the site, and in browser devtools toggle a mobile viewport (e.g. iPhone). Confirm:
- Logged **out**: no camera button anywhere (and none on `/login`).
- Logged **in**: a 56px camera button at the bottom-right on a public page **and** on an admin page (e.g. `/artworks`); it does not overlap the bottom-left sidebar toggle.
- Tap → the OS file picker opens (on a real phone: Take Photo / Photo Library / Choose File; in desktop devtools: the file dialog).
- Pick one or more images → `UploadArtworkDialog` opens **full-screen** with the images preloaded as thumbnails; the FAB is hidden while it is open.
- Desktop (width ≥ 1024px): no FAB; the dialog opens centered as before (regression check).
- Close the dialog → returns to the page; the FAB reappears.
- **On a real iPhone:** take a photo with the camera and pick HEIC photos from the library; confirm they arrive as usable images (iOS typically transcodes to JPEG via `accept="image/*"`) and upload succeeds. If an unsupported/oversized file slips through, confirm it surfaces in the dialog's "some uploads need attention" step with a working Retry (graceful failure, no crash).
- Selecting more than 20 images seeds only the first 20 (matches the dropzone cap).

- [ ] **Step 5: Commit**

```bash
git add src/app/layout.tsx
git commit -m "feat(upload): mount QuickUploadFab globally on mobile"
```

---

## Self-Review

**Spec coverage:**
- Floating camera button, lower-right, mobile, logged-in only → Tasks 4 (button + `lg:hidden` + safe-area) & 5 (mount) & 2 (auth predicate). ✓
- Available on all pages (admin + public) → Task 5 mounts in the shared root layout. ✓
- Tap prompts camera *or* photos → Task 4 file input `accept="image/*"` with no `capture`. ✓
- Upload screen comes up full-screen → Task 3 `max-lg:` overrides on step‑1 (step 2 already full-screen). ✓
- Images preloaded → Tasks 1 (helper) + 3 (`initialFiles` seeding). ✓
- Hidden on `/login`, while dialog open, on desktop → Task 2 predicate + `lg:hidden`. ✓

**Placeholder scan:** No TBD/TODO; every code step shows complete code; every command has expected output. ✓

**Type consistency:** `UploadedImage` `{ file, preview }` matches `types.ts`. `filesToUploadedImages(File[]): UploadedImage[]` defined in Task 1, consumed in Tasks 1 (onDrop) & 3 (seeding). `shouldShowQuickUploadFab(QuickUploadFabVisibility): boolean` defined in Task 2, consumed in Task 4 with matching field names/types (`isAuthenticated`, `loading`, `pathname: string | null`, `dialogOpen`). `useAuth()` returns `{ isAuthenticated, loading }` as used. `initialFiles?: File[]` defined in Task 3, passed in Task 4 (`files ?? undefined`). `MAX_IMAGE_COUNT` exported from `imageFiles.ts` in Task 1, consumed in Task 4. ✓
