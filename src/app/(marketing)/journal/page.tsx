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
      <section className="px-6 pb-16 pt-14 md:px-10 md:pb-24 md:pt-20">
        <div className="mx-auto max-w-[1600px]" data-reveal>
          <BackButton className="mb-8" />
          <SectionLabel>Journal</SectionLabel>
          <h1 className="mt-6 max-w-5xl font-serif text-[clamp(2.5rem,6vw,5.5rem)] leading-[1] tracking-[-0.025em] text-balance">
            Writing on silk, weaving, zari and textile technology.
          </h1>
          <p className="mt-8 max-w-xl text-lg text-pretty text-stone">
            A knowledge base for people buying or designing a silk saree who want to
            understand the material, not just choose from a swatch. No articles are
            published here yet — this is the topic list we&rsquo;re writing toward first.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[1600px] px-6 py-16 md:px-10">
        <div className="grid grid-cols-1 gap-x-14 md:grid-cols-2">
          {topics.map((t) => (
            <div key={t.title} className="flex flex-col gap-3 border-t border-line py-8 transition-colors duration-300 hover:border-charcoal" data-reveal>
              <p className="font-serif text-2xl leading-tight md:text-3xl">{t.title}</p>
              <p className="leading-relaxed text-pretty text-stone">{t.body}</p>
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
