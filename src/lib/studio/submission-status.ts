/**
 * Customer-facing submission status labels — PRD §35's exact list. Internal
 * workflow statuses (e.g. anything a designer/admin tool might add later,
 * like "assigned" or "internal-hold") must never be shown to a customer
 * verbatim; always go through `toCustomerStatusLabel`.
 *
 * The DB's `submissions.status` column (supabase/schema.sql) starts at
 * "submitted" and is otherwise changed only by design-team/admin tooling
 * (not built beyond the read-only list in this pass). This map is
 * intentionally permissive on the input side (falls back to "Submitted")
 * so an unrecognized/future internal status never leaks raw to a customer.
 */
export const CUSTOMER_STATUS_LABELS = [
  "Concept Saved",
  "Submitted",
  "Design Team Review",
  "Clarification Required",
  "Textile Design Refinement",
  "Technical Review",
  "Sample Discussion",
  "Production Discussion",
  "Completed",
] as const;

export type CustomerStatusLabel = (typeof CUSTOMER_STATUS_LABELS)[number];

// Internal status keys stored in `submissions.status`, mapped 1:1 to the
// customer-facing label above. Add new internal keys here, not to customer
// copy directly.
const INTERNAL_TO_CUSTOMER: Record<string, CustomerStatusLabel> = {
  concept_saved: "Concept Saved",
  submitted: "Submitted",
  design_team_review: "Design Team Review",
  clarification_required: "Clarification Required",
  textile_design_refinement: "Textile Design Refinement",
  technical_review: "Technical Review",
  sample_discussion: "Sample Discussion",
  production_discussion: "Production Discussion",
  completed: "Completed",
};

export function toCustomerStatusLabel(internalStatus: string | null | undefined): CustomerStatusLabel {
  if (!internalStatus) return "Submitted";
  return INTERNAL_TO_CUSTOMER[internalStatus.toLowerCase().trim()] ?? "Submitted";
}
