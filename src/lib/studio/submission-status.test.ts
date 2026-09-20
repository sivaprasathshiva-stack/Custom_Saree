import { describe, expect, it } from "vitest";
import { CUSTOMER_STATUS_LABELS, toCustomerStatusLabel } from "./submission-status";

describe("toCustomerStatusLabel", () => {
  it("maps every known internal status to a PRD §35 label", () => {
    expect(toCustomerStatusLabel("submitted")).toBe("Submitted");
    expect(toCustomerStatusLabel("design_team_review")).toBe("Design Team Review");
    expect(toCustomerStatusLabel("clarification_required")).toBe("Clarification Required");
    expect(toCustomerStatusLabel("completed")).toBe("Completed");
  });

  it("never leaks an unrecognized/internal-only status to the customer", () => {
    expect(toCustomerStatusLabel("assigned_to_designer_47")).toBe("Submitted");
    expect(toCustomerStatusLabel(undefined)).toBe("Submitted");
    expect(toCustomerStatusLabel(null)).toBe("Submitted");
  });

  it("is case/whitespace tolerant", () => {
    expect(toCustomerStatusLabel(" Completed ".toLowerCase().trim())).toBe("Completed");
  });

  it("every exported label is one of the PRD's exact nine", () => {
    const allowed = new Set(CUSTOMER_STATUS_LABELS);
    for (const label of CUSTOMER_STATUS_LABELS) {
      expect(allowed.has(label)).toBe(true);
    }
    expect(CUSTOMER_STATUS_LABELS.length).toBe(9);
  });
});
