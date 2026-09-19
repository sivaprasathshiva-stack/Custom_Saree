import { PageIntro } from "@/components/marketing/page-intro";

export const metadata = { title: "Sustainability — SĀRĪ Studio" };

export default function Page() {
  return (
    <PageIntro
      eyebrow="Sustainability"
      title="Claims backed by evidence, not marketing language."
      description="Material sourcing, production model, packaging and waste practices are described here only with a source, date and scope attached — no generic sustainability claims."
      heroLabel="Sustainability — Evidence Pending"
      heroHint="Documentation once supplied by manufacturing"
    />
  );
}
