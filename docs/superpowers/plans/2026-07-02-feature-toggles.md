# Feature Toggles Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Two admin switches — AR wall preview on/off (hides the button everywhere AND blocks the generation API) and a stored visitor-posts flag for the future Project B.

**Architecture:** Reuses the existing `site_settings` JSONB KV table (public-read + admin-write RLS already live), the existing `SettingsService` (new `FeatureFlags` methods mirroring `HomepageSections`), and the existing admin `SettingsDialog` (new "Features" Card). Public gating is two-layer: a module-cached client read hides `ArWallButton` until `ar_enabled` resolves true, and the AR route returns 403 when the flag is false.

**Tech Stack:** Next.js App Router, TypeScript, Supabase (supabase-js v2), Vitest, shadcn/ui.

**Spec:** `docs/superpowers/specs/2026-07-02-feature-toggles-design.md`

**Branch:** `feat/ar-wall-preview` (the toggle ships with the AR feature).

## Global Constraints

- **Missing-key defaults (D4):** `ar_enabled` missing/unreadable → **true**; `user_posts_enabled` missing → **false**. Fail-open everywhere: a broken settings read must never disable AR by accident.
- **AR off = button hidden AND API 403** (D1).
- The button must never flash while disabled: render nothing until the flag resolves **true** (D5).
- `src/lib/ar/constants.ts` stays import-free; `src/lib/ar/eligibility.ts` stays server-only. The new flag reader is its own file, `src/lib/ar/flags.ts`.
- JSONB values may arrive as boolean `true` or string `'true'` — parse with `value === true || value === 'true'` (existing service convention).
- No new dependencies. Files stay under ~2000 lines.
- **Typecheck gate** (known pre-existing errors in untracked WIP are excluded): `npm run typecheck 2>&1 | grep -E 'error TS' | grep -vE 'exhibitions/page|\.next/types/validator'` MUST be empty. Plain `npm run typecheck`/`npm run build` fail on that WIP — not a gate.
- **The user applies all SQL by pasting.** The seed SQL (Task 4) is optional — code never requires it.

---

## File Structure

**Create:**
- `src/services/settings.featureflags.test.ts` — TDD for the service methods
- `src/lib/ar/flags.ts` + `src/lib/ar/flags.test.ts` — client flag reader with module cache

**Modify:**
- `src/services/settings.service.ts` — `FeatureFlags` interface + `getFeatureFlags`/`updateFeatureFlags` (append after `updateHomepageSections`, ~line 147)
- `src/components/artwork/ArWallButton.tsx` — flag state + render gate
- `src/app/api/ar/[artworkId]/route.ts` — 403 guard
- `src/components/admin/SettingsDialog.tsx` — "Features" Card + load/save wiring

---

## Task 1: SettingsService feature flags

**Files:**
- Modify: `src/services/settings.service.ts` (append methods after `updateHomepageSections`, ~line 147; interface after `HomepageSections`, ~line 17)
- Test: `src/services/settings.featureflags.test.ts`

**Interfaces:**
- Produces: `export interface FeatureFlags { arEnabled: boolean; userPostsEnabled: boolean }`
- Produces: `SettingsService.getFeatureFlags(): Promise<FeatureFlags>` — defaults `{ arEnabled: true, userPostsEnabled: false }` on missing keys or error.
- Produces: `SettingsService.updateFeatureFlags(flags: Partial<FeatureFlags>): Promise<void>` — one `upsertSetting` per defined field (`ar_enabled`, `user_posts_enabled`).

- [ ] **Step 1: Write the failing test `src/services/settings.featureflags.test.ts`**

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

const state = vi.hoisted(() => ({
  rows: [] as { key: string; value: unknown }[],
  selectError: null as unknown,
  upserts: [] as { key: string; value: unknown }[],
}))

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        in: async () => ({ data: state.rows, error: state.selectError }),
      }),
      upsert: async (row: { key: string; value: unknown }) => {
        state.upserts.push(row)
        return { error: null }
      },
    }),
  },
  supabaseAdmin: null,
}))

const { SettingsService } = await import('./settings.service')

beforeEach(() => {
  state.rows = []
  state.selectError = null
  state.upserts = []
})

describe('getFeatureFlags', () => {
  it('returns defaults when no rows exist (ar on, posts off)', async () => {
    expect(await SettingsService.getFeatureFlags()).toEqual({
      arEnabled: true,
      userPostsEnabled: false,
    })
  })
  it('parses stored booleans and string booleans', async () => {
    state.rows = [
      { key: 'ar_enabled', value: false },
      { key: 'user_posts_enabled', value: 'true' },
    ]
    expect(await SettingsService.getFeatureFlags()).toEqual({
      arEnabled: false,
      userPostsEnabled: true,
    })
  })
  it('returns defaults on query error (fail-open)', async () => {
    state.selectError = { message: 'boom' }
    expect(await SettingsService.getFeatureFlags()).toEqual({
      arEnabled: true,
      userPostsEnabled: false,
    })
  })
})

describe('updateFeatureFlags', () => {
  it('upserts only the provided fields', async () => {
    await SettingsService.updateFeatureFlags({ arEnabled: false })
    expect(state.upserts).toEqual([{ key: 'ar_enabled', value: false }])
  })
  it('upserts both fields when both provided', async () => {
    await SettingsService.updateFeatureFlags({ arEnabled: true, userPostsEnabled: true })
    expect(state.upserts).toEqual([
      { key: 'ar_enabled', value: true },
      { key: 'user_posts_enabled', value: true },
    ])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/services/settings.featureflags.test.ts`
Expected: FAIL — `getFeatureFlags` is not a function.

- [ ] **Step 3: Implement in `src/services/settings.service.ts`**

(a) After the `HomepageSections` interface (~line 17), add:

```ts
export interface FeatureFlags {
  arEnabled: boolean        // ar_enabled — missing key means ENABLED
  userPostsEnabled: boolean // user_posts_enabled — missing key means disabled (feature not built yet)
}
```

(b) After `updateHomepageSections` (~line 147), add:

```ts
  /**
   * Get feature flags. Missing keys fall back to defaults; errors fail open
   * (a broken settings read must never disable a live feature by accident).
   */
  static async getFeatureFlags(): Promise<FeatureFlags> {
    const flags: FeatureFlags = { arEnabled: true, userPostsEnabled: false }
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .in('key', ['ar_enabled', 'user_posts_enabled'])

      if (error) throw error

      data?.forEach(setting => {
        if (setting.key === 'ar_enabled') {
          flags.arEnabled = setting.value === true || setting.value === 'true'
        }
        if (setting.key === 'user_posts_enabled') {
          flags.userPostsEnabled = setting.value === true || setting.value === 'true'
        }
      })
      return flags
    } catch (error) {
      console.error('Error fetching feature flags:', error)
      return flags
    }
  }

  /**
   * Update feature flags (only the provided fields).
   */
  static async updateFeatureFlags(flags: Partial<FeatureFlags>): Promise<void> {
    if (flags.arEnabled !== undefined) {
      await this.upsertSetting('ar_enabled', flags.arEnabled)
    }
    if (flags.userPostsEnabled !== undefined) {
      await this.upsertSetting('user_posts_enabled', flags.userPostsEnabled)
    }
  }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/services/settings.featureflags.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/services/settings.service.ts src/services/settings.featureflags.test.ts
git commit -m "feat: feature-flag settings (ar_enabled, user_posts_enabled)"
```

---

## Task 2: Client flag reader with module cache

**Files:**
- Create: `src/lib/ar/flags.ts`
- Test: `src/lib/ar/flags.test.ts`

**Interfaces:**
- Produces: `getArEnabled(): Promise<boolean>` — one supabase read per page load (module-cached promise); missing key / error / rejection → `true`.
- Produces: `_resetArEnabledCache(): void` — test-only cache reset.
- Consumed by Task 3's `ArWallButton`.

- [ ] **Step 1: Write the failing test `src/lib/ar/flags.test.ts`**

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

const state = vi.hoisted(() => ({
  response: { data: null as { value: unknown } | null, error: null as unknown },
  reject: false,
  calls: 0,
}))

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => {
            state.calls++
            if (state.reject) throw new Error('network down')
            return state.response
          },
        }),
      }),
    }),
  },
  supabaseAdmin: null,
}))

const { getArEnabled, _resetArEnabledCache } = await import('./flags')

beforeEach(() => {
  _resetArEnabledCache()
  state.response = { data: null, error: null }
  state.reject = false
  state.calls = 0
})

describe('getArEnabled', () => {
  it('true when the stored value is true or "true"', async () => {
    state.response = { data: { value: true }, error: null }
    expect(await getArEnabled()).toBe(true)
    _resetArEnabledCache()
    state.response = { data: { value: 'true' }, error: null }
    expect(await getArEnabled()).toBe(true)
  })
  it('false when the stored value is false', async () => {
    state.response = { data: { value: false }, error: null }
    expect(await getArEnabled()).toBe(false)
  })
  it('true when the key is missing (PGRST116-style error)', async () => {
    state.response = { data: null, error: { code: 'PGRST116' } }
    expect(await getArEnabled()).toBe(true)
  })
  it('true when the query rejects (fail-open)', async () => {
    state.reject = true
    expect(await getArEnabled()).toBe(true)
  })
  it('caches: repeated calls hit supabase once', async () => {
    state.response = { data: { value: false }, error: null }
    await Promise.all([getArEnabled(), getArEnabled(), getArEnabled()])
    expect(state.calls).toBe(1)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/ar/flags.test.ts`
Expected: FAIL — cannot find module `./flags`.

- [ ] **Step 3: Implement `src/lib/ar/flags.ts`**

```ts
import { supabase } from '@/lib/supabase'

let cached: Promise<boolean> | null = null

/**
 * Whether the AR wall-preview feature is enabled site-wide
 * (admin Settings -> Features). Missing key or any read error => true:
 * a broken settings read must never silently kill the feature.
 * Cached for the lifetime of the page; all ArWallButton instances share
 * one query.
 */
export function getArEnabled(): Promise<boolean> {
  if (!cached) {
    cached = supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'ar_enabled')
      .single()
      .then(
        ({ data, error }) => {
          if (error || !data) return true
          return data.value === true || data.value === 'true'
        },
        () => true,
      )
  }
  return cached
}

/** Test-only: clear the module cache. */
export function _resetArEnabledCache(): void {
  cached = null
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/ar/flags.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/ar/flags.ts src/lib/ar/flags.test.ts
git commit -m "feat: cached client-side ar_enabled flag reader"
```

---

## Task 3: Public gating — button + API route

**Files:**
- Modify: `src/components/artwork/ArWallButton.tsx`
- Modify: `src/app/api/ar/[artworkId]/route.ts`

**Interfaces:**
- Consumes: `getArEnabled` (Task 2).
- Produces: AR off ⇒ `ArWallButton` renders `null` everywhere; `POST /api/ar/{id}` → `403 { error: 'ar_disabled' }`.

- [ ] **Step 1: Gate `ArWallButton.tsx`**

(a) Add the import next to the other `@/lib/ar` imports:

```ts
import { getArEnabled } from '@/lib/ar/flags'
```

(b) Add state directly after `const [pulse, setPulse] = useState(autoOpen)` (line 34):

```ts
  const [arEnabled, setArEnabled] = useState<boolean | null>(null)
```

(c) Add an effect directly after the platform-detection effect (`useEffect(() => { setPlatform(currentArPlatform()) }, [])`, line 44):

```ts
  useEffect(() => { getArEnabled().then(setArEnabled) }, [])
```

(d) In the autoOpen effect (line 100-105), extend the bail-out guard:

```ts
    if (!autoOpen || !eligible || arEnabled !== true || !platform || platform === 'desktop') return
```

and the dependency array becomes `[autoOpen, eligible, arEnabled, platform]`.

(e) Replace the render guard (line 107):

```ts
  if (!eligible || platform === null || arEnabled !== true) return null
```

(The button stays hidden until the flag resolves true — spec D5, no flash.)

- [ ] **Step 2: Guard the route**

In `src/app/api/ar/[artworkId]/route.ts`, directly after `const client = supabaseAdmin ?? supabase` (the first line inside the `try`), insert:

```ts
    // Site-wide AR kill switch (admin Settings -> Features). Missing row or
    // read error fails open — only an explicit false blocks.
    const { data: flagRow } = await client
      .from('site_settings')
      .select('value')
      .eq('key', 'ar_enabled')
      .single()
    if (flagRow && !(flagRow.value === true || flagRow.value === 'true')) {
      return NextResponse.json({ error: 'ar_disabled' }, { status: 403 })
    }
```

- [ ] **Step 3: Verify**

Run: `npx vitest run`
Expected: full suite green (149 tests after Tasks 1-2).

Run: `npm run typecheck 2>&1 | grep -E 'error TS' | grep -vE 'exhibitions/page|\.next/types/validator'`
Expected: empty output.

- [ ] **Step 4: Commit**

```bash
git add src/components/artwork/ArWallButton.tsx "src/app/api/ar/[artworkId]/route.ts"
git commit -m "feat: gate AR button and generation API on ar_enabled flag"
```

---

## Task 4: Admin Settings dialog — Features section

**Files:**
- Modify: `src/components/admin/SettingsDialog.tsx`

**Interfaces:**
- Consumes: `FeatureFlags`, `SettingsService.getFeatureFlags`, `SettingsService.updateFeatureFlags` (Task 1).

- [ ] **Step 1: Wire state, load, and save**

(a) Extend the service import (line 14):

```ts
import { SettingsService, SiteSettings, HomepageSections, FeatureFlags } from '@/services/settings.service'
```

(b) Add state directly after the `sections` state (lines 42-45):

```ts
  const [features, setFeatures] = useState<FeatureFlags>({
    arEnabled: true,
    userPostsEnabled: false,
  })
```

(c) In the load effect's `Promise.all` (lines 61-65), add the fourth fetch and setter:

```ts
        const [carouselSettings, homepageSections, currentLogoUrl, featureFlags] = await Promise.all([
          SettingsService.getCarouselSettings(),
          SettingsService.getHomepageSections(),
          SettingsService.getLogoUrl(),
          SettingsService.getFeatureFlags(),
        ])
        setSettings(carouselSettings)
        setSections(homepageSections)
        setLogoUrl(currentLogoUrl)
        setFeatures(featureFlags)
```

(d) In `handleSave`'s `Promise.all` (lines 119-122), add:

```ts
        SettingsService.updateFeatureFlags(features),
```

- [ ] **Step 2: Add the Features Card**

Insert directly after the Homepage Sections `</Card>` (line 264), before the `{/* Carousel Settings */}` comment:

```tsx
            {/* Features */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Features</CardTitle>
              </CardHeader>
              <CardContent className="space-y-0">
                <div className="flex items-center justify-between py-2.5">
                  <div>
                    <Label className="text-sm">AR wall preview</Label>
                    <p className="text-xs text-gray-500">Show the &quot;View on your wall&quot; button and allow AR model generation</p>
                  </div>
                  <Switch
                    checked={features.arEnabled}
                    onCheckedChange={(checked) =>
                      setFeatures(prev => ({ ...prev, arEnabled: checked }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between py-2.5 border-t">
                  <div>
                    <Label className="text-sm">Visitor wall posts</Label>
                    <p className="text-xs text-gray-500">Coming soon — not built yet. This switch will control it when it ships.</p>
                  </div>
                  <Switch
                    checked={features.userPostsEnabled}
                    onCheckedChange={(checked) =>
                      setFeatures(prev => ({ ...prev, userPostsEnabled: checked }))
                    }
                  />
                </div>
              </CardContent>
            </Card>
```

- [ ] **Step 3: Verify**

Run: `npx vitest run`
Expected: full suite green.

Run: `npm run typecheck 2>&1 | grep -E 'error TS' | grep -vE 'exhibitions/page|\.next/types/validator'`
Expected: empty output.

- [ ] **Step 4: Commit**

```bash
git add src/components/admin/SettingsDialog.tsx
git commit -m "feat(admin): Features section with AR and visitor-posts toggles"
```

---

## Task 5: Seed SQL + final verification

**Files:** none (verification + user hand-off)

- [ ] **Step 1: Full verification on the branch**

Run: `npx vitest run` and the filtered typecheck.
Expected: all green / empty. Also `wc -l src/components/admin/SettingsDialog.tsx src/components/artwork/ArWallButton.tsx src/services/settings.service.ts` — all far under 2000.

- [ ] **Step 2: Paste the optional seed SQL for the user** (idempotent; code works without it):

```sql
INSERT INTO site_settings (key, value, description) VALUES
  ('ar_enabled', 'true', 'Show the "View on your wall" AR button and allow AR model generation'),
  ('user_posts_enabled', 'false', 'Visitor wall-photo posts (feature not yet built; flag reserved for it)')
ON CONFLICT (key) DO NOTHING;
```

No pause required — this seed is cosmetic (self-documenting table); defaults are code-level.

- [ ] **Step 3: Push the branch** so the Vercel preview includes the toggles for the device pass, then hand back.

Manual checks that ride on the existing device pass: toggle AR off in admin → button gone from lightbox + detail page after reload, `POST /api/ar/<id>` → 403; toggle back on → everything returns.
