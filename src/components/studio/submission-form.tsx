"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { validateSubmission, type SubmissionInput } from "@/lib/studio/submission-validation";

/**
 * Submission form (PRD §32-33). Client-side validation mirrors
 * src/lib/studio/submission-validation.ts, which the API route also runs —
 * so this form can never bypass server-side checks, only give faster
 * feedback.
 */
export function SubmissionForm({ designId, designName }: { designId: string; designName: string }) {
  const router = useRouter();
  const [values, setValues] = useState<Partial<SubmissionInput>>({});
  const [errors, setErrors] = useState<ReturnType<typeof validateSubmission>["errors"]>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const set = <K extends keyof SubmissionInput>(key: K, value: SubmissionInput[K]) =>
    setValues((v) => ({ ...v, [key]: value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = validateSubmission(values);
    setErrors(result.errors);
    if (!result.valid) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/studio/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ designId, ...values }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setSubmitError(body.error ?? "Could not submit your design. Please try again.");
        setSubmitting(false);
        return;
      }
      const body = await res.json();
      const params = new URLSearchParams({
        conceptId: body.id,
        submittedAt: body.submittedAt,
        name: values.fullName ?? "",
        email: values.email ?? "",
        phone: values.phone ?? "",
        requiredByDate: values.requiredByDate ?? "",
      });
      router.push(`/studio/${designId}/submit/confirmation?${params.toString()}`);
    } catch {
      setSubmitError("Could not reach the server. Check your connection and try again.");
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
