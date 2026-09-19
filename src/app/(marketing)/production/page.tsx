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
      <section className="border-b border-line px-6 py-20 md:px-10">
        <div className="mx-auto max-w-[1600px]">
          <BackButton className="mb-8" />
          <SectionLabel>Production</SectionLabel>
          <h1 className="mt-6 max-w-2xl font-display text-5xl leading-tight md:text-6xl">
            From approved design to finished weave.
          </h1>
          <p className="mt-6 max-w-xl text-stone">
            Once your design is confirmed, it moves through the same stages every
            VELVOREA saree follows at our Elampillai facility. Once you have an
            active order, this page shows its live progress against this timeline —
            for now, here&rsquo;s what the timeline itself looks like.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[1600px] px-6 py-16 md:px-10">
        <ol className="grid grid-cols-1 gap-px border border-line bg-line md:grid-cols-2 lg:grid-cols-3">
          {stages.map((s, i) => (
            <li key={s.title} className="flex flex-col gap-3 bg-ivory p-8">
              <span className="font-mono text-xs text-stone">{String(i + 1).padStart(2, "0")}</span>
              <p className="font-display text-xl">{s.title}</p>
              <p className="text-sm leading-relaxed text-stone">{s.body}</p>
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
