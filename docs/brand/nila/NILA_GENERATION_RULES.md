# NILA AI Generation Rules

## Rule 1 — Identity First
Whenever the AI platform in use supports character/reference-image workflows, the Nila reference images must be supplied. Text description alone is a fallback, not the default.

## Rule 2 — Never Start From Text Alone
Do not attempt to recreate Nila from a generic text description when a reference-image workflow is available. Text-only generation risks identity drift and must be avoided whenever an image-reference path exists.

## Rule 3 — Use Primary Reference
Use `nila-master-primary.png` as the primary identity anchor for every generation.

## Rule 4 — Supporting References
Use `nila-front-portrait.png`, `nila-3q-left.png`, `nila-3q-right.png`, `nila-profile.png` and `nila-full-body.png` as supporting references whenever the generation system supports multiple reference images.

## Rule 5 — Same Person
Every generated Nila image must read as the same fictional woman as the reference set — checked against the Identity Invariants in `NILA_MASTER_IDENTITY.md`.

## Rule 6 — Saree Changes Are Allowed
Saree, colour, border, pallu and jewellery may change freely to match the product/campaign being shown. Face identity must not.

## Rule 7 — Environment Changes Are Allowed
Nila may appear in India, Paris, London, Dubai, Singapore, New York, Tokyo, or other campaign environments as VELVOREA's international ambitions require. Environment changes must never be used to justify or mask identity drift.

## Rule 8 — No Celebrity Resemblance
Do not intentionally generate Nila to resemble any real celebrity or public figure. If a generation output unintentionally resembles a real person, discard it and regenerate — do not publish it.

## Rule 9 — No Documentary Deception
Do not present AI-generated Nila imagery as documentary evidence of real artisans, factories, manufacturing locations or events. Nila is a fictional ambassador; she must never substitute for real weaver/artisan photography that the product requirements call for elsewhere (see `.claude/skills/silk-design/SKILL.md` — "Material honesty in imagery").

## Rule 10 — Actual Product Accuracy
When Nila is shown wearing an actual VELVOREA design (a real material/border/pallu/zari combination from the product catalogue or a customer's Studio design), use the actual design as a reference whenever the generation system allows it. Do not let the AI arbitrarily redesign the product she's shown wearing — the saree shown must match what's actually being sold or demonstrated.
