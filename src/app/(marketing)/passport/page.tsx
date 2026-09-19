import { PageIntro } from "@/components/marketing/page-intro";

export const metadata = { title: "Saree Passport — VELVOREA" };

export default function Page() {
  return (
    <PageIntro
      eyebrow="Saree Passport"
      title="Verify a finished saree without an account."
      description="Scan the QR code on a completed saree's passport, or enter a passport ID, to see its material, weave, zari, production date and quality status."
      heroLabel="Saree Passport Lookup"
      heroHint="Passport lookup form once the passport service is built"
    />
  );
}
