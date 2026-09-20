/**
 * Stub office-notification sender (PRD §30/§37/§46). Same "honest stub"
 * pattern as src/app/api/vitals/route.ts: it logs exactly what WOULD be
 * emailed to the VELVOREA office and returns a failure result, because no
 * real email provider (Resend/SendGrid/etc.) is wired up yet — that requires
 * an account/key decision only the project owner can make.
 *
 * Non-negotiable per PRD §37: this function's failure must never fail the
 * customer's submission. Callers (src/app/api/studio/submissions/route.ts)
 * always persist the submission row first, then call this best-effort and
 * record the outcome in `notification_events`.
 */
export interface OfficeNotificationPayload {
  submissionId: string;
  designId: string;
  designName: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  requiredByDate: string;
}

export interface OfficeNotificationResult {
  status: "SENT" | "FAILED";
  error?: string;
}

const OFFICE_RECIPIENT = process.env.VELVOREA_OFFICE_EMAIL ?? "studio-office@velvorea.example";

export async function sendOfficeNotification(
  payload: OfficeNotificationPayload,
): Promise<OfficeNotificationResult> {
  console.log("[office-notification:stub] would email", OFFICE_RECIPIENT, {
    subject: `New design submission — ${payload.designName} (${payload.submissionId})`,
    body:
      `Design: ${payload.designName}\n` +
      `Concept ID: ${payload.submissionId}\n` +
      `Customer: ${payload.customerName} <${payload.customerEmail}>, ${payload.customerPhone}\n` +
      `Required by: ${payload.requiredByDate}`,
  });

  // No provider configured — this is deliberate, not a bug. See module
  // comment above. Replace this block with a real provider call once one is
  // chosen, and update the recipient() env var name if needed.
  return {
    status: "FAILED",
    error:
      "No email provider configured (VELVOREA needs a Resend/SendGrid/etc. account + API key before this can send real email). The submission itself succeeded regardless, per PRD §37.",
  };
}

export function officeNotificationRecipient() {
  return OFFICE_RECIPIENT;
}
