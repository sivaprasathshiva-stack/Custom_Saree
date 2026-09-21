/**
 * Design lifecycle state machine (requirements §5).
 *
 * Every transition in the product goes through `canTransition` / `assertTransition`.
 * Route handlers never compare status strings inline — that is how a customer
 * ends up able to edit a submitted design, or an admin able to skip review.
 */

import type { DesignStatus, UserRole } from "./types";

/** Who is attempting the transition. */
export type Actor = "CUSTOMER" | "DESIGNER" | "ADMIN" | "SUPER_ADMIN" | "SYSTEM";

/** Transitions a customer may perform on their own design (§5.2). */
const CUSTOMER_TRANSITIONS: ReadonlyArray<readonly [DesignStatus, DesignStatus]> = [
  ["DRAFT", "WOVEN_CONCEPT"],
  ["WOVEN_CONCEPT", "DRAFT"],
  ["WOVEN_CONCEPT", "SUBMITTED"],
];

/** Transitions available to VELVOREA designers and admins (§5.2). */
const INTERNAL_TRANSITIONS: ReadonlyArray<readonly [DesignStatus, DesignStatus]> = [
  ["SUBMITTED", "IN_REVIEW"],
  ["IN_REVIEW", "REFINING"],
  ["IN_REVIEW", "SAMPLE"],
  ["REFINING", "IN_REVIEW"],
  ["REFINING", "SAMPLE"],
  ["SAMPLE", "APPROVED"],
  ["APPROVED", "PRODUCTION"],
  ["PRODUCTION", "COMPLETED"],
];

/**
 * Operational states an internal user may cancel from. Terminal and
 * already-closed states are deliberately excluded.
 */
const CANCELLABLE_FROM: readonly DesignStatus[] = [
  "SUBMITTED",
  "IN_REVIEW",
  "REFINING",
  "SAMPLE",
  "APPROVED",
  "PRODUCTION",
];

/** States from which a design may be archived rather than deleted. */
const ARCHIVABLE_FROM: readonly DesignStatus[] = [
  "DRAFT",
  "WOVEN_CONCEPT",
  "COMPLETED",
  "CANCELLED",
];

/** Terminal states — nothing transitions out of these. */
export const TERMINAL_DESIGN_STATUSES: readonly DesignStatus[] = [
  "COMPLETED",
  "CANCELLED",
  "ARCHIVED",
];

function isInternal(actor: Actor): boolean {
  return actor === "DESIGNER" || actor === "ADMIN" || actor === "SUPER_ADMIN";
}

function matches(
  table: ReadonlyArray<readonly [DesignStatus, DesignStatus]>,
  from: DesignStatus,
  to: DesignStatus,
): boolean {
  return table.some(([f, t]) => f === from && t === to);
}

/**
 * Whether `actor` may move a design from `from` to `to`.
 *
 * A customer cannot touch a design once it is SUBMITTED (§5.2: "SUBMITTED →
 * read-only") — that restriction is enforced here, not in the UI.
 */
export function canTransition(from: DesignStatus, to: DesignStatus, actor: Actor): boolean {
  if (from === to) return false;
  if (TERMINAL_DESIGN_STATUSES.includes(from)) return false;

  if (to === "ARCHIVED") {
    if (!ARCHIVABLE_FROM.includes(from)) return false;
    // A customer may archive their own unsubmitted work; anything that has
    // reached VELVOREA is an internal decision to archive.
    return actor === "CUSTOMER" ? from === "DRAFT" || from === "WOVEN_CONCEPT" : isInternal(actor);
  }

  if (to === "CANCELLED") {
    return isInternal(actor) && CANCELLABLE_FROM.includes(from);
  }

  if (actor === "CUSTOMER") {
    return matches(CUSTOMER_TRANSITIONS, from, to);
  }

  if (isInternal(actor)) {
    // Internal users own the post-submission pipeline. They deliberately do
    // NOT get the customer's DRAFT <-> WOVEN_CONCEPT authoring transitions.
    return matches(INTERNAL_TRANSITIONS, from, to);
  }

  if (actor === "SYSTEM") {
    // The worker promotes a design to WOVEN_CONCEPT when a generation job
    // succeeds (§14.3). That is the only system-driven transition.
    return from === "DRAFT" && to === "WOVEN_CONCEPT";
  }

  return false;
}

export class InvalidTransitionError extends Error {
  readonly code = "INVALID_STATE_TRANSITION";
  constructor(
    readonly from: DesignStatus,
    readonly to: DesignStatus,
    readonly actor: Actor,
  ) {
    super(`${actor} cannot move a design from ${from} to ${to}.`);
    this.name = "InvalidTransitionError";
  }
}

export function assertTransition(from: DesignStatus, to: DesignStatus, actor: Actor): void {
  if (!canTransition(from, to, actor)) {
    throw new InvalidTransitionError(from, to, actor);
  }
}

/** Every state `actor` could legally move this design to right now. */
export function allowedTransitions(from: DesignStatus, actor: Actor): DesignStatus[] {
  const candidates: DesignStatus[] = [
    "DRAFT",
    "WOVEN_CONCEPT",
    "SUBMITTED",
    "IN_REVIEW",
    "REFINING",
    "SAMPLE",
    "APPROVED",
    "PRODUCTION",
    "COMPLETED",
    "CANCELLED",
    "ARCHIVED",
  ];
  return candidates.filter((to) => canTransition(from, to, actor));
}

/** Whether the customer may still edit the composition (§5.2). */
export function isCustomerEditable(status: DesignStatus): boolean {
  return status === "DRAFT" || status === "WOVEN_CONCEPT";
}

/** Map a stored role to the actor used by the state machine. */
export function actorForRole(role: UserRole): Actor {
  return role;
}

/**
 * Customer-facing status labels (§22.2).
 *
 * Internal-only states deliberately collapse onto something a customer can
 * act on: a cancelled or archived design is never shown raw.
 */
const CUSTOMER_STATUS_LABELS: Record<DesignStatus, string> = {
  DRAFT: "Draft",
  WOVEN_CONCEPT: "Woven Concept",
  SUBMITTED: "Submitted",
  IN_REVIEW: "In Review",
  REFINING: "Refining",
  SAMPLE: "Sample",
  APPROVED: "Approved",
  PRODUCTION: "Production",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  ARCHIVED: "Archived",
};

export function customerStatusLabel(status: DesignStatus): string {
  return CUSTOMER_STATUS_LABELS[status];
}
