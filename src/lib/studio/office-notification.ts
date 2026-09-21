/**
 * Office notification on submission (requirements §48).
 *
 * Sends through Resend when configured; otherwise logs exactly what it would
 * have sent and reports a failure, so an unconfigured deployment is visibly
 * unconfigured rather than silently dropping submissions.
 *
 * Non-negotiable (§37): a failure here must never fail the customer's
 * submission. Callers persist the submission row first, then call this
 * best-effort and record the outcome in `notification_events`.
 */

import { isEnabled } from "@/config/feature-flags";
import { logger } from "@/lib/observability/logger";

export interface OfficeNotificationPayload {
  submissionId: string;
  designId: string;
  designName: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  requiredByDate: string;
  /** The human-readable VL-YYYY-NNNNNN identifier, when available (§21). */
  conceptId?: string | null;
}

export interface OfficeNotificationResult {
  status: "SENT" | "FAILED";
  error?: string;
}

const RESEND_ENDPOINT = "https://api.resend.com/emails";

export function officeNotificationRecipient(): string {
  return process.env.VELVOREA_OFFICE_EMAIL ?? "studio-office@velvorea.example";
}

function fromAddress(): string {
  // Must be a domain verified in Resend, or the API rejects the send.
  return process.env.EMAIL_FROM_ADDRESS ?? "VELVOREA Studio <studio@velvorea.com>";
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildEmail(payload: OfficeNotificationPayload) {
  const reference = payload.conceptId ?? payload.submissionId;
  const studioUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://www.velvorea.com"}/admin/designs/${payload.designId}`;

  const rows: Array<[string, string]> = [
    ["Concept", reference],
    ["Design", payload.designName],
    ["Customer", payload.customerName],
    ["Email", payload.customerEmail],
    ["Phone", payload.customerPhone],
    ["Required by", payload.requiredByDate],
  ];

  const text = [
    `New concept submitted — ${reference}`,
    "",
    ...rows.map(([label, value]) => `${label}: ${value}`),
    "",
    `Open in the design console: ${studioUrl}`,
  ].join("\n");

  const html = [
    `<div style="font-family:Georgia,serif;color:#111;max-width:560px">`,
    `<p style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#888;margin:0 0 8px">VELVOREA</p>`,
    `<h1 style="font-size:20px;margin:0 0 16px">New concept submitted</h1>`,
    `<table style="border-collapse:collapse;font-size:14px">`,
    ...rows.map(
      ([label, value]) =>
        `<tr><td style="padding:4px 16px 4px 0;color:#888">${escapeHtml(label)}</td><td style="padding:4px 0">${escapeHtml(value)}</td></tr>`,
    ),
    `</table>`,
    `<p style="margin:24px 0 0"><a href="${escapeHtml(studioUrl)}" style="color:#6b6459">Open in the design console →</a></p>`,
    `</div>`,
  ].join("");

  return {
    subject: `New concept — ${reference} (${payload.customerName})`,
    text,
    html,
  };
}

export async function sendOfficeNotification(
  payload: OfficeNotificationPayload,
): Promise<OfficeNotificationResult> {
  const email = buildEmail(payload);
  const recipient = officeNotificationRecipient();
  const apiKey = process.env.RESEND_API_KEY?.trim();

  if (!isEnabled("ENABLE_EMAIL_NOTIFICATIONS") || !apiKey) {
    // Honest stub: say precisely what is missing rather than pretending.
    logger.info("Office notification not sent — email is not configured", {
      submissionId: payload.submissionId,
      subject: email.subject,
    });
    return {
      status: "FAILED",
      error: !apiKey
        ? "RESEND_API_KEY is not set."
        : "ENABLE_EMAIL_NOTIFICATIONS is off.",
    };
  }

  try {
    const response = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from: fromAddress(),
        to: [recipient],
        // So a reply from the office goes straight to the customer.
        reply_to: payload.customerEmail,
        subject: email.subject,
        text: email.text,
        html: email.html,
      }),
    });

    if (!response.ok) {
      // Read the body only to record a short reason; never surface it.
      const detail = (await response.text().catch(() => "")).slice(0, 200);
      logger.error("Office notification rejected by provider", {
        submissionId: payload.submissionId,
        status: response.status,
      });
      return { status: "FAILED", error: `Provider returned ${response.status}: ${detail}` };
    }

    logger.info("Office notification sent", { submissionId: payload.submissionId });
    return { status: "SENT" };
  } catch (error) {
    logger.error("Office notification threw", { submissionId: payload.submissionId, error });
    return {
      status: "FAILED",
      error: error instanceof Error ? error.message : "Unknown email error.",
    };
  }
}
