# Feature Toggles — AR Wall Preview + Visitor Wall Posts

**Date:** 2026-07-02
**Status:** Approved (Daniel: "lets do the recommended")
**Depends on:** the AR wall preview feature (`feat/ar-wall-preview` branch, spec `2026-07-02-ar-wall-preview-design.md`). Built on the same branch so AR ships with its kill switch.

## 1. Goal

Give the artist two switches in the admin panel:

1. **AR wall preview** — turn the entire AR feature on/off site-wide. Off = the
   "View on your wall" button is hidden everywhere AND the model-generation API
   refuses requests (stale QR codes and direct calls are dead).
2. **Visitor wall posts** — a stored flag for the future visitor-photos feature
   (Project B, not built yet). Visible and toggleable now, marked "coming soon";
   Project B will honor it from day one.

## 2. Decisions (locked)

- **D1.** AR off = button hidden + API blocked (Daniel chose the strict option).
- **D2.** Both flags are created now; the posts flag has no consumer yet.
- **D3.** Reuse the existing `site_settings` KV table, `SettingsService`, and
  admin `SettingsDialog` — no new tables, pages, or concepts (Approach A).
- **D4.** Missing key semantics: `ar_enabled` defaults **true**,
  `user_posts_enabled` defaults **false**. Code never requires the seed SQL.
- **D5.** The AR button waits for the flag to resolve true before rendering
  (no flash of a disabled feature). One cached read per page load, shared by
  all button instances.

## 3. Data

Two rows in the existing `site_settings` table (id UUID PK, key TEXT UNIQUE,
value JSONB NOT NULL, description; public-read + admin-write RLS already
enabled):

| key | value | default when missing |
|---|---|---|
| `ar_enabled` | `true` / `false` (JSONB boolean) | `true` |
| `user_posts_enabled` | `true` / `false` | `false` |

Optional seed SQL (pasted for Daniel; idempotent; code works without it):

```sql
INSERT INTO site_settings (key, value, description) VALUES
  ('ar_enabled', 'true', 'Show the "View on your wall" AR button and allow AR model generation'),
  ('user_posts_enabled', 'false', 'Visitor wall-photo posts (feature not yet built; flag reserved for it)')
ON CONFLICT (key) DO NOTHING;
```

## 4. Components

### 4.1 `SettingsService` additions (`src/services/settings.service.ts`)

Mirrors the existing `HomepageSections` pattern exactly:

```ts
export interface FeatureFlags {
  arEnabled: boolean        // default true
  userPostsEnabled: boolean // default false
}
static async getFeatureFlags(): Promise<FeatureFlags>   // .in('key', [...]), tolerant of true/'true'
static async updateFeatureFlags(flags: Partial<FeatureFlags>): Promise<void>  // upsertSetting per key
```

`getFeatureFlags` returns defaults on error (same resilience as
`getHomepageSections`).

### 4.2 Client flag reader (`src/lib/ar/flags.ts` — new, client-safe)

```ts
export function getArEnabled(): Promise<boolean>
```

- Module-level cached promise: N `ArWallButton` instances on a page → 1 query.
- Reads the `ar_enabled` key via the anon supabase client (public-read RLS).
- Missing key / query error → `true` (D4; a broken settings read must not
  silently kill the AR feature).
- Lives in its own file, NOT `constants.ts` (constants stays import-free) and
  NOT `eligibility.ts` (server-only, node:crypto).

### 4.3 `ArWallButton` gating (`src/components/artwork/ArWallButton.tsx`)

- New state `arEnabled: boolean | null` (null = unresolved).
- Effect alongside the platform-detection effect calls `getArEnabled()`.
- Render guard becomes: `if (!eligible || platform === null || arEnabled !== true) return null`.
- No other behavior changes; the autoOpen prefetch effect also bails while the
  flag is unresolved or false.

### 4.4 API guard (`src/app/api/ar/[artworkId]/route.ts`)

After the UUID gate, before the artwork query: read `ar_enabled` with the
route's existing client (`supabaseAdmin ?? supabase`). If `false` →
`403 { error: 'ar_disabled' }`. Missing key/error → allow (D4). One extra
small query per generation request; cache hits pay it too (acceptable — it's a
single-row PK lookup).

### 4.5 Admin UI (`src/components/admin/SettingsDialog.tsx`)

New "Features" section (same visual pattern as the Homepage sections block):

- **AR wall preview** — Switch bound to `arEnabled`; caption: "Show the 'View
  on your wall' button and allow AR model generation".
- **Visitor wall posts** — Switch bound to `userPostsEnabled`; caption: "Coming
  soon — not built yet. This switch will control it when it ships."
- Loaded with the dialog's existing parallel fetch; saved via the dialog's
  existing save flow (`updateFeatureFlags` joins the `Promise.all`).

## 5. Behavior matrix

| ar_enabled | Button (lightbox + detail) | POST /api/ar | ?ar=1 arrival |
|---|---|---|---|
| true / missing | renders (when artwork eligible) | works | prefetch + pulse |
| false | hidden (never flashes) | 403 ar_disabled | nothing renders; page is normal |

`user_posts_enabled` has no runtime effect anywhere yet.

## 6. Error handling

- Settings read fails client-side → button behaves as enabled (D4).
- Settings read fails in the route → generation proceeds (D4).
- Toggle save fails → existing SettingsDialog error handling (unchanged).

## 7. Testing

- `settings.featureflags.test.ts`: `getFeatureFlags` defaults (empty result,
  error), true/'true' tolerance, `updateFeatureFlags` upsert calls — mocked
  `@/lib/supabase` (same pattern as `artwork.transform.test.ts`).
- `flags.test.ts`: missing key → true, `false` value → false, error → true,
  cache returns same promise.
- Route guard + dialog section verified by typecheck + the deployed device
  pass (no route/component test infra exists; not introducing it here).

## 8. Constraints

- Files stay under ~2000 lines (`SettingsDialog.tsx` is 361 lines — fine).
- Daniel applies all SQL by pasting (the seed is optional but will be pasted).
- No new dependencies.
- Filtered typecheck gate (known pre-existing errors in untracked
  `exhibitions/page.tsx` + stale `.next/types` are excluded).

## 9. Out of scope

- Project B itself (visitor posts) — separate brainstorm/spec after AR ships.
- Localizing the admin dialog (existing dialog is EN-only).
- Per-artwork AR opt-out (global switch only).
