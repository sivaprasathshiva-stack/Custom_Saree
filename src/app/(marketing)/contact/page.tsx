import { PageIntro } from "@/components/marketing/page-intro";

export const metadata = { title: "Contact — SĀRĪ Studio" };

export default function Page() {
  return (
    <PageIntro
      eyebrow="Contact"
      title="Reach the studio directly."
      description="Email and WhatsApp contact details are configured business data, shown here once supplied. This page is scaffolded ahead of that configuration."
      heroLabel="Contact Details"
      heroHint="Verified business contact information"
    />
  );
}
