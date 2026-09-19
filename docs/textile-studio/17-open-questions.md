# 17 — Open Questions (read this file first, before 02-16)

This has to come before the rest of the assessment because it changes what the assessment can responsibly say.

## 1. The referenced master requirements document does not exist in this repository

The prompt states: *"The repository contains an existing master requirements document: `custom-silk-saree-platform-claude-master-requirements.md`. READ THE ENTIRE DOCUMENT BEFORE MAKING ARCHITECTURAL DECISIONS... Do not replace, ignore, simplify, contradict or duplicate its existing requirements."*

I searched the full repository (`find . -iname "*master-requirements*"`, all of `/docs`, repo root) — **this file is not present anywhere in the codebase.** The only requirements-shaped documents that exist are the three `.claude/skills/*/SKILL.md` files (`silk-design`, `design-review`, `frontend-design`) and `docs/brand/nila/*` (brand-ambassador documentation, unrelated to the Studio). None of them contain the entity names, phase structure, or terminology this prompt references (e.g. `ManufacturingRuleEngine`, `DrapeEngine`, `ai_capabilities` table).

**This means:** the rest of this document set is written against the requirements pasted directly into this prompt (the "VELVOREA Textile Studio — Detailed Product & Technical Requirements" doc) plus what I could infer from the existing codebase's own internal comments (e.g. `pricing-engine.ts` references "requirements 25/113" — a numbering scheme that doesn't match either document I have access to, confirming a third document existed at some point that I also don't have). I am treating the pasted document as authoritative for the Studio, and the existing repo as authoritative for the rest of the site, and flagging every place they conflict below rather than silently picking one.

**Action needed from you:** if `custom-silk-saree-platform-claude-master-requirements.md` exists outside this repo (a doc, a Drive file, something referenced by ID `#113`), send it and I'll re-run this assessment against it before Phase 1 starts. Otherwise I'll proceed on the basis above.

## 2. Direct contradictions between the pasted requirements and the live product

- **Blouse/model/drape are described as core, load-bearing features** ("THIS IS A CORE REQUIREMENT" — §31) but the live site's actual business (per prior conversation context: bespoke silk saree manufacturing in Elampillai, Salem — real looms, real lead times, real pricing tied to a real pricing engine already scoped as "DEMO, needs real manufacturing numbers") has never mentioned a model/drape visualization feature before this prompt. Confirm this is a genuinely new product direction, not a misread of the existing site's scope.
- The requirements ask for Google-only auth as MVP ("No username/password registration is required for MVP" — §5). The site already ships email/password auth (shipped this session, before this prompt). Recommend keeping both rather than removing email/password — removing a working, already-deployed auth path to match an "MVP" spec for a feature that hasn't shipped yet would be a regression for no user benefit. Flagged for your confirmation, not assumed.
- JSONB-blob persistence (what's live now) directly contradicts §9/§10's normalization requirement. This is a real gap, not a disagreement — see `04-database-schema.md`.

## 3. Business questions only you can answer

- Is Gemini (or any AI provider) an account you already have API access to, or does that need to be provisioned? The requirements ask for provisioning only, not activation, so this doesn't block Phase 1-11, but it blocks Phase 12 planning specifics (rate limits, model selection).
- Is there a real payments provider decided for the FREE/PRO/BUSINESS entitlement tiers, or is entitlement-gating being built ahead of a monetization decision? Affects whether `subscriptions`/`plans` tables get built against Stripe/Razorpay webhooks now or as inert tables for later.
- Female model library (§28/§32): using real photographed models has licensing/consent implications; using illustrated/generated models has a different production pipeline. Which is intended? This materially changes the Phase 9 estimate.
- Object storage: Supabase Storage (same project, zero new vendor) vs. S3/Cloudflare R2. Recommend Supabase Storage for consistency with the existing auth/db choice unless you have a reason otherwise.

None of the above blocks starting Phase 1 (auth is already live; database foundation work can start against the pasted requirements). They do block responsibly scoping Phases 8-13 (drape, model library, AI). See `16-implementation-plan.md`.
