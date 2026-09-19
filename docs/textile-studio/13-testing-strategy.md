# 13 — Testing Strategy

## Current state: zero automated tests exist in this repository

No Jest, Vitest, Testing Library, or Playwright in `package.json`. This is a real gap the requirements (§68-§72) correctly call out — "not complete because the UI renders" applies to the entire codebase as it stands today, not just the Studio.

## Recommended stack (Phase 1, before Phase 2 work merges)

- **Vitest** — unit tests for pure logic: `pricing-engine.ts`, `manufacturability-engine.ts`, `design-reducer.ts`, the future `scale-service.ts`. Fast, zero-config with Next/Turbopack, no reason to choose Jest here.
- **@testing-library/react** — component tests for panels/forms (auth forms, artwork panel validation states).
- **Playwright** — the critical E2E journey (§68): Google login → create saree → material → colour → artwork upload → repeat → border → pallu → zari → save → drape → model select → view drape → change design → confirm drape updates → save version → export. This single test is the highest-value test in the entire plan — it's the one that proves the product, not just its parts, works.

## What gets tested per phase, concretely

- **Phase 1:** RLS isolation (`user A` cannot read/write `user B`'s rows) — write as a Vitest test hitting the real Supabase test project with two seeded users, not mocked.
- **Phase 2:** autosave debounce doesn't fire per-keystroke; version restore doesn't mutate other versions; concurrent-edit conflict (§72) is detected, not silently overwritten.
- **Phase 4:** upload validation rejects oversized/wrong-MIME files server-side even if a client bypasses the UI check.
- **Phase 5-6:** repeat/border/pallu/zari config changes propagate to price + manufacturability recompute (pure function tests — cheap, high value).
- **Phase 8-10:** drape regenerates on body/border/pallu/zari change; changing the selected model does not mutate `SareeDesign` (assert via deep-equal before/after).
- **Phase 12-13:** free user hits AI entry point → paywall renders → assert zero network calls to `/api/ai/*` (this is the concrete, automatable version of §70's "no Gemini request" requirement — a test that inspects network activity, not just UI text).

## Not building now

Load/performance testing infrastructure, visual regression tooling — reasonable later additions once there's enough UI surface for them to be worth the setup cost.
