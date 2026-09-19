---
name: silk-design
description: Project-specific visual identity doctrine for the SĀRĪ Studio silk saree manufacturing platform. Load this before any design or UI work on this project — it fixes brand-specific decisions (palette, type, heritage treatment, manufacturing language) that the general-purpose frontend-design skill deliberately leaves open. Use together with frontend-design, not instead of it.
---

# Silk Design — SĀRĪ Studio Visual Doctrine

This skill answers the brand-specific questions that `frontend-design` intentionally
leaves to the brief. Where `frontend-design` sets *how* to design (avoid templated
defaults, ground choices in subject matter, work in two passes, self-critique),
this skill sets *what this brand specifically is*.

## The one-sentence identity

**A digital textile laboratory for a working silk manufacturer** — not a saree
ecommerce store, not a generic fashion-tech SaaS, not a wedding-catalogue site.

The reference feeling: if a senior textile engineer and a senior editorial designer
built this together, and neither one was allowed to add decoration the other
couldn't justify.

## What this is not

Reject these outright, they are the default failure modes for this brief:

- **Generic Indian saree ecommerce** — product grids, wedding-red/gold theming,
  ornamental borders as page chrome, star ratings, "best seller" badges.
- **Generic SaaS/AI startup** — rounded cards with soft shadows, gradient washes,
  centered hero + 3-card feature grid, chatbot bubble as a hero element.
- **Wedding invitation aesthetic** — heavy gold, maroon/red as a primary UI color,
  paisley or temple-motif page chrome, script/calligraphic type.
- **Cosplay heritage** — using "Indian-ness" as decoration rather than as the
  actual subject matter (real weave structures, real zari mechanics, real
  process) coming through in layout and content.

## Palette discipline

Keep the working palette close to monochrome (ink/paper, a handful of grays) and
treat color as *material*, not *brand chrome*:

- Structural UI (nav, backgrounds, text, borders, panels) stays neutral —
  near-black, near-white, warm stone grays. No accent color owns the interface.
- Color enters the page primarily through **the actual silk, dye and zari being
  shown** — palette swatches, material photography, saree canvas renders — not
  through buttons, links or section backgrounds.
- If a UI accent is needed (a single interactive color, a focus state, a status
  color), pick one restrained, desaturated tone and justify it against this
  specific brief. Do not default to gold. Do not default to Anthropic's own
  clay/terracotta (~#D97757) — that reads as an unmodified AI-generated tell
  on any brief, this one included.
- Status/semantic colors (pass/warning/fail, success/error) are allowed to be
  more saturated because they encode meaning, not brand.

## Typography discipline

One or two type families, chosen for *this* subject — precision manufacturing
crossed with material craft — not for generic luxury signaling:

- Prefer a typeface with genuine editorial or engineering character over a
  default geometric grotesk grabbed because it "looks premium."
  Re-evaluate the current choice (Archivo/Inter) against the brief each time
  the identity shifts — don't inherit it by default.
  If a second family is used for technical/data content (specs, measurements,
  price breakdowns), it should read as *functional* — a face built for tabular
  and technical setting — not decorative monospace sprinkled everywhere as a
  "tech" signal. Follow `frontend-design`'s guidance: avoid monospace-for-every-
  small-label as a reflex.
- Avoid ALL-CAPS as a default label treatment (per `frontend-design`); reserve
  it for places where it earns its keep — e.g. a genuine specification value
  like a fabric code — not routine nav items or section eyebrows.

## Heritage without decoration

Indian textile heritage is represented through **subject matter**, never
through page chrome:

- Real weave structure, real repeat geometry, real zari cross-section — shown
  as diagrams, macro photography or technical illustration.
- Loom mechanics, warping, dyeing — process, not pattern.
- Weaver/artisan stories told as editorial content with real names/photos
  once available, never invented.
- Motifs (temple, paisley, floral, geometric) belong *inside* the design tool
  and material library as actual product content the customer can choose —
  not stamped across the marketing chrome as ambient decoration.

## Manufacturing truth as a design constraint

Every screen that shows a design must be honest about what stage it represents.
This is a content requirement that has visual consequences:

```
DIGITAL DESIGN → TEXTILE VALIDATION → JACQUARD PREPARATION →
YARN → WARPING → WEAVING → FINISHING → QUALITY → SAREE PASSPORT
```

- A rendered preview always carries a visible status
  (CONCEPT / DIGITAL PREVIEW / TECHNICALLY REVIEWED / SAMPLE APPROVED /
  PRODUCTION APPROVED). This is not a badge for decoration — treat it as
  load-bearing information, styled accordingly (quiet, not celebratory).
- Never let a render look more "finished" or "certain" than its actual status.

## The Textile Studio is the flagship screen

It must read as **professional design software**, closer to a CAD/DAW tool than
a form wizard:

- Canvas dominates. Controls are dense but calm — property panels, not
  marketing copy.
- Technical language throughout: measurements, repeat dimensions, GSM, cm —
  real units, not vague adjectives.
- Manufacturability and price are always visible, always explained (never a
  bare number with no breakdown).
- Motion here is functional only — panel transitions, drag feedback, render
  progress. No decorative entrance animation.

## Material honesty in imagery

- Use real photography once available; until then use the project's premium
  placeholder system (see `design-review` skill and `/docs/media-architecture.md`)
  — never a generic stock photo standing in for *this* factory, *this* loom,
  *these* weavers.
- Generic/editorial stock (silk texture, abstract material, mood photography)
  is acceptable for atmosphere but must be tagged as such in the media
  registry and must never appear near a caption implying it depicts SĀRĪ
  Studio's own facility, product or people.

## How this skill resolves conflicts

1. The product requirements document wins on functionality.
2. This skill wins on brand-specific visual decisions (palette, type choice,
   heritage treatment, manufacturing-status language).
3. `frontend-design` wins on general design craft (avoiding templated
   defaults, typographic discipline, restraint, motion discipline) — apply
   it *within* the boundaries this skill sets.
4. Accessibility/UX and performance concerns (see `design-review`) win where
   a visual decision would materially harm usability or Core Web Vitals.
