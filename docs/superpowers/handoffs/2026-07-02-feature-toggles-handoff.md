# Handoff — Feature toggles: spec + plan done, EXECUTE next; AR feature built & on preview (2026-07-02, evening)

_Supersedes [2026-07-02-ar-wall-preview-handoff.md](2026-07-02-ar-wall-preview-handoff.md) — that handoff's job (build the AR feature) is DONE; this one carries what remains on the same branch._

**Resume point:** EXECUTE [../plans/2026-07-02-feature-toggles.md](../plans/2026-07-02-feature-toggles.md) Tasks 1–5 with **superpowers:subagent-driven-development** (Daniel chose subagents in a fresh session), on the existing branch `feat/ar-wall-preview`. No app code for the toggles exists yet. No migration pause this time — missing settings keys default in code; the Task 5 seed SQL is cosmetic (paste it, don't block on it).

## The work (one paragraph)

Two switches in the existing admin **SettingsDialog**: (1) **AR wall preview** on/off — off hides `ArWallButton` everywhere AND makes `POST /api/ar/[artworkId]` return `403 ar_disabled`; (2) **Visitor wall posts** — a stored flag (default off, "coming soon") that the future Project B will honor; nothing consumes it yet. Reuses the existing `site_settings` JSONB KV table (public-read + admin-write RLS live since Nov 2025), `SettingsService`, and dialog — no new tables/pages/deps. Spec: [../specs/2026-07-02-feature-toggles-design.md](../specs/2026-07-02-feature-toggles-design.md). The AR feature itself (17 commits) is **built, fully reviewed, and pushed** — the toggles ship on the same branch so AR arrives with its kill switch.

## Repo state right now

- **Repo:** `maibritt` — single repo (NOT the Wolthers two-repo split; `wolthers-repo-facts.md` does not apply). Docs + app share this git repo.
- **Branch:** `feat/ar-wall-preview`, working tree clean (tracked files). HEAD = `7cb4b6f`.
- **Pushed:** everything through `6fa09a0` (the whole AR feature) is on `origin/feat/ar-wall-preview` → **Vercel preview deployment exists** (URL in Daniel's Vercel dashboard). **UNPUSHED: `340e726` (toggles spec) + `7cb4b6f` (toggles plan)** — verify with `git log --oneline @{u}..`.
- **main is untouched and unpushed-to** — it auto-deploys to Production on push; only merge/push main after the device pass.
- **Stash:** `stash@{0}: On main: Login redirect fixes attempt` — unrelated, leave it.
- **Untracked (pre-existing, not this work):** `.claude/settings.json`, older handoffs/specs/plans from June, `scripts/update-exhibitions-schema.sql`, `src/app/(admin)/exhibitions/page.tsx` (Daniel's WIP — NEVER touch, it breaks build/typecheck), `src/lib/migrations/`, `supabasemaibritt.rtf`.
- **SDD ledger:** `.superpowers/sdd/progress.md` (git-ignored) — "SDD Progress — AR Wall Preview" section has the full task-by-task record; append the toggles run there (new section or continue it).

## What's done (all on this branch)

**AR wall preview — COMPLETE, reviewed, pushed:**

| SHA | What |
|---|---|
| `d225ac1`…`d538f51` | 13 plan tasks: dimensions helper, woodHex, geometry, GLB, USDZ, texture, eligibility, migration+service, admin H/W inputs, AR route, ArWallButton, lightbox toggle, detail page (each implemented by a fresh subagent + task-reviewed clean) |
| `83a5a32` | fix: flex-wrap buttons row (task-review catch) |
| `141389c` | fix wave 1: 15s texture-fetch timeout, pulse clears on tap, presets cache-bump comment |
| `6fa09a0` | fix wave 2 (user-approved plan override): clearing H/W inputs writes NULL |

Final whole-branch review (fable): **ready-with-fixes → fixes applied**. 139/139 tests, filtered typecheck clean. The `height_cm`/`width_cm` **migration is applied to the live DB** (16 leftover rows = empty-dimensions placeholders, expected).

**Toggles — docs only:**

| SHA | What |
|---|---|
| `340e726` | `docs:` toggles design spec |
| `7cb4b6f` | `docs:` toggles implementation plan (5 tasks, complete code) |

## Locked decisions (do NOT relitigate)

1. **AR off = button hidden AND API 403** (Daniel chose strict).
2. **Both flags now**; posts flag is stored + toggleable, marked "coming soon", zero consumers until Project B.
3. **Approach A**: reuse `site_settings` KV + `SettingsService` + `SettingsDialog`. No new tables/pages/deps.
4. **Fail-open defaults**: missing `ar_enabled` → true, missing `user_posts_enabled` → false; ANY settings read error → defaults. A broken read must never kill AR.
5. **No-flash gating**: `ArWallButton` renders nothing until the flag resolves **true** (module-cached promise in new `src/lib/ar/flags.ts`; one query shared by all buttons). Waiting beats optimistic-show-then-hide.
6. `flags.ts` is its own file: `constants.ts` stays import-free (client-safe), `eligibility.ts` stays server-only (`node:crypto`) — never import eligibility from client code.
7. **Clearing H/W inputs writes NULL** (Daniel overrode the original plan's no-op-on-clear — already implemented in `6fa09a0`).
8. **Labels stay EN-only for now** (PT in tooltip); site-wide localization is a later pass. Don't "fix" this.
9. JSONB flag parse convention: `value === true || value === 'true'` (matches existing service).
10. Dimensions are HEIGHT × WIDTH in cm; `dimensions` TEXT stays authoritative for display/slugs; AR texture = `enhanced ?? display`, never `framed`. (Carried from the AR job — still binding.)

## Codebase anchors (saves re-exploring)

Toggles work (the plan repeats these with full code):
- [settings.service.ts:14-17](../../../src/services/settings.service.ts) `HomepageSections` interface (pattern to mirror); `upsertSetting` at ~L169; append new methods after `updateHomepageSections` (~L147).
- [SettingsDialog.tsx:42-45](../../../src/components/admin/SettingsDialog.tsx) sections state; load `Promise.all` L61-65; save `Promise.all` L119-122; Homepage Sections Card ends L264 (Features Card goes right after); Switch row idiom L239-262.
- [ArWallButton.tsx:34](../../../src/components/artwork/ArWallButton.tsx) pulse state (flag state goes after); platform effect L44; autoOpen effect L100-105; render guard L107.
- [route.ts](../../../src/app/api/ar/[artworkId]/route.ts) — guard goes directly after `const client = supabaseAdmin ?? supabase` (first line inside the `try`).
- `site_settings` schema: [migrations/20251121_create_site_settings.sql](../../../migrations/20251121_create_site_settings.sql) (id UUID PK, key TEXT UNIQUE, value JSONB NOT NULL); RLS in `migrations/20251125_enable_rls_public_read_policies.sql`.
- Vitest mock pattern for services: `src/services/artwork.transform.test.ts` (mock `@/lib/supabase` before dynamic import); the plan's tests use `vi.hoisted` state.

## Gotchas

- **Filtered typecheck is the gate**: `npm run typecheck 2>&1 | grep -E 'error TS' | grep -vE 'exhibitions/page|\.next/types/validator'` must be EMPTY. Plain typecheck shows ~8-10 pre-existing errors in Daniel's untracked exhibitions WIP; `npm run build` FAILS on it. Neither is a usable gate — don't chase those errors, don't touch that file.
- **Local `.env.local` Supabase project is DEAD**: ref `fpzhswuivxkrtyrxussw` is NXDOMAIN globally (verified via 8.8.8.8/1.1.1.1, unsandboxed). Daniel applies SQL via his dashboard and it works, so production uses a different/current project. **Local dev server cannot reach the DB** — no local smoke tests against Supabase; verify on the Vercel preview instead. **Open question for Daniel: paste current Supabase URL + anon + service keys to fix local dev** (nobody has asked him yet).
- Give every implementer subagent the filtered-typecheck line and "run focused tests only, full suite once before commit" — and tell reviewers the test evidence is in the implementer's report.
- Subagent briefs/reports live in `.superpowers/sdd/` via the skill's `task-brief`/`review-package` scripts; report files from older runs at the same path get overwritten — harmless, git history has them.
- `vitest run` does NOT typecheck — two AR-branch bugs were caught only by the consolidated filtered `tsc`. Run it after every task.
- Suite count is currently **139 tests / 30 files**; plan Tasks 1-2 add 10 more (149).
- Daniel's rules: he pastes+applies all SQL (the toggles seed is optional/cosmetic — paste it, don't block); files under ~2000 lines (inform + refactor beyond ~2200); always paste SQL in chat.
- `main` auto-deploys to Vercel Production on push. Branch pushes create preview deployments — safe.

## Remaining after the toggles (ordered by value)

1. **Execute toggles plan Tasks 1–5** (this handoff's resume point), push branch → preview updates.
2. **Device pass on the Vercel preview** (Daniel + real hardware; simulators can't AR). Plan Task 14 checklist PLUS the final review's additions: iOS **cold-cache first tap** (user-activation window — if Safari swallows the Quick Look launch, fix is a two-phase prepare→tap UX); **Vercel env has SUPABASE_SERVICE_ROLE_KEY** (else every cold generation 500s on RLS); `.usdz` served as `model/vnd.usdz+zip` (curl -I); vertical anchoring actually wins (wall, not floor); iPad desktop-UA → Quick Look not QR; Android back-gesture from the model-viewer sheet; largest artwork (285cm) cold gen under 60s; QR-from-lightbox path; toggle off→on round trip.
3. **Merge to main + push** (= production deploy) once the device pass is green. Then offer a **changelog entry** (changelog skill).
4. **Warn Daniel before he fixes the 16 leftover rows**: editing dimensions regenerates the slug (pre-existing rule) → old artwork URLs/QRs for those rows break.
5. Deferred polish (final review said ride-as-is): GLB/USDZ roughness/wrap alignment (bump `AR_MODEL_VERSION` when touching), modal a11y (role/Escape/focus-trap), old-localStorage-draft `?? ''`, toNum consolidation.
6. **Project B brainstorm** (visitor wall posts): anonymous upload + artist moderation; AR can't hand photos back to the page → "screenshot in AR, then upload" flow; site has NO public auth. The `user_posts_enabled` flag already exists for it.

## Things the user said that should shape future work

- "lets do the recommended" (Approach A) and subagent-driven execution in a fresh session — that's this handoff.
- Chose: clearing dims removes them; EN-only labels for now; AR off blocks API too; posts switch built now.
- The AR spec was approved verbatim earlier ("this is it"); don't reopen design questions on either feature.
