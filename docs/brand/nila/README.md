# NILA — VELVOREA Brand Ambassador

Nila is the canonical fictional visual ambassador for VELVOREA.

## Primary Reference
`/public/assets/brand/nila/master/nila-master-primary.png`

## Reference Pack (9 files, `public/assets/brand/nila/master/`)
1. `nila-master-primary.png` — primary identity anchor
2. `nila-front-portrait.png` — front facial reference
3. `nila-3q-left.png` — 3/4 left facial reference
4. `nila-3q-right.png` — 3/4 right facial reference
5. `nila-profile.png` — profile reference
6. `nila-full-body.png` — full-body / proportion reference
7. `nila-neutral-expression.png` — neutral expression
8. `nila-natural-smile.png` — natural smile reference
9. `nila-hair-variation.png` — hair-up/hair-down variation reference

## Documentation
- [`NILA_MASTER_IDENTITY.md`](./NILA_MASTER_IDENTITY.md) — who Nila is, identity invariants, allowed variation
- [`NILA_REFERENCE_REGISTRY.md`](./NILA_REFERENCE_REGISTRY.md) — per-image purpose and usage guidance
- [`NILA_VISUAL_BIBLE.md`](./NILA_VISUAL_BIBLE.md) — photography style, fashion language, makeup, hair, backgrounds
- [`NILA_GENERATION_RULES.md`](./NILA_GENERATION_RULES.md) — mandatory rules for any future AI generation of Nila
- [`NILA_PROMPT_LIBRARY.md`](./NILA_PROMPT_LIBRARY.md) — 20 reusable prompt templates
- [`NILA_USAGE_GUIDELINES.md`](./NILA_USAGE_GUIDELINES.md) — where Nila may and may not be used
- [`NILA_PROVENANCE.md`](./NILA_PROVENANCE.md) — what Nila is and isn't, fictional-status statement
- [`NILA_CHANGELOG.md`](./NILA_CHANGELOG.md) — dated history of the identity system

## Asset directories
- `public/assets/brand/nila/master/` — the 9 canonical reference images (populated)
- `public/assets/brand/nila/identity-sheet/` — contact-sheet composite (not yet created, see below)
- `public/assets/brand/nila/campaigns/` — future campaign output (empty)
- `public/assets/brand/nila/editorial/` — future editorial output (empty)
- `public/assets/brand/nila/saree-lookbook/` — future lookbook output (empty)
- `public/assets/brand/nila/social/` — future social-media output (empty)

## Identity sheet status
`nila-master-reference-sheet.png` (a single composited contact sheet of all 9 references) was **not created**. This environment has no image-composition tooling (no ImageMagick, no image-manipulation library in the project's dependencies) that could composite the nine PNGs into one labeled sheet without risk of mishandling the source files. Building it would need either an image library added to the project or manual work outside this session. The individual reference images are complete and usable without it.

## Website integration status
Registered in the existing media registry (`src/lib/media-registry.ts`) under ids `nila.master.primary` through `nila.reference.hair` — no new/duplicate registry was created. **Not placed on any live page** — per instruction, this pass only makes the asset system available for future use.

## Important
Do not replace the canonical reference images without an intentional identity review, recorded in `NILA_CHANGELOG.md`. The originals are preserved unmodified at `NILA MASTER IDENTITY PACK/` in the repository root.
