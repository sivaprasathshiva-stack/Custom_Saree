import { PageIntro } from "@/components/marketing/page-intro";

export const metadata = { title: "Zari — VELVOREA" };

export default function Page() {
  return (
    <PageIntro
      eyebrow="Zari"
      title="The metallic thread that defines a saree's finish."
      description="Type, composition, thickness, shine and origin — zari options are configured in the manufacturing system and validated against material compatibility before they reach the Studio."
      cta={{ label: "Configure zari in the Studio", href: "/studio" }}
      heroLabel="Zari — Macro Detail"
      heroHint="Macro photography of zari thread, real material required"
    />
  );
}
