# 02 — Product Architecture

See `17-open-questions.md` first — the referenced master requirements file doesn't exist in-repo; this is written against the pasted spec.

## Positioning (accepted as-is)

Deterministic Design Engine is the source of truth. AI is an optional, paid, non-authoritative accelerator that proposes structured commands the engine validates and applies. This principle is sound engineering regardless of the missing source document and is adopted without modification.

## Layer model

```
VELVOREA (existing marketing site — unchanged)
   │
   └── Textile Studio (/studio) — expanded, not replaced
          │
          ├── Design Engine (deterministic, owns SareeDesign state)
          │      ├── Material / Weave
          │      ├── Colour
          │      ├── Artwork + Layers
          │      ├── Repeat
          │      ├── Body / Border / Pallu (independent sub-systems)
          │      ├── Zari
          │      └── Blouse
          │
          ├── Rendering Layer
          │      ├── Flat/Canvas Renderer (2D, MVP)
          │      └── Drape Renderer (template compositing, MVP)
          │
          ├── Persistence Layer
          │      ├── Postgres (Supabase) — structured entities, not blobs
          │      ├── Object Storage (Supabase Storage) — artwork/previews
          │      └── localStorage — draft recovery only, never source of truth
          │
          ├── AI Layer (provisioned, not activated)
          │      ├── AIProvider interface → GeminiProvider / MockAIProvider
          │      ├── Entitlement Gateway
          │      └── /api/ai/* route handlers
          │
          └── Future: Manufacturability / Pricing / Sample / Production / QC / Passport
                 (existing marketing pages for these already exist as content stubs —
                 see 16-implementation-plan.md for how Studio output eventually feeds them)
```

## What stays, what's replaced

**Stays unchanged:** all marketing routes, site nav/footer, auth (extended, not replaced — see open question #2), design tokens, existing Supabase `profiles` table.

**Replaced:** `design-reducer.ts`'s flat scalar model (single `borderId`/`palluId`/`zariId` strings) becomes structured sub-configurations per the domain model in `03-domain-model.md`. This is a breaking change to `SareeDesign`'s shape — existing saved designs (currently a handful at most, since this shipped within this same session) will need a migration or, more practically given the tiny existing dataset, can be discarded with user consent since Studio has had no real users yet.

**Net-new:** canvas rendering engine, model library, drape engine, AI gateway, object storage, normalized schema, everything under Phases 4-13 in the implementation plan.
