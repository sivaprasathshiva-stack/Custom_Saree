# 07 — Rendering Architecture

## Decision: Konva (react-konva) for the saree canvas

Evaluated against §20's criteria:

| | Raw Canvas | SVG | Konva | Fabric.js |
|---|---|---|---|---|
| Layer management | manual | DOM-based, fine to ~100 nodes | built-in scene graph | built-in |
| Transform (drag/scale/rotate) handles | manual | manual | built-in (`Transformer`) | built-in |
| High-res export | manual | good | built-in `toDataURL`/`toBlob` | built-in |
| Zoom/pan | manual | CSS transform hacks | built-in | built-in |
| React bindings | none | native | `react-konva` (official, maintained) | community wrappers only |
| Repeat-pattern rendering | manual tiling | `<pattern>` (good fit) | `Konva.Pattern` fill | pattern fill support |
| Touch | manual | manual | built-in | built-in |

**Konva over Fabric:** first-party React bindings (`react-konva`) fit the existing React/Next architecture without a wrapper-maintenance burden; Fabric's React wrappers are community-maintained and less actively kept current against React 19.

**Konva over raw SVG:** artwork layers need frequent transform + eventual filter/texture operations (§30 macro view, future weave texture) — SVG's DOM-node-per-shape cost becomes a real bottleneck once repeat tiling produces dozens of pattern instances on screen; canvas-based rendering (what Konva wraps) doesn't have that ceiling. SVG remains the right choice for the *border-width selector UI* and similar small fixed diagrams, just not the main canvas.

**Not WebGL/Three.js for the flat canvas:** unjustified for 2D compositing — reserved for future 3D drape (see `08-drape-architecture.md`), consistent with §78 ("do not add heavy 3D infrastructure unless necessary for MVP").

## Physical-scale conversion (§24)

Centralize in one module, `src/components/studio/scale-service.ts` (Phase 5), with a single conversion basis: `pxPerCm` derived from the canvas's current zoom level and the design's `dimensions` (length/width in metres). Every panel that displays a physical unit (repeat width in cm, border width in cm, artwork size) calls this module — never computes its own px↔cm formula. This directly satisfies §24's "do not scatter conversion formulas throughout UI components."

## Repeat rendering

Store `RepeatConfiguration` as data (already true today); render it as a `Konva.Rect` filled with a `Konva.Pattern` built from the active artwork layer, retiled live as `widthCm`/`heightCm`/`offsetX`/`offsetY` change. Do not flatten to a static bitmap except at export time (§23 is explicit about this).

## What doesn't change

`pricing-engine.ts` and `manufacturability-engine.ts` stay pure functions operating on `SareeDesign` data — they never touch the canvas or Konva. This separation (already correct in the current code) is what keeps AI-future-proofing possible: a structured command changes `SareeDesign`, the canvas re-renders from that state, pricing/manufacturability re-evaluate from that state — nobody reaches into the canvas directly.
