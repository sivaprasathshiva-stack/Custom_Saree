import { SectionLabel } from "@/components/ui/section-label";
import { BackButton } from "@/components/ui/back-button";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Journal — VELVOREA",
  description: "Writing on silk, weaving, zari and saree craftsmanship, from VELVOREA's manufacturing base in Elampillai, Salem.",
};

const topics = [
  { title: "Silk types", body: "What separates Kanchipuram, Banarasi, Tussar and Mysore silk in weight, drape and finish." },
  { title: "Handloom vs. powerloom", body: "What each method actually changes about a finished saree, without overstating either." },
  { title: "Zari, explained", body: "What zari is made of, how density and placement affect cost, and how to judge it in person." },
  { title: "Care and longevity", body: "Storage, cleaning and handling that keeps a silk saree in good condition for decades." },
];

export default function JournalPage() {
  return (
    <div className="bg-ivory">
      <section className="border-b border-line px-6 py-20 md:px-10">
        <div className="mx-auto max-w-[1600px]">
          <BackButton className="mb-8" />
          <SectionLabel>Journal</SectionLabel>
          <h1 className="mt-6 max-w-2xl font-display text-5xl leading-tight md:text-6xl">
            Writing on silk, weaving, zari and textile technology.
          </h1>
          <p className="mt-6 max-w-xl text-stone">
            A knowledge base for people buying or designing a silk saree who want to
            understand the material, not just choose from a swatch. No articles are
            published here yet — this is the topic list we&rsquo;re writing toward first.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[1600px] px-6 py-16 md:px-10">
        <div className="grid grid-cols-1 gap-px border border-line bg-line md:grid-cols-2">
          {topics.map((t) => (
            <div key={t.title} className="flex flex-col gap-3 bg-ivory p-8">
              <p className="font-display text-xl">{t.title}</p>
              <p className="text-sm leading-relaxed text-stone">{t.body}</p>
              <span className="font-mono text-xs uppercase tracking-[0.1em] text-stone">Coming soon</span>
            </div>
          ))}
        </div>
        <div className="mt-9">
          <Button href="/materials" variant="primary">
            Browse the Silk Library
          </Button>
        </div>
      </section>
    </div>
  );
}
