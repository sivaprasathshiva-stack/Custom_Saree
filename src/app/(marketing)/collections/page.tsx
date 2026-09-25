import { SectionLabel } from "@/components/ui/section-label";
import { MediaPlaceholder } from "@/components/ui/media-placeholder";
import { BackButton } from "@/components/ui/back-button";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Collections — VELVOREA",
  description: "Editorial groupings of saree designs, organised by occasion, technique or material.",
};

export default function CollectionsPage() {
  return (
    <div className="bg-ivory">
      <section className="px-6 pb-16 pt-14 md:px-10 md:pb-24 md:pt-20">
        <div className="mx-auto max-w-[1600px]" data-reveal>
          <BackButton className="mb-8" />
          <SectionLabel>Collections</SectionLabel>
          <h1 className="mt-6 max-w-5xl font-serif text-[clamp(2.5rem,6vw,5.5rem)] leading-[1] tracking-[-0.025em] text-balance">
            Editorial groupings, organised by story rather than category.
          </h1>
          <p className="mt-8 max-w-xl text-lg text-pretty text-stone">
            Collections will bring designs together around an occasion, a technique
            or a material — the way{" "}
            <a href="/bridal" className="text-ink underline underline-offset-4">
              Bridal
            </a>{" "}
            already does for weddings. No other collections are published yet; this
            page is the container waiting for them, not a placeholder grid pretending
            to be finished.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[1600px] px-6 py-16 md:px-10">
        <MediaPlaceholder label="Collection Editorial Spread" hint="Full-bleed collection photography, 21:9" ratio="aspect-[21/9]" />
      </section>

      <section className="mx-auto max-w-[1600px] px-6 pb-20 md:px-10">
        <div className="mt-9 flex flex-wrap gap-4">
          <Button href="/bridal" variant="primary">
            Explore Bridal
          </Button>
          <Button href="/studio" variant="secondary">
            Start from a blank design
          </Button>
        </div>
      </section>
    </div>
  );
}
