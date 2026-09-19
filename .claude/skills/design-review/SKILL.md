---
name: design-review
description: Structured QA pass for a completed or near-complete SĀRĪ Studio page or component. Use after implementing a page from silk-design/frontend-design, before considering it done, or when the user asks for a design/UX review of existing UI. Checks visual craft, UX completeness, technical correctness and brand fit together, and produces a pass/revise verdict per criterion.
---

# Design Review — SĀRĪ Studio

Run this after building or materially changing a page. It is a checklist skill,
not a visual-taste skill — the taste calls come from `silk-design` and
`frontend-design`; this skill verifies the result actually meets them plus
baseline UX/technical quality.

For each page/component under review, go through all four sections below and
give each item a verdict: **pass**, **revise (with a one-line reason)**, or
**n/a**. Don't skip sections because the page "looks fine" — the point of a
checklist is to catch what a quick look misses.

## 1. Visual

- Hierarchy: is it obvious what to look at first, second, third?
- Composition: does the layout avoid the generic patterns `frontend-design`
  flags (identical card grids, centered-hero-plus-three-cards, ALL-CAPS
  eyebrows on everything, monospace on every small label, "→" on every link,
  numbered 01/02/03 markers where the content isn't actually a sequence)?
- Typography: intentional type scale, real hierarchy in weight/size, line
  lengths under ~80 characters for body copy?
- Whitespace: is density controlled, or is everything packed to fill the
  viewport?
- Color: does the palette match `silk-design` discipline (neutral structural
  UI, color from material/product, not brand chrome)?
- Does the page look like it was designed *for this brief*, or could the same
  shell hold a different brand's logo with no other changes? If the latter,
  revise.

## 2. UX

- Is the primary action on the page obvious and singular (not competing CTAs)?
- Are all interactive elements' affordances clear (buttons look pressable,
  links look clickable, disabled states look disabled)?
- Loading state present and specific to what's loading (not a bare spinner)?
- Error state present, explains what happened and what to do next (see
  `silk-design` / `frontend-design` writing guidance — interface voice, no
  vague "something went wrong")?
- Empty state present and designed, not a blank div?
- Success/confirmation state present where an action has lasting effect?
- Mobile: is this a genuinely reconsidered layout, or a squeezed desktop
  layout? Check touch target size, and that nothing requires hover to
  discover.
- Keyboard: can every interactive element be reached and operated without a
  mouse? Is focus visible?

## 3. Technical

- Images: real `next/image` (or equivalent) usage with explicit sizes,
  lazy-loaded below the fold, priority only on the actual LCP element?
- Animation: respects `prefers-reduced-motion`; nothing animates
  continuously/looping without purpose; entrance animation is not applied
  to every section indiscriminately (`frontend-design`: spend motion once,
  deliberately)?
- Console: no errors or warnings introduced?
- Semantic HTML: headings in order, landmarks (`nav`, `main`, `footer`) used,
  buttons are `<button>`, links are `<a>`/`next/link`?
- Accessibility: sufficient contrast, alt text on meaningful images (empty
  alt on decorative ones), form fields labelled, ARIA only where semantic
  HTML can't do the job?
- Performance: no obviously oversized unoptimized media; heavy dependencies
  (3D/canvas libraries) not loaded on routes that don't need them?

## 4. Brand fit

Read the page cold and answer honestly:

> Does this feel like premium silk manufacturing technology — a luxury
> fashion sensibility applied by people who actually understand weaving,
> crossed with serious engineering software — or does it feel like a
> generic SaaS/ecommerce/AI-startup template with silk-themed copy pasted in?

If it's the latter, that's a revise verdict regardless of how the four
sections above scored individually — brand fit is the thing the other checks
serve, not an independent nice-to-have.

Also confirm no fabricated business claims slipped in (certifications,
years of experience, factory capabilities, testimonials, live counters) —
per the product requirements, those are CMS/config data only, never invented
copy. Flag any as a hard revise, not a style note.

## Output format

Report findings grouped by the four sections, each item marked pass/revise/n-a
with a one-line reason for any revise. End with the single brand-fit verdict
and, if revise, the smallest set of changes that would flip it to pass.
