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
      <section className="border-b border-line px-6 py-20 md:px-10">
        <div className="mx-auto max-w-[1600px]">
          <BackButton className="mb-8" />
          <SectionLabel>Sample Program</SectionLabel>
          <h1 className="mt-6 max-w-2xl font-display text-5xl leading-tight md:text-6xl">
            See and feel your design before it goes into production.
          </h1>
          <p className="mt-6 max-w-xl text-stone">
            A screen render can get you close, but silk, zari and weave have a
            physical presence a screen can&rsquo;t fully show. Once your Studio design
            passes technical review, you can request a physical sample before
            committing to the full saree.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[1600px] px-6 py-16 md:px-10">
        <div className="grid grid-cols-1 gap-px border border-line bg-line md:grid-cols-2">
          {options.map((o) => (
            <div key={o.title} className="flex flex-col gap-3 bg-ivory p-8">
              <p className="font-display text-xl">{o.title}</p>
              <p className="text-sm leading-relaxed text-stone">{o.body}</p>
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
