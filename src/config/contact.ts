/**
 * VELVOREA's published contact channels.
 *
 * Defined once so the footer, the contact page and any future call-to-action
 * cannot drift apart — a phone number that is right in one place and stale in
 * another is worse than one that is missing.
 */

/** Where customer enquiries and studio submissions land. */
export const OFFICE_EMAIL = "velvorea@gmail.com";

export const INSTAGRAM_HANDLE = "@velvorea";
export const INSTAGRAM_URL = "https://instagram.com/velvorea";

/** Display form, spaced for readability. */
export const WHATSAPP_DISPLAY = "+91 88700 82760";

/**
 * wa.me requires the number in full international form with no punctuation —
 * a "+" or a space silently breaks the link.
 */
export const WHATSAPP_NUMBER = "918870082760";
export const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}`;

/** Pre-filled opening message, so an enquiry arrives with context. */
export function whatsappUrlWithMessage(message: string): string {
  return `${WHATSAPP_URL}?text=${encodeURIComponent(message)}`;
}

export const CONTACT_CHANNELS = [
  {
    id: "email",
    label: "Email",
    value: OFFICE_EMAIL,
    href: `mailto:${OFFICE_EMAIL}`,
    note: "For enquiries, orders and anything you'd rather put in writing.",
  },
  {
    id: "whatsapp",
    label: "WhatsApp",
    value: WHATSAPP_DISPLAY,
    href: WHATSAPP_URL,
    note: "The quickest way to reach the studio during Indian working hours.",
  },
  {
    id: "instagram",
    label: "Instagram",
    value: INSTAGRAM_HANDLE,
    href: INSTAGRAM_URL,
    note: "Finished sarees, work in progress and the loom floor.",
  },
] as const;
