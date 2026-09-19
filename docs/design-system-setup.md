# Design/UX skill stack — setup notes

## What was actually installed

| # | Skill | Location | Source |
|---|---|---|---|
| 1 | `frontend-design` | `.claude/skills/frontend-design/SKILL.md` | Verbatim from `anthropics/skills` (Apache-2.0), unmodified |
| 2 | `silk-design` | `.claude/skills/silk-design/SKILL.md` | Authored for this project |
| 3 | `design-review` | `.claude/skills/design-review/SKILL.md` | Authored for this project |

All three are project-scoped skills discovered by Claude Code from `.claude/skills/`
on session start (no global/user-level install was touched).

## Two requested items that were **not** installed as-is, and why

**Image-fetching skill (Part 2).** There is no image search/download tool
available in this environment — no Unsplash/Pexels/Pixabay API access, no
general web-image-search tool. I'm not going to fabricate a "skill" that
calls APIs it can't actually reach, or scrape/guess image URLs and assert
licensing I haven't verified. What exists instead:

- The media architecture (`public/media/*`, `src/lib/media-registry.ts`) is
  fully built and already distinguishes `placeholder` / `sourced` / `owned`
  assets, exactly as the registry schema you specified.
- If you provide Unsplash/Pexels API keys, I can wire up real fetch-and-save
  automation against their APIs (attribution + license fields populate from
  the API response, which is the reliable way to do this correctly).
- Until then, every image slot renders the premium `MediaPlaceholder`
  component rather than a stand-in stock photo — which matches your Part 13
  placeholder rule anyway.

**"UI/UX Pro Max" skill (Part 14).** This isn't a skill I have access to or
can verify the provenance/quality of, so I didn't install something under
that name. Its actual job — interaction design, IA, accessibility, forms,
navigation, responsive/interaction states, UX review — is fully covered by
the `design-review` skill's Section 2 (UX) and Section 3 (Technical/a11y)
checklists, which I authored to cover exactly that scope. If you have a
specific skill repo in mind, point me at it and I'll evaluate and install it
for real rather than assuming.

No separate frontend-engineering-quality skill (Part 15) was installed for
the same reason — its scope (WCAG 2.2, Core Web Vitals, semantic HTML,
responsive layout) is folded into `design-review` Section 3 rather than
duplicated across a fourth file.

## Skill priority (as specified)

1. Product requirements document — functionality
2. `silk-design` — brand-specific visual decisions
3. `frontend-design` — general design craft, avoiding templated defaults
4. `design-review` — UX/accessibility verification, run after building
5. Performance/accessibility — wins where a visual choice materially hurts it
6. General coding conventions

## Known conflict with current implementation

`frontend-design` explicitly names, as generated-page tells: ALL-CAPS labels,
monospace on small data labels used pervasively, "→" appended to links,
numbered 01/02/03 markers where content isn't a sequence, and em-dash-joined
labels. The current build (homepage, nav, footer, Textile Studio) uses all of
these fairly heavily. This needs a revision pass under `design-review` before
we call any existing page done — flagging now rather than silently living
with it.
