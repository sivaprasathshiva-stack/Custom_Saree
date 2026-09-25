import { SectionLabel } from "@/components/ui/section-label";
import { BackButton } from "@/components/ui/back-button";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Sample Program — VELVOREA",
  description: "Request a physical swatch or sample before committing to full production of your custom silk saree.",
};

const options = [
  { title: "Colour swatch", body: "A small piece of dyed silk in your chosen base colour — the fastest way to confirm colour before anything else." },
  { title: "Fabric swatch", body: "A larger piece showing the actual material, weight and drape you've selected." },
  { title: "Motif swatch", body: "Your uploaded artwork woven at actual scale, so you can check size and clarity before it's repeated across a full saree." },
  { title: "Border sample", body: "A short length of the finished border, including zari, as it will appear on the final piece." },
];

export default function SampleProgramPage() {
  return (
    <div className="bg-ivory">
      <section className="px-6 pb-16 pt-14 md:px-10 md:pb-24 md:pt-20">
        <div className="mx-auto max-w-[1600px]" data-reveal>
          <BackButton className="mb-8" />
          <SectionLabel>Sample Program</SectionLabel>
          <h1 className="mt-6 max-w-5xl font-serif text-[clamp(2.5rem,6vw,5.5rem)] leading-[1] tracking-[-0.025em] text-balance">
            See and feel your design before it goes into production.
          </h1>
          <p className="mt-8 max-w-xl text-lg text-pretty text-stone">
            A screen render can get you close, but silk, zari and weave have a
            physical presence a screen can&rsquo;t fully show. Once your Studio design
            passes technical review, you can request a physical sample before
            committing to the full saree.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[1600px] px-6 py-16 md:px-10">
        <div className="grid grid-cols-1 gap-x-14 md:grid-cols-2">
          {options.map((o) => (
            <div key={o.title} className="flex flex-col gap-3 border-t border-line py-8 transition-colors duration-300 hover:border-charcoal" data-reveal>
              <p className="font-serif text-2xl leading-tight md:text-3xl">{o.title}</p>
              <p className="leading-relaxed text-pretty text-stone">{o.body}</p>
            </div>
          ))}
        </div>
        <p className="mt-10 max-w-xl text-sm text-stone">
          Sample requests are handled directly once your design clears
          manufacturability review in the Studio — pricing and lead time depend on
          which sample type and how much of the design it covers.
        </p>
        <div className="mt-9">
          <Button href="/studio" variant="primary">
            Start a design
          </Button>
        </div>
      </section>
    </div>
  );
}
