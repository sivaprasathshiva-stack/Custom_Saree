# 10 — Authentication

## Already live (shipped this session, before this prompt)

Supabase Auth via `@supabase/ssr`: email/password sign-up/sign-in, Google OAuth (UI wired, provider needs enabling in the Supabase dashboard — outstanding user action, not a code gap), password reset flow, session refresh via `src/middleware.ts`. Every design row is owned (`designs.user_id`) and RLS-enforced.

## Reconciling with requirements §5/§14 ("Google Sign-In" only, no username/password for MVP)

Recommendation: **keep both**, don't remove email/password. Reasoning:
- Email/password already works in production; removing it is a regression with no user benefit, done solely to match a spec line written before this session's work existed.
- Google OAuth is additive on the same Supabase Auth users table — no architectural conflict between the two.
- The actual requirement being served ("frictionless sign-in, no separate account creation burden") is satisfied by Google being available and default-promoted in the UI, not by email/password being absent.

Flagged as an open question in `17-open-questions.md` rather than assumed — reverse this if you disagree.

## What's needed for Textile Studio specifically

Nothing new at the auth layer. `getUser()`/`createClient()` (`src/lib/supabase/{client,server}.ts`) are reused as-is for every Studio API route and RLS policy. Design ownership already follows the pattern documented in `05-api-contract.md`.

## Account deletion (§13, not yet built)

`auth.users` cascade already deletes `profiles`/`designs`/`design_versions` (all have `on delete cascade` FKs per the existing schema). A user-facing "Delete account" action needs: (1) a confirmation UI on `/account`, (2) a server action calling Supabase Admin API's `deleteUser` (requires the service-role key, server-only, not yet configured as an env var — add in Phase 1 if this ships). Scoped as Phase 1 work, small, not yet built.
