# 05 — API Contract

## Decision: Next.js Route Handlers, not a separate backend service

The existing site is Next.js App Router on Vercel with no separate API service. Route handlers under `src/app/api/**/route.ts` are the natural, zero-new-infrastructure choice and match how `src/app/auth/callback/route.ts` already works.

## Endpoints (Phase-tagged)

```
Phase 2 — Design persistence
POST   /api/designs                    create
GET    /api/designs                    list (owner-scoped)
GET    /api/designs/:id                read
PATCH  /api/designs/:id                update (debounced autosave target)
DELETE /api/designs/:id
POST   /api/designs/:id/versions       create version
GET    /api/designs/:id/versions       list versions
POST   /api/designs/:id/versions/:vid/restore

Phase 4 — Artwork
POST   /api/artworks                   upload (multipart → object storage, returns assetId)
DELETE /api/artworks/:id

Phase 3 — Reference data
GET    /api/materials
GET    /api/materials/:id

Phase 9-10 — Drape
GET    /api/models
POST   /api/designs/:id/drape          generate drape preview (MVP: synchronous template composite)

Phase 11 — Export
POST   /api/exports                    { designId, format: 'png'|'jpeg' } → asset URL

Phase 12 — AI (provisioned, not activated)
GET    /api/ai/entitlement
GET    /api/ai/capabilities
POST   /api/ai/:capability             e.g. /api/ai/motif — always checks entitlement before any provider call
```

## Every mutating endpoint, without exception

1. Resolve identity server-side from the Supabase session cookie (`src/lib/supabase/server.ts` — already exists). **Never** trust a `userId`/`ownerId` in the request body.
2. Verify ownership (`design.owner_id === session.user.id`) before read or write — enforced twice: RLS at the database layer (belt) and an explicit check in the route handler (suspenders), because RLS alone gives an opaque empty-result failure that's hard to turn into a good error message.
3. Validate input shape (recommend `zod`, not yet a dependency — add in Phase 2).
4. Return typed error shapes so the client can render the Loading/Empty/Error states §65 requires, not a raw 500.

## What this replaces

Nothing currently — there are zero `/api/*` routes in the repo today (Studio does everything client-side against Supabase directly via `cloud-design-store.ts`, calling the JS client from the browser). That pattern is fine for simple CRUD under RLS and should **stay** for Phase 2's basic design save/load (less code, same security guarantee via RLS) — introduce route handlers specifically where server-only logic is required: artwork upload (needs server-side MIME/size validation before touching storage), AI (needs to hide the Gemini key), and export (needs server-side rendering). Building route handlers for plain CRUD that RLS already secures would be unneeded ceremony.
