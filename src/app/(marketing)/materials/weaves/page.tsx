import { PageIntro } from "@/components/marketing/page-intro";

export const metadata = { title: "Weaves — SĀRĪ Studio" };

export default function Page() {
  return (
    <PageIntro
      eyebrow="Weaves"
      title="Plain, jacquard, brocade and tissue — each with its own constraints."
      description="Every weave defines its own supported motifs, density limits, repeat constraints and pricing multiplier. This page will list the configured weave taxonomy once populated by manufacturing."
      heroLabel="Weave Structure Diagram"
      heroHint="Technical illustration or macro photography"
    />
  );
}
