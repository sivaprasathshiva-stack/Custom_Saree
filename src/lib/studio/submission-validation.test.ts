import { describe, expect, it } from "vitest";
import { validateSubmission } from "./submission-validation";

const validInput = {
  fullName: "Anita Rao",
  email: "anita@example.com",
  phone: "+91 98765 43210",
  addressLine1: "12 Silk Street",
  city: "Chennai",
  requiredByDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
};

describe("validateSubmission", () => {
  it("accepts a fully valid submission", () => {
    expect(validateSubmission(validInput)).toEqual({ valid: true, errors: {} });
  });

  it("requires full name, email, phone, address, city, and required-by date", () => {
    const { valid, errors } = validateSubmission({});
    expect(valid).toBe(false);
    expect(errors.fullName).toBeTruthy();
    expect(errors.email).toBeTruthy();
    expect(errors.phone).toBeTruthy();
    expect(errors.addressLine1).toBeTruthy();
    expect(errors.city).toBeTruthy();
    expect(errors.requiredByDate).toBeTruthy();
  });

  it("rejects a malformed email", () => {
    const { valid, errors } = validateSubmission({ ...validInput, email: "not-an-email" });
    expect(valid).toBe(false);
    expect(errors.email).toBeTruthy();
  });

  it("rejects a required-by date in the past", () => {
    const { valid, errors } = validateSubmission({ ...validInput, requiredByDate: "2000-01-01" });
    expect(valid).toBe(false);
    expect(errors.requiredByDate).toBeTruthy();
  });

  it("treats optional fields (occasion/quantity/budget/comments) as optional", () => {
    const { valid } = validateSubmission({ ...validInput, quantity: undefined, occasion: undefined });
    expect(valid).toBe(true);
  });

  it("rejects a non-positive quantity when provided", () => {
    const { valid, errors } = validateSubmission({ ...validInput, quantity: 0 });
    expect(valid).toBe(false);
    expect(errors.quantity).toBeTruthy();
  });
});
