import { SectionLabel } from "@/components/ui/section-label";
import { BackButton } from "@/components/ui/back-button";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Production Tracker — VELVOREA",
  description: "How a VELVOREA saree moves from approved design to finished weave, manufactured in Elampillai, Salem.",
};

const stages = [
  { title: "Design approved", body: "The Studio design has passed manufacturability review and is confirmed for production." },
  { title: "Silk prepared", body: "Yarn is selected and graded to the design's material specification." },
  { title: "Yarn dyed", body: "Colour is matched against the Studio palette in a small-batch dye run." },
  { title: "Warping and weaving", body: "The loom is set to the design's repeat, border and pallu configuration, then woven." },
  { title: "Finishing", body: "The fabric is cleared, pressed and prepared for inspection." },
  { title: "Quality control", body: "Checked against the original specification before dispatch — see Quality & Certification." },
];

export default function ProductionPage() {
  return (
    <div className="bg-ivory">
      <section className="px-6 pb-16 pt-14 md:px-10 md:pb-24 md:pt-20">
        <div className="mx-auto max-w-[1600px]" data-reveal>
          <BackButton className="mb-8" />
          <SectionLabel>Production</SectionLabel>
          <h1 className="mt-6 max-w-5xl font-serif text-[clamp(2.5rem,6vw,5.5rem)] leading-[1] tracking-[-0.025em] text-balance">
            From approved design to finished weave.
          </h1>
          <p className="mt-8 max-w-xl text-lg text-pretty text-stone">
            Once your design is confirmed, it moves through the same stages every
            VELVOREA saree follows at our Elampillai facility. Once you have an
            active order, this page shows its live progress against this timeline —
            for now, here&rsquo;s what the timeline itself looks like.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[1600px] px-6 py-16 md:px-10">
        <ol className="grid grid-cols-1 gap-x-14 md:grid-cols-2 lg:grid-cols-3">
          {stages.map((s, i) => (
            <li key={s.title} className="flex flex-col gap-3 border-t border-line py-8 transition-colors duration-300 hover:border-charcoal" data-reveal>
              <span className="font-serif text-2xl italic tabular-nums text-stone">{String(i + 1).padStart(2, "0")}</span>
              <p className="font-serif text-2xl leading-tight md:text-3xl">{s.title}</p>
              <p className="leading-relaxed text-pretty text-stone">{s.body}</p>
            </li>
          ))}
        </ol>
        <div className="mt-9">
          <Button href="/orders" variant="primary">
            View your orders
          </Button>
        </div>
      </section>
    </div>
  );
}
