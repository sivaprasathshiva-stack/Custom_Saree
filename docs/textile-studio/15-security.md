# 15 — Security

## Already in place

RLS on every user-owned table, scoped to `auth.uid()`. Server-side session resolution via `@supabase/ssr` (no client-supplied identity trusted). Supabase Auth handles password hashing/session tokens — not reimplemented.

## Gaps this plan closes, and when

| Gap | Phase | Fix |
|---|---|---|
| Artwork upload has no server-side MIME/size validation yet (client-only `ACCEPTED_TYPES`/`MAX_FILE_BYTES` constants exist in `studio-shell.tsx` but nothing stops a direct API call from bypassing them) | 4 | Route handler validates before touching storage — see `12-storage-architecture.md` |
| No rate limiting on any endpoint | 2 (basic), 12 (AI-specific — most important there given cost) | Vercel Edge Config or a simple Postgres-backed token bucket; AI endpoints get per-user-per-minute limits tied to `plans` |
| SVG upload XSS surface | 4 | Decision flagged, not yet resolved — see `12-storage-architecture.md` |
| Gemini key exposure risk | 12 | Server-only env var, never `NEXT_PUBLIC_*` — see `09-ai-architecture.md` |
| No audit log | 4+ (write on every mutating action from that phase forward) | `audit_logs` table already in `04-database-schema.md` |
| Account deletion doesn't exist | 1 | See `10-authentication.md` |

## Explicitly out of scope for this plan

CSRF: Next.js Route Handlers + `SameSite` cookies (Supabase's default) already mitigate the classic CSRF vector for same-origin form/fetch submissions; no additional CSRF token scheme is being added unless a concrete gap is identified — adding one preemptively would be unjustified complexity per §8.

## Principle carried through every phase

Never trust client-supplied identity or ownership claims (§61, restated because it's the single most common real-world vulnerability class in apps like this — an endpoint that reads `req.body.userId` instead of the session). Every route handler and RLS policy in this plan resolves identity from the server-side session only.
