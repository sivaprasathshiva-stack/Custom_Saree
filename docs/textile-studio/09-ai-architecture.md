# 09 — AI Architecture

## Status: provisioned only, per explicit instruction (§40). Nothing in this document is activated in Phase 1-11.

## Provider abstraction

```ts
interface AIProvider {
  analyzeImage(input: AnalyzeImageInput): Promise<AnalyzeImageResult>;
  generateDesign(input: GenerateDesignInput): Promise<StructuredCommand>;
  generateRepeat(input: GenerateRepeatInput): Promise<StructuredCommand>;
  generateColourway(input: ColourwayInput): Promise<StructuredCommand>;
  critiqueDesign(input: CritiqueInput): Promise<CritiqueResult>;
  generateDrape(input: DrapeInput): Promise<StructuredCommand>;
}
```

`GeminiProvider implements AIProvider` — the only concrete provider written when activation happens; wraps the Gemini SDK entirely server-side (route handlers only, per §46 — never a client-importable module).

`MockAIProvider implements AIProvider` — built in Phase 13, returns `{ status: 'unavailable', message: 'AI capability is provisioned but currently unavailable for this plan.' }` for every method. Used for development and for any user without entitlement, so the UI paywall path (§43) can be built and tested with zero Gemini calls, ever, from a free account.

## Structured commands, never direct mutation (§67/§47, load-bearing constraint)

```
User → AI → { operation: "UPDATE_BORDER", parameters: { widthCm: 6 } }
           → zod schema validation
           → Design Engine dispatch (design-reducer.ts's existing action shape —
             a structured command IS a DesignAction, or maps 1:1 to one)
           → canvas preview
           → user approval (explicit confirm, not auto-applied)
           → persist
```

This is why `design-reducer.ts`'s existing `DesignAction` union type matters architecturally beyond its current use: a well-typed action union is exactly the "structured command" surface the requirements ask for. Phase 12 work should design future AI commands as a superset of this union, not a separate command language, so the same validation/dispatch path handles both human clicks and AI proposals.

## Entitlement gate (§42/§43/§70, testable without any AI activation)

```
GET /api/ai/entitlement → { enabled, plan, features: { motifGeneration, repeatGeneration, ... } }
```
resolved server-side from `subscriptions.plan_id` → `plans.ai_enabled` (schema in `04-database-schema.md`). The `✦ VELVOREA AI` UI entry point (Phase 12) always calls this first; on `enabled: false` it renders the paywall card from §7/§43 and **makes no further request** — this is directly testable today (Phase 13 test: free user → paywall shown → zero network calls to `/api/ai/*`) even though no AI provider exists yet.

## Capability registry (§41)

Seeded into `ai_capabilities` (schema already defined) with `enabled: false` for every row at first migration. Turning a capability on later is a data change (`update ai_capabilities set enabled = true where id = '...'`), not a code deploy — this is the point of the registry.

## Credential handling (§46, non-negotiable)

Gemini API key: Vercel server-only environment variable, read only inside `/api/ai/*` route handlers or server actions. Never in a `NEXT_PUBLIC_*` variable (contrast with the Supabase anon key, which is correctly public — see `10-authentication.md`). No BYOK support planned or requested.
