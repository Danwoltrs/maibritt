# Background Artwork Upload Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the end-of-flow batch upload in the admin artwork dialog with progressive per-Next background uploads, add localStorage-based session recovery, and switch the per-image detail view to a two-column (large image left, form right) layout.

**Architecture:** A new client-side React hook `useBackgroundUploads` owns per-artwork upload state machines (idle/queued/uploading/uploaded/failed) with a concurrency cap of 2 and silent retry × 2 with exponential backoff. `UploadArtworkDialog` calls `startUpload(i)` on each Next click and gates the success screen on a finalizer that drains pending and addresses failed uploads. `PerImageDetailsStep` becomes a two-column layout on `md+` screens and persists form text to localStorage for session recovery. No server changes — uses existing `ArtworkService.createArtwork` / `updateArtwork`.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Tailwind CSS, shadcn/ui, react-dropzone, Supabase, Vitest + @testing-library/react (newly added), Framer Motion (already present).

**Spec:** `docs/superpowers/specs/2026-05-03-background-artwork-upload-design.md`

---

## File Structure

**New files:**
- `src/components/admin/upload-artwork/useBackgroundUploads.ts` — the hook (state machine, retry, concurrency)
- `src/components/admin/upload-artwork/useBackgroundUploads.test.ts` — unit tests for the hook
- `src/components/admin/upload-artwork/draftStorage.ts` — pure helpers for reading/writing localStorage drafts
- `src/components/admin/upload-artwork/draftStorage.test.ts` — unit tests for draft helpers
- `src/components/admin/upload-artwork/SessionRecoveryDialog.tsx` — "Resume previous session?" prompt
- `src/components/admin/upload-artwork/types.ts` — shared types extracted from existing files
- `vitest.config.ts` — test runner config
- `vitest.setup.ts` — test setup (jest-dom matchers)

**Modified files:**
- `src/components/admin/upload-artwork/UploadArtworkDialog.tsx` — wires hook, removes batch loop, adds finalizer screen, mounts recovery dialog
- `src/components/admin/upload-artwork/PerImageDetailsStep.tsx` — two-column layout, status badges, jump-to-failed, beforeunload
- `src/components/admin/upload-artwork/index.ts` — re-exports
- `package.json` — adds vitest + testing libs + test script
- `tsconfig.json` — verifies vitest types are picked up (only if needed)

**Untouched:**
- `src/services/artwork.service.ts` — `createArtwork` and `updateArtwork` already do what we need
- `src/services/storage.service.ts`

---

## Task 1: Add Vitest + React Testing Library

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `vitest.setup.ts`

- [ ] **Step 1: Install dependencies**

Run:
```bash
npm install -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom @vitejs/plugin-react
```

Expected: packages added to `devDependencies`. No errors.

- [ ] **Step 2: Add `test` script to `package.json`**

In `package.json`, modify the `"scripts"` block to add:

```json
"test": "vitest run",
"test:watch": "vitest"
```

Final scripts block:

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "next lint",
  "typecheck": "tsc --noEmit",
  "test": "vitest run",
  "test:watch": "vitest"
}
```

- [ ] **Step 3: Create `vitest.config.ts`**

Create file `vitest.config.ts` at the repo root:

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

- [ ] **Step 4: Create `vitest.setup.ts`**

Create file `vitest.setup.ts` at the repo root:

```ts
import '@testing-library/jest-dom/vitest'
```

- [ ] **Step 5: Smoke-test the runner**

Create `src/__smoke__/smoke.test.ts`:

```ts
import { describe, it, expect } from 'vitest'

describe('smoke', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2)
  })
})
```

Run: `npm test`
Expected: 1 test passes.

- [ ] **Step 6: Delete the smoke test**

```bash
rm -rf src/__smoke__
```

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json vitest.config.ts vitest.setup.ts
git commit -m "chore: add vitest + react testing library"
```

---

## Task 2: Extract shared types

**Files:**
- Create: `src/components/admin/upload-artwork/types.ts`
- Modify: `src/components/admin/upload-artwork/UploadArtworkDialog.tsx`
- Modify: `src/components/admin/upload-artwork/PerImageDetailsStep.tsx`

- [ ] **Step 1: Create `types.ts`**

Create `src/components/admin/upload-artwork/types.ts`:

```ts
export interface UploadedImage {
  file: File
  preview: string
}

export interface ArtworkDetails {
  titlePt: string
  titleEn: string
  mediumPt: string
  mediumEn: string
  dimensions: string
  descriptionPt: string
  descriptionEn: string
  featured: boolean
  category?: string
  year?: number
}

export interface CommonMetadata {
  category?: string
  year?: number
}

export interface ApplyToAll {
  category: boolean
  year: boolean
}

export interface CommonApplied {
  category?: string
  year?: number
}
```

- [ ] **Step 2: Update `UploadArtworkDialog.tsx` to import shared types**

In `src/components/admin/upload-artwork/UploadArtworkDialog.tsx`, replace the local interface declarations for `UploadedImage`, `CommonMetadata`, and `ApplyToAll` with an import:

Find:
```ts
interface UploadedImage {
  file: File
  preview: string
}
```

…and the `CommonMetadata` and `ApplyToAll` interfaces. Replace all three with:

```ts
import type { UploadedImage, CommonMetadata, ApplyToAll } from './types'
```

Also change the existing import from `./PerImageDetailsStep`:
```ts
import { PerImageDetailsStep, type ArtworkDetails } from './PerImageDetailsStep'
```
to:
```ts
import { PerImageDetailsStep } from './PerImageDetailsStep'
import type { ArtworkDetails } from './types'
```

- [ ] **Step 3: Update `PerImageDetailsStep.tsx` to import shared types**

In `src/components/admin/upload-artwork/PerImageDetailsStep.tsx`, replace the local `UploadedImage`, `ArtworkDetails`, `CommonApplied` interfaces with:

```ts
import type { UploadedImage, ArtworkDetails, CommonApplied } from './types'
```

Remove the `export interface ArtworkDetails { ... }` block — it's now in `types.ts`.

- [ ] **Step 4: Re-export `ArtworkDetails` from `PerImageDetailsStep` for backwards compat**

Still in `PerImageDetailsStep.tsx`, after the imports, add:

```ts
export type { ArtworkDetails } from './types'
```

- [ ] **Step 5: Verify typecheck and lint pass**

Run: `npm run typecheck`
Expected: no errors.

Run: `npm run lint`
Expected: no new errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/admin/upload-artwork/types.ts src/components/admin/upload-artwork/UploadArtworkDialog.tsx src/components/admin/upload-artwork/PerImageDetailsStep.tsx
git commit -m "refactor: extract shared types for upload-artwork module"
```

---

## Task 3: Draft storage helpers (TDD)

**Files:**
- Create: `src/components/admin/upload-artwork/draftStorage.ts`
- Create: `src/components/admin/upload-artwork/draftStorage.test.ts`

- [ ] **Step 1: Write the failing test for `saveDraft`/`loadDraft` round-trip**

Create `src/components/admin/upload-artwork/draftStorage.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { saveDraft, loadDraft, clearDraft, DRAFT_KEY } from './draftStorage'
import type { ArtworkDetails, CommonMetadata, ApplyToAll } from './types'

const sampleDetails: Record<number, ArtworkDetails> = {
  0: {
    titlePt: 'Obra Um', titleEn: 'Work One',
    mediumPt: '', mediumEn: '', dimensions: '',
    descriptionPt: '', descriptionEn: '', featured: false,
  },
}
const sampleCommon: CommonMetadata = { year: 2026, category: 'painting' }
const sampleApply: ApplyToAll = { category: true, year: true }

describe('draftStorage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('round-trips a saved draft', () => {
    saveDraft({
      commonMeta: sampleCommon,
      applyToAll: sampleApply,
      artworkDetails: sampleDetails,
      fileHints: [{ name: 'a.jpg', size: 100 }],
    })
    const loaded = loadDraft()
    expect(loaded).not.toBeNull()
    expect(loaded?.artworkDetails[0].titleEn).toBe('Work One')
    expect(loaded?.fileHints[0].name).toBe('a.jpg')
  })

  it('returns null when no draft exists', () => {
    expect(loadDraft()).toBeNull()
  })

  it('returns null when draft is older than 7 days', () => {
    const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
    localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({
        savedAt: eightDaysAgo,
        commonMeta: sampleCommon,
        applyToAll: sampleApply,
        artworkDetails: sampleDetails,
        fileHints: [],
      })
    )
    expect(loadDraft()).toBeNull()
  })

  it('clearDraft removes the entry', () => {
    saveDraft({
      commonMeta: sampleCommon,
      applyToAll: sampleApply,
      artworkDetails: sampleDetails,
      fileHints: [],
    })
    clearDraft()
    expect(loadDraft()).toBeNull()
  })

  it('returns null when stored JSON is corrupt', () => {
    localStorage.setItem(DRAFT_KEY, '{not json')
    expect(loadDraft()).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- draftStorage`
Expected: FAIL with "Cannot find module './draftStorage'" or similar.

- [ ] **Step 3: Implement `draftStorage.ts`**

Create `src/components/admin/upload-artwork/draftStorage.ts`:

```ts
import type { ArtworkDetails, CommonMetadata, ApplyToAll } from './types'

export const DRAFT_KEY = 'mbw-upload-draft-v1'
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000

export interface FileHint {
  name: string
  size: number
}

export interface DraftPayload {
  commonMeta: CommonMetadata
  applyToAll: ApplyToAll
  artworkDetails: Record<number, ArtworkDetails>
  fileHints: FileHint[]
}

interface StoredDraft extends DraftPayload {
  savedAt: string
}

export function saveDraft(payload: DraftPayload): void {
  if (typeof window === 'undefined') return
  const stored: StoredDraft = { ...payload, savedAt: new Date().toISOString() }
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(stored))
  } catch {
    // localStorage full or disabled — silently ignore
  }
}

export function loadDraft(): StoredDraft | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(DRAFT_KEY)
  if (!raw) return null
  let parsed: StoredDraft
  try {
    parsed = JSON.parse(raw) as StoredDraft
  } catch {
    return null
  }
  if (!parsed.savedAt) return null
  const age = Date.now() - new Date(parsed.savedAt).getTime()
  if (Number.isNaN(age) || age > MAX_AGE_MS) return null
  return parsed
}

export function clearDraft(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(DRAFT_KEY)
}

export function draftHasContent(draft: StoredDraft | null): boolean {
  if (!draft) return false
  return Object.values(draft.artworkDetails).some(
    (d) =>
      (d.titlePt || '').trim() ||
      (d.titleEn || '').trim() ||
      (d.descriptionPt || '').trim() ||
      (d.descriptionEn || '').trim()
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- draftStorage`
Expected: 5 tests pass.

- [ ] **Step 5: Add a test for `draftHasContent`**

Append to `draftStorage.test.ts`:

```ts
describe('draftHasContent', () => {
  it('returns false for null', async () => {
    const { draftHasContent } = await import('./draftStorage')
    expect(draftHasContent(null)).toBe(false)
  })

  it('returns true when at least one artwork has a title', async () => {
    const { draftHasContent } = await import('./draftStorage')
    expect(
      draftHasContent({
        savedAt: new Date().toISOString(),
        commonMeta: {},
        applyToAll: { category: false, year: false },
        artworkDetails: {
          0: {
            titlePt: '', titleEn: 'Hello',
            mediumPt: '', mediumEn: '', dimensions: '',
            descriptionPt: '', descriptionEn: '', featured: false,
          },
        },
        fileHints: [],
      })
    ).toBe(true)
  })

  it('returns false when all artworks are empty', async () => {
    const { draftHasContent } = await import('./draftStorage')
    expect(
      draftHasContent({
        savedAt: new Date().toISOString(),
        commonMeta: {},
        applyToAll: { category: false, year: false },
        artworkDetails: {
          0: {
            titlePt: '', titleEn: '',
            mediumPt: '', mediumEn: '', dimensions: '',
            descriptionPt: '', descriptionEn: '', featured: false,
          },
        },
        fileHints: [],
      })
    ).toBe(false)
  })
})
```

Run: `npm test -- draftStorage`
Expected: 8 tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/components/admin/upload-artwork/draftStorage.ts src/components/admin/upload-artwork/draftStorage.test.ts
git commit -m "feat: add localStorage draft helpers for upload flow"
```

---

## Task 4: `useBackgroundUploads` hook — state machine + happy path (TDD)

**Files:**
- Create: `src/components/admin/upload-artwork/useBackgroundUploads.ts`
- Create: `src/components/admin/upload-artwork/useBackgroundUploads.test.ts`

- [ ] **Step 1: Write the failing test for state transition `idle → uploading → uploaded`**

Create `src/components/admin/upload-artwork/useBackgroundUploads.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useBackgroundUploads } from './useBackgroundUploads'

vi.mock('@/services/artwork.service', () => ({
  ArtworkService: {
    createArtwork: vi.fn(),
    updateArtwork: vi.fn(),
  },
}))

import { ArtworkService } from '@/services/artwork.service'

const mockCreate = ArtworkService.createArtwork as unknown as ReturnType<typeof vi.fn>
const mockUpdate = ArtworkService.updateArtwork as unknown as ReturnType<typeof vi.fn>

const samplePayload = {
  title: { ptBR: 'A', en: 'A' },
  year: 2026,
  medium: { ptBR: '', en: '' },
  dimensions: '',
  description: { ptBR: '', en: '' },
  category: 'painting' as const,
  images: [new File(['x'], 'a.jpg', { type: 'image/jpeg' })],
  featured: false,
}

beforeEach(() => {
  mockCreate.mockReset()
  mockUpdate.mockReset()
})

describe('useBackgroundUploads — happy path', () => {
  it('starts at idle and transitions to uploaded on success', async () => {
    mockCreate.mockResolvedValue({ id: 'artwork-1' })
    const { result } = renderHook(() => useBackgroundUploads())

    expect(result.current.getState(0).status).toBe('idle')

    act(() => {
      result.current.startUpload(0, samplePayload)
    })

    await waitFor(() =>
      expect(result.current.getState(0).status).toBe('uploaded')
    )
    const state = result.current.getState(0)
    if (state.status === 'uploaded') {
      expect(state.artworkId).toBe('artwork-1')
    }
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- useBackgroundUploads`
Expected: FAIL with "Cannot find module './useBackgroundUploads'".

- [ ] **Step 3: Implement minimal hook**

Create `src/components/admin/upload-artwork/useBackgroundUploads.ts`:

```ts
import { useCallback, useRef, useState } from 'react'
import { ArtworkService, type ArtworkCreateData, type ArtworkUpdateData } from '@/services/artwork.service'

export type UploadState =
  | { status: 'idle' }
  | { status: 'queued' }
  | { status: 'uploading'; progress: number }
  | { status: 'uploaded'; artworkId: string }
  | { status: 'failed'; error: string; attempts: number }

const IDLE: UploadState = { status: 'idle' }
const MAX_ATTEMPTS = 3
const CONCURRENCY = 2
const RETRY_DELAYS_MS = [1_000, 3_000]

export interface UseBackgroundUploadsApi {
  startUpload: (index: number, payload: ArtworkCreateData) => void
  retry: (index: number) => void
  updateUploaded: (index: number, payload: ArtworkUpdateData) => void
  getState: (index: number) => UploadState
  pendingCount: number
  failedCount: number
  uploadedCount: number
  allDone: boolean
}

interface QueueEntry {
  index: number
  payload: ArtworkCreateData
  attempt: number
}

export function useBackgroundUploads(): UseBackgroundUploadsApi {
  const [states, setStates] = useState<Record<number, UploadState>>({})
  const queueRef = useRef<QueueEntry[]>([])
  const inFlightRef = useRef(0)
  const lastPayloadRef = useRef<Record<number, ArtworkCreateData>>({})

  const setState = useCallback((index: number, next: UploadState) => {
    setStates((prev) => ({ ...prev, [index]: next }))
  }, [])

  const drain = useCallback(() => {
    while (inFlightRef.current < CONCURRENCY && queueRef.current.length > 0) {
      const entry = queueRef.current.shift()!
      inFlightRef.current += 1
      setState(entry.index, { status: 'uploading', progress: 0 })

      ArtworkService.createArtwork(entry.payload, (progress) => {
        setState(entry.index, { status: 'uploading', progress: progress.percentage })
      })
        .then((artwork: { id: string }) => {
          setState(entry.index, { status: 'uploaded', artworkId: artwork.id })
        })
        .catch((err: unknown) => {
          const message = err instanceof Error ? err.message : 'Upload failed'
          const isRetryable = isRetryableError(err)
          if (isRetryable && entry.attempt < MAX_ATTEMPTS) {
            const delay = RETRY_DELAYS_MS[entry.attempt - 1] ?? 3_000
            setTimeout(() => {
              queueRef.current.push({ ...entry, attempt: entry.attempt + 1 })
              drain()
            }, delay)
          } else {
            setState(entry.index, {
              status: 'failed',
              error: message,
              attempts: entry.attempt,
            })
          }
        })
        .finally(() => {
          inFlightRef.current -= 1
          drain()
        })
    }
  }, [setState])

  const startUpload = useCallback(
    (index: number, payload: ArtworkCreateData) => {
      lastPayloadRef.current[index] = payload
      setState(index, { status: 'queued' })
      queueRef.current.push({ index, payload, attempt: 1 })
      drain()
    },
    [drain, setState]
  )

  const retry = useCallback(
    (index: number) => {
      const payload = lastPayloadRef.current[index]
      if (!payload) return
      setState(index, { status: 'queued' })
      queueRef.current.push({ index, payload, attempt: 1 })
      drain()
    },
    [drain, setState]
  )

  const updateUploaded = useCallback(
    (index: number, payload: ArtworkUpdateData) => {
      const current = states[index]
      if (current?.status !== 'uploaded') return
      const artworkId = current.artworkId
      ArtworkService.updateArtwork(artworkId, payload).catch((err) => {
        const message = err instanceof Error ? err.message : 'Update failed'
        setState(index, { status: 'failed', error: message, attempts: 1 })
      })
    },
    [setState, states]
  )

  const getState = useCallback(
    (index: number): UploadState => states[index] ?? IDLE,
    [states]
  )

  const values = Object.values(states)
  const pendingCount = values.filter(
    (s) => s.status === 'queued' || s.status === 'uploading'
  ).length
  const failedCount = values.filter((s) => s.status === 'failed').length
  const uploadedCount = values.filter((s) => s.status === 'uploaded').length
  const startedCount = values.length
  const allDone =
    startedCount > 0 && pendingCount === 0 && failedCount === 0

  return {
    startUpload,
    retry,
    updateUploaded,
    getState,
    pendingCount,
    failedCount,
    uploadedCount,
    allDone,
  }
}

function isRetryableError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return true
  const anyErr = err as { status?: number; statusCode?: number; message?: string }
  const status = anyErr.status ?? anyErr.statusCode
  if (typeof status === 'number') {
    if (status >= 400 && status < 500) return false
    return true
  }
  return true
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- useBackgroundUploads`
Expected: 1 test passes.

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/upload-artwork/useBackgroundUploads.ts src/components/admin/upload-artwork/useBackgroundUploads.test.ts
git commit -m "feat: add useBackgroundUploads hook (happy path)"
```

---

## Task 5: `useBackgroundUploads` — concurrency cap test

**Files:**
- Modify: `src/components/admin/upload-artwork/useBackgroundUploads.test.ts`

- [ ] **Step 1: Add a test that 3 concurrent starts run at most 2 in parallel**

Append to `useBackgroundUploads.test.ts`:

```ts
describe('useBackgroundUploads — concurrency cap', () => {
  it('runs at most 2 uploads in parallel', async () => {
    let inFlight = 0
    let maxInFlight = 0
    const resolvers: Array<() => void> = []

    mockCreate.mockImplementation(() => {
      inFlight += 1
      maxInFlight = Math.max(maxInFlight, inFlight)
      return new Promise<{ id: string }>((resolve) => {
        resolvers.push(() => {
          inFlight -= 1
          resolve({ id: `id-${resolvers.length}` })
        })
      })
    })

    const { result } = renderHook(() => useBackgroundUploads())

    act(() => {
      result.current.startUpload(0, samplePayload)
      result.current.startUpload(1, samplePayload)
      result.current.startUpload(2, samplePayload)
      result.current.startUpload(3, samplePayload)
    })

    await waitFor(() => expect(mockCreate).toHaveBeenCalledTimes(2))
    expect(maxInFlight).toBe(2)

    // Resolve first two; next two should now run.
    act(() => {
      resolvers[0]()
      resolvers[1]()
    })

    await waitFor(() => expect(mockCreate).toHaveBeenCalledTimes(4))
    expect(maxInFlight).toBe(2)

    act(() => {
      resolvers[2]()
      resolvers[3]()
    })

    await waitFor(() =>
      expect(result.current.allDone).toBe(true)
    )
  })
})
```

- [ ] **Step 2: Run tests**

Run: `npm test -- useBackgroundUploads`
Expected: all pass (existing + new).

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/upload-artwork/useBackgroundUploads.test.ts
git commit -m "test: cover concurrency cap in useBackgroundUploads"
```

---

## Task 6: `useBackgroundUploads` — retry logic tests

**Files:**
- Modify: `src/components/admin/upload-artwork/useBackgroundUploads.test.ts`

- [ ] **Step 1: Add fake-timer test for retry on network error**

Append to `useBackgroundUploads.test.ts`:

```ts
describe('useBackgroundUploads — retries', () => {
  it('retries up to 2 times on network/5xx errors and succeeds', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    mockCreate
      .mockRejectedValueOnce(Object.assign(new Error('boom'), { status: 503 }))
      .mockRejectedValueOnce(Object.assign(new Error('boom'), { status: 503 }))
      .mockResolvedValueOnce({ id: 'art-after-retry' })

    const { result } = renderHook(() => useBackgroundUploads())
    act(() => {
      result.current.startUpload(0, samplePayload)
    })

    await waitFor(() => expect(mockCreate).toHaveBeenCalledTimes(1))
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1_000)
    })
    await waitFor(() => expect(mockCreate).toHaveBeenCalledTimes(2))
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3_000)
    })
    await waitFor(() => expect(mockCreate).toHaveBeenCalledTimes(3))

    await waitFor(() =>
      expect(result.current.getState(0).status).toBe('uploaded')
    )
    vi.useRealTimers()
  })

  it('fails fast on 4xx without retry', async () => {
    mockCreate.mockRejectedValueOnce(
      Object.assign(new Error('bad request'), { status: 400 })
    )
    const { result } = renderHook(() => useBackgroundUploads())
    act(() => {
      result.current.startUpload(0, samplePayload)
    })

    await waitFor(() =>
      expect(result.current.getState(0).status).toBe('failed')
    )
    expect(mockCreate).toHaveBeenCalledTimes(1)
  })

  it('marks as failed after retries exhausted', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    mockCreate.mockRejectedValue(
      Object.assign(new Error('boom'), { status: 503 })
    )
    const { result } = renderHook(() => useBackgroundUploads())
    act(() => {
      result.current.startUpload(0, samplePayload)
    })

    await waitFor(() => expect(mockCreate).toHaveBeenCalledTimes(1))
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1_000)
    })
    await waitFor(() => expect(mockCreate).toHaveBeenCalledTimes(2))
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3_000)
    })
    await waitFor(() => expect(mockCreate).toHaveBeenCalledTimes(3))

    await waitFor(() =>
      expect(result.current.getState(0).status).toBe('failed')
    )
    vi.useRealTimers()
  })
})
```

- [ ] **Step 2: Run tests**

Run: `npm test -- useBackgroundUploads`
Expected: all pass.

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/upload-artwork/useBackgroundUploads.test.ts
git commit -m "test: cover retry logic in useBackgroundUploads"
```

---

## Task 7: `useBackgroundUploads` — `retry()` and `updateUploaded()` tests

**Files:**
- Modify: `src/components/admin/upload-artwork/useBackgroundUploads.test.ts`

- [ ] **Step 1: Add tests**

Append to `useBackgroundUploads.test.ts`:

```ts
describe('useBackgroundUploads — manual retry', () => {
  it('retry() re-queues a failed upload using the original payload', async () => {
    mockCreate
      .mockRejectedValueOnce(
        Object.assign(new Error('bad'), { status: 400 })
      )
      .mockResolvedValueOnce({ id: 'art-retry' })

    const { result } = renderHook(() => useBackgroundUploads())
    act(() => {
      result.current.startUpload(0, samplePayload)
    })
    await waitFor(() =>
      expect(result.current.getState(0).status).toBe('failed')
    )

    act(() => {
      result.current.retry(0)
    })
    await waitFor(() =>
      expect(result.current.getState(0).status).toBe('uploaded')
    )
  })
})

describe('useBackgroundUploads — updateUploaded', () => {
  it('calls ArtworkService.updateArtwork with the artwork id', async () => {
    mockCreate.mockResolvedValueOnce({ id: 'art-7' })
    mockUpdate.mockResolvedValueOnce({ id: 'art-7' })
    const { result } = renderHook(() => useBackgroundUploads())

    act(() => {
      result.current.startUpload(0, samplePayload)
    })
    await waitFor(() =>
      expect(result.current.getState(0).status).toBe('uploaded')
    )

    act(() => {
      result.current.updateUploaded(0, { title: { ptBR: 'novo', en: 'new' } })
    })

    await waitFor(() => expect(mockUpdate).toHaveBeenCalledTimes(1))
    expect(mockUpdate).toHaveBeenCalledWith('art-7', {
      title: { ptBR: 'novo', en: 'new' },
    })
  })

  it('updateUploaded is a no-op when state is not uploaded', () => {
    const { result } = renderHook(() => useBackgroundUploads())
    act(() => {
      result.current.updateUploaded(0, { title: { ptBR: 'x', en: 'x' } })
    })
    expect(mockUpdate).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run tests**

Run: `npm test -- useBackgroundUploads`
Expected: all pass.

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/upload-artwork/useBackgroundUploads.test.ts
git commit -m "test: cover manual retry and updateUploaded paths"
```

---

## Task 8: `SessionRecoveryDialog` component

**Files:**
- Create: `src/components/admin/upload-artwork/SessionRecoveryDialog.tsx`

- [ ] **Step 1: Create the component**

Create `src/components/admin/upload-artwork/SessionRecoveryDialog.tsx`:

```tsx
'use client'

import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { History } from 'lucide-react'

interface SessionRecoveryDialogProps {
  open: boolean
  artworkCount: number
  savedAt: string
  fileNames: string[]
  onResume: () => void
  onStartFresh: () => void
}

export function SessionRecoveryDialog({
  open,
  artworkCount,
  savedAt,
  fileNames,
  onResume,
  onStartFresh,
}: SessionRecoveryDialogProps) {
  const formattedDate = formatSavedAt(savedAt)
  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-[500px]"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Resume previous session?
          </DialogTitle>
          <DialogDescription>
            You had <strong>{artworkCount}</strong> artwork
            {artworkCount === 1 ? '' : 's'} in progress on{' '}
            <strong>{formattedDate}</strong>. Pictures need to be re-attached,
            but your titles and descriptions are saved.
          </DialogDescription>
        </DialogHeader>

        {fileNames.length > 0 && (
          <div className="text-sm text-muted-foreground">
            <p className="font-medium mb-1">Original file names:</p>
            <ul className="list-disc pl-5 space-y-0.5">
              {fileNames.slice(0, 8).map((n, i) => (
                <li key={i}>{n}</li>
              ))}
              {fileNames.length > 8 && (
                <li>…and {fileNames.length - 8} more</li>
              )}
            </ul>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onStartFresh}>
            Start fresh
          </Button>
          <Button onClick={onResume}>Resume</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function formatSavedAt(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  } catch {
    return iso
  }
}
```

- [ ] **Step 2: Verify it typechecks**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/upload-artwork/SessionRecoveryDialog.tsx
git commit -m "feat: add SessionRecoveryDialog component"
```

---

## Task 9: Wire `useBackgroundUploads` into `UploadArtworkDialog`

**Files:**
- Modify: `src/components/admin/upload-artwork/UploadArtworkDialog.tsx`

This is the structural change that flips the flow from batch-at-end to per-Next. We replace the existing `handleSubmit` loop with a hook-driven flow and add a "finalizer" step.

- [ ] **Step 1: Add hook + state changes for finalizer step**

In `UploadArtworkDialog.tsx`:

a) Add new imports near the top (after existing imports):

```ts
import { useBackgroundUploads } from './useBackgroundUploads'
```

b) Update the `step` state union to include `'finalizing'`:

```ts
const [step, setStep] = useState<'upload' | 'details' | 'finalizing' | 'success'>('upload')
```

c) Inside the component body (after the state declarations near line 92), instantiate the hook:

```ts
const uploads = useBackgroundUploads()
```

d) Remove the now-unused `isSubmitting` and `uploadProgress` state (lines ~92–94). They will be replaced by hook-derived values.

- [ ] **Step 2: Replace `handleSubmit` with a finalizer-driven flow**

Replace the entire `handleSubmit` function (currently around lines 175–211):

```ts
const handleSubmit = async () => {
  setError(null)
  setStep('finalizing')
}
```

The actual upload work has already been kicked off by `Next` clicks. Finish just transitions to the finalizer screen, which watches the hook and advances when ready.

- [ ] **Step 3: Add an effect that auto-advances `finalizing → success`**

Just after the `uploads` hook line, add:

```ts
useEffect(() => {
  if (step === 'finalizing' && uploads.allDone) {
    setStep('success')
    fireConfetti()
  }
}, [step, uploads.allDone])
```

- [ ] **Step 4: Build the `buildPayload` helper**

Inside the component, before `handleSubmit`, add:

```ts
const buildPayload = useCallback(
  (i: number) => {
    const d = artworkDetails[i]
    const category = applyToAll.category ? commonMeta.category : d?.category
    const year = applyToAll.year ? commonMeta.year : d?.year ?? new Date().getFullYear()
    return {
      title: { ptBR: d.titlePt, en: d.titleEn },
      year,
      medium: { ptBR: d.mediumPt, en: d.mediumEn },
      dimensions: d.dimensions,
      description: { ptBR: d.descriptionPt, en: d.descriptionEn },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      category: category as any,
      images: [images[i].file],
      featured: d.featured,
    }
  },
  [artworkDetails, applyToAll, commonMeta, images]
)
```

- [ ] **Step 5: Pass new props down to `PerImageDetailsStep`**

Replace the `if (step === 'details')` block (around lines 234–248) with:

```tsx
if (step === 'details') {
  return (
    <PerImageDetailsStep
      images={images}
      artworkDetails={artworkDetails}
      onUpdateDetails={handleUpdateDetails}
      commonApplied={commonApplied}
      onBack={() => setStep('upload')}
      onSubmit={handleSubmit}
      onUploadIndex={(i) => {
        const state = uploads.getState(i)
        if (state.status === 'uploaded') {
          uploads.updateUploaded(i, buildPayload(i))
        } else {
          uploads.startUpload(i, buildPayload(i))
        }
      }}
      onRetryIndex={(i) => uploads.retry(i)}
      getUploadState={uploads.getState}
      error={error}
    />
  )
}
```

- [ ] **Step 6: Replace the `submitting` step with the new `finalizing` screen**

Replace the entire `if (step === 'submitting')` block (lines ~250–269) with:

```tsx
if (step === 'finalizing') {
  const failedIndices = images
    .map((_, i) => i)
    .filter((i) => uploads.getState(i).status === 'failed')

  return (
    <Dialog open={true} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-[500px]"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>
            {failedIndices.length > 0 ? 'Some uploads need attention' : 'Finalizing…'}
          </DialogTitle>
        </DialogHeader>

        {failedIndices.length === 0 ? (
          <div className="py-8 text-center space-y-3">
            <Loader2 className="h-10 w-10 mx-auto text-blue-500 animate-spin" />
            <p className="text-sm text-gray-600">
              Finalizing {uploads.pendingCount} of {images.length} still uploading…
            </p>
          </div>
        ) : (
          <div className="space-y-3 py-2">
            <p className="text-sm text-gray-600">
              {failedIndices.length} artwork{failedIndices.length === 1 ? '' : 's'} failed to upload.
            </p>
            <ul className="space-y-2">
              {failedIndices.map((i) => {
                const state = uploads.getState(i)
                const errorMsg = state.status === 'failed' ? state.error : 'Unknown error'
                const title = artworkDetails[i]?.titleEn || artworkDetails[i]?.titlePt || `Artwork ${i + 1}`
                return (
                  <li key={i} className="flex items-center gap-3 border rounded-md p-2">
                    <img src={images[i].preview} alt="" className="w-12 h-12 object-cover rounded" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{title}</p>
                      <p className="text-xs text-red-600 truncate">{errorMsg}</p>
                    </div>
                    <Button size="sm" onClick={() => uploads.retry(i)}>Retry</Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setStep('details')}
                    >
                      Edit
                    </Button>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 7: Update success screen text to use `uploads.uploadedCount`**

In the existing `if (step === 'success')` block, change:

```tsx
<h2 className="text-2xl font-bold text-gray-900">
  {images.length} Artwork{images.length > 1 ? 's' : ''} Created!
</h2>
```

…to:

```tsx
<h2 className="text-2xl font-bold text-gray-900">
  {uploads.uploadedCount} Artwork{uploads.uploadedCount > 1 ? 's' : ''} Created!
</h2>
```

- [ ] **Step 8: Add `useCallback` and `useEffect` to imports if missing**

At the top of the file, ensure the React import line is:

```ts
import React, { useState, useEffect, useRef, useCallback } from 'react'
```

(It already is — verify.)

- [ ] **Step 9: Verify typecheck**

Run: `npm run typecheck`
Expected: no errors. (Errors here will likely be from `PerImageDetailsStep` props mismatch — that's fine, Task 10 fixes them. If you see errors only in `PerImageDetailsStep.tsx`, proceed to Task 10. If you see errors in `UploadArtworkDialog.tsx`, fix before continuing.)

- [ ] **Step 10: Commit (intermediate — typecheck of PerImageDetailsStep will fail until Task 10)**

Skip this commit. Combine with Task 10's commit after the props match up.

---

## Task 10: Update `PerImageDetailsStep` props and wire Next-as-upload

**Files:**
- Modify: `src/components/admin/upload-artwork/PerImageDetailsStep.tsx`

- [ ] **Step 1: Update the props interface**

Replace the `PerImageDetailsStepProps` interface entirely:

```ts
import type { UploadState } from './useBackgroundUploads'

interface PerImageDetailsStepProps {
  images: UploadedImage[]
  artworkDetails: Record<number, ArtworkDetails>
  onUpdateDetails: (index: number, updates: Partial<ArtworkDetails>) => void
  commonApplied: CommonApplied
  onBack: () => void
  onSubmit: () => void
  onUploadIndex: (index: number) => void
  onRetryIndex: (index: number) => void
  getUploadState: (index: number) => UploadState
  error: string | null
}
```

Remove the old `isSubmitting` and `uploadProgress` props.

- [ ] **Step 2: Update the function signature**

Change:

```ts
export function PerImageDetailsStep({
  images,
  artworkDetails,
  onUpdateDetails,
  commonApplied,
  onBack,
  onSubmit,
  isSubmitting,
  uploadProgress,
  error,
}: PerImageDetailsStepProps) {
```

…to:

```ts
export function PerImageDetailsStep({
  images,
  artworkDetails,
  onUpdateDetails,
  commonApplied,
  onBack,
  onSubmit,
  onUploadIndex,
  onRetryIndex,
  getUploadState,
  error,
}: PerImageDetailsStepProps) {
```

- [ ] **Step 3: Make Next trigger upload before advancing**

Replace the `handleNext` function (around line 100):

```ts
const handleNext = () => {
  onUploadIndex(currentIndex)
  if (currentIndex < images.length - 1) {
    setCurrentIndex(currentIndex + 1)
  }
}
```

- [ ] **Step 4: Make the Finish button also fire the last upload**

In the JSX where the "Upload All N Artworks" button is rendered (around lines 516–530), replace the entire `currentIndex < images.length - 1 ? ... : ...` ternary with:

```tsx
{currentIndex < images.length - 1 ? (
  <Button onClick={handleNext}>
    Next
    <ChevronRight className="h-4 w-4 ml-1" />
  </Button>
) : (
  <Button
    onClick={() => {
      onUploadIndex(currentIndex)
      onSubmit()
    }}
    className="min-w-[160px]"
  >
    Finish
    <ChevronRight className="h-4 w-4 ml-1" />
  </Button>
)}
```

- [ ] **Step 5: Update thumbnail strip to show upload status**

Replace the thumbnail strip mapping (around lines 466–490) with:

```tsx
{images.map((img, i) => {
  const details = artworkDetails[i]
  const hasTitle = details?.titleEn || details?.titlePt
  const state = getUploadState(i)
  let badge: React.ReactNode = null
  if (state.status === 'uploading' || state.status === 'queued') {
    badge = <span className="absolute top-0.5 right-0.5 w-3 h-3 rounded-full bg-blue-500 ring-1 ring-white animate-pulse" />
  } else if (state.status === 'uploaded') {
    badge = <span className="absolute top-0.5 right-0.5 w-3 h-3 rounded-full bg-green-500 ring-1 ring-white" />
  } else if (state.status === 'failed') {
    badge = <span className="absolute top-0.5 right-0.5 w-3 h-3 rounded-full bg-red-500 ring-1 ring-white" />
  } else if (hasTitle) {
    badge = <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-green-400 rounded-full" />
  }
  return (
    <button
      key={i}
      onClick={() => setCurrentIndex(i)}
      className={`relative shrink-0 w-16 h-16 rounded-lg border-2 overflow-hidden transition-all ${
        i === currentIndex
          ? 'border-blue-500 ring-2 ring-blue-200'
          : state.status === 'uploaded'
            ? 'border-green-400'
            : state.status === 'failed'
              ? 'border-red-400'
              : hasTitle
                ? 'border-green-300'
                : 'border-gray-200 hover:border-gray-400'
      }`}
    >
      <img src={img.preview} alt="" className="w-full h-full object-cover" />
      <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] text-center">
        {i + 1}
      </span>
      {badge}
    </button>
  )
})}
```

- [ ] **Step 6: Show retry button + error inline when current artwork is failed**

In the form section, just before the Title row (around line 290), add:

```tsx
{(() => {
  const cur = getUploadState(currentIndex)
  if (cur.status !== 'failed') return null
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between gap-3">
        <span>Upload failed: {cur.error}</span>
        <Button size="sm" onClick={() => onRetryIndex(currentIndex)}>
          Retry
        </Button>
      </AlertDescription>
    </Alert>
  )
})()}
```

- [ ] **Step 7: Run typecheck**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 8: Run all tests**

Run: `npm test`
Expected: all pass.

- [ ] **Step 9: Commit**

```bash
git add src/components/admin/upload-artwork/UploadArtworkDialog.tsx src/components/admin/upload-artwork/PerImageDetailsStep.tsx
git commit -m "feat: per-Next background uploads in admin artwork flow"
```

---

## Task 11: Two-column layout in `PerImageDetailsStep`

**Files:**
- Modify: `src/components/admin/upload-artwork/PerImageDetailsStep.tsx`

- [ ] **Step 1: Restructure the main content area**

Find the block that renders the image preview + form (currently around lines 258–457):

```tsx
{/* Main content: image top, form bottom */}
<div className="flex-1 overflow-y-auto">
  <div className="max-w-5xl mx-auto px-6 py-6 space-y-6">
    {/* Image preview */}
    <div className="relative mx-auto w-fit">
      <img
        src={images[currentIndex]?.preview}
        ...
```

Replace **just the wrapper structure** (NOT the form fields inside) with a two-column grid that falls back to stacked below `md`:

```tsx
{/* Main content: two-column on md+, stacked below */}
<div className="flex-1 overflow-y-auto">
  <div className="mx-auto px-6 py-6 grid gap-6 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] md:items-start max-w-7xl">
    {/* LEFT column: large image preview */}
    <div className="relative md:sticky md:top-6">
      <img
        src={images[currentIndex]?.preview}
        alt={`Artwork ${currentIndex + 1}`}
        className="w-full max-h-[20vh] md:max-h-[calc(100vh-220px)] object-contain rounded-lg border bg-gray-50"
      />
      <Button
        variant="secondary"
        size="sm"
        className="absolute top-2 right-2 h-7 w-7 p-0 bg-black/50 hover:bg-black/70 text-white border-0"
        onClick={() => setLightboxOpen(true)}
      >
        <Maximize2 className="h-3.5 w-3.5" />
      </Button>
    </div>

    {/* RIGHT column: form */}
    <div className="space-y-5 min-w-0">
      {/* AI message, Title, Medium, Dimensions, Description, Featured — UNCHANGED, just moved here */}
      {/* ... existing form JSX from "AI message" through "Featured toggle" goes here ... */}
    </div>
  </div>
</div>
```

**Important:** preserve all existing form JSX from the AI message div through the Featured toggle. Only the outer wrapper structure changes (from `space-y-6` single column with image-on-top to a CSS grid with image-left, form-right). The "failed alert" added in Task 10 goes inside the right column at the top.

- [ ] **Step 2: Run typecheck and dev server**

Run: `npm run typecheck`
Expected: no errors.

Run: `npm run dev`
Expected: server starts without errors.

- [ ] **Step 3: Manual layout check**

In a browser at `http://localhost:3000/artworks/new`:
1. Drop 2–3 sample images, click Continue.
2. Verify on a wide window (>= 1024px): image fills left column, form is on the right, both visible without scrolling.
3. Resize narrow (< 768px): layout stacks (image on top, form below).
4. Click the lightbox icon — opens full-size image.
5. Click thumbnails at the bottom — image swaps; form fields swap.

Note: this is a manual visual check; no automated test.

- [ ] **Step 4: Commit**

```bash
git add src/components/admin/upload-artwork/PerImageDetailsStep.tsx
git commit -m "feat: two-column layout for per-image artwork details"
```

---

## Task 12: localStorage draft persistence in `UploadArtworkDialog`

**Files:**
- Modify: `src/components/admin/upload-artwork/UploadArtworkDialog.tsx`

- [ ] **Step 1: Import draft helpers**

Near the other imports at the top:

```ts
import { saveDraft, loadDraft, clearDraft, draftHasContent } from './draftStorage'
import { SessionRecoveryDialog } from './SessionRecoveryDialog'
```

- [ ] **Step 2: Add recovery dialog state**

In the component body, add:

```ts
const [recovery, setRecovery] = useState<{
  artworkCount: number
  savedAt: string
  fileNames: string[]
  draftDetails: Record<number, ArtworkDetails>
  draftCommon: CommonMetadata
  draftApplyToAll: ApplyToAll
} | null>(null)
```

- [ ] **Step 3: On dialog open, check for a draft**

Inside the existing `useEffect(() => { if (open) { ArtworkService.getCategories()... } }, [open])` block, add a sibling effect right after it:

```ts
useEffect(() => {
  if (!open) return
  const draft = loadDraft()
  if (!draftHasContent(draft) || !draft) return
  const artworkCount = Object.values(draft.artworkDetails).filter(
    (d) => (d.titleEn || d.titlePt || d.descriptionEn || d.descriptionPt || '').trim()
  ).length
  setRecovery({
    artworkCount,
    savedAt: draft.savedAt,
    fileNames: draft.fileHints.map((f) => f.name),
    draftDetails: draft.artworkDetails,
    draftCommon: draft.commonMeta,
    draftApplyToAll: draft.applyToAll,
  })
}, [open])
```

- [ ] **Step 4: Add a debounced save effect**

Add another effect:

```ts
useEffect(() => {
  if (step === 'success') return
  const handle = setTimeout(() => {
    saveDraft({
      commonMeta,
      applyToAll,
      artworkDetails,
      fileHints: images.map((img) => ({
        name: img.file.name,
        size: img.file.size,
      })),
    })
  }, 500)
  return () => clearTimeout(handle)
}, [step, commonMeta, applyToAll, artworkDetails, images])
```

- [ ] **Step 5: Clear the draft on success and on explicit close**

In `handleClose`, add `clearDraft()` at the top:

```ts
const handleClose = useCallback(() => {
  clearDraft()
  setStep('upload')
  // ... rest unchanged
}, [onClose])
```

In the `useEffect` that detects `allDone` (added in Task 9, Step 3), call `clearDraft()`:

```ts
useEffect(() => {
  if (step === 'finalizing' && uploads.allDone) {
    clearDraft()
    setStep('success')
    fireConfetti()
  }
}, [step, uploads.allDone])
```

- [ ] **Step 6: Render the recovery dialog**

Just before the final `return` (the Step 1 JSX), add:

```tsx
if (recovery) {
  return (
    <SessionRecoveryDialog
      open={true}
      artworkCount={recovery.artworkCount}
      savedAt={recovery.savedAt}
      fileNames={recovery.fileNames}
      onResume={() => {
        setCommonMeta(recovery.draftCommon)
        setApplyToAll(recovery.draftApplyToAll)
        setArtworkDetails(recovery.draftDetails)
        setRecovery(null)
      }}
      onStartFresh={() => {
        clearDraft()
        setRecovery(null)
      }}
    />
  )
}
```

- [ ] **Step 7: Verify typecheck**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 8: Manual recovery flow check**

Run: `npm run dev`

1. Open `/artworks/new`, drop 2 images, click Continue.
2. Type "Test One" in the first artwork's English title. Wait 1 second.
3. Close the browser tab.
4. Reopen `/artworks/new`. Recovery dialog appears with "1 artwork in progress".
5. Click "Start fresh" — dialog closes, fresh state.
6. Repeat steps 1-3, then click "Resume" instead — confirm the title text is restored after re-attaching images.

- [ ] **Step 9: Commit**

```bash
git add src/components/admin/upload-artwork/UploadArtworkDialog.tsx
git commit -m "feat: localStorage draft persistence and session recovery"
```

---

## Task 13: `beforeunload` warning

**Files:**
- Modify: `src/components/admin/upload-artwork/UploadArtworkDialog.tsx`

- [ ] **Step 1: Add the effect**

Inside the component body, add:

```ts
useEffect(() => {
  if (step === 'success' || step === 'upload') return
  const hasUnsaved =
    uploads.pendingCount > 0 ||
    uploads.failedCount > 0 ||
    Object.values(artworkDetails).some(
      (d) =>
        (d.titleEn || d.titlePt || d.descriptionEn || d.descriptionPt || '').trim()
    )
  if (!hasUnsaved) return
  const handler = (e: BeforeUnloadEvent) => {
    e.preventDefault()
    e.returnValue = ''
  }
  window.addEventListener('beforeunload', handler)
  return () => window.removeEventListener('beforeunload', handler)
}, [step, uploads.pendingCount, uploads.failedCount, artworkDetails])
```

- [ ] **Step 2: Verify typecheck**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 3: Manual check**

1. `npm run dev`
2. Open `/artworks/new`, drop an image, type a title, click Continue.
3. Try to close the tab — browser prompt appears.
4. Cancel the prompt; complete the flow normally; on success, closing the tab no longer prompts.

- [ ] **Step 4: Commit**

```bash
git add src/components/admin/upload-artwork/UploadArtworkDialog.tsx
git commit -m "feat: warn before unload when upload work is unsaved"
```

---

## Task 14: Update `index.ts` exports

**Files:**
- Modify: `src/components/admin/upload-artwork/index.ts`

- [ ] **Step 1: Re-export the public surface**

Replace the contents of `src/components/admin/upload-artwork/index.ts` with:

```ts
export { UploadArtworkDialog } from './UploadArtworkDialog'
export type { ArtworkDetails } from './types'
```

- [ ] **Step 2: Verify nothing else imports the removed shape**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/upload-artwork/index.ts
git commit -m "chore: tidy upload-artwork module exports"
```

---

## Task 15: End-to-end manual verification

This is the final golden-path pass before declaring the feature done. **No code changes** unless issues are found.

- [ ] **Step 1: Start the dev server**

Run: `npm run dev`

- [ ] **Step 2: Happy path — 5 artworks**

1. Navigate to `/artworks/new`
2. Drop 5 images, set common Year + Category (with "Same for all" toggled), click Continue.
3. Fill artwork 1's title, click **Next**. Verify: thumbnail 1 turns blue (uploading) then green (uploaded) within a few seconds. Form jumps to artwork 2 instantly.
4. Repeat for artworks 2–4.
5. Fill artwork 5, click **Finish**.
6. Verify: finalizer screen shows briefly if anything is still pending, otherwise straight to confetti success.
7. Confirm in `/artworks` list that all 5 are present with correct titles, year, category.

- [ ] **Step 3: Failure + retry path**

1. Open browser DevTools → Network → set throttling to "Offline".
2. Open `/artworks/new`, drop 2 images, fill artwork 1, click Next.
3. Wait ~5 seconds. Thumbnail 1 should turn red after retries exhaust.
4. Click thumbnail 1 — error message and Retry button appear.
5. Set Network back to "Online". Click Retry. Thumbnail turns green.
6. Click Next/Finish to complete artwork 2 normally.

- [ ] **Step 4: Edit-after-Next path**

1. Open `/artworks/new`, drop 2 images, fill artwork 1 with title "Original", click Next.
2. Wait for thumbnail 1 to turn green (uploaded).
3. Click thumbnail 1 to go back. Change title to "Edited".
4. Click Next. Confirm no error; the metadata update fires (network tab shows PATCH/UPDATE on artworks).
5. Complete artwork 2; finish; check `/artworks` shows "Edited" not "Original".

- [ ] **Step 5: Session recovery**

1. Open `/artworks/new`, drop 3 images, fill artwork 1 + 2 with titles, do NOT click Next (or click Next on 1 then leave on artwork 2).
2. Close the browser tab.
3. Reopen `/artworks/new`. Recovery dialog appears.
4. Click Resume. Re-drop the same 3 images. Confirm titles are restored.
5. Click Start fresh in a fresh dialog (after typing once and closing again). Confirm fields are empty.

- [ ] **Step 6: Two-column layout sanity**

1. Wide window (≥ 1280px): image fills left, form is right, both visible without scroll above ~720px viewport height.
2. Narrow window (< 768px): stacked.
3. Test the lightbox button on left column.
4. Confirm the thumbnail strip wraps cleanly at the bottom.

- [ ] **Step 7: Commit any small fixes found, then**

```bash
git log --oneline -20
```

Verify the recent commits tell a clear story of the feature.

---

## Spec Coverage Self-Review

(Done by writer after writing the plan — fixed inline.)

| Spec section | Covered by |
|---|---|
| Hook architecture (state machine, concurrency, retry) | Tasks 4–7 |
| Components (new + modified files) | Tasks 2, 8, 9, 10, 11, 14 |
| Two-column layout | Task 11 |
| Per-Next dispatch + finalizer | Tasks 9, 10 |
| Edit-after-Next path (`updateUploaded`) | Tasks 7, 9 (Step 5), 15 (Step 4) |
| Drafts (localStorage, debounce, 7-day expiry) | Tasks 3, 12 |
| Session recovery dialog | Tasks 8, 12 |
| Error handling (silent retry, jump-back, retry button) | Tasks 6, 10 (Step 6), 9 (Step 6 finalizer) |
| `beforeunload` | Task 13 |
| Tests (unit) | Tasks 3, 4, 5, 6, 7 |
| Manual browser verification | Tasks 11 (Step 3), 12 (Step 8), 13 (Step 3), 15 |

No gaps.
