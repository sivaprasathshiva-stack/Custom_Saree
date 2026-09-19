# 11 — Permissions

## Model: owner-only, enforced twice

Every design-scoped table (`designs`, `design_versions`, `artwork_assets`, `drape_previews`) carries `owner_id`/`user_id` and an RLS policy of the existing shape (`auth.uid() = user_id`, already live for `designs`/`design_versions` — extend identically to new tables). Route handlers additionally re-check ownership server-side before any write (redundant with RLS by design — see `05-api-contract.md` for why the redundancy is intentional, not laziness).

## Roles

No role system beyond `plans.id` (`free`/`pro`/`business`/`admin`) exists or is needed yet — "admin" in the requirements is used purely as "AI always enabled," not as a content-moderation/backoffice role. If a real admin backoffice (managing `materials`, `model_templates`, `ai_capabilities`) is wanted, that's a distinct, unscoped piece of work — flagged, not assumed into this plan.

## Sharing (§48, future)

`design/velvorea.com/design/:id` with `private`/`link`/`team` visibility is explicitly future-scope per the requirements themselves. Not designed further here — building the permission model for a feature with no other spec detail (what is "team"? shared with whom?) would be exactly the "arbitrary architectural decision" §8 warns against. Revisit when scoped.
