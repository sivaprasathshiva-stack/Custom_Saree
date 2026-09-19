# 10 — Authentication

## Already live (shipped this session, before this prompt)

Supabase Auth via `@supabase/ssr`: email/password sign-up/sign-in, Google OAuth (UI wired, provider needs enabling in the Supabase dashboard — outstanding user action, not a code gap), password reset flow, session refresh via `src/middleware.ts`. Every design row is owned (`designs.user_id`) and RLS-enforced.

## RESOLVED (confirmed by user): Google-only for the Studio

The Studio's own sign-in entry point (reached via `/studio`, distinct from the general site's `/auth/login`) uses Google exclusively — no email/password form shown there. Rationale for scoping it this way rather than removing email/password sitewide: email/password already works in production for the general site (`/account`, `/auth/login`) and removing it there would be a regression with no requested benefit; the requirement is specifically about the Studio's entry experience (§5/§14's login screen mockup), which this satisfies without touching the already-shipped general auth.

Implementation: the existing `AuthForm` component (`src/components/auth/auth-form.tsx`) already renders the Google button first and email/password below a divider — for the Studio-specific entry point, render only the Google button (a `googleOnly` prop, or a small dedicated `StudioAuthGate` component — decide at implementation time based on how much the two entry points actually need to diverge).

## What's needed for Textile Studio specifically

Nothing new at the auth layer. `getUser()`/`createClient()` (`src/lib/supabase/{client,server}.ts`) are reused as-is for every Studio API route and RLS policy. Design ownership already follows the pattern documented in `05-api-contract.md`.

## Account deletion (§13, not yet built)

`auth.users` cascade already deletes `profiles`/`designs`/`design_versions` (all have `on delete cascade` FKs per the existing schema). A user-facing "Delete account" action needs: (1) a confirmation UI on `/account`, (2) a server action calling Supabase Admin API's `deleteUser` (requires the service-role key, server-only, not yet configured as an env var — add in Phase 1 if this ships). Scoped as Phase 1 work, small, not yet built.
