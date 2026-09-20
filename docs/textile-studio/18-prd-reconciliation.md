# 18 — Reconciliation: VELVOREA_Textile_Studio_PRD_FRD_Architecture.md vs. docs 00-17

A full customer-journey/workflow PRD (`VELVOREA_Textile_Studio_PRD_FRD_Architecture.md`, repo root)
was added after Phases 1-3 of the `00-17` doc set were already implemented. This
document reconciles the two before more code is written, per this task's Step 1.

## (a) Where they already agree

- **Normalized JSONB design state.** The new PRD's data model and `04-database-schema.md`
  both converge on: don't store the full design (with binary artwork) as one blob;
  keep the `designs.design` jsonb as a reference structure. Phase 2 already
  implemented this (`PersistedSareeDesign`, `cloud-design-store.ts`).
- **Undo/redo command pattern.** Already implemented (`use-design-history.ts`);
  the PRD's FR-015 asks for exactly this, no gap.
- **Region-based body/border/pallu.** Both treat body/border/pallu as the
  structuring concept for a saree design (`03-domain-model.md`'s
  `BodyConfiguration`/`BorderConfiguration`/`PalluConfiguration`; PRD §13/§17
  "Place On: Body / Border / Pallu"). Full independent sub-configurations are
  still Phase 6 per the existing plan; this pass (Phase 3.5, below) adds the
  simpler thing the PRD actually asks for now — a placement selector on each
  artwork layer, not a full per-region engine.
- **Autosave / no data loss.** Guardrail 4 in the PRD ("never lose customer
  work... autosave continuously") is already implemented as a real debounced
  autosave with idle/saving/saved/failed states (Phase 2).
- **Versioning.** PRD's "revision history" (FR-019) already exists as
  version create/restore/compare (Phase 2).
- **RLS / tenant isolation.** Both assume every row is scoped to its owning
  user via Supabase RLS — already the pattern for `designs`/`design_versions`,
  extended in this pass to `submissions`/`notification_events`.
- **No-fabrication of technical claims.** Both explicitly forbid inventing
  numbers/features that don't exist (existing docs' repeated "flagged, not
  fabricated" notes; PRD §73's guardrails). This pass follows the same rule:
  `technicalProperties` nulls stay null, NILA is a disabled "coming soon"
  control, not a fake button.

## (b) Real differences, and how this pass resolves them

1. **Journey-first vs. editor-internals-first.** The new PRD is organized around
   the customer's end-to-end journey (login → phone → My Designs → Create →
   edit → preview → drape → Complete → Submit → confirmation → design-team
   review) and gives that journey P0 status end-to-end. The existing `00-17`
   docs were written editor-outward (domain model, rendering, drape
   architecture) and had not yet reached the submission/office-notification
   workflow at all — it wasn't in scope for Phases 1-3. Resolution: the
   submission workflow becomes this pass's actual scope (Phase 3.5 below);
   the existing docs' phase *order* for editor internals (Phase 4 artwork
   storage, Phase 5 Konva, Phase 6 region sub-configs, etc.) is kept as-is
   and simply resumes after Phase 3.5.

2. **Route structure.** The PRD implies distinct routes: `/studio/designs`
   (My Designs), `/studio/new` (base selection), `/studio/[designId]/edit`
   (editor), `/studio/[designId]/preview`, `/studio/[designId]/drape`. The
   existing app has a single `/studio/page.tsx` that edits "the current
   design" for the signed-in user (most-recently-updated row), with no
   `:designId` in the URL at all.

   **Decision:** migrate toward the PRD's route structure — it's more
   scalable and is what My Designs / Create Design / a future drape page
   actually need as distinct, linkable pages. **What actually shipped in
   this pass, and what didn't:** `/studio/designs` (My Designs — real list,
   rename/duplicate/archive/delete, empty state) and `/studio/new` (base
   picker, creates a real `designs` row) were added and are fully wired.
   `/studio/[designId]/complete` (Concept Review) and
   `/studio/[designId]/submit` (+ `/confirmation`) were added and load a
   *specific* design by id.

   The one piece **not** done: moving the actual editor
   (`studio-shell.tsx`) from `/studio` to `/studio/[designId]/edit`. The
   editor's internal state model (`cloud-design-store.ts`) is built around
   "the current design for this user," not "the design with this id" — every
   load/save/version function takes a `userId`, none take a `designId`
   directly except `getOrCreateDesignId`. Retrofitting real per-id editing
   (so "Open" on a specific My Designs row opens *that* row, not whichever
   is most recently updated) means changing `loadCurrentDesignCloud`,
   `saveCurrentDesignCloud`, `loadVersionsCloud` and every call site in
   `studio-shell.tsx` to thread a `designId` through, plus deciding how the
   local (signed-out) store's single-design model maps onto multi-design
   cloud state. That's a real, bounded, but non-trivial refactor of the
   editor's data layer — attempting it in the same pass as the submission
   workflow, without being able to manually exercise the editor in a
   browser here, was judged too high-risk of silently breaking existing
   autosave/version/RLS-tested behavior. `/studio` keeps working exactly as
   before (zero regression); `/studio/designs` "Open" and `/studio/new`'s
   redirect both currently land on `/studio`, which loads the most-recent
   design — correct for a single-design user, an acknowledged limitation
   for a user with more than one design. This is flagged, not hidden, and
   is the next concrete follow-on task.

3. **3D stack recommendation.** The PRD recommends Three.js/React Three
   Fiber for NILA. `08-drape-architecture.md` already anticipated a
   `DrapeEngine` interface without committing to a renderer. No conflict —
   record the PRD's recommendation as the answer to that previously-open
   question, to be acted on when Phase 8+ actually starts. Out of scope for
   this pass per the task's explicit instruction (no 3D asset exists yet).

4. **Phone verification.** PRD's own journey diagram gates phone
   verification before My Designs; FR-AUTH text is looser and allows
   MVP to gate it later. **Decision (pragmatic, documented as a deviation):**
   require a phone number only at submission time, not at signup/before
   editing. Reasoning: (a) OTP/SMS verification needs a provider decision
   (Twilio/MSG91/etc.) not made yet — building a phone *gate* without real
   verification would just be a fake speed bump; (b) gating My Designs
   access behind an unverifiable phone number blocks legitimate use of the
   editor for no real benefit yet. The submission form
   (`src/components/studio/submission-form.tsx`) requires phone as a
   mandatory field, validated both client- and server-side
   (`src/lib/studio/submission-validation.ts`), so no design reaches the
   office without a phone number on file — the substance of FR-AUTH's
   intent is met without a premature fake-OTP flow. Real OTP verification
   remains open, needs a provider choice from the project owner.

5. **Google OAuth / FR-AUTH-001.** Already live per
   `10-authentication.md`/Phase 1 — satisfied, no further action here.

## (c) Phase list update

See `16-implementation-plan.md`, which now has a **Phase 3.5** inserted
between the existing Phase 3 (material + colour, done) and Phase 4 (artwork
+ object storage, not started) covering exactly what shipped in this pass:
submission workflow, admin read-only design-requests list, artwork
placement selector, no-export guard, and the additive My-Designs/Create
routes. The original Phase 4-14 numbering is otherwise unchanged — nothing
was silently dropped, only renumbered where a phase now sits after 3.5
instead of directly after 3.
