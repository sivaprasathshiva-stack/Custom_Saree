import { PageIntro } from "@/components/marketing/page-intro";

export const metadata = { title: "Textile Room — VELVOREA" };

export default function Page() {
  return (
    <PageIntro
      eyebrow="Textile Room"
      title="Configurable saree designs, ready to make your own."
      description="A catalogue of signature saree configurations — material, palette, border, pallu and zari already resolved — that you can customize from a real starting point instead of a blank canvas."
      cta={{ label: "Enter the Textile Studio", href: "/studio" }}
      heroLabel="Textile Room — Configuration Grid"
      heroHint="Product screenshot once the catalogue view is built"
    />
  );
}
