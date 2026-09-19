# Nila 3D Model — Phase 1 Audit

**Status:** audit + scoping only. No 3D asset was created — see the blocking constraint below before reading further.

## 1. Canonical Nila reference — located

Nine reference images exist at `public/assets/brand/nila/master/`, already registered in `src/lib/media-registry.ts` (`status: "owned"`, `category: "brand"`) and documented in `docs/brand/nila/NILA_REFERENCE_REGISTRY.md`.

| File | Dimensions | Format | Size |
|---|---|---|---|
| `nila-master-primary.png` | 1106×1422 | PNG, 8-bit RGB | 2.26 MB |
| `nila-front-portrait.png` | 1024×1536 | PNG | 2.60 MB |
| `nila-3q-left.png` | 1024×1536 | PNG | 2.20 MB |
| `nila-3q-right.png` | 1024×1536 | PNG | 2.42 MB |
| `nila-profile.png` | 1024×1536 | PNG | 2.39 MB |
| `nila-full-body.png` | 1024×1536 | PNG | 2.39 MB |
| `nila-neutral-expression.png` | 1024×1536 | PNG | 2.52 MB |
| `nila-natural-smile.png` | 1024×1536 | PNG | 2.30 MB |
| `nila-hair-variation.png` | 1024×1536 | PNG | 2.39 MB |

`nila-master-primary.png` is the canonical identity reference per existing docs (`NILA_MASTER_IDENTITY.md`). Original files are untouched by this audit — nothing here modifies or overwrites them, consistent with the existing provenance rule that they're immutable.

## 2. Existing architecture this must reuse, not duplicate

Two documents already define the exact systems this feature needs, written before this prompt arrived (Textile Studio Phase 0 audit):

- **`docs/textile-studio/08-drape-architecture.md`** — already defines `DrapeEngine`, `TemplateDrapeEngine`, the model/mask compositing approach, the fidelity-disclaimer requirement, and the sync-on-design-change requirement. Nila is not a new drape system — she's the first (and for now, only) row in the `model_templates` table that architecture already specifies.
- **`docs/textile-studio/04-database-schema.md`** — already defines `model_templates` and `drape_previews` tables. No new `character_assets`/`digital_looks` table is needed yet; `model_templates.id` can hold `"character.nila"` as a slug-style identifier, and `DigitalLook` (requirements §46) is redundant with the existing `SareeDesign.selectedModelId` + `DrapeConfiguration` fields already in `03-domain-model.md` — introducing a second entity for the same relationship would be exactly the "duplicate the SareeDesign domain model" this document's own §58 forbids.

## 3. The blocking constraint (stated plainly, not worked around)

**No 3D pipeline, 3D library, or GLB/GLTF asset exists anywhere in this repository** (confirmed: no `three`/`@react-three/*` in `package.json`, no `.glb`/`.gltf` files anywhere). This is expected — none was requested until now.

Nine 2D photographs (however consistent) are not sufficient input to produce a rigged, UV-mapped, saree-ready 3D character mesh through code. That requires one of:
1. A 3D artist modeling Nila in Blender/ZBrush/Maya from the reference set (the standard path for a production character asset)
2. A photogrammetry pipeline, which needs many more calibrated multi-angle captures than nine stylistically-generated reference images provide
3. A specialized image-to-3D generation service — even then, the requirements' own §35 QA checklist (identity consistency, clean topology, non-manifold geometry, hand/finger correctness) needs human review before any such output is usable, not just an API call

None of these is a task a coding agent can perform inside this environment. This document's own closing note anticipates exactly this and asks for an honest audit rather than a fabricated deliverable — this is that audit.

## 4. What is actually buildable right now, without a GLB in hand

The full software layer around wherever a GLB eventually arrives:
- `DrapeEngine` interface extension for a future `ThreeDDrapeEngine` (alongside the already-documented `TemplateDrapeEngine`)
- `model_templates` row reservation for `character.nila` (metadata only — no asset yet, `status: "planned"`)
- Rendering library decision (documented in `docs/technical/nila-3d-architecture.md`, not yet installed — installing `@react-three/fiber` with nothing to render would be exactly the "introduce unnecessary dependencies" this requirements doc's §58 forbids)
- Loading/error/unavailable UI states for a `<NilaModel>` component, buildable and testable today against a placeholder/missing asset path
- Documentation set per §56

None of this is wired into any live, user-facing page yet — same rule the existing Nila docs already followed for the 2D reference set ("not integrated into any live page this pass").

## Verdict

Phase 1 (this audit) and Phase 2 (technical decision, next document) are completable now. Phases 3-4 (actual character asset, web-optimized GLB) are **blocked on external 3D production** — not on more code. Phase 5 (Studio integration) is buildable as inert scaffolding now, functional once Phase 3-4 deliver a real asset.
