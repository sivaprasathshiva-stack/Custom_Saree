"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { validateStudioSubmission, type SubmissionInput } from "@/lib/studio/submission-validation";
import { ApiError, apiPost } from "@/lib/api/client";

/**
 * Submission form (§20).
 *
 * Client-side validation mirrors src/lib/studio/submission-validation.ts,
 * which the API route runs again — this form gives faster feedback, it never
 * substitutes for the server's check (§85 Rule 6).
 */
export function SubmissionForm({ designId, designName }: { designId: string; designName: string }) {
  const router = useRouter();
  const [values, setValues] = useState<Partial<SubmissionInput>>({});
  const [errors, setErrors] = useState<ReturnType<typeof validateStudioSubmission>["errors"]>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const set = <K extends keyof SubmissionInput>(key: K, value: SubmissionInput[K]) =>
    setValues((v) => ({ ...v, [key]: value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = validateStudioSubmission(values);
    setErrors(result.errors);
    if (!result.valid) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      const body = await apiPost<{ submissionId: string; conceptId: string; submittedAt: string }>(
        `/api/studio/designs/${designId}/submission`,
        values,
      );
      const params = new URLSearchParams({
        // The human-readable VL-YYYY-NNNNNN id, not the row id (§21).
        conceptId: body.conceptId ?? "",
        submittedAt: body.submittedAt,
        name: values.fullName ?? "",
        email: values.email ?? "",
        phone: values.phone ?? "",
        requiredByDate: values.requiredByDate ?? "",
      });
      router.push(`/studio/${designId}/submit/confirmation?${params.toString()}`);
    } catch (caught) {
      setSubmitError(
        caught instanceof ApiError
          ? caught.message
          : "Could not reach the server. Check your connection and try again.",
      );
      setSubmitting(false);
    }
  }

  const field = (
    key: keyof SubmissionInput,
    label: string,
    type: string = "text",
    required = true,
  ) => (
    <div>
      <label className="font-mono text-[10px] uppercase tracking-[0.15em] text-stone">
        {label}
        {required ? " *" : ""}
      </label>
      <input
        type={type}
        value={(values[key] as string) ?? ""}
        onChange={(e) =>
          set(key, (type === "number" ? Number(e.target.value) : e.target.value) as never)
        }
        className="mt-1 w-full border border-line-dark bg-transparent px-3 py-2 text-sm text-ivory focus:border-brass focus:outline-none"
      />
      {errors[key] && <p className="mt-1 text-xs text-danger">{errors[key]}</p>}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone">
        Submitting: {designName}
      </p>
      <div className="grid gap-5 sm:grid-cols-2">
        {field("fullName", "Full name")}
        {field("email", "Email", "email")}
        {field("phone", "Phone")}
        {field("country", "Country", "text", false)}
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        {field("addressLine1", "Address line 1")}
        {field("addressLine2", "Address line 2", "text", false)}
      </div>
      <div className="grid gap-5 sm:grid-cols-3">
        {field("city", "City")}
        {field("state", "State", "text", false)}
        {field("postalCode", "Postal code", "text", false)}
      </div>
      <div>
        {field("requiredByDate", "Required-by date", "date")}
        <p className="mt-2 max-w-md text-xs text-stone">
          This date helps our design team understand your timeline. Final delivery timing will be
          confirmed after design and production review.
        </p>
      </div>
      <div className="grid gap-5 sm:grid-cols-3">
        {field("occasion", "Occasion", "text", false)}
        {field("quantity", "Quantity", "number", false)}
        {field("budgetRange", "Budget range", "text", false)}
      </div>
      <div>
        <label className="font-mono text-[10px] uppercase tracking-[0.15em] text-stone">Comments</label>
        <textarea
          value={values.comments ?? ""}
          onChange={(e) => set("comments", e.target.value)}
          rows={3}
          className="mt-1 w-full border border-line-dark bg-transparent px-3 py-2 text-sm text-ivory focus:border-brass focus:outline-none"
        />
      </div>

      {/* §20.4 — recorded with a timestamp and terms version on submission. */}
      <div className="border-t border-line-dark pt-5">
        <label className="flex cursor-pointer items-start gap-3 text-sm text-ivory">
          <input
            type="checkbox"
            checked={values.termsAccepted ?? false}
            onChange={(e) => set("termsAccepted", e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-brass-bright"
          />
          <span className="leading-relaxed">
            I understand this is a digital concept and final production appearance is subject to
            VELVOREA technical review.
          </span>
        </label>
        {errors.termsAccepted && (
          <p className="mt-1 text-xs text-danger">{errors.termsAccepted}</p>
        )}
      </div>

      {submitError && <p className="text-sm text-danger">{submitError}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="mt-2 self-start bg-brass-bright px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.15em] text-charcoal hover:bg-ivory disabled:opacity-50"
      >
        {submitting ? "Submitting…" : "Submit to VELVOREA"}
      </button>
    </form>
  );
}
