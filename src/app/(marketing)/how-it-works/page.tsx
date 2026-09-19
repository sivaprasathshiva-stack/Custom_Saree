import { PageIntro } from "@/components/marketing/page-intro";

export const metadata = { title: "How It Works — SĀRĪ Studio" };

export default function Page() {
  return (
    <PageIntro
      eyebrow="How it works"
      title="From idea to loom, in ten stages."
      description="Material, colour, artwork, repeat, border, pallu, zari, manufacturability review, sample, then production — the same sequence the Textile Studio walks you through."
      cta={{ label: "Start designing", href: "/studio" }}
      heroLabel="Process Diagram — Idea to Loom"
      heroHint="Technical process illustration"
    />
  );
}
