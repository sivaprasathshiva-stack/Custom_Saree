# 19 — Production Requirements Build

Implements `VELVOREA_TEXTILE_STUDIO_PRODUCTION_REQUIREMENTS` (the 93-section
build specification). Section references below (§n) point at that document.

## Decisions taken before any code was written

Three questions were genuinely ambiguous and were resolved by the project
owner, not assumed:

1. **The photo → AI → drape flow replaces the configurator.** The material /
   weave / colour / border / pallu / zari / price configurator is retired, not
   kept alongside. See "What was removed" below.
2. **Evolve in place on Supabase**, rather than restructuring into the
   monorepo + self-hosted Postgres + Redis/BullMQ + S3 stack §59 describes.
   This matches §25.1's own "modular monolith for V1" guidance and preserves
   the existing auth, RLS and tested stores. Where §59 names infrastructure we
   do not have, the *capability* is implemented on Supabase primitives — see
   "Deviations" below.
3. **The Google sign-in gate stays.** §4.1/§23.3's anonymous-start model is
   deferred; there is no `anonymous_sessions` table and no claim flow.

## What was built

### Foundation
- `src/config/limits.ts`, `src/config/feature-flags.ts` — every §57 limit and
  §56 flag, env-overridable, no magic numbers anywhere else (§85 Rule 3).
- `src/domain/` — entities (§29), the §5 lifecycle state machine with
  per-actor permissions, the normalized 0..1 composition model (§9.3, §10.1)
  with server-authoritative validation, concept-id format (§21), and the error
  catalogue with customer-safe copy (§27, §37).

### Database (`supabase/schema.sql`)
All of §29: `design_assets`, `saree_analysis`, `compositions`,
`generation_jobs`, `concept_versions`, `drapes`, `drape_assets`,
`design_status_history`, `internal_notes`, `audit_logs`, plus
`concept_sequences` and `rate_limit_counters`. RLS on every table, owner-scoped,
with read-only admin policies mirroring the existing `submissions` pattern.

Four Postgres functions do work the application layer cannot do correctly:
- `allocate_concept_id()` — atomic per-year sequence (§21).
- `claim_generation_job()` — `FOR UPDATE SKIP LOCKED`, so concurrent workers
  never process (or bill for) the same job twice, with lease reclamation for
  crashed workers (§32).
- `complete_woven_concept_job()` — the §54 all-or-nothing commit: asset row,
  immutable version, design pointer, lifecycle state, job closure and history
  in one transaction.
- `consume_rate_limit()` / `generation_quota()` — counters that must be correct
  across serverless instances (§34.6, §65).

`designs.status` was migrated in place from the Phase 3.5 `active|archived`
values to the §5 lifecycle states. `designs.design` (the configurator's jsonb
blob) is deliberately **not** dropped — old rows still hold customer work.

### AI abstraction (`src/lib/ai/`)
Provider interfaces per §15.1, a versioned prompt registry (§62), and a
complete deterministic mock provider set (§71) that renders the customer's
actual composition as woven SVG. No vendor SDK appears outside this folder
(§85 Rule 7). `AI_MODE=LIVE` throws rather than silently serving mock output as
real — an unconfigured production deploy fails loudly.

### Jobs (`src/lib/jobs/`)
Durable Postgres-backed queue with idempotency (§14.6), retry/backoff/
dead-letter (§32.2), named stages (§14.5), and three processors. A failed job
never mutates or clears the customer's composition (§85 Rule 11).

### Security
- `src/lib/security/image-validation.ts` — magic-byte format detection and
  real PNG/JPEG/WebP header parsing. Rejects renamed executables, HEIC, and
  files whose declared type contradicts their bytes (§34.5). Deliberately
  avoids a native decoder: parsing three known headers is a far smaller attack
  surface than handing arbitrary uploads to a full image library.
- Postgres-backed rate limiting (§34.6), fail-open with loud logging.
- `src/lib/audit/audit-log.ts` — append-only, hashed IP/user-agent, never
  fails the operation it describes (§50, §29.15).
- `src/lib/observability/logger.ts` — structured JSON with a redaction list
  that makes logging a token, signed URL or personal data hard by accident
  (§51.1).

### API (`src/app/api/studio/`)
Designs, assets, composition, analysis, smart-arrange, optimize,
woven-concepts, jobs, drapes, submission, worker tick. Every route goes through
`withRoute`/`withAuthedRoute` for request id, timing, auth and error
sanitization; every resource lookup re-checks ownership explicitly even though
RLS also covers it (§34.2, §34.4).

### UI (`src/app/studio/`)
Welcome → Upload → Compose → Woven → Drape → Submit → Confirmation, plus My
Designs. The compose canvas supports move / resize / rotate / delete and
nothing else (§9.5, §13), with keyboard equivalents for every pointer gesture
(§41). Autosave is debounced with visible idle/saving/saved/failed state and a
retry (§46). Processing shows named stages, never a fabricated percentage
(§14.2). All §16.5, §12.4 and §25 disclaimers are rendered, not paraphrased.

## What was removed

Retired with the configurator (recoverable from git history):
`studio-shell.tsx`, `new-design-base-picker.tsx`, `design-reducer.ts`,
`use-design-history.ts`, `local-design-store.ts`, `cloud-design-store.ts`,
`pricing-engine.ts`, `manufacturability-engine.ts`, `design-diff.ts` and their
tests. `studio-data.ts` was **kept** — the marketing site imports `materials`,
`palette`, `borders` and `studioPresets` from it.

`/studio/new` now creates a design and redirects to Upload. `/studio/[id]/complete`
permanently redirects to `/woven`.

## Deviations from the specification, and why

- **No Redis/BullMQ, no separate worker service.** The queue is a Postgres
  table, delivering every §32.1 capability without new infrastructure.

  **How jobs actually get processed — this matters operationally.** The Vercel
  account is on the Hobby plan, which permits a cron to run *once per day*.
  A scheduled tick therefore cannot be what a waiting customer depends on. The
  queue is driven instead by the request path:
  - `kickWorker()` runs a tick via `after()` from `next/server`, which keeps
    the serverless invocation alive past the response (a bare fire-and-forget
    promise would be killed when the response is sent);
  - every poll of `GET /api/studio/jobs/[jobId]` for a non-terminal job also
    drives a tick — the client polls every ~2s while waiting, so the queue
    drains for exactly as long as someone is waiting on it;
  - the daily cron (`0 3 * * *`) is a **sweeper** for stragglers: a job whose
    worker crashed, or one left RETRYING overnight.

  Claiming is atomic (`FOR UPDATE SKIP LOCKED`), so a poll-driven tick and the
  cron running simultaneously cannot process the same job twice.

  **On a Pro plan**, change the schedule in `vercel.json` to `* * * * *` for
  near-real-time processing; nothing else needs to change.
- **No S3.** Supabase Storage, private bucket, short-lived signed URLs (§30.1).
- **No `sharp`.** Image validation reads headers directly; derivative
  generation (§30.3 thumbnails) is **not implemented** — concept assets are
  served at full size. Flagged, not silently skipped.
- **SSE/WebSocket not implemented.** §33 names polling as an acceptable
  transport; the client backs off using a server-supplied interval.
- **Thumbnails are generated** with `sharp` (§30.3) after the concept commit,
  deliberately non-fatally: a missing thumbnail only means the UI falls back
  to the full image, whereas failing the job would discard a concept.

## AI providers

Gemini is wired up, split along what the free tier actually permits:

| Capability | Model | Free? |
|---|---|---|
| Saree analysis (§8.4) | `gemini-3.8-flash` | yes |
| Smart Arrange (§11) | `gemini-3.8-flash` | yes |
| Content moderation (§36) | `gemini-3.8-flash` | yes |
| Weave optimization (§12) | none — deterministic rules | n/a |
| Woven concept image (§14) | `gemini-3.1-flash-image` | **no, billing required** |
| NILA drape frames (§19) | `gemini-3.1-flash-image` | **no, billing required** |

Two switches, because of that split:

- `AI_MODE=MOCK|GEMINI` — analysis, placement, moderation.
- `AI_IMAGE_PROVIDER=MOCK|GEMINI` — concept and drape images.

With `AI_MODE=GEMINI` and `AI_IMAGE_PROVIDER` unset, a deployment runs real
analysis and real moderation for free while concepts remain locally rendered
placeholders. `conceptRenderMode()` reports which is in effect so the UI never
presents a placeholder as an AI generation.

Weave optimization stays deterministic on purpose: a threshold check should be
instant, free and identical on every run, not a model call.

## Still not implemented

- **Real NILA model photography.** Drape frames are generated (or, without
  billing, placeholder silhouettes). Whether to use generated models or
  commission real photography remains the business decision flagged in
  `08-drape-architecture.md`.
- **Designer assignment.** The console supports status transitions, notes and
  job retry, but there is no "assign to designer" concept — no designer roster
  exists yet.

## Verification status

Done in this pass:
- 104 tests pass (`npm test`), including 52 domain tests, 23 mock-provider
  tests and 17 image-validation tests written here.
- `tsc --noEmit` clean, `eslint src` clean, `next build` succeeds (45 pages).
- Dev server smoke test: `/studio`, `/studio/designs`, `/`, `/materials`,
  `/bridal` all return 200 with no server errors — confirming the configurator
  removal did not regress the marketing site.

**The schema is applied and the flow is verified end to end**, in two layers:

- `src/lib/jobs/pipeline.integration.test.ts` drives design → upload →
  analysis → composition → generation → immutable version → thumbnail against
  the live Supabase project with the mock provider.
- `e2e/studio-journey.spec.ts` drives the same journey through a real browser,
  including the drape, the submission form's §20.4 acknowledgement gate, the
  confirmation screen and My Designs.

### Bugs these tests found

Worth recording, because each would have reached a customer:

1. **Phantom jobs.** A plpgsql function returning NULL for a composite type
   comes back through PostgREST as an object with every field null, so the
   worker treated an empty queue as a job with a null id.
2. **Valid images rejected.** `instanceof Uint8Array` fails across a realm
   boundary, so every generated concept was discarded as "empty".
3. **The worker would never have run in production.** Vercel's Hobby plan caps
   cron at once per day and rejected the every-minute schedule outright.
4. **The processing screen never finished.** A ref guard in the polling effect
   meant StrictMode's double-invocation aborted the first poll and skipped the
   second, leaving customers watching a spinner while the job had succeeded.
5. **The confirmation screen was unreadable and wrong.** Dark-theme text on a
   light background, and `slice(0, 8)` truncating `VL-2026-000019` to
   `VL-2026-` — written when the id was a UUID.
6. **My Designs was permanently empty.** It filtered on `status = 'active'`, a
   value no design carries after the lifecycle migration, and archived to
   lowercase `'archived'`.
7. **Login and submission fields had no accessible names** — placeholders
   only, so screen readers announced nothing (§41).

## What to do next

1. **Set `GEMINI_API_KEY`** and `AI_MODE=GEMINI` to turn on real analysis,
   placement and moderation at no cost.
2. **Decide on Gemini billing.** Without it, concepts stay placeholders. With
   it, set `AI_IMAGE_PROVIDER=GEMINI`.
3. **Set `RESEND_API_KEY`, `EMAIL_FROM_ADDRESS`, `VELVOREA_OFFICE_EMAIL` and
   `ENABLE_EMAIL_NOTIFICATIONS=true`** so submissions reach the office.
4. **Grant yourself admin**: `update public.profiles set is_admin = true where
   id = '<your-user-uuid>';` — the console is at `/admin`.
