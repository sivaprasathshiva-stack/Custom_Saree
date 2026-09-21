/**
 * Shared validation for the "Submit to VELVOREA" form (PRD §32-33). Used by
 * both the client form (inline errors) and the API route
 * (src/app/api/studio/submissions/route.ts), so server-side validation can
 * never be bypassed by skipping the client.
 */
export interface SubmissionInput {
  fullName: string;
  email: string;
  phone: string;
  country?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state?: string;
  postalCode?: string;
  requiredByDate: string; // ISO date, yyyy-mm-dd
  occasion?: string;
  quantity?: number;
  budgetRange?: string;
  comments?: string;
  /**
   * The §20.4 acknowledgement that this is a digital concept. Recorded with a
   * timestamp and terms version on the submission row, so what the customer
   * agreed to — and when — is reconstructable later.
   */
  termsAccepted?: boolean;
}

export interface ValidationResult {
  valid: boolean;
  errors: Partial<Record<keyof SubmissionInput, string>>;
}

import { MAX_SUBMISSION_QUANTITY, SUPPORTED_OCCASIONS } from "@/config/limits";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateSubmission(input: Partial<SubmissionInput>): ValidationResult {
  const errors: ValidationResult["errors"] = {};

  if (!input.fullName?.trim()) errors.fullName = "Full name is required.";
  if (!input.email?.trim() || !EMAIL_RE.test(input.email.trim())) {
    errors.email = "A valid email address is required.";
  }
  if (!input.phone?.trim() || input.phone.trim().replace(/[^0-9]/g, "").length < 7) {
    errors.phone = "A valid phone number is required.";
  }
  if (!input.addressLine1?.trim()) errors.addressLine1 = "Address is required.";
  if (!input.city?.trim()) errors.city = "City is required.";

  if (!input.requiredByDate?.trim()) {
    errors.requiredByDate = "A required-by date is required.";
  } else {
    const parsed = new Date(input.requiredByDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (Number.isNaN(parsed.getTime())) {
      errors.requiredByDate = "Enter a valid date.";
    } else if (parsed < today) {
      errors.requiredByDate = "Required-by date must be in the future.";
    }
  }

  if (input.quantity !== undefined && input.quantity !== null) {
    if (!Number.isInteger(input.quantity) || input.quantity < 1) {
      errors.quantity = "Quantity must be a positive whole number.";
    } else if (input.quantity > MAX_SUBMISSION_QUANTITY) {
      errors.quantity = `For more than ${MAX_SUBMISSION_QUANTITY}, please contact us directly.`;
    }
  }

  if (input.occasion && !SUPPORTED_OCCASIONS.includes(input.occasion)) {
    errors.occasion = "Choose one of the listed occasions.";
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

/**
 * Submission validation for the Textile Studio flow, which additionally
 * requires the digital-concept acknowledgement (§20.4). Kept separate from
 * `validateSubmission` so the older configurator route's contract is
 * unchanged.
 */
export function validateStudioSubmission(
  input: Partial<SubmissionInput>,
): ValidationResult {
  const result = validateSubmission(input);
  const errors = { ...result.errors };

  if (input.termsAccepted !== true) {
    errors.termsAccepted = "Please confirm you understand this is a digital concept.";
  }

  return { valid: Object.keys(errors).length === 0, errors };
}
