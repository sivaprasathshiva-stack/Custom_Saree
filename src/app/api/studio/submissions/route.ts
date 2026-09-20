import { NextResponse } from "next/server";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { validateSubmission, type SubmissionInput } from "@/lib/studio/submission-validation";
import { sendOfficeNotification, officeNotificationRecipient } from "@/lib/studio/office-notification";

/**
 * POST /api/studio/submissions — "Submit to VELVOREA" (PRD §23-24, §32-37).
 *
 * Order of operations matters here per PRD §37 (email failure must never
 * fail the submission): 1) validate, 2) verify design ownership, 3) insert
 * the submission row, 4) THEN attempt the office notification best-effort
 * and record the outcome — a notification failure only updates
 * `notification_events`, never rolls back or errors the submission response.
 */
export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Studio backend is not configured in this environment." },
      { status: 501 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  let body: { designId?: string } & Partial<SubmissionInput>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { designId, ...submissionInput } = body;
  if (!designId) {
    return NextResponse.json({ error: "designId is required." }, { status: 400 });
  }

  const { valid, errors } = validateSubmission(submissionInput);
  if (!valid) {
    return NextResponse.json({ error: "Validation failed.", fields: errors }, { status: 422 });
  }

  // Ownership check happens implicitly via RLS on the select below, but we
  // check explicitly first so we can return a clean 404 rather than a
  // confusing empty-insert failure.
  const { data: design, error: designErr } = await supabase
    .from("designs")
    .select("id, name")
    .eq("id", designId)
    .maybeSingle();
  if (designErr || !design) {
    return NextResponse.json({ error: "Design not found." }, { status: 404 });
  }

  const input = submissionInput as SubmissionInput;
  const { data: submission, error: insertErr } = await supabase
    .from("submissions")
    .insert({
      design_id: designId,
      user_id: user.id,
      full_name: input.fullName,
      email: input.email,
      phone: input.phone,
      country: input.country ?? null,
      address_line1: input.addressLine1,
      address_line2: input.addressLine2 ?? null,
      city: input.city,
      state: input.state ?? null,
      postal_code: input.postalCode ?? null,
      required_by_date: input.requiredByDate,
      occasion: input.occasion ?? null,
      quantity: input.quantity ?? null,
      budget_range: input.budgetRange ?? null,
      comments: input.comments ?? null,
      status: "submitted",
    })
    .select("id, submitted_at")
    .single();

  if (insertErr || !submission) {
    return NextResponse.json({ error: "Could not save submission." }, { status: 500 });
  }

  // Best-effort notification — never fails the response above this point.
  const recipient = officeNotificationRecipient();
  let notificationStatus: "SENT" | "FAILED" = "FAILED";
  let lastError: string | null = null;
  try {
    const result = await sendOfficeNotification({
      submissionId: submission.id,
      designId,
      designName: design.name,
      customerName: input.fullName,
      customerEmail: input.email,
      customerPhone: input.phone,
      requiredByDate: input.requiredByDate,
    });
    notificationStatus = result.status;
    lastError = result.error ?? null;
  } catch (err) {
    lastError = err instanceof Error ? err.message : "Unknown notification error.";
  }

  await supabase.from("notification_events").insert({
    submission_id: submission.id,
    type: "office_notification",
    recipient,
    status: notificationStatus,
    attempt_count: 1,
    last_error: lastError,
  });

  return NextResponse.json({
    id: submission.id,
    designName: design.name,
    submittedAt: submission.submitted_at,
  });
}
