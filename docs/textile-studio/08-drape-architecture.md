# 08 — Drape Architecture

## Interface (from requirements, adopted as-is)

```ts
interface DrapeEngine {
  applyDesign(design: SareeDesign, model: ModelTemplate): Promise<DrapeResult>;
}
```

## MVP implementation: `TemplateDrapeEngine`

```
ModelTemplate (base photo/illustration + region mask/UV map for pallu/body/border/pleats)
   +
SareeDesign texture (the flat canvas render from 07-rendering-architecture.md, exported as an image)
   =
DrapeResult (composited preview image + fidelity metadata)
```

Concretely: pre-authored PNG masks per model per region (pallu, body, border, blouse), composited server-side (Phase 10 route handler `POST /api/designs/:id/drape`) using `sharp` (already a project dependency, used earlier this session for favicon generation) to layer the design texture onto the model through each mask. Deterministic, no AI, no per-request cost beyond compute — directly satisfies §34's "do not generate a random AI image for the basic drape preview."

## What this requires that doesn't exist yet

1. **Actual model photography/illustration + hand-authored region masks.** This is a content production task (photography or illustration + Photoshop/mask authoring), not a code task — flagged clearly because no amount of engineering substitutes for this asset not existing. See open question in `17-open-questions.md` re: photographed vs. illustrated models.
2. `model_templates` table (already in `04-database-schema.md`).
3. Region-mapping precision: pallu/body/border masks must align with how the flat canvas exports its own pallu/body/border regions (from `dimensions` + region boundaries in `03-domain-model.md`), or the composite will misplace the border. This is the main technical risk in Phase 10, not the compositing itself.

## Disclaimer requirement (§38, non-negotiable)

Every drape view renders a persistent, visible label: **"Digital Drape Preview — not an exact representation of the final physical garment."** Fidelity metadata (`pattern`/`colour`: high; `drape`: always `"approximate"`; `material`: `"approximate"` or `"medium"`, never higher) is computed once per `TemplateDrapeEngine` implementation and hardcoded to these ceilings — the engine must never report a fidelity level it can't back up.

## Sync requirement (§37/§40)

`DrapeConfiguration` is a field on `SareeDesign`, not a parallel state tree. Any change to `body`/`border`/`pallu`/`zari`/artwork triggers drape regeneration (debounced, same pattern as autosave — see `06-editor-architecture.md`'s history coalescing for the precedent). Changing the *selected model* never mutates the canonical design — it's a view parameter, stored on `DrapeConfiguration.modelId`, read-only with respect to `SareeDesign`'s design fields.

## Explicitly not built now

3D rendering, cloth simulation, AI drape generation (`renderingMode: 'ai'` is a valid enum value in the type from day one — §78/§79 — but no implementation exists behind it; selecting it should show the same paid-feature-unavailable state as AI in `09-ai-architecture.md`, not silently fall back to `'template'`).
