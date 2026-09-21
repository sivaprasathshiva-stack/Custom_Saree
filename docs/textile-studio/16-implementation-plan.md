# 16 — Phased Implementation Plan

Per §82/§94: no phase starts before the prior phase's foundation is stable, tested, and reported. This document is the gate.

## Phase 0 — Architecture audit (this document set)
**Status: done.** Output: `01-17` in this folder. Blocking open items before Phase 1: none — see `17-open-questions.md` for items that affect *scoping* of later phases (9-13) without blocking earlier ones.

## Phase 1 — Auth + database foundation + test scaffolding
**Status: done, except one item that requires your Supabase dashboard access.**
- Confirm email/password + Google dual-auth decision (`10-authentication.md`) — resolved, no code change needed.
- Enable Google provider in Supabase dashboard — **still outstanding, your action.** Requires the project owner's dashboard access and a Google OAuth Client ID/Secret; cannot be done from this environment. UI already renders the Google button (per `10-authentication.md`); it will start working once the provider is enabled.
- Vitest already existed (design-reducer/pricing/manufacturability tests). Playwright was **not added** — out of scope for what was actually built this pass; still recommended per `13-testing-strategy.md` for the full E2E journey once more of the Studio surface exists (Phase 4+).
- RLS-isolation test: added as `src/lib/supabase/rls-isolation.test.ts`, a real (not mocked) Vitest test using the Supabase admin API to create two real users, seed a design owned by user B, sign in as user A with the anon-key client, and assert zero rows are readable/writable/deletable. It runs for real when `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are all set against a live project; otherwise it self-documents as skipped (keeps `npm test` green without a live project, per the existing `isSupabaseConfigured()` fallback pattern used elsewhere in the repo). Not yet run against a real project in this session — no service-role key is configured here.
- Account deletion: added. `src/lib/supabase/admin.ts` (service-role client, server-only), `src/app/api/account/delete/route.ts` (deletes the signed-in user via `auth.admin.deleteUser`, which cascades `profiles`/`designs`/`design_versions` via existing FKs), and a real UI control on `/account` (`src/components/account/delete-account-button.tsx`, two-step confirm). Returns 501 with a clear message if `SUPABASE_SERVICE_ROLE_KEY` isn't set, rather than silently no-op'ing. **Requires you to add `SUPABASE_SERVICE_ROLE_KEY` to your environment** (documented in `.env.example`) — not yet set in this environment, so deletion is wired but untested against a live project.
- Web Vitals: added `src/components/web-vitals-reporter.tsx` (Next's built-in `useReportWebVitals`) mounted in `src/app/layout.tsx`, sending each metric to a stub route `src/app/api/vitals/route.ts` that logs server-side only. **This is not a real analytics sink** — no provider (Vercel Analytics/GA/etc.) is wired up, since that requires an account/key decision only you can make. The measurement plumbing is real and ready to point at a real provider once chosen.

## Phase 2 — Design persistence + versioning
**Status: done, with one known, documented limitation pending Phase 4.**
- Migrated `designs.design`/`design_versions.design` to the reference-structure jsonb contract from `04-database-schema.md`: artwork layers keep id/name/fileName/transform/visible but never their base64 `dataUrl`. Implemented as `PersistedSareeDesign` (`src/components/studio/types.ts`) plus `toPersisted`/`fromPersisted` conversion in `src/components/studio/cloud-design-store.ts`, covered by `cloud-design-store.test.ts`. No DDL/ALTER was needed since `design` is untyped jsonb — documented the new contract as a comment block in `supabase/schema.sql` directly (the repo's existing convention: a single hand-maintained schema file, no `migrations/` folder exists). **Known limitation, by design:** since `artwork_assets` + Supabase Storage are explicitly Phase 4 scope (not this task's scope), artwork pixel data is device-local only (localStorage) — a design reloaded from the cloud on a different device shows artwork layers as a "re-upload" placeholder (implemented in `studio-shell.tsx`) rather than the actual image. This is the correct incremental step per `04-database-schema.md`'s own staging note ("pragmatic first migration is: get binary data OUT of the blob... Revisit after Phase 6" / Phase 4 for real storage) — full fidelity needs Phase 4.
- Version create/restore/compare: create/restore already existed; added a real compare UI (`VersionCompareTable` in `studio-shell.tsx` + `src/components/studio/design-diff.ts`, tested in `design-diff.test.ts`) — pick any two versions from history, see a field-by-field side-by-side diff (material, colours, border, pallu, zari, repeat, artwork layer count) with changed rows highlighted, and restore either side directly from the compare view.
- Autosave: extended the existing save-status ticker to a real `idle`/`saving`/`saved`/`failed` state machine with a visible retry action on failure, and added an actual debounced (1.5s) autosave effect on every design change (previously autosave only fired on manual Save/Ctrl+S/version-save — there was no automatic debounce loop). Failure state specifically reflects the cloud write (the one real data-loss risk); local save failures also surface but are rare (storage quota only).

**Not done / explicitly deferred as Phase 3+ scope, not silently skipped:** materials-table extension, colour palette slot changes (motif/blouse), full body/border/pallu/zari sub-configurations, artwork_assets/object storage, Konva canvas, drape/model/AI/payments — all per the phase boundaries already defined below and the task's explicit out-of-scope list (Nila 3D, AI, payments).

## Phase 3 — Material + colour
**Status: done, as a static-data extension (no `materials` table yet — see judgment call below).**
- Extended the static `materials` array (`src/components/studio/studio-data.ts`) with `weaveFamily` (which weaves each silk actually supports), `availableColours`, `compatibleZari`, and `technicalProperties`. `technicalProperties` only restates the weight/width/drape/sheen values already published on `/materials` (same source of truth, nothing new invented); genuinely unknown fields (`threadCount`, `weaveDensity`, `zariComposition`) are explicit `null`, never fabricated, per §15.
- Added a `weaves` catalog (plain/jacquard/brocade/tissue) reusing the copy already live at `/materials/weaves` verbatim, plus `weavesForMaterial()` to filter by a material's `weaveFamily`.
- `SareeDesign.weaveId` added alongside `materialId` (`src/components/studio/types.ts`), matching `03-domain-model.md`'s `MaterialSelection` gap note. `SET_WEAVE` action added to the reducer; `SET_MATERIAL` now re-picks a compatible weave if the current one no longer applies to the newly chosen material.
- Colour: `paletteHexBySlot` extended from 4 slots (base/border/pallu/accent) to 6, adding `motif` and `blouse`, with real `SET_COLOUR`-driven swatch controls in the Colour step UI (`studio-shell.tsx`) — not just type additions.
- `pricing-engine.ts` extended with a weave-complexity line (plain < jacquard/tissue < brocade, same demo-data status as every other line, clearly commented as such); `manufacturability-engine.ts` extended with a "Weave compatible with material" check. Both keep their existing pure-function signature (`(design: SareeDesign) => ...`) — only the input's fields grew, per `03-domain-model.md`'s explicit instruction to keep their approach.
- `design-diff.ts` (version compare) extended to show weave and the two new colour slots.
- Tests added: `design-reducer.test.ts` (SET_WEAVE, SET_COLOUR for motif/blouse, SET_MATERIAL re-picking an incompatible weave), `pricing-engine.test.ts` (brocade costs more than plain), `manufacturability-engine.test.ts` (weave/material compatibility check both ways).
- **Judgment call:** `04-database-schema.md`'s recommended schema does list a future `materials` table, but explicitly defers `weaves` as its own table ("Explicitly deferred... none of these are needed for Phase 1-7") and doesn't call for migrating `materials` off static data as *this* phase's work — Phase 3 in this very plan only says "extend materials," not "create the table." Since materials/weaves are catalog data (not user data), and `schema.sql` is hand-maintained with no migrations tooling, extending the static TS data model was the scope-consistent choice for this phase; standing up a live `materials`/`material_colour_options` table remains open for whenever real catalog-management needs (admin editing, per-region availability, etc.) justify it — not before.
- **Not fabricated, flagged as open:** exact GSM/weave-density/zari-composition numbers per material are not published anywhere in the codebase or marketing copy, so `technicalProperties` carries them as `null` rather than invented figures. `availableColours`/`compatibleZari` per material are demo/UI defaults (all zari options compatible with almost all materials, a shared 5-swatch palette), not sourced manufacturing constraints — flagged for real data when it exists.

## Phase 3.5 — Submission workflow + route restructuring (start of PRD reconciliation)
**Status: done, with one deliberately deferred item — see below.** Added after
`VELVOREA_Textile_Studio_PRD_FRD_Architecture.md` landed; see
`18-prd-reconciliation.md` for the full comparison against this doc set.
- `submissions` + `notification_events` tables (`supabase/schema.sql`), RLS
  matching the existing owner-scoped pattern, plus an admin-scoped select
  policy on `submissions` gated on a new `profiles.is_admin boolean`.
- Customer-facing status labels: `src/lib/studio/submission-status.ts`
  (PRD §35's exact nine-label list), tested.
- Submission validation shared by client + server:
  `src/lib/studio/submission-validation.ts`, tested.
- Stub office notification: `src/lib/studio/office-notification.ts` (honest
  stub, same pattern as `/api/vitals`) + `POST /api/studio/submissions`
  (`src/app/api/studio/submissions/route.ts`), which always persists the
  submission first and treats notification failure as best-effort per
  PRD §37 — a failed "email" never fails the submission.
- Concept Review (`/studio/[designId]/complete`), submission form
  (`/studio/[designId]/submit`, `src/components/studio/submission-form.tsx`),
  and confirmation screen (`/studio/[designId]/submit/confirmation`), using
  the PRD's exact guardrail copy for the required-by date.
- My Designs (`/studio/designs`) and Create Design base picker
  (`/studio/new`) added as real, additive routes — list/rename/duplicate
  /archive/delete against the `designs` table, empty state per PRD §7.
- Admin read-only design-requests list (`/admin/design-requests`), gated
  server-side on `profiles.is_admin` (no client-trusted flag). Granting
  admin currently requires a manual DB update — no admin UI for role
  management yet, by design (out of scope, see task instructions).
- Artwork placement selector ("Place On: Body / Border / Pallu",
  `ArtworkLayer.placement` in `types.ts`, `ARTWORK_SET_PLACEMENT` action) —
  border/pallu placement centers the layer in that region's strip; full
  per-region drag/repeat is still Phase 6/7 scope.
- No-export guard: explicit code comment in `studio-shell.tsx` plus
  `onContextMenu` prevention on the preview canvas only (does not affect
  keyboard/assistive-tech interaction).
- Guardrail copy correction: the flat preview now says "Digital textile
  concept preview" (PRD §73 Guardrail 1), not "Technical preview."
- Profile phone/country: exposed as a real editable field on `/account`
  (`profiles.phone`/`country` already existed in the schema since Phase 1
  but had no UI). Phone is required at **submission** time (enforced by the
  submission form/API), not at signup — see `18-prd-reconciliation.md` (b)4
  for why this deviates from the PRD's journey diagram.
- **Deliberately not done:** moving the editor itself
  (`studio-shell.tsx`) from `/studio` to `/studio/[designId]/edit` with real
  per-id load/save. `/studio` still edits "the current design" (most
  recently updated row) for the signed-in user; `/studio/designs`' "Open"
  and `/studio/new`'s post-create redirect both land there. Correct for a
  single-design user, a known limitation for a multi-design user — see
  `18-prd-reconciliation.md` (b)2 for the full reasoning and what the real
  refactor requires. Nothing that existed before this phase regressed.
- **Still out of scope, unchanged:** NILA 3D/Three.js (no 3D asset exists —
  "View on NILA" is a disabled, honestly-labelled "coming soon" control),
  AI features, OTP/SMS phone verification, a real email provider, the full
  designer workspace beyond the read-only list, B2B/legal pages, payments.

## Phase 3.9 — Production requirements build (supersedes Phases 4-14 below)

**Status: built, not yet verified against a live project.** See
`19-production-requirements-build.md` for the full record.

A new build specification (`VELVOREA_TEXTILE_STUDIO_PRODUCTION_REQUIREMENTS`,
93 sections) arrived after Phase 3.5 and redefines the product: the customer
now uploads photographs of an existing saree, adds an image and up to 99
characters, positions them on a canvas, and receives an AI-generated woven
concept and a NILA drape. **The project owner confirmed this replaces the
configurator** rather than sitting alongside it.

This pass implemented: the §29 data model, §5 state machine, §15 AI provider
abstraction with a deterministic mock set, the §32 durable job queue with a
serverless tick worker, §34.5 upload security, §34.6 rate limiting, §50 audit
logging, the §26 API surface, and the full Upload → Compose → Woven → Drape →
Submit customer flow. The configurator's editor, pricing engine and
manufacturability engine were retired (recoverable from git history);
`studio-data.ts` was kept because the marketing site depends on it.

**Blocking next step:** `supabase/schema.sql` must be re-run against the
Supabase project — none of the new tables or functions exist there yet, so the
flow cannot be exercised end to end until it is.

### Phases 4-14 below: superseded, retained for history

The phases below were written for the configurator's roadmap (repeat engine,
region sub-systems, flat preview, entitlement/paywall). Phases 4, 5 and 8-11
are substantially delivered in different form by the work above — object
storage, a canvas, and the drape architecture all now exist, built to the new
specification rather than these plans. Phases 6, 7, 12 and 13 describe a
product that no longer exists. Do not resume them without re-reading
`19-production-requirements-build.md` first.

## Phase 4 — Artwork + layer engine + object storage
- `artwork_assets` table + Supabase Storage buckets (`12-storage-architecture.md`)
- Server-side upload validation route handler
- Switch `ArtworkLayer.assetId` off inline `dataUrl`

## Phase 5 — Repeat engine + canvas foundation
- Introduce Konva (`07-rendering-architecture.md`)
- Extend `RepeatConfiguration` to the full 7-type set with offset/mirror/spacing
- Live repeat preview on canvas

## Phase 6 — Body + border + pallu + zari as independent sub-systems
- Promote from single-id-pick to full `BodyConfiguration`/`BorderConfiguration`/`PalluConfiguration`/`ZariConfiguration` (`03-domain-model.md`)
- Extend `pricing-engine.ts`/`manufacturability-engine.ts` inputs accordingly — their pure-function shape stays, inputs grow

## Phase 7 — Flat textile preview
- Full/body/border/pallu/macro/repeat-tile view modes, zoom/pan/fit, physical-scale indicator

## Phase 8 — Drape architecture (code only, no assets yet)
- `DrapeEngine` interface, `TemplateDrapeEngine` implementation skeleton, `DrapeConfiguration` wired into `SareeDesign`
- **Blocked on a business decision, not code:** model photography/illustration sourcing (`08-drape-architecture.md`, `17-open-questions.md`) — this phase can complete its code shape with placeholder/test assets, but cannot ship real models without that decision

## Phase 9 — Female model library
- `model_templates` table + admin-entered (not user-facing-built) initial 4 models
- Depends on Phase 8's decision being resolved

## Phase 10 — Drape rendering
- `POST /api/designs/:id/drape` route handler, `sharp`-based compositing
- Fidelity disclaimer UI (§38/§39), sync-on-change (§37/§40)

## Phase 11 — Export
- PNG/JPEG of flat design + drape preview, design-sheet metadata (name/version/date/material/palette)

## Phase 12 — AI entitlement + provider abstraction (no activation)
- `plans`/`subscriptions`/`ai_capabilities`/`ai_requests` tables
- `AIProvider` interface, entitlement gateway, `/api/ai/*` route shells returning "not available" for every request regardless of plan (provider not yet wired)

## Phase 13 — Mock AI provider + AI paywall UX
- `MockAIProvider`, `✦ VELVOREA AI` entry point, paywall card
- Test: free user → paywall → zero `/api/ai/*` network calls with a real provider attached

## Phase 14 — Testing completion, performance, accessibility pass
- Full E2E journey test (`13-testing-strategy.md`)
- WCAG 2.2 AA pass across Studio specifically (marketing site accessibility is a separate, already-partially-addressed concern from earlier sessions)

## What ships to production after each phase

Every phase above ends with: build passes, lint clean, new tests pass, existing routes unaffected (verified by loading the site, not assumed), docs in this folder updated to reflect what actually got built vs. planned, and a status report to you before starting the next phase — per §82's explicit instruction not to silently chain phases.

## Immediate next step

Waiting on: (1) your decision on the master-requirements-document question in `17-open-questions.md` #1, (2) confirmation on the email/password-vs-Google-only question, (3) go-ahead to start Phase 1. Nothing further is being coded until you respond — per §94, this document set is the gate.
