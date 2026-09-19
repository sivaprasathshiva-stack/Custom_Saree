# 16 — Phased Implementation Plan

Per §82/§94: no phase starts before the prior phase's foundation is stable, tested, and reported. This document is the gate.

## Phase 0 — Architecture audit (this document set)
**Status: done.** Output: `01-17` in this folder. Blocking open items before Phase 1: none — see `17-open-questions.md` for items that affect *scoping* of later phases (9-13) without blocking earlier ones.

## Phase 1 — Auth + database foundation + test scaffolding
- Confirm email/password + Google dual-auth decision (`10-authentication.md`)
- Enable Google provider in Supabase dashboard (your action — Client ID/Secret)
- Add Vitest + Playwright, write the RLS-isolation test as the first test in the repo
- Add account deletion
- Add Web Vitals reporting (`14-performance-strategy.md`)

## Phase 2 — Design persistence + versioning
- Migrate `designs.design` blob to reference-structure jsonb (ids/scalars only, no binary) — see `04-database-schema.md`
- Version create/restore/compare (comparison UI, not just storage — currently only storage exists)
- Autosave debounce + Saving/Saved/Failed states (§51) — partially exists (`studio-shell.tsx` has a save-status ticker), extend to real failure/retry states

## Phase 3 — Material + colour
- Extend `materials` table with `weaveFamily`, `availableColours`, `compatibleZari`, `technicalProperties` (null where unknown — never fabricated, §15)
- Colour: add `motif`/`blouse` slots to the 4 existing palette slots

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
