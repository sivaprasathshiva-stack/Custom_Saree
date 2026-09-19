import { PageIntro } from "@/components/marketing/page-intro";

export const metadata = { title: "Sample Program — VELVOREA" };

export default function Page() {
  return (
    <PageIntro
      eyebrow="Sample Program"
      title="See and feel your design before it goes into production."
      description="Colour swatch, fabric swatch, motif swatch, border sample or full sample saree — request a physical sample once your design passes technical review in the Studio."
      cta={{ label: "Start a design", href: "/studio" }}
      heroLabel="Physical Sample Swatches"
      heroHint="Real swatch photography"
    />
  );
}
