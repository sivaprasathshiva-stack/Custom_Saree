import { PageIntro } from "@/components/marketing/page-intro";

export const metadata = { title: "Our Weavers — SĀRĪ Studio" };

export default function Page() {
  return (
    <PageIntro
      eyebrow="Weavers"
      title="Master weaver, profile coming soon."
      description="Weaver names, specialisations, locations and portraits are published only once verified and consented by the manufacturing team — never invented for marketing."
      heroLabel="Master Weaver Portrait"
      heroHint="Real portrait with verified name/role/consent"
    />
  );
}
