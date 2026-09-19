# 01 — Current State Assessment

**Status:** audit only, no code changed as a result of this document.

## What exists today

**Framework:** Next.js 16 (App Router, Turbopack), React 19, TypeScript strict, Tailwind v4. Deployed on Vercel at velvorea.com. No test framework of any kind is installed (no Jest/Vitest/Playwright in package.json).

**Studio implementation** (`src/components/studio/`):
- `studio-shell.tsx` (~1000 lines) — the entire Studio UI in one client component: top bar, step sidebar, a property panel per step, price/manufacturability summary. **There is no visual saree canvas.** "Artwork" upload stores a `dataUrl` string and a transform (`x`, `y`, `scale`, `rotation`) per layer, edited via numeric sliders in a side panel — there is no drag/rotate/scale-on-canvas interaction, no rendering of the saree shape (pallu/body/border regions), no visual repeat preview, no zoom/pan.
- `design-reducer.ts` — a plain `useReducer` reducer over a flat `SareeDesign` object (material id, 4 palette hex slots, one artwork-layer array, one repeat config, one border id, one pallu id, one zari id). Body/border/pallu are **not independent design regions** — they're each a single selected preset ID from a fixed list of 3-4 options, not a configurable sub-system with their own artwork/repeat/colour.
- `use-design-history.ts` — undo/redo via a linear history array plus a `HISTORY_SIGNIFICANT_ACTIONS` set to coalesce/skip noisy actions. Reasonable pattern, scoped correctly.
- `pricing-engine.ts`, `manufacturability-engine.ts` — pure functions, explicitly self-documented as "DEMO" with hardcoded numbers (`kan: 12400`, etc.) and hardcoded rule thresholds. Comments already state real values must come from manufacturing before launch.
- `local-design-store.ts` — localStorage-only persistence, explicitly written with a matching-signature comment anticipating a server-backed swap-in.
- `cloud-design-store.ts` (added this session) — Supabase-backed equivalent of the above, used opportunistically when a user is signed in; the whole `SareeDesign` is stored as one `jsonb` column (`designs.design`), not normalized entities.
- `types.ts` — `SareeDesign`, `ArtworkLayer`, `RepeatConfig` (types: straight/half-drop/mirror/brick — not the grid/brick/mirror/tossed/stripe/custom set the new requirements ask for), `DesignVersion`, `ManufacturabilityCheck`, `PriceResult`. No `BodyConfiguration`, `BorderConfiguration` (beyond an id), `PalluConfiguration` (beyond an id), `BlouseConfiguration`, `DrapeConfiguration`, or `ModelTemplate` types exist anywhere.
- `studio-data.ts` — static arrays: 4 materials, 4 palette swatches, 3 borders, 3 pallus, 3 zari options. No weave, no per-material available-colours/compatible-zari, no technical properties.

## Authentication & database (added this session, before this prompt arrived)

- `@supabase/ssr` + `@supabase/supabase-js` wired for browser/server/middleware clients (`src/lib/supabase/*`).
- Email/password + Google OAuth (UI built; Google provider not yet enabled in the Supabase dashboard) + password reset flow.
- `supabase/schema.sql`: `profiles`, `designs`, `design_versions` — three tables, RLS scoped by `auth.uid()`. `designs.design` and `design_versions.design` are `jsonb` blobs of the entire `SareeDesign`. This is exactly what §9 of the new requirements says not to do ("Do not store the entire design as one JSON blob... avoid... Use structured domain entities").
- No `materials`, `weaves`, `artwork_assets`, `model_templates`, `subscriptions`, `entitlements`, `ai_*`, or `audit_logs` tables exist. No object storage is configured — artwork lives as base64 `dataUrl` strings inside the jsonb blob, which is both a normalization violation and, at scale, a Postgres row-size/performance problem.

## What does not exist at all

Canvas/rendering engine, layer drag-transform UI, repeat live-preview, independent border/pallu/body sub-editors, zari density/placement/width fields, blouse configuration, model library, drape engine of any kind, AI provider abstraction/entitlement/gateway, object storage, design export, version comparison UI (versions are stored and listable but not diffed), analytics events, audit log, rate limiting, CSRF/upload validation beyond MIME/size checks not yet written, and no automated tests anywhere in the repo.

## Conclusion

The current Studio is a **configurator** (pick from short preset lists, tweak numeric fields, see a computed price) built as a fast, honest placeholder — its own code comments say so throughout. It is not the "professional textile CAD + drape visualization" product described in the new requirements. That gap is the subject of the rest of this document set.
