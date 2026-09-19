import { SectionLabel } from "@/components/ui/section-label";
import { BackButton } from "@/components/ui/back-button";

export const metadata = {
  title: "Sustainability — VELVOREA",
  description: "What made-to-order manufacturing actually means for waste and inventory, stated without unverified claims.",
};

const facts = [
  {
    title: "Made to order, not made to stock",
    body: "Every saree starts as a Studio design and is only woven once ordered. There's no seasonal inventory produced speculatively and discounted or discarded if it doesn't sell.",
  },
  {
    title: "Manufactured where it's designed",
    body: "Production stays at a single facility in Elampillai, Salem, Tamil Nadu — no multi-country supply chain to audit or explain.",
  },
  {
    title: "Sample-first for high-value orders",
    body: "The Sample Program exists specifically to catch mismatches before a full saree is woven, reducing rework and material waste on bridal and premium orders.",
  },
];

export default function SustainabilityPage() {
  return (
    <div className="bg-ivory">
      <section className="border-b border-line px-6 py-20 md:px-10">
        <div className="mx-auto max-w-[1600px]">
          <BackButton className="mb-8" />
          <SectionLabel>Sustainability</SectionLabel>
          <h1 className="mt-6 max-w-2xl font-display text-5xl leading-tight md:text-6xl">
            Claims backed by evidence, not marketing language.
          </h1>
          <p className="mt-6 max-w-xl text-stone">
            We&rsquo;d rather state three things we can actually stand behind than a long
            list of generic sustainability language. Material sourcing certifications,
            packaging and waste-handling specifics will be added here with a source,
            date and scope attached as they&rsquo;re formally documented — not before.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[1600px] px-6 py-16 md:px-10">
        <div className="grid grid-cols-1 gap-px border border-line bg-line md:grid-cols-3">
          {facts.map((f) => (
            <div key={f.title} className="flex flex-col gap-3 bg-ivory p-8">
              <p className="font-display text-xl">{f.title}</p>
              <p className="text-sm leading-relaxed text-stone">{f.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
