# Background Artwork Upload + Two-Column Detail Layout

**Date:** 2026-05-03
**Area:** Admin upload flow (`src/components/admin/upload-artwork/`)

## Problem

The current admin upload flow batches all work to the end. The artist picks N images, fills in details for each across N pages, then clicks **Upload All** — only at that point does the app start uploading files and writing DB rows.

Two pain points:

1. **Lost work risk.** If the browser closes, she hits Escape, or anything goes wrong before the final click, every title, description, and field she typed is gone.
2. **Slow finish.** With 10–20 artworks, the final upload can take a long time and feels like a single long wait at the end.

Separately, the per-artwork detail view shows the image in a small strip above the form (`max-h-[20vh]`), which is too small to reference while editing titles and descriptions.

## Goals

- Save each artwork progressively as the artist clicks **Next**, so closing the browser mid-flow loses at most the in-progress artwork's text (and even that is recoverable from a draft).
- Make the overall upload feel faster by overlapping uploads with form-filling.
- Surface a clear status per artwork (uploading / done / failed) without blocking the workflow.
- Show the image large alongside the form on wide screens.

## Non-Goals

- No new backend infrastructure (no queues, no workers, no edge functions added).
- No changes to `ArtworkService.createArtwork` or storage layout.
- No mobile-first redesign — the new two-column layout falls back to the existing stacked layout below the `md` breakpoint.
- No server-side draft persistence; localStorage only.

## User Decisions (from brainstorming)

| # | Decision |
|---|---|
| 1 | Editing a previously-saved artwork: re-save only fires when the artist clicks **Next** again from that page. No auto-save on field change for already-uploaded artworks. |
| 2 | **Next** is fire-and-forget — instant advance, upload runs in the background. The final **Finish** screen waits on any still-pending or failed uploads before showing success. |
| 3 | Failed background uploads silently retry 2× with exponential backoff. Only after retries fail does the thumbnail badge turn red and the artwork become "needs attention." |
| 4 | Session recovery: localStorage-backed text drafts only. Image File objects are not persisted. On reopen, offer a "Resume previous session?" dialog. |
| 5 | Background upload runs in the browser using the existing `ArtworkService.createArtwork` call — no queue or worker. |

## Architecture

### Hook: `useBackgroundUploads`

A new client-side React hook owns all per-artwork upload state. Lives at `src/components/admin/upload-artwork/useBackgroundUploads.ts`.

**State per artwork (keyed by index):**

```ts
type UploadState =
  | { status: 'idle' }
  | { status: 'queued' }
  | { status: 'uploading'; progress: number }
  | { status: 'uploaded'; artworkId: string }
  | { status: 'failed'; error: string; attempts: number }
```

**Public API:**

```ts
{
  startUpload(index: number, payload: ArtworkCreateData): void   // fire-and-forget
  retry(index: number): void
  updateUploaded(index: number, payload: ArtworkUpdateData): void  // for "edit after Next" path
  getState(index: number): UploadState
  pendingCount: number   // queued + uploading
  failedCount: number
  allDone: boolean       // every started index is uploaded
}
```

**Concurrency:** at most 2 uploads in-flight at once. Additional `startUpload` calls queue and drain as slots free up. This keeps the UI responsive on a 20-artwork batch without saturating the connection.

**Retry:** on network or 5xx errors, retry up to 2 times with backoff (1s, 3s). 4xx errors fail fast (validation issues won't be fixed by retry).

### Components

| File | Status | Role |
|---|---|---|
| `useBackgroundUploads.ts` | NEW | Hook described above |
| `SessionRecoveryDialog.tsx` | NEW | "Resume previous session?" prompt with file re-attach affordance |
| `UploadArtworkDialog.tsx` | MODIFIED | Wires hook in, removes end-of-flow loop, adds finalizer screen, mounts recovery dialog |
| `PerImageDetailsStep.tsx` | MODIFIED | Two-column layout, status badges on thumbnails, **Next** triggers `startUpload` |
| `ArtworkService` | UNCHANGED | `createArtwork` and `updateArtwork` already do exactly what we need |

### Layout change in `PerImageDetailsStep`

On viewports `md` and above, the main content area becomes a two-column flex/grid:

- **Left column** (~55–60% of width): image preview, sized to fill available height (e.g. `max-h-[calc(100vh-220px)]`), `object-contain`. Lightbox button overlays a corner. The upload status badge (⏳ / ✓ / ⚠) overlays another corner.
- **Right column** (~40–45% of width): scrollable form with all current fields — Title PT/EN + AI Suggest, Medium, Dimensions, Description PT/EN, Featured.

Below `md`, the layout falls back to today's stacked image-on-top, form-below.

The thumbnail strip and Prev/Next/Finish footer stay full-width below both columns.

## Data Flow

```
[Step 1: pick images, common meta]
     │  Continue
     ▼
[Step 2: Artwork i, two-column view]
     │  user types in form
     │  └─ debounced 500ms ──► localStorage draft updated
     │
     │  click Next
     ▼
   startUpload(i, payload)        ──► returns instantly, advance to i+1
     │                                state: queued → uploading
     │  (concurrency cap 2)
     ▼
   on success:  state = uploaded(artworkId), draft for index i cleared
   on failure:  retry × 2 with backoff
                if still failing: state = failed, badge red, jump-back enabled

[Last artwork: click Finish]
     │
     ▼
   Finalizer screen
     • pendingCount > 0: spinner + "Finalizing X of N still uploading…"
     • failedCount > 0: list each failed artwork with Retry / Edit buttons
     │  pendingCount === 0 && failedCount === 0
     ▼
   Success screen + confetti, all drafts cleared
```

### "Edit after Next" path (decision #1)

When the artist navigates back to a previously-uploaded artwork (state `uploaded`) and edits a field:

- The form remains editable — no lock UI.
- localStorage draft is updated as she types.
- Clicking **Next** from that page calls `updateUploaded(index, payload)` which dispatches `ArtworkService.updateArtwork(artworkId, payload)`. Image is unchanged so this is a metadata-only update.
- Status stays `uploaded` (no flash to `uploading` for in-place edits) but a small "Saving…" indicator appears on the thumbnail until the update resolves.

## Drafts & Session Recovery

### Storage

- Key: `mbw-upload-draft-v1`
- Value (JSON):

  ```ts
  {
    savedAt: string                        // ISO timestamp
    commonMeta: CommonMetadata
    applyToAll: ApplyToAll
    artworkDetails: Record<number, ArtworkDetails>
    fileHints: Array<{ name: string; size: number }>  // for matching on resume
  }
  ```

- Written debounced 500ms after any form change in Step 1 or Step 2.
- Cleared on successful completion of the flow, on explicit "Start fresh" in the recovery dialog, and ignored if `savedAt` is older than 7 days.

### Recovery flow

When `UploadArtworkDialog` opens:

1. Read draft from localStorage.
2. If draft exists and at least one artwork has any non-empty title/description, mount `SessionRecoveryDialog` *before* the upload dialog content shows.
3. Dialog text: "Resume previous session? You had **N** artworks in progress on **{savedAt}**. Pictures need to be re-attached, but your titles and descriptions are saved." Two buttons: **Resume** / **Start fresh**.
4. **Resume:** restores `commonMeta`, `applyToAll`, `artworkDetails` into state. The dropzone in Step 1 is shown with a hint listing the expected file names from `fileHints`. As she drops files, they're matched to draft entries by array index (the order she drops them = the order they map to draft entries 0, 1, 2…). She can also rearrange via drag if needed (out of scope unless trivial).
5. **Start fresh:** clears the draft and proceeds with a fresh dialog.

Image File objects cannot be persisted in localStorage (no IndexedDB Blob route taken — rare-case crash recovery doesn't justify the complexity). The artist re-attaches files; her typing is preserved.

## Error Handling

### Per-artwork upload errors

- Network errors and 5xx: retry up to 2× with backoff (1s, 3s, then surface).
- 4xx and validation errors: fail immediately, no retry.
- After retries exhausted, state = `failed(error message)`. The thumbnail badge turns red ⚠. The artist can click the badge to jump to that artwork; the error message is shown above the form, and a **Retry** button appears next to the **Next** button on that page.

### Finalizer screen

After **Finish** is clicked on the last artwork:

- If `pendingCount > 0` and `failedCount === 0`: spinner with text "Finalizing X of N still uploading…" auto-advances to success when done.
- If `failedCount > 0`: list each failed artwork (thumbnail + title + error). Each row has **Retry** (calls `retry(index)`) and **Edit** (jumps back to that artwork). The success screen is gated until `failedCount === 0`.

### `beforeunload` warning

The dialog registers a `beforeunload` handler whenever any of:

- `pendingCount > 0` (uploads still in flight)
- `failedCount > 0` (unresolved failures)
- Any artwork's form is dirty relative to its last-saved draft state

The handler returns the standard browser confirmation prompt. Removed on success or on dialog close after the artist explicitly cancels.

## Testing

This is a UI-heavy change with browser APIs. Strategy:

### Unit tests — `useBackgroundUploads`

Jest + React Testing Library, mocking `ArtworkService`:

- State transitions: `idle → queued → uploading → uploaded`
- State transitions: `uploading → failed` after 2 retries
- Concurrency cap: starting 5 uploads runs at most 2 in parallel; a 3rd starts only after one finishes
- Retry backoff timing (use fake timers)
- 4xx error fails fast without retry
- `updateUploaded` dispatches `updateArtwork`, not `createArtwork`, when state is `uploaded`

### Manual browser verification

Per CLAUDE.md, UI feature correctness needs browser verification. Walk through:

- 5-image happy path: each Next advances instantly, badges flip green, Finish goes straight to success
- Induce failure: throttle/kill network mid-upload, verify red badge appears after retries, jump-back works, retry succeeds
- Recovery: type into 3 artworks, close tab without finishing, reopen — confirm dialog shows, Resume restores text, Start fresh clears it
- `beforeunload` prompt fires when leaving with pending uploads
- Two-column layout at desktop sizes; stacked fallback below `md`

## Build Sequence

Suggested order for the implementation plan:

1. Extract `ArtworkCreateData`/`ArtworkUpdateData` payload-building from `handleSubmit` into a small helper (no behavior change).
2. Build and unit-test `useBackgroundUploads` hook in isolation.
3. Wire the hook into `UploadArtworkDialog`: replace the end-of-flow loop with per-Next dispatch, add finalizer screen.
4. Add localStorage draft persistence + `SessionRecoveryDialog`.
5. Refactor `PerImageDetailsStep` layout to two columns + status badges + jump-back-to-failed affordance.
6. Add `beforeunload` handler.
7. Manual browser pass through all scenarios above.

## Open Questions

None. All decisions captured above.
