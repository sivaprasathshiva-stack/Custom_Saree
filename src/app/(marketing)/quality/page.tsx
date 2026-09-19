import { PageIntro } from "@/components/marketing/page-intro";

export const metadata = { title: "Quality & Certification — VELVOREA" };

export default function Page() {
  return (
    <PageIntro
      eyebrow="Quality"
      title="Verified claims only — nothing published until confirmed."
      description="Certification badges and quality claims are hidden until an admin marks them verified, with issuer, certificate number and evidence on file. None are verified in this demo build."
      heroLabel="Certification — Placeholder"
      heroHint="Certificate document once verified"
    />
  );
}
