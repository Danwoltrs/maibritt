# Mobile Quick-Upload FAB — Design

**Date:** 2026-06-30
**Status:** Approved (design), pending implementation plan

## Goal

Give the logged-in artist a one-tap way to add artwork from her phone. A small floating
button sits at the lower-right of every page on mobile (when authenticated). Tapping it
opens the phone's native camera-or-photos picker; once she shoots or picks image(s), the
existing artwork upload screen opens **full-screen** with those images already loaded.

## User-Facing Behavior

1. A logged-in artist on a phone/small tablet sees a circular **camera** button fixed at
   the bottom-right of any page (public site or admin).
2. Tapping it immediately opens the OS sheet: **Take Photo / Photo Library / Choose File**.
3. She shoots a photo or selects one or more from her library.
4. The `UploadArtworkDialog` opens **full-screen** with those images preloaded, landing on
   step 1 (Work + Year), then step 2 (per-image details + optional AI enhance), then the
   background-upload + confetti success steps — the existing flow, unchanged.
5. Closing the dialog returns her to the page she was on. Existing draft auto-save covers
   accidental interruptions.

## Locked Decisions

- **Picker-first.** Tap → native picker → then the full-screen editor with images preloaded.
  (Not editor-first.)
- **Global on mobile when logged in.** The button appears on **all** pages — admin *and*
  public site — whenever the artist is authenticated ("owner mode"). Not scoped to the
  artworks section.
- **Camera icon**, not a generic `+` — the tap goes straight to the photo picker, so a
  camera reads more truthfully.
- **Multi-select allowed** (`multiple`), matching the dialog's existing 20-file support.
  Camera captures one shot at a time; the photo library allows multiple.
- **Reuse the existing dialog.** No separate mobile upload screen, no navigation-based file
  hand-off.

## Architecture

### New component: `QuickUploadFab`

**File:** `src/components/admin/upload-artwork/QuickUploadFab.tsx` (co-located with the
upload feature it drives).

Responsibilities:
- Self-gates: renders nothing unless **all** are true —
  - `useAuth().isAuthenticated` is true (and not `loading`),
  - not on the `/login` route (`usePathname()`),
  - the upload dialog it owns is not already open.
- The mobile-only constraint is handled by CSS (`lg:hidden`) on the rendered button — no JS
  breakpoint hook needed, which avoids an SSR/hydration flash.
- Renders:
  - a hidden `<input type="file" accept="image/*" multiple ref={inputRef} />` — **no
    `capture` attribute** (that's what makes iOS/Android show the Camera/Library/Browse
    menu instead of jumping straight to the camera),
  - a circular camera button that calls `inputRef.current?.click()`.
- On the input's `onChange`: if files were selected, store them in local state and open
  `<UploadArtworkDialog open initialFiles={files} onClose={...} />`. If the picker was
  cancelled (no files), do nothing. Reset the input value after each use so re-picking the
  same file fires `onChange` again.

**Mounting:** one instance in `src/app/layout.tsx`, inside `<AuthProvider>`, as a sibling
after `<main>`. That root layout is shared by public and admin route groups, which is what
makes the button global.

### Change to `UploadArtworkDialog` (existing)

**File:** `src/components/admin/upload-artwork/UploadArtworkDialog.tsx`

1. **New prop** `initialFiles?: File[]`. When the dialog opens with `initialFiles` present,
   seed the `images` state from them so the artist lands on step 1 with thumbnails already
   populated.
2. **Shared helper.** Extract the dropzone's existing `File → UploadedImage` mapping (object
   URL creation, default per-image detail shape, etc.) into a small reusable function so the
   `initialFiles` path and the drag-and-drop `onDrop` path use identical logic. No behavioral
   divergence between the two entry points.
3. **Full-screen on mobile.** Pass `max-lg:` overrides via the dialog's existing
   `DialogContent className` so that below `lg` it renders edge-to-edge. The repo's
   `DialogContent` (`src/components/ui/dialog.tsx`) ships these defaults that must be
   neutralized on mobile:
   - centering: `left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%]`
     → `max-lg:left-0 max-lg:top-0 max-lg:translate-x-0 max-lg:translate-y-0`
   - size: `w-full max-w-lg` → `max-lg:w-screen max-lg:h-screen max-lg:max-w-none`
   - corners: `sm:rounded-lg` → `max-lg:rounded-none` (needed because `sm:rounded-lg`
     would otherwise round corners across the whole 640–1023px band)

   Desktop (`lg+`) rendering is unchanged. Steps 1 and 2 already adapt their internal layout
   responsively; this only makes the shell full-bleed. Two details for the implementer:
   - `DialogContent` renders its own absolute close button at `right-4 top-4`; on full-screen
     mobile, make sure it clears the status bar / notch (top safe-area inset).
   - The default `p-6` padding and the `zoom/slide-in-from-top` open animation are acceptable
     as-is; switching to a slide-up-from-bottom sheet animation is optional polish, not required.

No changes to upload, enhancement, draft, or success logic.

## Placement & Styling (mobile-ux)

- **Position:** `fixed`, bottom-right, `lg:hidden`. Bottom offset respects the iOS home
  indicator: `bottom: max(1rem, env(safe-area-inset-bottom))` (right offset `1rem`). The
  existing sidebar-toggle FAB stays bottom-**left**, so there is no overlap.
- **Size & target:** 56px circular button — comfortably past the 44px minimum touch target.
- **Look:** filled circle in the site's foreground/primary color with a white camera icon
  and a soft shadow, matching the Mai-Britt light theme (deliberately *not* the dark `#111`
  palette from the mobile-ux skill, which targets the Wolthers System).
- **Stacking:** above page content, below the dialog overlay.
- **Icon:** lucide `Camera`.

## Edge Cases

- **Picker cancelled** (no files chosen): nothing opens; FAB stays put.
- **Re-selecting the same file:** input value is reset after each change so `onChange` fires.
- **Logged out / on `/login`:** FAB not rendered.
- **Desktop:** FAB hidden via `lg:hidden`; the existing `/artworks` "+" entry point is
  unaffected.
- **Dialog already open:** FAB hidden (it owns the open state).
- **Public-site pages:** FAB shows there too (intended) because it's mounted in the shared
  root layout and gated only on auth + viewport.

## Out of Scope

- No changes to the desktop upload entry points or the enhancement pipeline.
- No PWA/manifest/service-worker/web-push work (the native `<input>` already works in mobile
  Safari; PWA is a separate future effort).
- No offline upload / background sync.
- No new auth or session behavior — reuses `useAuth()` as-is.

## Files Touched

| File | Change |
|------|--------|
| `src/components/admin/upload-artwork/QuickUploadFab.tsx` | **New** — FAB + hidden file input + dialog owner |
| `src/app/layout.tsx` | Mount `<QuickUploadFab />` inside `<AuthProvider>` |
| `src/components/admin/upload-artwork/UploadArtworkDialog.tsx` | Add `initialFiles` prop, extract shared file→image helper, full-screen-on-mobile shell |

## Testing Checklist (mobile-ux)

- [ ] FAB is ≥44px and easily tappable; 56px circle renders correctly.
- [ ] FAB clears the iOS home indicator (safe-area inset) and does not overlap the bottom-left sidebar toggle.
- [ ] Tapping opens the native Camera/Library/Browse sheet (no `capture` forcing camera-only).
- [ ] Selecting from library (single and multiple) preloads the dialog correctly.
- [ ] Taking a photo with the camera preloads the dialog correctly.
- [ ] Cancelling the picker opens nothing.
- [ ] Dialog is full-screen on phone; centered modal on desktop (unchanged).
- [ ] FAB hidden when logged out, on `/login`, on desktop, and while the dialog is open.
- [ ] FAB appears on both a public page and an admin page when logged in.
- [ ] Re-picking the same file after closing re-triggers the flow.
- [ ] No horizontal scroll or layout shift introduced on any page by the FAB.
