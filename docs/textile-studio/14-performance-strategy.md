# 14 — Performance Strategy

## Targets (from requirements, adopted as-is)

Studio initial load < 3s on good broadband. Interaction response < 100ms perceived. Artwork operations must not block the main thread.

## Where the current build stands

No canvas exists yet, so canvas performance is a Phase-4-forward concern, not a current regression. The current Studio's actual load cost is dominated by the ~1000-line `studio-shell.tsx` client component and its embedded panel markup — reasonable today, but exactly the thing that should be code-split once panels move to the `panels/` structure in `06-editor-architecture.md` (`next/dynamic` per panel, so switching to the "Zari" step doesn't need the "Artwork" panel's code loaded first).

## Concrete measures, tied to phases

- **Phase 4 (artwork):** re-encoding/validation happens server-side (route handler + `sharp`), not in the browser — keeps large-file handling off the main thread by construction, no Web Worker needed for this specific operation.
- **Phase 5 (repeat rendering):** Konva's canvas-based rendering avoids the SVG DOM-node cost `07-rendering-architecture.md` flagged; retiling on offset/scale change should be throttled (requestAnimationFrame-batched), not fired on every pixel of a drag.
- **Phase 2 (autosave):** debounced 1-2s per §52, already the plan — this also caps API/DB write volume, a cost and performance concern simultaneously.
- **Images:** `next/image` already used sitewide (confirmed in `site-nav.tsx`, `site-footer.tsx`, homepage) — extend the same discipline to model-library and drape-preview assets when Phase 9-10 lands; use WebP for stored previews (matches `SiteLoader`'s existing asset choices).

## Measurement, not guesswork

No performance measurement currently exists (no Vercel Analytics/Web Vitals reporting wired up, confirmed via repo search). Before optimizing further than the above, Phase 1 should add basic Web Vitals reporting (Vercel Analytics is a one-line addition on a Vercel-hosted Next app) so later phases optimize against real numbers, not assumptions — directly following §59's "do not optimize prematurely, measure first."
