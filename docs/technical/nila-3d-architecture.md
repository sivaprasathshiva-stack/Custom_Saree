# Nila 3D — Technical Architecture Decision (Phase 2)

See `docs/brand/nila/NILA_3D_AUDIT.md` first — this document assumes its blocking-constraint finding (no 3D asset exists yet) and scopes what's decided vs. what's deferred accordingly.

## Rendering library: React Three Fiber + drei (decided, not yet installed)

| | Raw Three.js | React Three Fiber + drei | Babylon.js |
|---|---|---|---|
| React integration | manual imperative bridge | first-party, declarative | community wrapper only |
| GLTF/GLB loading | manual `GLTFLoader` | `useGLTF` (drei), handles caching/suspense | built-in loader, different API shape |
| Fits existing stack | — | matches React 19/Next 16 patterns already used sitewide | would be the only non-React-idiomatic dependency in the codebase |

**Decision: React Three Fiber (`@react-three/fiber`) + `@react-three/drei`**, for the same reason Konva was chosen for the flat canvas (`docs/textile-studio/07-rendering-architecture.md`) — first-party React bindings, no wrapper-maintenance burden, consistent with how the rest of this codebase is built. Not installed yet (see below).

## Format: GLB (binary glTF)

Single-file, web-optimized, directly what `@react-three/drei`'s `useGLTF` expects. No decision needed beyond confirming this matches requirements §21 — it does.

## Drape engine: extend, don't replace, the existing abstraction

`docs/textile-studio/08-drape-architecture.md` already defines:
```ts
interface DrapeEngine {
  applyDesign(design: SareeDesign, model: ModelTemplate): Promise<DrapeResult>;
}
```
with `TemplateDrapeEngine` (2D mask compositing) as the MVP implementation. This requirements document asks for the same interface shape (§26) applied to a 3D character. Rather than a parallel `NilaDrapeEngine`, the correct extension is a second implementation of the same interface:

```ts
class ThreeDDrapeEngine implements DrapeEngine {
  async applyDesign(design: SareeDesign, model: ModelTemplate): Promise<DrapeResult> {
    // Loads model.glbAssetId, applies design.body/border/pallu/zari as
    // textures/materials onto the pre-rigged saree-ready mesh regions,
    // returns a DrapeResult the same shape TemplateDrapeEngine returns —
    // callers (Studio UI) don't need to know which engine ran.
  }
}
```
`DrapeConfiguration.renderingMode` (already `"template" | "3d" | "ai"` in `03-domain-model.md`) is the switch — Nila selects `renderingMode: "3d"`. No new top-level entity needed; `character.nila` is a value in `model_templates`, not a new table.

## What's deferred, and why

**Not installing `@react-three/fiber` yet.** Requirements §58 explicitly forbids introducing unnecessary dependencies — installing a 3D rendering library with no GLB to render would sit unused in the bundle for however long Phase 3-4 (external 3D production) takes. It gets added in the same PR that wires up the first real GLB, not before.

**Not building `<NilaModel>` as a live component yet**, for the same reason — a component whose only job is loading a file that doesn't exist can't be meaningfully tested beyond its error state. The interface shape is documented here so Phase 5 has a clear target:

```ts
interface NilaModelProps {
  glbUrl: string;               // model_templates.glbAssetId → signed/public URL
  pose?: "neutral";              // MVP: single pose, per requirements §12/§19
  camera?: "front" | "three-quarter-left" | "three-quarter-right" | "side" | "back";
  sareeDesign?: SareeDesign;     // undefined = base neutral-garment mannequin
  onLoadError?: (error: Error) => void;
}
```

**LOD (§15) deferred** — requirements §15 itself says "do not prematurely create unnecessary versions if the chosen pipeline can generate them automatically." No pipeline is chosen yet because no asset exists; revisit once the actual GLB's polygon budget is known.

## Status summary (per requirements §60's required reporting format)

| Item | Status |
|---|---|
| Reference asset audit | IMPLEMENTED |
| Reuse of existing drape/model_templates architecture (no duplicate system) | IMPLEMENTED |
| Rendering library decision | IMPLEMENTED (decision documented, package not installed) |
| `ThreeDDrapeEngine` / `NilaModel` interfaces | IMPLEMENTED (types only, no runtime code) |
| Actual 3D character mesh, rig, textures, GLB | REQUIRES EXTERNAL 3D TOOL — not achievable by this coding agent from 2D references |
| Studio "Drape on Nila" UI | PLANNED — blocked on the GLB existing |
| model_templates row for character.nila | PLANNED — add once an asset path exists; adding it earlier with `status: "planned"` and no file would invite exactly the "fake functionality" requirements §58 forbids |
