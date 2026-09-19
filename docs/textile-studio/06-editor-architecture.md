# 06 — Editor Architecture

## Current state

`studio-shell.tsx` is a single ~1000-line client component mixing state orchestration, all seven step panels, and layout. It works, but it's a property-panel form, not a visual editor — there's no canvas to click, drag, or see the saree shape on. This is the single biggest gap between the live product and the requirements' "flagship editor" bar (§56/§84).

## Recommended structure (Phase 4+)

```
studio-shell.tsx              — orchestration only: layout, step routing, top bar
  design-context.tsx           — SareeDesign state + dispatch, provided via context
                                  (replaces prop-threading through studio-shell)
  canvas/
    saree-canvas.tsx           — the rendering surface, see 07-rendering-architecture.md
    layer-transform-controls.tsx — on-canvas drag/scale/rotate handles
    canvas-toolbar.tsx         — zoom/pan/grid/rulers
  panels/
    material-panel.tsx
    colour-panel.tsx
    artwork-panel.tsx          — layer list, upload, reorder (drag), visibility/lock
    repeat-panel.tsx
    border-panel.tsx
    pallu-panel.tsx
    zari-panel.tsx
    blouse-panel.tsx
  history/
    use-design-history.ts      — reuse as-is, already well-scoped
```

Splitting `studio-shell.tsx` into this structure is itself Phase-4 work, not a prerequisite — the existing panel-based UI can keep working exactly as it does today while the canvas is added alongside it, then panels migrate to read/write on-canvas selection instead of only numeric fields, one panel at a time. This avoids a big-bang rewrite (§90 explicitly warns against this).

## State management decision

Keep `useReducer` + custom history hook — do not introduce Redux/Zustand/Jotai. The existing reducer pattern is already correct for this problem size (single-owner tree state, no cross-component subscription fan-out beyond what React context handles fine at this scale). Introducing a state library would be solving a problem that doesn't exist yet, contradicting §75's "no arbitrary architectural decisions."

## Beginner/Pro mode (§55)

Not built now. The panel list above already maps cleanly onto a future `mode: 'beginner' | 'pro'` filter (hide `repeat` fine controls / physical-scale fields / zari density-placement-width in beginner mode) — noted as a Phase 6+ extension point, not built ahead of need.
