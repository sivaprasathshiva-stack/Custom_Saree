import { PageIntro } from "@/components/marketing/page-intro";

export const metadata = { title: "Journal — VELVOREA" };

export default function Page() {
  return (
    <PageIntro
      eyebrow="Journal"
      title="Writing on silk, weaving, zari and textile technology."
      description="A knowledge base covering silk authenticity, handloom vs. powerloom, zari, colour matching, care and design terminology. Articles are CMS-managed; none exist yet in this build."
      heroLabel="Journal — Featured Article"
      heroHint="Editorial photography, 21:9"
    />
  );
}
