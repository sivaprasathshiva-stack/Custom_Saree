# 17 — Open Questions

## 1. RESOLVED — master requirements document

The document is now committed at `docs/textile-studio/00-master-requirements.md` (68 sections, matches what was pasted into the original prompt verbatim — confirmed by diffing section structure, no new content). This document set (`01-16`) was written against that pasted text and remains accurate; no re-audit needed.

The `custom-silk-saree-platform-claude-master-requirements.md` filename referenced in the original prompt (a different file, describing the rest of the platform beyond the Studio) still does not exist in this repository. If it exists, send it — it isn't currently blocking Studio work, since `00-master-requirements.md` is self-contained for the Studio's own scope, but it would matter if Studio work needs to integrate with manufacturability/sample/production/passport flows described elsewhere.

## Decisions received, all resolved

1. **Auth: Google only** for the Studio going forward. Email/password stays live on the rest of the site (already shipped, real users could exist) but the Studio's own sign-in entry point promotes Google exclusively, per `10-authentication.md`'s update.
2. **Gemini and payments: ignored for now.** Phase 12 (AI entitlement) and `plans`/`subscriptions` tables are built as inert schema/interfaces only — no provider wiring, no payment integration. Confirmed scope-limiting, not a blocker.
3. **Model library: user will create and supply models later.** Phase 8 (drape architecture) proceeds now as code-only scaffolding; Phase 9 (actual model library) is blocked on assets from you, not on engineering — flagged again in `16-implementation-plan.md`.

## 2. Remaining note, not blocking

JSONB-blob persistence (what's live now) directly contradicts §9/§10's normalization requirement. This is a real gap, not a disagreement — see `04-database-schema.md`. Fixed as part of Phase 2/4.

## Status: all questions resolved. Phase 1 is cleared to start.
