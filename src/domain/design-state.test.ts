import { describe, expect, it } from "vitest";
import {
  allowedTransitions,
  assertTransition,
  canTransition,
  customerStatusLabel,
  InvalidTransitionError,
  isCustomerEditable,
  TERMINAL_DESIGN_STATUSES,
} from "./design-state";
import { DESIGN_STATUSES, type DesignStatus } from "./types";

describe("canTransition — customer", () => {
  it("allows the authoring loop and submission (§5.2)", () => {
    expect(canTransition("DRAFT", "WOVEN_CONCEPT", "CUSTOMER")).toBe(true);
    expect(canTransition("WOVEN_CONCEPT", "DRAFT", "CUSTOMER")).toBe(true);
    expect(canTransition("WOVEN_CONCEPT", "SUBMITTED", "CUSTOMER")).toBe(true);
  });

  it("makes a submitted design read-only for its owner", () => {
    expect(canTransition("SUBMITTED", "DRAFT", "CUSTOMER")).toBe(false);
    expect(canTransition("SUBMITTED", "IN_REVIEW", "CUSTOMER")).toBe(false);
    expect(canTransition("SUBMITTED", "CANCELLED", "CUSTOMER")).toBe(false);
  });

  it("does not let a customer skip straight from draft to submitted", () => {
    expect(canTransition("DRAFT", "SUBMITTED", "CUSTOMER")).toBe(false);
  });

  it("lets a customer archive only their own unsubmitted work", () => {
    expect(canTransition("DRAFT", "ARCHIVED", "CUSTOMER")).toBe(true);
    expect(canTransition("WOVEN_CONCEPT", "ARCHIVED", "CUSTOMER")).toBe(true);
    expect(canTransition("COMPLETED", "ARCHIVED", "CUSTOMER")).toBe(false);
  });
});

describe("canTransition — internal", () => {
  it("walks the review pipeline", () => {
    expect(canTransition("SUBMITTED", "IN_REVIEW", "DESIGNER")).toBe(true);
    expect(canTransition("IN_REVIEW", "REFINING", "DESIGNER")).toBe(true);
    expect(canTransition("REFINING", "IN_REVIEW", "DESIGNER")).toBe(true);
    expect(canTransition("SAMPLE", "APPROVED", "ADMIN")).toBe(true);
    expect(canTransition("APPROVED", "PRODUCTION", "ADMIN")).toBe(true);
    expect(canTransition("PRODUCTION", "COMPLETED", "ADMIN")).toBe(true);
  });

  it("cannot skip stages", () => {
    expect(canTransition("SUBMITTED", "PRODUCTION", "ADMIN")).toBe(false);
    expect(canTransition("IN_REVIEW", "COMPLETED", "ADMIN")).toBe(false);
  });

  it("does not hand internal users the customer's authoring transitions", () => {
    expect(canTransition("DRAFT", "WOVEN_CONCEPT", "DESIGNER")).toBe(false);
  });

  it("allows cancellation only from live operational states", () => {
    expect(canTransition("IN_REVIEW", "CANCELLED", "ADMIN")).toBe(true);
    expect(canTransition("PRODUCTION", "CANCELLED", "ADMIN")).toBe(true);
    expect(canTransition("DRAFT", "CANCELLED", "ADMIN")).toBe(false);
    expect(canTransition("COMPLETED", "CANCELLED", "ADMIN")).toBe(false);
  });
});

describe("canTransition — system", () => {
  it("promotes a design when a generation job succeeds, and nothing else", () => {
    expect(canTransition("DRAFT", "WOVEN_CONCEPT", "SYSTEM")).toBe(true);
    expect(canTransition("WOVEN_CONCEPT", "SUBMITTED", "SYSTEM")).toBe(false);
    expect(canTransition("SUBMITTED", "IN_REVIEW", "SYSTEM")).toBe(false);
  });
});

describe("terminal states", () => {
  it("never transition anywhere, for anyone", () => {
    for (const from of TERMINAL_DESIGN_STATUSES) {
      for (const to of DESIGN_STATUSES) {
        for (const actor of ["CUSTOMER", "DESIGNER", "ADMIN", "SUPER_ADMIN", "SYSTEM"] as const) {
          expect(canTransition(from, to, actor)).toBe(false);
        }
      }
    }
  });
});

describe("self-transitions", () => {
  it("are always rejected", () => {
    for (const status of DESIGN_STATUSES) {
      expect(canTransition(status, status, "ADMIN")).toBe(false);
    }
  });
});

describe("assertTransition", () => {
  it("throws a typed error carrying the attempted move", () => {
    try {
      assertTransition("SUBMITTED", "DRAFT", "CUSTOMER");
      throw new Error("should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidTransitionError);
      const typed = error as InvalidTransitionError;
      expect(typed.code).toBe("INVALID_STATE_TRANSITION");
      expect(typed.from).toBe("SUBMITTED");
      expect(typed.to).toBe("DRAFT");
      expect(typed.actor).toBe("CUSTOMER");
    }
  });

  it("stays silent on a legal move", () => {
    expect(() => assertTransition("DRAFT", "WOVEN_CONCEPT", "CUSTOMER")).not.toThrow();
  });
});

describe("allowedTransitions", () => {
  it("agrees with canTransition for every state", () => {
    for (const from of DESIGN_STATUSES) {
      const allowed = allowedTransitions(from, "ADMIN");
      for (const to of allowed) {
        expect(canTransition(from, to, "ADMIN")).toBe(true);
      }
    }
  });

  it("is empty for terminal states", () => {
    expect(allowedTransitions("COMPLETED", "ADMIN")).toEqual([]);
    expect(allowedTransitions("ARCHIVED", "SUPER_ADMIN")).toEqual([]);
  });
});

describe("isCustomerEditable", () => {
  it("is true only while the customer still owns the design", () => {
    expect(isCustomerEditable("DRAFT")).toBe(true);
    expect(isCustomerEditable("WOVEN_CONCEPT")).toBe(true);
    expect(isCustomerEditable("SUBMITTED")).toBe(false);
    expect(isCustomerEditable("IN_REVIEW")).toBe(false);
  });
});

describe("customerStatusLabel", () => {
  it("has a label for every status", () => {
    for (const status of DESIGN_STATUSES) {
      expect(customerStatusLabel(status as DesignStatus)).toBeTruthy();
    }
  });
});
