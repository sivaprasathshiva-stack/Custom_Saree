import { PageIntro } from "@/components/marketing/page-intro";

export const metadata = { title: "Our Craft — SĀRĪ Studio" };

export default function Page() {
  return (
    <PageIntro
      eyebrow="Craft"
      title="Woven in Elampillai, a silk town near Salem."
      description="Silk sourcing, yarn preparation, dyeing, digitisation, weaving, finishing and quality control — the twelve-stage process described in the product requirements, carried out at our Elampillai facility and illustrated once real factory media is supplied."
      heroLabel="Factory — Weaving Floor"
      heroHint="Real factory footage required, 4K, 16:9"
    />
  );
}
