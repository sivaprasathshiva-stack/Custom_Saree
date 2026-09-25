import { SectionLabel } from "@/components/ui/section-label";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/back-button";

export const metadata = {
  title: "B2B & Boutiques — VELVOREA",
  description: "Bulk custom saree orders for boutiques and buyers, manufactured in Elampillai, Salem.",
};

const steps = [
  {
    title: "Share your requirement",
    body: "Colourways, quantities, target price points and delivery window — send us the brief through Contact and we'll respond with what's feasible.",
  },
  {
    title: "Design and technical review",
    body: "Each colourway is built to spec and checked for manufacturability before quoting, the same review every individual Studio design goes through.",
  },
  {
    title: "Sample approval",
    body: "A physical sample is produced for sign-off before full production begins — see the Sample Program for how this works on individual orders.",
  },
  {
    title: "Production and shipping",
    body: "Once approved, the full order is woven and shipped as a batch, domestically or internationally.",
  },
];

export default function B2BPage() {
  return (
    <div className="bg-ivory">
      <section className="px-6 pb-16 pt-14 md:px-10 md:pb-24 md:pt-20">
        <div className="mx-auto max-w-[1600px]" data-reveal>
          <BackButton className="mb-8" />
          <SectionLabel>B2B</SectionLabel>
          <h1 className="mt-6 max-w-5xl font-serif text-[clamp(2.5rem,6vw,5.5rem)] leading-[1] tracking-[-0.025em] text-balance">
            Bulk orders, multiple colourways, one point of contact.
          </h1>
          <p className="mt-8 max-w-xl text-lg text-pretty text-stone">
            For boutiques and buyers ordering more than a single saree — one design,
            several colourways, or a full seasonal range — manufactured at the same
            Elampillai facility as individual Studio orders.
          </p>
          <div className="mt-9">
            <Button href="/contact" variant="primary">
              Contact sales
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1600px] px-6 py-16 md:px-10">
        <ol className="grid grid-cols-1 gap-x-14 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <li key={s.title} className="flex flex-col gap-3 border-t border-line py-8 transition-colors duration-300 hover:border-charcoal" data-reveal>
              <span className="font-serif text-2xl italic tabular-nums text-stone">{String(i + 1).padStart(2, "0")}</span>
              <p className="font-serif text-2xl leading-tight md:text-3xl">{s.title}</p>
              <p className="leading-relaxed text-pretty text-stone">{s.body}</p>
            </li>
          ))}
        </ol>
        <p className="mt-10 max-w-xl text-sm text-stone">
          A self-service organisation account (team invitations, saved colourways,
          purchase-order management) isn&rsquo;t built yet — for now, every B2B
          relationship starts as a direct conversation through Contact.
        </p>
      </section>
    </div>
  );
}
