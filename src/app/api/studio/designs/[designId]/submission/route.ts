import { TERMS_VERSION } from "@/config/limits";
import { assertTransition } from "@/domain/design-state";
import { DomainError } from "@/domain/errors";
import { readJson, requireOwnedDesign, withAuthedRoute } from "@/lib/api/handler";
import { created, ok } from "@/lib/api/response";
import { recordAudit, recordStatusChange } from "@/lib/audit/audit-log";
import { officeNotificationRecipient, sendOfficeNotification } from "@/lib/studio/office-notification";
import {
  validateStudioSubmission,
  type SubmissionInput,
} from "@/lib/studio/submission-validation";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { updateDesignStatus } from "@/lib/studio/repository";

/**
 * Send to VELVOREA (§20, §21, §55).
 *
 * Ordering is deliberate and matches §37: validate, transition, persist the
 * submission, and only then attempt the office notification. A notification
 * failure is recorded but never fails the submission — the customer's concept
 * has reached VELVOREA either way.
 */

type Params = { designId: string };

export const GET = withAuthedRoute<Params>(
  "GET /api/studio/designs/[designId]/submission",
  async (context) => {
    const design = await requireOwnedDesign(context, context.params.designId);

    const { data } = await context.supabase
      .from("submissions")
      .select("id, submitted_at, required_by_date, occasion, quantity, status")
      .eq("design_id", design.id)
      .maybeSingle();

    return ok({ submission: data ?? null, conceptId: design.public_id }, context.requestId);
  },
);

export const POST = withAuthedRoute<Params>(
  "POST /api/studio/designs/[designId]/submission",
  async (context) => {
    await enforceRateLimit("submission", context.userId);

    const design = await requireOwnedDesign(context, context.params.designId);

    if (design.status === "SUBMITTED" || design.submitted_at) {
      throw new DomainError("ALREADY_SUBMITTED");
    }

    // The state machine is the authority on whether this design may be sent
    // — not the presence of a form payload (§5.2).
    assertTransition(design.status, "SUBMITTED", "CUSTOMER");

    const body = await readJson<Partial<SubmissionInput>>(context.request);
    const { valid, errors } = validateStudioSubmission(body);
    if (!valid) {
      if (errors.termsAccepted) throw new DomainError("TERMS_NOT_ACCEPTED");
      throw new DomainError("VALIDATION_FAILED", { details: { fields: errors } });
    }

    const input = body as SubmissionInput;
    const supabase = createAdminClient();
    const acceptedAt = new Date().toISOString();

    const { data: submission, error } = await supabase
      .from("submissions")
      .insert({
        design_id: design.id,
        user_id: context.userId,
        concept_version_id: design.current_version_id,
        full_name: input.fullName.trim(),
        email: input.email.trim().toLowerCase(),
        phone: input.phone.trim(),
        country: input.country?.trim() || null,
        address_line1: input.addressLine1.trim(),
        address_line2: input.addressLine2?.trim() || null,
        city: input.city.trim(),
        state: input.state?.trim() || null,
        postal_code: input.postalCode?.trim() || null,
        required_by_date: input.requiredByDate,
        occasion: input.occasion ?? null,
        quantity: input.quantity ?? 1,
        comments: input.comments?.trim() || null,
        terms_version: TERMS_VERSION,
        terms_accepted_at: acceptedAt,
        status: "submitted",
      })
      .select("id, submitted_at")
      .single<{ id: string; submitted_at: string }>();

    if (error) {
      // The partial unique index guarantees one live submission per design,
      // so a duplicate here is a double-submit, not a server fault (§55).
      if (error.code === "23505") throw new DomainError("ALREADY_SUBMITTED");
      throw new DomainError("INTERNAL_ERROR", { cause: error });
    }

    await updateDesignStatus(design.id, "SUBMITTED", { submitted_at: submission.submitted_at });
    await recordStatusChange({
      designId: design.id,
      fromStatus: design.status,
      toStatus: "SUBMITTED",
      actorUserId: context.userId,
      reason: "Customer submitted concept",
    });
    await recordAudit({
      action: "SUBMISSION_CREATED",
      entityType: "submission",
      entityId: submission.id,
      actorUserId: context.userId,
      metadata: { designId: design.id, conceptId: design.public_id },
      request: context.clientInfo,
    });

    // Best-effort from here down — nothing below may fail the response.
    try {
      const result = await sendOfficeNotification({
        submissionId: submission.id,
        designId: design.id,
        designName: design.name,
        customerName: input.fullName,
        customerEmail: input.email,
        customerPhone: input.phone,
        requiredByDate: input.requiredByDate,
      });
      await supabase.from("notification_events").insert({
        submission_id: submission.id,
        type: "office_notification",
        recipient: officeNotificationRecipient(),
        status: result.status,
        attempt_count: 1,
        last_error: result.error ?? null,
      });
    } catch (notificationError) {
      context.log.error("Office notification failed", { error: notificationError });
      await supabase.from("notification_events").insert({
        submission_id: submission.id,
        type: "office_notification",
        recipient: officeNotificationRecipient(),
        status: "FAILED",
        attempt_count: 1,
        last_error:
          notificationError instanceof Error ? notificationError.message : "Unknown error",
      });
    }

    return created(
      {
        submissionId: submission.id,
        conceptId: design.public_id,
        submittedAt: submission.submitted_at,
      },
      context.requestId,
    );
  },
);

export const dynamic = "force-dynamic";
