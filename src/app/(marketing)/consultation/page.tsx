import { PageIntro } from "@/components/marketing/page-intro";

export const metadata = { title: "Book a Consultation — SĀRĪ Studio" };

export default function Page() {
  return (
    <PageIntro
      eyebrow="Consultation"
      title="Talk through your design before you start."
      description="Design, technical and B2B consultations can be booked once a scheduling provider is connected. Until then, reach out directly."
      cta={{ label: "Contact us instead", href: "/contact" }}
      heroLabel="Consultation Booking"
      heroHint="Scheduling UI once a provider is connected"
    />
  );
}
